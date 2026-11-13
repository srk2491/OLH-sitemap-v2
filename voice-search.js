/* Voice search only: never modifies project identities or quota matching. */
(function(root){
'use strict';
const normalize=s=>String(s||'').normalize('NFC').toLowerCase().replace(/[\u200b-\u200d]/g,'').replace(/[^\p{L}\p{M}\p{N}\s]/gu,' ').replace(/\s+/g,' ').trim();
const compact=s=>normalize(s).replace(/\s/g,'');
// Search-only, reviewed spelling variants. These do not change source-data joins.
const aliases={
 shettihalli:['shettyhalli','shetty halli','shetti halli'],
 nelaguli:['nela guli','nelagulli'],
 sadenahalli:['sadena halli','saden halli','ಸಾದೇನಹಳ್ಳಿ'],
 kenchanapura:['kenchanpura'],
 agraharapalya:['agrahara palya'],
 yelahanka:['yelhanka','yela hanka'],
 yeshwanthapura:['yeshwanthpura','yeswanthpura','yeshwanthpur'],
 'krpura':['k r pura','kr puram','krishnarajapuram','krishnarajapura']
};
function catalog(sites){
 const out=new Map();
 function add(type,value,kn,spellings){
  if(!value)return;
  const id=type+':'+value;let item=out.get(id);
  if(!item){item={id,type,value,nameKn:kn||'',aliases:[]};out.set(id,item);}
  if(!item.nameKn&&kn)item.nameKn=kn;
  for(const name of [value,kn,...spellings,...(aliases[compact(value)]||[])])if(name&&!item.aliases.includes(name))item.aliases.push(name);
 }
 for(const s of sites){
  add('site',s.name,s.nameKn,[]);
  add('site',s.locationName,s.locationNameKn,[]);
  add('constituency',s.constituency,s.report_identity?.category_kn,[]);
 }
 return [...out.values()];
}
function distance(a,b){
 let row=Array.from({length:b.length+1},(_,i)=>i);
 for(let i=1;i<=a.length;i++){const next=[i];for(let j=1;j<=b.length;j++)next[j]=Math.min(next[j-1]+1,row[j]+1,row[j-1]+(a[i-1]===b[j-1]?0:1));row=next;}return row[b.length];
}
function analyse(text,items){
 let remaining=' '+normalize(text)+' ';const selected=new Map();
 const names=items.flatMap(item=>item.aliases.map(name=>({item,name:normalize(name)}))).filter(x=>x.name).sort((a,b)=>compact(b.name).length-compact(a.name).length);
 for(const {item,name} of names){
  // Optional spaces allow dictation such as "Shetty halli" without substring matches.
  const escaped=[...compact(name)].map(c=>c.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')).join('\\s*');
  const re=new RegExp('(^|\\s)('+escaped+')(?=\\s|$)','gu');
  remaining=remaining.replace(re,(match,lead)=>{selected.set(item.id,item);return lead+' '.repeat(match.length-lead.length);});
 }
 const t=normalize(text);
 const has1=/(?:\b(?:one|1)\s*(?:b\s*h\s*k|bedrooms?)\b|(?:ಒಂದು|೧)\s*(?:ಬಿಎಚ್\s*ಕೆ|ಬೆಡ್\S*))/u.test(t);
 const has2=/(?:\b(?:two|2)\s*(?:b\s*h\s*k|bedrooms?)\b|(?:ಎರಡು|೨)\s*(?:ಬಿಎಚ್\s*ಕೆ|ಬೆಡ್\S*))/u.test(t);
 const near=/\b(?:near me|nearby|nearest)\b|ನನ್ನ ಹತ್ತಿರ|ಹತ್ತಿರದ/u.test(t);
 remaining=remaining.replace(/\b(?:one|two|1|2)\s*(?:b\s*h\s*k|bedrooms?)\b/gu,' ').replace(/(?:ಒಂದು|ಎರಡು|೧|೨)\s*(?:ಬಿಎಚ್\s*ಕೆ|ಬೆಡ್\S*)/gu,' ');
 remaining=remaining.replace(/\b(?:please|show|find|search|me|sites?|locations?|homes?|houses?|flats?|in|at|and|or|near|nearby|nearest|with|for|constituency)\b/gu,' ').replace(/ನನ್ನ ಹತ್ತಿರ|ಹತ್ತಿರದ|ಹುಡುಕಿ|ತೋರಿಸಿ|ಮತ್ತು|ಅಥವಾ|ಮನೆಗಳು|ಸ್ಥಳಗಳು|ಕ್ಷೇತ್ರ/gu,' ').replace(/\s+/g,' ').trim();
 const words=remaining.split(' ').filter(Boolean),suggestions=[];
 for(const item of items){
  if(selected.has(item.id))continue;let score=0;
  for(const name of item.aliases){const n=compact(name);if(n.length<4)continue;
   for(let i=0;i<words.length;i++)for(let len=1;len<=Math.min(4,words.length-i);len++){
    const q=compact(words.slice(i,i+len).join(' '));if(q.length<4)continue;
    const d=distance(q,n);if(d<=Math.min(2,Math.floor(n.length*.25)))score=Math.max(score,1-d/Math.max(q.length,n.length));
    if(n.startsWith(q)&&q.length>=4)score=Math.max(score,.72);
   }
  }
  if(score>=.72)suggestions.push({...item,score});
 }
 suggestions.sort((a,b)=>b.score-a.score||a.value.localeCompare(b.value));
 return {matches:[...selected.values()],suggestions:suggestions.slice(0,4),remaining,mode:has1!==has2?(has1?'1':'2'):null,modeConflict:has1&&has2,near};
}
function intent(items,mode,near){
 return {mode,near,constituency:items.length===1&&items[0].type==='constituency'?items[0].value:'',query:items.length===1&&items[0].type==='constituency'?'':items.map(x=>x.value).join(', ')};
}
// Isolated lifecycle: Stop collects final results; Cancel invalidates callbacks first.
function recorder({Recognition,onState,onText,onError,setTimer=setTimeout,clearTimer=clearTimeout}){
 let active=null;
 function clear(s){for(const t of s.timers)clearTimer(t);s.timers=[];}
 function finish(s,error){if(active!==s)return;clear(s);active=null;if(error)onError(error);onState(error?'error':'review');}
 function cancel(){const s=active;if(!s)return;active=null;clear(s);try{s.rec.abort();}catch{}onState('review');}
 function stop(){const s=active;if(!s||s.stopping)return;s.stopping=true;clear(s);onState('processing');s.timers.push(setTimer(()=>{if(active!==s)return;finish(s,'timeout');try{s.rec.abort();}catch{}},8000));try{s.rec.stop();}catch{finish(s,'service-not-allowed');}}
 function start(language,prior){
  if(active||!Recognition)return false;
  let rec;try{rec=new Recognition();}catch{onError('service-not-allowed');onState('error');return false;}
  const s={rec,prior:prior.trim(),results:new Map(),timers:[],stopping:false,final:false};active=s;
  rec.lang=language;rec.continuous=false;rec.interimResults=true;rec.maxAlternatives=3;
  rec.onstart=()=>{if(active!==s||s.stopping)return;clear(s);onState('listening');s.timers.push(setTimer(stop,20000));};
  rec.onspeechend=()=>{if(active===s)stop();};
  rec.onaudioend=()=>{if(active===s)stop();};
  rec.onresult=e=>{
   if(active!==s)return;
   for(let i=e.resultIndex||0;i<e.results.length;i++)s.results.set(i,{final:e.results[i].isFinal===true,text:e.results[i][0]?.transcript?.trim()||'',alternatives:Array.from(e.results[i]).slice(1).map(a=>a.transcript)});
   // Interim slots may be removed on a later event; final slots must survive.
   for(const [i,r] of s.results)if(i>=e.results.length&&!r.final)s.results.delete(i);
   const results=[...s.results].sort((a,b)=>a[0]-b[0]).map(x=>x[1]);
   const finals=results.filter(x=>x.final&&x.text);s.final=finals.length>0;
   const finalText=[s.prior,...finals.map(x=>x.text)].filter(Boolean).join(', ');
   const interim=results.filter(x=>!x.final).map(x=>x.text).join(' ');
   onText(finalText,interim,finals.flatMap(x=>x.alternatives));
  };
  rec.onerror=e=>{if(active!==s)return;finish(s,e.error||'unknown');try{rec.abort();}catch{}};
  rec.onend=()=>{if(active!==s)return;finish(s,s.final?null:'no-speech');};
  onState('connecting');s.timers.push(setTimer(()=>{if(active!==s)return;finish(s,'start-timeout');try{rec.abort();}catch{}},12000));
  try{rec.start();return true;}catch{finish(s,'not-allowed');return false;}
 }
 return {start,stop,cancel,isActive:()=>Boolean(active)};
}
function mount({getSites,getMode,getLanguage,beforeListen,apply}){
 const $=id=>document.getElementById(id),dialog=$('voiceDialog'),T=(en,kn)=>getLanguage()==='kn'?kn:en;
 const Recognition=root.SpeechRecognition||root.webkitSpeechRecognition;
 const secure=root.isSecureContext!==false;let lastMode=null,lastNear=false;let phase='idle',error='',excluded=new Set(),manual=new Map(),alternatives=[],items=[],result=null,typedTimer;
 const labels={idle:['Ready when you are','ಮಾತನಾಡಲು ಸಿದ್ಧ'],connecting:['Connecting to microphone…','ಮೈಕ್ರೊಫೋನ್ ಸಂಪರ್ಕಿಸಲಾಗುತ್ತಿದೆ…'],listening:['Listening… say your locations','ಆಲಿಸಲಾಗುತ್ತಿದೆ… ಸ್ಥಳಗಳನ್ನು ಹೇಳಿ'],processing:['Processing your words…','ನಿಮ್ಮ ಮಾತನ್ನು ಸಂಸ್ಕರಿಸಲಾಗುತ್ತಿದೆ…'],review:['Review your selections','ಆಯ್ಕೆಗಳನ್ನು ಪರಿಶೀಲಿಸಿ'],error:['Voice search needs attention','ಧ್ವನಿ ಹುಡುಕಾಟಕ್ಕೆ ಸಹಾಯ ಅಗತ್ಯ']};
 const messages={
  'not-allowed':['Microphone permission was denied. Allow microphone access for this site, then try again. You can also type below.','ಮೈಕ್ರೊಫೋನ್ ಅನುಮತಿ ನಿರಾಕರಿಸಲಾಗಿದೆ. ಈ ತಾಣಕ್ಕೆ ಅನುಮತಿ ನೀಡಿ ಅಥವಾ ಕೆಳಗೆ ಟೈಪ್ ಮಾಡಿ.'],
  'service-not-allowed':['Speech recognition is unavailable or blocked. In Safari, check Siri/Dictation settings, or type below.','ಧ್ವನಿ ಗುರುತಿಸುವಿಕೆ ಲಭ್ಯವಿಲ್ಲ. Safariಯಲ್ಲಿ Siri/Dictation ಸೆಟ್ಟಿಂಗ್ ಪರಿಶೀಲಿಸಿ ಅಥವಾ ಟೈಪ್ ಮಾಡಿ.'],
  'no-speech':['No final words were received. Speak a short phrase, or type below. Earlier selections are kept.','ಮಾತು ಪತ್ತೆಯಾಗಿಲ್ಲ. ಚಿಕ್ಕ ವಾಕ್ಯ ಹೇಳಿ ಅಥವಾ ಟೈಪ್ ಮಾಡಿ. ಹಿಂದಿನ ಆಯ್ಕೆಗಳು ಉಳಿದಿವೆ.'],
  network:['The speech service could not connect. Check your connection and try again, or type below.','ಧ್ವನಿ ಸೇವೆಗೆ ಸಂಪರ್ಕ ಸಾಧ್ಯವಾಗಲಿಲ್ಲ. ಸಂಪರ್ಕ ಪರಿಶೀಲಿಸಿ ಅಥವಾ ಟೈಪ್ ಮಾಡಿ.'],
  'audio-capture':['No microphone is available. Check microphone access or type below.','ಮೈಕ್ರೊಫೋನ್ ಲಭ್ಯವಿಲ್ಲ. ಅನುಮತಿ ಪರಿಶೀಲಿಸಿ ಅಥವಾ ಟೈಪ್ ಮಾಡಿ.'],
  'language-not-supported':['The speech service could not use this language. Choose another language or type Kannada/English below.','ಈ ಭಾಷೆಗೆ ಧ್ವನಿ ಸೇವೆಯ ಬೆಂಬಲವಿಲ್ಲ. ಬೇರೆ ಭಾಷೆ ಆಯ್ಕೆ ಮಾಡಿ ಅಥವಾ ಟೈಪ್ ಮಾಡಿ.'],
  timeout:['The service took too long to finish. Confirmed words are kept; please review or retry.','ಸೇವೆ ಪೂರ್ಣಗೊಳ್ಳಲು ಹೆಚ್ಚು ಸಮಯ ತೆಗೆದುಕೊಂಡಿತು. ಉಳಿದ ಪದಗಳನ್ನು ಪರಿಶೀಲಿಸಿ ಅಥವಾ ಮತ್ತೆ ಪ್ರಯತ್ನಿಸಿ.'],
  'start-timeout':['The microphone did not start. Check permission and Siri/Dictation on Safari, or type below.','ಮೈಕ್ರೊಫೋನ್ ಪ್ರಾರಂಭವಾಗಿಲ್ಲ. ಅನುಮತಿ ಮತ್ತು Siri/Dictation ಪರಿಶೀಲಿಸಿ ಅಥವಾ ಟೈಪ್ ಮಾಡಿ.'],
  interrupted:['Listening stopped because the page became inactive. Your confirmed words are kept.','ಪುಟ ನಿಷ್ಕ್ರಿಯವಾದ್ದರಿಂದ ಆಲಿಸುವಿಕೆ ನಿಂತಿದೆ. ಖಚಿತವಾದ ಪದಗಳು ಉಳಿದಿವೆ.']
 };
 function selected(){return [...new Map([...(result?.matches||[]),...manual.values()].map(x=>[x.id,x])).values()].filter(x=>!excluded.has(x.id));}
 function name(item){return getLanguage()==='kn'&&item.nameKn?item.nameKn:item.value;}
 function refresh(){
  items=catalog(getSites());
  result=analyse($('voiceTranscript').value,items);
  render();
 }
 function render(){
  const busy=['connecting','listening','processing'].includes(phase),chosen=selected();
  dialog.dataset.state=phase;$('voiceStatus').textContent=T(...labels[phase]);
  $('voiceError').hidden=!error;$('voiceError').textContent=error?T(...(messages[error]||['Voice search could not finish. Try again or type below.','ಧ್ವನಿ ಹುಡುಕಾಟ ಪೂರ್ಣಗೊಂಡಿಲ್ಲ. ಮತ್ತೆ ಪ್ರಯತ್ನಿಸಿ ಅಥವಾ ಟೈಪ್ ಮಾಡಿ.'])):'';
  $('startVoice').textContent=phase==='connecting'?T('Cancel connection','ಸಂಪರ್ಕ ರದ್ದುಮಾಡಿ'):phase==='listening'?T('Finish listening','ಆಲಿಸುವಿಕೆ ಮುಗಿಸಿ'):phase==='processing'?T('Processing…','ಸಂಸ್ಕರಿಸಲಾಗುತ್ತಿದೆ…'):chosen.length?T('Add another location','ಮತ್ತೊಂದು ಸ್ಥಳ ಸೇರಿಸಿ'):T('Start listening','ಆಲಿಸಲು ಪ್ರಾರಂಭಿಸಿ');
  $('startVoice').disabled=!Recognition||!secure||phase==='processing';$('startVoice').classList.toggle('listening',phase==='listening');
  for(const id of ['voiceLanguage','voiceTranscript','voiceMode','voiceNear'])$(id).disabled=busy;
  $('voiceSelected').replaceChildren();$('voiceSelectionCount').textContent=T(`${chosen.length} selected`,`${chosen.length} ಆಯ್ಕೆಗಳು`);
  for(const item of chosen){const button=document.createElement('button');button.type='button';button.className='voice-chip';button.disabled=busy;button.textContent=name(item)+' ×';button.setAttribute('aria-label',T('Remove ','ತೆಗೆದುಹಾಕಿ: ')+name(item));button.addEventListener('click',()=>{excluded.add(item.id);manual.delete(item.id);render();$('voiceSelectionCount').focus();});$('voiceSelected').append(button);}
  $('voiceSelectedEmpty').hidden=chosen.length>0;
  $('voiceSuggestions').replaceChildren();const choices=new Map((result?.suggestions||[]).map(x=>[x.id,x]));
  for(const alt of alternatives){for(const x of analyse(alt,items).matches)choices.set(x.id,x);}
  // A removed match is offered again explicitly rather than silently restored.
  for(const x of result?.matches||[])if(excluded.has(x.id))choices.set(x.id,x);
  const suggestions=[...choices.values()].filter(x=>!chosen.some(c=>c.id===x.id)).slice(0,4);
  $('voiceSuggestionsWrap').hidden=!suggestions.length;
  for(const item of suggestions){const button=document.createElement('button');button.type='button';button.className='voice-suggestion';button.disabled=busy;button.textContent=name(item)+' · '+(item.type==='constituency'?T('Constituency','ಕ್ಷೇತ್ರ'):T('Location','ಸ್ಥಳ'));button.addEventListener('click',()=>{manual.set(item.id,item);excluded.delete(item.id);render();$('voiceSelectionCount').focus();});$('voiceSuggestions').append(button);}
  const unmatched=result?.remaining||'';
  $('voiceUnmatched').hidden=!unmatched;$('voiceUnmatched').textContent=unmatched?T(`Check these words: “${unmatched}”. Only the selections above will be searched. Edit the text or choose a suggestion.`,`ಈ ಪದಗಳನ್ನು ಪರಿಶೀಲಿಸಿ: “${unmatched}”. ಮೇಲಿನ ಆಯ್ಕೆಗಳನ್ನು ಮಾತ್ರ ಹುಡುಕಲಾಗುತ್ತದೆ. ಪಠ್ಯ ಸರಿಪಡಿಸಿ ಅಥವಾ ಸಲಹೆ ಆಯ್ಕೆ ಮಾಡಿ.`):'';
  $('voiceModeConflict').hidden=!result?.modeConflict;
  const allowAll=!chosen.length&&!unmatched&&Boolean(result?.mode||result?.near||result?.modeConflict);
  $('applyVoice').disabled=busy||(!chosen.length&&!allowAll);
  $('applyVoice').textContent=chosen.length?T(`Search ${chosen.length} selection${chosen.length===1?'':'s'}`,`${chosen.length} ಆಯ್ಕೆಗಳನ್ನು ಹುಡುಕಿ`):T('Search projects','ಯೋಜನೆಗಳನ್ನು ಹುಡುಕಿ');
  $('voiceSummary').textContent=T(`${$('voiceMode').value} BHK${$('voiceNear').checked?' · nearest first':''}`,`${$('voiceMode').value} BHK${$('voiceNear').checked?' · ಹತ್ತಿರದ ಸ್ಥಳಗಳು ಮೊದಲು':''}`);
 }
 function syncIntent(){const p=analyse($('voiceTranscript').value,items);if(p.mode&&p.mode!==lastMode)$('voiceMode').value=p.mode;if(p.near&&!lastNear)$('voiceNear').checked=true;lastMode=p.mode;lastNear=p.near;}
 const rec=recorder({Recognition,onState:s=>{phase=s;if(s!=='listening')$('voiceInterim').textContent='';render();},onError:e=>{error=e;},onText:(final,interim,alts)=>{$('voiceTranscript').value=final;$('voiceInterim').textContent=interim?T('Hearing: ','ಆಲಿಸಲಾಗುತ್ತಿದೆ: ')+interim:'';alternatives=alts;syncIntent();refresh();}});
 function translate(){
  const strings={voiceTitle:['Find your places','ನಿಮ್ಮ ಸ್ಥಳಗಳನ್ನು ಹುಡುಕಿ'],voiceIntro:['Speak or type a location, then review your selections. Add more places before searching.','ಸ್ಥಳದ ಹೆಸರನ್ನು ಹೇಳಿ ಅಥವಾ ಟೈಪ್ ಮಾಡಿ. ಹುಡುಕುವ ಮೊದಲು ಆಯ್ಕೆಗಳನ್ನು ಪರಿಶೀಲಿಸಿ ಮತ್ತು ಹೆಚ್ಚಿನ ಸ್ಥಳಗಳನ್ನು ಸೇರಿಸಿ.'],voiceLanguageLabel:['Speaking language','ಮಾತನಾಡುವ ಭಾಷೆ'],voiceModeLabel:['Home type','ಮನೆಯ ಪ್ರಕಾರ'],voiceNearLabel:['Nearest first','ಹತ್ತಿರದ ಸ್ಥಳಗಳು ಮೊದಲು'],voiceTranscriptLabel:['What we heard · you can edit this','ನಾವು ಕೇಳಿದ ಪದಗಳು · ಸರಿಪಡಿಸಬಹುದು'],voiceSelectionsLabel:['Places to search','ಹುಡುಕಬೇಕಾದ ಸ್ಥಳಗಳು'],voiceSelectedEmpty:['Your matched locations will appear here.','ಹೊಂದಿಕೆಯಾಗುವ ಸ್ಥಳಗಳು ಇಲ್ಲಿ ಕಾಣಿಸುತ್ತವೆ.'],voiceSuggestionsLabel:['Did you mean…? Tap to add','ನೀವು ಹೇಳಿದ್ದು…? ಸೇರಿಸಲು ಒತ್ತಿ'],voiceModeConflict:['You mentioned both home types. Choose 1 BHK or 2 BHK above.','ಎರಡೂ ಮನೆಯ ಪ್ರಕಾರಗಳನ್ನು ಹೇಳಿದ್ದೀರಿ. ಮೇಲೆ 1 BHK ಅಥವಾ 2 BHK ಆಯ್ಕೆ ಮಾಡಿ.'],clearVoice:['Clear all','ಎಲ್ಲವನ್ನೂ ತೆರವುಗೊಳಿಸಿ'],voicePrivacy:['Your browser may send audio to its speech service. This app does not store recordings.','ನಿಮ್ಮ ಬ್ರೌಸರ್ ಧ್ವನಿ ಸೇವೆಗೆ ಆಡಿಯೊ ಕಳುಹಿಸಬಹುದು. ಈ ಅಪ್ಲಿಕೇಶನ್ ಧ್ವನಿಮುದ್ರಣ ಉಳಿಸುವುದಿಲ್ಲ.'],voiceHelpTitle:['Microphone not working?','ಮೈಕ್ರೊಫೋನ್ ಕೆಲಸ ಮಾಡುತ್ತಿಲ್ಲವೇ?'],voiceHelpText:['Use HTTPS or localhost and allow microphone access. In Safari, check Siri/Dictation settings. Try a short phrase in the selected language. You can always type or use keyboard dictation in the text box.','HTTPS ಅಥವಾ localhost ಬಳಸಿ, ಮೈಕ್ರೊಫೋನ್ ಅನುಮತಿ ನೀಡಿ. Safariಯಲ್ಲಿ Siri/Dictation ಪರಿಶೀಲಿಸಿ. ಆಯ್ಕೆ ಮಾಡಿದ ಭಾಷೆಯಲ್ಲಿ ಚಿಕ್ಕ ವಾಕ್ಯ ಹೇಳಿ. ಪಠ್ಯ ಪೆಟ್ಟಿಗೆಯಲ್ಲಿ ಟೈಪ್ ಮಾಡಬಹುದು ಅಥವಾ ಕೀಬೋರ್ಡ್ ಧ್ವನಿ ಆಯ್ಕೆ ಬಳಸಬಹುದು.']};
  for(const [id,pair] of Object.entries(strings))$(id).textContent=T(...pair);
  $('closeVoice').setAttribute('aria-label',T('Close voice search','ಧ್ವನಿ ಹುಡುಕಾಟ ಮುಚ್ಚಿ'));
  $('voiceTranscript').placeholder=T('Try Nelaguli and Sadenahalli','ನೆಲಗುಳಿ ಮತ್ತು ಸಾದೇನಹಳ್ಳಿ');
  $('voiceFallback').hidden=Boolean(Recognition)&&secure;
  $('voiceFallback').textContent=!secure?T('Open this site over HTTPS or localhost to use the microphone. Typing still works.','ಮೈಕ್ರೊಫೋನ್ ಬಳಸಲು HTTPS ಅಥವಾ localhost ಮೂಲಕ ತೆರೆಯಿರಿ. ಟೈಪ್ ಮಾಡಬಹುದು.'):T('Voice recognition is unavailable here. Type below or use your keyboard’s dictation microphone.','ಧ್ವನಿ ಗುರುತಿಸುವಿಕೆ ಲಭ್ಯವಿಲ್ಲ. ಟೈಪ್ ಮಾಡಿ ಅಥವಾ ಕೀಬೋರ್ಡ್ ಧ್ವನಿ ಆಯ್ಕೆ ಬಳಸಿ.');
 }
 $('voiceBtn').addEventListener('click',()=>{items=catalog(getSites());$('voiceLanguage').value=getLanguage()==='kn'?'kn-IN':'en-IN';$('voiceMode').value=getMode();error='';phase='idle';translate();refresh();dialog.showModal();});
 $('startVoice').addEventListener('click',()=>{
  if(phase==='connecting'){rec.cancel();return;}if(rec.isActive()){rec.stop();return;}
  clearTimeout(typedTimer);error='';beforeListen();rec.start($('voiceLanguage').value,$('voiceTranscript').value);
 });
 $('voiceTranscript').addEventListener('input',()=>{alternatives=[];error='';phase='review';clearTimeout(typedTimer);typedTimer=setTimeout(()=>{syncIntent();refresh();},200);});
 $('voiceLanguage').addEventListener('change',()=>{error='';phase='idle';render();});
 $('voiceMode').addEventListener('change',render);$('voiceNear').addEventListener('change',render);
 $('clearVoice').addEventListener('click',()=>{rec.cancel();clearTimeout(typedTimer);excluded.clear();manual.clear();alternatives=[];lastMode=null;lastNear=false;error='';phase='idle';$('voiceTranscript').value='';$('voiceInterim').textContent='';$('voiceNear').checked=false;refresh();$('voiceTranscript').focus();});
 $('closeVoice').addEventListener('click',()=>{rec.cancel();dialog.close();});
 function close(){rec.cancel();clearTimeout(typedTimer);$('voiceInterim').textContent='';$('voiceBtn').focus();}
 dialog.addEventListener('close',close);dialog.addEventListener('cancel',()=>rec.cancel());
 root.addEventListener('pagehide',()=>rec.cancel());document.addEventListener('visibilitychange',()=>{if(document.hidden&&rec.isActive()){rec.cancel();error='interrupted';render();}});
 $('applyVoice').addEventListener('click',()=>{if(rec.isActive())return;clearTimeout(typedTimer);refresh();if($('applyVoice').disabled)return;const chosen=selected(),request=intent(chosen,$('voiceMode').value,$('voiceNear').checked);dialog.close();apply(request,chosen.map(name).join(', ')||$('voiceSummary').textContent);});
 return {cancel:()=>rec.cancel()};
}
const api={catalog,analyse,intent,recorder,mount};if(typeof module!=='undefined'&&module.exports)module.exports=api;else root.OLHVoice=api;
})(typeof window!=='undefined'?window:globalThis);
