(function(root){
'use strict';
function siteText(s,kn=false){
 const name=kn?(s.nameKn||s.name):s.name;
 const number=n=>n<0?(kn?'ಮೈನಸ್ ':'minus ')+Math.abs(n):String(n);
 const quota=(title,total,parts)=>{
  let text=title+(total===null||total===undefined?(kn?' ಮಾಹಿತಿ ಲಭ್ಯವಿಲ್ಲ. ':' data unavailable. '):(kn?' ವರದಿಯಾದ ಲಭ್ಯತೆ ':' reported availability ')+number(total)+'. ');
  const cats=kn?['ಎಸ್ ಸಿ','ಸಾಮಾನ್ಯ','ಅಲ್ಪಸಂಖ್ಯಾತ']:['SC','General','Minority'];
  if(parts)text+=parts.map((n,i)=>n===null?'':cats[i]+' '+number(n)+'. ').join('');return text;
 };
 if(kn)return `${name}. ${s.mode} ಬಿ ಎಚ್ ಕೆ. ಸರ್ವೆ ಸಂಖ್ಯೆ ${s.survey}. ಕ್ಷೇತ್ರ ${s.report_identity?.category_kn||s.constituency}. `+quota('ಸಾರ್ವಜನಿಕ ಕೋಟಾ',s.available,s.breakdown)+quota('ಶಾಸಕರ ಕೋಟಾ',s.mlaAvailable,s.mlaBreakdown)+(s.approximate?'ಈ ಸ್ಥಳದ ಲಭ್ಯತೆಯನ್ನು ದೃಢೀಕರಿಸಿ. ':'')+'ಅರ್ಜಿ ಸಲ್ಲಿಸುವ ಮೊದಲು ಆರ್ ಜಿ ಎಚ್ ಸಿ ಎಲ್ ನಲ್ಲಿ ಪ್ರಸ್ತುತ ಲಭ್ಯತೆಯನ್ನು ದೃಢೀಕರಿಸಿ.';
 return `${name}. ${s.mode} bedroom homes. Survey ${s.survey}. Constituency ${s.constituency}. `+quota('Public quota',s.available,s.breakdown)+quota('MLA quota',s.mlaAvailable,s.mlaBreakdown)+(s.approximate?'Availability for this parcel needs confirmation. ':'')+((s.breakdown||[]).concat(s.mlaBreakdown||[],s.available,s.mlaAvailable).some(n=>n!==null&&n<0)?'Negative figures are reported by the source and need confirmation. ':'')+'Confirm current availability with RGHCL before applying.';
}
function resultText(groups,kn=false){const names=groups.slice(0,5).map(g=>kn?(g.nameKn||g.name):g.name).join(', ');return kn?`${groups.length} ಸ್ಥಳಗಳು ಕಂಡುಬಂದಿವೆ. ${names}. ${groups.length>5?'ಉಳಿದ ಸ್ಥಳಗಳನ್ನು ಪಟ್ಟಿಯಲ್ಲಿ ನೋಡಿ.':''}`:`${groups.length} locations found. ${names}${names?'.':''} ${groups.length>5?'Showing the first five names. Browse the list for more.':''}`;}
function create({getSite,getGroups}){
 const $=id=>document.getElementById(id),synth=root.speechSynthesis,supported=!!(synth&&root.SpeechSynthesisUtterance);let current=null,hoverTimer=null,hoverOwner=null,paused=false;
 const dialog=document.createElement('dialog');dialog.id='accessDialog';dialog.className='voice-dialog';dialog.setAttribute('aria-labelledby','accessTitle');
 dialog.innerHTML=`<div class="voice-head"><h2 id="accessTitle">Reading & display</h2><button id="closeAccess" class="icon-button" aria-label="Close reading settings">×</button></div><p>Use a speaker button to hear a project. Automatic reading is off until you enable it.</p><label for="readLanguage">Reading language</label><select id="readLanguage"><option value="en-IN">English</option><option value="kn-IN">ಕನ್ನಡ</option></select><label for="readRate">Reading speed</label><select id="readRate"><option value="0.8">Slow</option><option value="1" selected>Normal</option><option value="1.2">Fast</option></select><p id="voiceAvailability" role="status"></p><label class="access-check"><input type="checkbox" id="readHover"> Read on hover or keyboard focus</label><label class="access-check"><input type="checkbox" id="readSearch"> Speak search results</label><label class="access-check"><input type="checkbox" id="largeText"> Larger text</label><label class="access-check"><input type="checkbox" id="highContrast"> Stronger contrast</label><div class="reader-controls"><button class="quiet" data-reader-pause>Pause</button><button class="quiet" data-reader-stop>Stop reading</button></div><p>Hover reading waits briefly and stops when you move away. Press Escape to stop any reading. Use your screen reader with automatic reading off to avoid duplicate speech.</p><small>Voices and pronunciation depend on your device. Some speech voices use an online service.</small>`;document.body.append(dialog);
 const accessibilityKn={
 'Reading & display':'ಓದುವಿಕೆ ಮತ್ತು ಪ್ರದರ್ಶನ',
 'Use a speaker button to hear a project. Automatic reading is off until you enable it.':'ಯೋಜನೆಯ ವಿವರಗಳನ್ನು ಕೇಳಲು ಧ್ವನಿವರ್ಧಕ ಗುಂಡಿ ಒತ್ತಿ. ನೀವು ಸಕ್ರಿಯಗೊಳಿಸುವವರೆಗೆ ಸ್ವಯಂಚಾಲಿತ ಓದುವಿಕೆ ಆಫ್ ಆಗಿರುತ್ತದೆ.',
 'Reading language':'ಓದುವ ಭಾಷೆ','Reading speed':'ಓದುವ ವೇಗ',
 'Slow':'ನಿಧಾನ','Normal':'ಸಾಮಾನ್ಯ','Fast':'ವೇಗ',
 'Read on hover or keyboard focus':'ಮೌಸ್ ಅಥವಾ ಕೀಬೋರ್ಡ್ ಫೋಕಸ್‌ನಲ್ಲಿ ಓದಿ',
 'Speak search results':'ಹುಡುಕಾಟ ಫಲಿತಾಂಶಗಳನ್ನು ಓದಿ',
 'Larger text':'ದೊಡ್ಡ ಅಕ್ಷರಗಳು','Stronger contrast':'ಹೆಚ್ಚಿನ ಕಾಂಟ್ರಾಸ್ಟ್',
 'Pause':'ವಿರಾಮ','Stop reading':'ಓದುವುದನ್ನು ನಿಲ್ಲಿಸಿ','Stop':'ನಿಲ್ಲಿಸಿ',
 'Hover reading waits briefly and stops when you move away. Press Escape to stop any reading. Use your screen reader with automatic reading off to avoid duplicate speech.':'ಮೌಸ್ ಇರಿಸಿದಾಗ ಸ್ವಲ್ಪ ಸಮಯದ ನಂತರ ಓದುವಿಕೆ ಪ್ರಾರಂಭವಾಗಿ, ಮೌಸ್ ತೆಗೆದಾಗ ನಿಲ್ಲುತ್ತದೆ. ನಿಲ್ಲಿಸಲು Escape ಒತ್ತಿ. ಪುನರಾವರ್ತಿತ ಓದುವಿಕೆ ತಪ್ಪಿಸಲು ಸ್ಕ್ರೀನ್ ರೀಡರ್ ಬಳಸುವಾಗ ಸ್ವಯಂಚಾಲಿತ ಓದುವಿಕೆ ಆಫ್ ಮಾಡಿ.',
 'Voices and pronunciation depend on your device. Some speech voices use an online service.':'ಧ್ವನಿ ಮತ್ತು ಉಚ್ಚಾರಣೆ ನಿಮ್ಮ ಸಾಧನವನ್ನು ಅವಲಂಬಿಸಿವೆ. ಕೆಲವು ಧ್ವನಿ ಸೇವೆಗಳು ಇಂಟರ್ನೆಟ್ ಬಳಸುತ್ತವೆ.'
 };
 const translatable=[...dialog.querySelectorAll('h2,p,label,small,option,button')].map(el=>({el,en:el.innerHTML,plain:el.textContent.trim()}));
 const barTexts=[];
 function applyReaderLanguage(language){
  translatable.forEach(({el,en,plain})=>{
   if(language==='en'){if(el.querySelector('input')){const node=[...el.childNodes].find(n=>n.nodeType===Node.TEXT_NODE&&n.textContent.trim());if(node)node.textContent=' '+plain;}else el.innerHTML=en;return;}
   const kn=accessibilityKn[plain];if(!kn)return;
   if(el.querySelector('input')){const node=[...el.childNodes].find(n=>n.nodeType===Node.TEXT_NODE&&n.textContent.trim());if(node)node.textContent=' '+kn;}
   else el.textContent=kn;
  });
  dialog.querySelector('#closeAccess').setAttribute('aria-label',language==='kn'?'ಓದುವಿಕೆ ಸೆಟ್ಟಿಂಗ್‌ಗಳನ್ನು ಮುಚ್ಚಿ':'Close reading settings');
  bar.setAttribute('aria-label',language==='kn'?'ಓದುವಿಕೆ ನಿಯಂತ್ರಣಗಳು':'Read-aloud controls');
  availability();sync();
 }
 root.addEventListener('olh-language-change',e=>applyReaderLanguage(e.detail.lang));
 const bar=document.createElement('aside');bar.id='readerBar';bar.className='reader-bar';bar.hidden=true;bar.setAttribute('aria-label','Read-aloud controls');bar.innerHTML='<span id="readerStatus" role="status"></span><button class="quiet" data-reader-pause>Pause</button><button class="quiet" data-reader-stop>Stop</button>';document.body.append(bar);
 function sync(){document.querySelectorAll('[data-reader-message]').forEach(el=>el.textContent=bar.hidden?'':$('readerStatus').textContent);document.querySelectorAll('[data-reader-pause]').forEach(b=>{b.textContent=(document.documentElement.lang==='kn'?(paused?'ಮುಂದುವರಿಸಿ':'ವಿರಾಮ'):(paused?'Resume':'Pause'));b.disabled=!current;});}
 function cancelHover(){clearTimeout(hoverTimer);hoverTimer=null;hoverOwner=null;}
 function stop(){cancelHover();current=null;paused=false;synth?.cancel();bar.hidden=true;sync();}
 function availability(){const prefix=$('readLanguage').value.slice(0,2),voices=supported?synth.getVoices():[];const voice=voices.find(v=>v.lang.toLowerCase().replace('_','-')===$('readLanguage').value.toLowerCase())||voices.find(v=>v.lang.toLowerCase().startsWith(prefix));$('voiceAvailability').textContent=!supported?'Read-aloud is unavailable in this browser. Text and screen-reader access remain available.':voice?`${prefix==='kn'?'Kannada':'English'} voice available: ${voice.name}`:`No ${prefix==='kn'?'Kannada':'English'} voice is available yet. Try another language or check your device speech settings.`;return voice;}
 function speak(text,label,fromHover=false){stop();const voice=availability();if(!supported||!voice){bar.hidden=false;$('readerStatus').textContent=$('voiceAvailability').textContent;sync();return;}
  const u=new root.SpeechSynthesisUtterance(text);u.voice=voice;u.lang=$('readLanguage').value;u.rate=Number($('readRate').value);current=u;bar.hidden=false;$('readerStatus').textContent=(document.documentElement.lang==='kn'?'ಓದುತ್ತಿದೆ: ':'Reading: ')+label;sync();
  u.onend=()=>{if(current===u){current=null;paused=false;bar.hidden=true;sync();}};u.onerror=()=>{if(current===u){current=null;paused=false;$('readerStatus').textContent='Reading could not finish. Try another voice or use the text.';sync();}};
  try{synth.speak(u);}catch{current=null;$('readerStatus').textContent='Read-aloud could not start.';sync();}
 }
 const kn=()=>$('readLanguage').value==='kn-IN';
 function readSite(key){const site=getSite(key);if(site)speak(siteText(site,kn()),site.name);}
 function readGroup(id){const g=getGroups().find(g=>g.id===id);if(!g)return;const names=g.sites.map(s=>kn()?s.parcelLabel.replace('Parcel','ಭಾಗ').replace('Survey','ಸರ್ವೆ').replace('Contract','ಒಪ್ಪಂದ'):s.parcelLabel).join(', ');speak(kn()?`${g.nameKn||g.name}. ${g.sites.length} ಯೋಜನೆಗಳು. ${names}. ವಿವರಗಳನ್ನು ಕೇಳಲು ಯೋಜನೆಯನ್ನು ಆಯ್ಕೆಮಾಡಿ.`:`${g.name}. ${g.sites.length} projects: ${names}. Expand this location, then use a project's speaker button for its availability.`,g.name);}
 function results(){if(!document.hidden&&$('readSearch').checked)speak(resultText(getGroups(),kn()),'search results');}
 function schedule(owner,fn){cancelHover();if(!$('readHover').checked)return;hoverOwner=owner;hoverTimer=setTimeout(()=>{if(hoverOwner===owner){fn();hoverOwner=owner;}},700);}
 function leave(owner){if(hoverOwner===owner)stop();}
 function target(e){return e.target.closest('[data-read],[data-read-group],.card-main,.group-toggle');}
 document.addEventListener('pointerover',e=>{const el=target(e);if(el&&!el.contains(e.relatedTarget))schedule(el,()=>readTarget(el));});document.addEventListener('pointerout',e=>{const el=target(e);if(el&&!el.contains(e.relatedTarget))leave(el);});
 document.addEventListener('focusin',e=>{const el=target(e);if(el)schedule(el,()=>readTarget(el));});document.addEventListener('focusout',e=>{const el=target(e);if(el)leave(el);});
 function readTarget(el){if(el.dataset.readGroup||el.dataset.group)readGroup(el.dataset.readGroup||el.dataset.group);else readSite(el.dataset.read||el.closest('[data-key]')?.dataset.key);}
 document.addEventListener('click',e=>{const read=e.target.closest('[data-read],[data-read-group]');if(read){readTarget(read);return;}if(e.target.closest('[data-reader-stop]'))stop();if(e.target.closest('[data-reader-pause]')&&current){paused=!paused;paused?synth.pause():synth.resume();$('readerStatus').textContent=document.documentElement.lang==='kn'?(paused?'ಓದುವಿಕೆ ವಿರಾಮದಲ್ಲಿದೆ':'ಓದುವಿಕೆ ಮುಂದುವರಿದಿದೆ'):(paused?'Reading paused':'Reading resumed');sync();}});
 document.addEventListener('keydown',e=>{if(e.key==='Escape')stop();});root.addEventListener('pagehide',stop);document.addEventListener('visibilitychange',()=>{if(document.hidden)stop();});
 $('accessBtn').addEventListener('click',()=>{availability();dialog.showModal();});$('closeAccess').addEventListener('click',()=>dialog.close());
 $('readLanguage').addEventListener('change',()=>{stop();availability();});$('readRate').addEventListener('change',stop);$('readHover').addEventListener('change',stop);$('readSearch').addEventListener('change',stop);
 $('largeText').addEventListener('change',()=>document.body.classList.toggle('large-text',$('largeText').checked));$('highContrast').addEventListener('change',()=>document.body.classList.toggle('high-contrast',$('highContrast').checked));
 synth?.addEventListener?.('voiceschanged',availability);availability();sync();
 return {stop,results,readSite,readGroup,schedule,leave};
}
const api={siteText,resultText,create};if(typeof module!=='undefined'&&module.exports)module.exports=api;else root.OLHAccessibility=api;
})(typeof window!=='undefined'?window:globalThis);
