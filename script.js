'use strict';
const $=id=>document.getElementById(id);
const escapeHTML=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const state={mode:'1',search:'',location:'',constituency:'',availability:'',sort:'number',position:null,selected:null,savedOnly:false,expanded:null};
let reader=null,searchReadTimer=null;
let sites=[],filtered=[],manifest={sites:{}},map,layer,userMarker,markers=new Map(),lang='en',galleryURLs=[],galleryToken=0;
const icon=window.OLHIcon;let saved=new Set();try{saved=new Set(JSON.parse(localStorage.getItem('olh-saved-sites')||'[]').filter(v=>typeof v==='string'));}catch{}
function toggleSaved(key){saved.has(key)?saved.delete(key):saved.add(key);try{localStorage.setItem('olh-saved-sites',JSON.stringify([...saved]));}catch{toast('Saved for this session only. Browser storage is unavailable.');}render();if(state.selected)updateSaveButtons();}
function updateSaveButtons(){document.querySelectorAll('[data-save]').forEach(b=>{b.setAttribute('aria-pressed',saved.has(b.dataset.save));b.setAttribute('aria-label',`${saved.has(b.dataset.save)?tr('Remove saved site','ಉಳಿಸಿದ ಸ್ಥಳವನ್ನು ತೆಗೆದುಹಾಕಿ'):tr('Save site','ಸ್ಥಳವನ್ನು ಉಳಿಸಿ')}`);});}
const params=new URLSearchParams(location.search),preview=false;
// Covers share the gallery's draft override, including empty/video-only drafts.
const previewCovers=new Map(),coverURLs=[];
function coverPhoto(key){return previewCovers.has(key)?previewCovers.get(key):OLHMedia.publishedItems(manifest,key).find(m=>m.type==='image');}
async function loadPreviewCovers(){
 if(!preview)return;
 try{for(const draft of await OLHMedia.all()){
  const photo=draft.items.find(item=>item.type==='image');
  if(photo?.blob){const src=URL.createObjectURL(photo.blob);coverURLs.push(src);previewCovers.set(draft.key,{...photo,src});}
  else previewCovers.set(draft.key,photo||null);
 }}catch{toast('Local draft covers could not load. Published covers are shown.');}
}
window.addEventListener('pagehide',event=>{if(!event.persisted)coverURLs.forEach(URL.revokeObjectURL);});

const translations = {
  kn: {
    filtersLocation: 'ಫಿಲ್ಟರ್‌ಗಳು ಮತ್ತು ಸ್ಥಳ',
    assemblyConstituency: 'ವಿಧಾನಸಭಾ ಕ್ಷೇತ್ರ',
    publicQuota: 'ಸಾರ್ವಜನಿಕ ಕೋಟಾ ಲಭ್ಯತೆ',
    numberingHelp: 'ಪ್ರತಿ ವಸತಿ ಪ್ರಕಾರಕ್ಕೂ ಪ್ರತ್ಯೇಕ ಸಂಖ್ಯೆಗಳಿವೆ. ಉಪಯೋಜನೆಗಳನ್ನು ನೋಡಲು ಸ್ಥಳವನ್ನು ವಿಸ್ತರಿಸಿ.',
    eyebrow: 'ನಿಮ್ಮ ಕನಸಿನ ಮನೆ',
    heading: 'ನಿಮ್ಮ ಕನಸಿನ ಮನೆ ಹುಡುಕಿ.',
    intro: 'ವಸತಿ ಸ್ಥಳಗಳು, ಲಭ್ಯತೆ ಮತ್ತು ಮಾರ್ಗದ ಮಾಹಿತಿಯನ್ನು ನೋಡಿ.',
    homes: 'ಮನೆಗಳು',
    location: 'ಸ್ಥಳ',
    availability: 'ಲಭ್ಯತೆ',
    locate: 'ನನ್ನ ಸ್ಥಳ ಬಳಸಿ',
    reset: 'ಫಿಲ್ಟರ್ ತೆರವುಗೊಳಿಸಿ',
    disclaimer: 'ಲಭ್ಯತೆಯನ್ನು ಅಧಿಕೃತವಾಗಿ ದೃಢೀಕರಿಸಬೇಕು.',
    mapEyebrow: 'ಸ್ಥಳಗಳನ್ನು ಅನ್ವೇಷಿಸಿ',
    fit: 'ಎಲ್ಲಾ ಸ್ಥಳಗಳು',
    legend: 'ಲಭ್ಯತೆ',
    projectDetails: 'ಯೋಜನೆಯ ವಿವರಗಳು'
  }
};
const original=new Map([...document.querySelectorAll('[data-i18n]')].map(el=>[el,el.innerHTML]));
// Static UI localization: keep DOM nodes, icons and option values intact.
const staticTranslations = [
 ['.brand-title','ವಸತಿ ಅನ್ವೇಷಕ'],
 ['.brand small','ರಾಜೀವ್ ಗಾಂಧಿ ವಸತಿ ನಿಗಮ ನಿಯಮಿತ'],
 ['#headerLocation small','ನಿಮ್ಮ ಹುಡುಕಾಟದ ಸ್ಥಳ'],
 ['#savedBtn','ಉಳಿಸಿದವು'],
 ['#accessBtn','ಓದುವಿಕೆ ಮತ್ತು ಪ್ರದರ್ಶನ'],
 ['.collection-meta > span:first-child','ಯೋಜನಾ ಸ್ಥಳಗಳು'],
 ['.city-pill','ಬೆಂಗಳೂರು'],
 ['.filter-grid label:nth-child(2) > span','ಸಾರ್ವಜನಿಕ ಕೋಟಾ ಲಭ್ಯತೆ'],
 ['#availabilityFilter option[value=""]','ಎಲ್ಲಾ ಸ್ಥಿತಿಗಳು'],
 ['#availabilityFilter option[value="available"]','10 ಕ್ಕಿಂತ ಹೆಚ್ಚು'],
 ['#availabilityFilter option[value="limited"]','1–10 ಲಭ್ಯ'],
 ['#availabilityFilter option[value="zero"]','ಶೂನ್ಯ / ಋಣಾತ್ಮಕ ವರದಿ'],
 ['#availabilityFilter option[value="unknown"]','ಮಾಹಿತಿ ಲಭ್ಯವಿಲ್ಲ'],
 ['#sortBy option[value="number"]','ಪ್ರದಕ್ಷಿಣಾಕಾರ ಕ್ರಮ'],
 ['#sortBy option[value="name"]','ಹೆಸರು ಅ–ಹ'],
 ['#sortBy option[value="nearest"]','ಹತ್ತಿರದವು ಮೊದಲು'],
 ['.numbering-help','ಪ್ರತಿ ವಸತಿ ಪ್ರಕಾರಕ್ಕೂ ಪ್ರತ್ಯೇಕ ಪ್ರದಕ್ಷಿಣಾಕಾರ ಸಂಖ್ಯೆಗಳಿವೆ. ಉಪಯೋಜನೆಗಳನ್ನು ನೋಡಲು ಸ್ಥಳವನ್ನು ವಿಸ್ತರಿಸಿ.'],
 ['.map-caption','ನಕ್ಷೆಯನ್ನು ಅನ್ವೇಷಿಸಿ · ವಿವರಗಳು ಮತ್ತು ಚಿತ್ರಗಳನ್ನು ನೋಡಲು ಸ್ಥಳ ಆಯ್ಕೆಮಾಡಿ'],
 ['.footer-links a','ಆಶ್ರಯ ಪೋರ್ಟಲ್ ↗'],
 ['#listViewBtn','ಪಟ್ಟಿ'], ['#mapViewBtn','ನಕ್ಷೆ'],
 ['#voiceTitle','ಧ್ವನಿಯ ಮೂಲಕ ಸ್ಥಳ ಹುಡುಕಿ'],
 ['#voiceDialog > p:first-of-type','“ನೆಲಗುಳಿ ಮತ್ತು ಸಾದೇನಹಳ್ಳಿ ಹುಡುಕಿ” ಎಂದು ಹೇಳಿ. ಹಲವು ಸ್ಥಳಗಳ ಹೆಸರುಗಳನ್ನು ಹೇಳಬಹುದು.'],
 ['label[for="voiceLanguage"]','ಮಾತನಾಡುವ ಭಾಷೆ'],
 ['label[for="voiceTranscript"]','ನಿಮ್ಮ ಹುಡುಕಾಟ · ಬೇಕಿದ್ದರೆ ತಿದ್ದುಪಡಿ ಮಾಡಿ'],
 ['#clearVoice','ಮಾತನ್ನು ತೆರವುಗೊಳಿಸಿ'],
 ['#applyVoice','ಹುಡುಕಾಟ ಅನ್ವಯಿಸಿ'],
 ['#voiceDialog > small','ನಿಮ್ಮ ಬ್ರೌಸರ್ ಧ್ವನಿಯನ್ನು ತನ್ನ ಧ್ವನಿ ಸೇವೆಗೆ ಕಳುಹಿಸಬಹುದು. ಈ ಆ್ಯಪ್ ಧ್ವನಿಮುದ್ರಣಗಳನ್ನು ಸಂಗ್ರಹಿಸುವುದಿಲ್ಲ.']
];
const staticNodes=staticTranslations.map(([selector,kn])=>{const el=document.querySelector(selector);return el?{el,kn,html:el.innerHTML}:null;}).filter(Boolean);
const originalAttributes=[
 ['#searchBox','aria-label','ಸ್ಥಳಗಳನ್ನು ಹುಡುಕಿ'], ['#searchBox','placeholder','ಹೆಸರು, ಕ್ಷೇತ್ರ ಅಥವಾ ಗುತ್ತಿಗೆದಾರರನ್ನು ಹುಡುಕಿ'],
 ['#voiceTranscript','placeholder','ಸ್ಥಳ ಅಥವಾ ವಸತಿ ಆದ್ಯತೆ'],
 ['#voiceBtn','aria-label','ಧ್ವನಿ ಹುಡುಕಾಟ ತೆರೆಯಿರಿ'], ['#voiceBtn','title','ಧ್ವನಿ ಹುಡುಕಾಟ'],
 ['#accessBtn','aria-label','ಓದುವಿಕೆ ಮತ್ತು ಪ್ರದರ್ಶನ ಸೆಟ್ಟಿಂಗ್‌ಗಳು'],
 ['#closeDetails','aria-label','ಯೋಜನೆ ವಿವರಗಳನ್ನು ಮುಚ್ಚಿ'],
 ['#closeVoice','aria-label','ಧ್ವನಿ ಹುಡುಕಾಟ ಮುಚ್ಚಿ'],
 ['#fitBtn','title','ಎಲ್ಲಾ ಹೊಂದುವ ಸ್ಥಳಗಳನ್ನು ನಕ್ಷೆಯಲ್ಲಿ ತೋರಿಸಿ']
].map(([selector,attr,kn])=>{const el=document.querySelector(selector);return el?{el,attr,kn,en:el.getAttribute(attr)}:null;}).filter(Boolean);
function applyStaticLanguage(){
 original.forEach((v,el)=>{
  if(lang==='en'){el.innerHTML=v;return;}
  const value=translations.kn[el.dataset.i18n];if(!value)return;
  // The heading has nested emphasis; retain it instead of flattening the DOM.
  if(el.dataset.i18n==='heading')el.innerHTML='ನಿಮ್ಮ ಕನಸಿನ ಮನೆ.<br><em>ನಿಮಗಾಗಿ ಕಾಯುತ್ತಿದೆ.</em>';
  else if(el.children.length===0)el.textContent=value;
  else {const textNode=[...el.childNodes].find(n=>n.nodeType===Node.TEXT_NODE&&n.textContent.trim());if(textNode)textNode.textContent=value;}
 });
 staticNodes.forEach(({el,kn,html})=>{
  if(lang==='en'){if(el.id==='savedBtn'||el.matches('.collection-meta > span:first-child,.city-pill,#listViewBtn,#mapViewBtn')){const node=[...el.childNodes].find(n=>n.nodeType===Node.TEXT_NODE&&n.textContent.trim());const tmp=document.createElement('div');tmp.innerHTML=html;const originalNode=[...tmp.childNodes].find(n=>n.nodeType===Node.TEXT_NODE&&n.textContent.trim());if(node&&originalNode)node.textContent=originalNode.textContent;}else el.innerHTML=html;return;}
  if(el.id==='savedBtn'){const node=[...el.childNodes].find(n=>n.nodeType===Node.TEXT_NODE&&n.textContent.trim());if(node)node.textContent=' '+kn+' ';return;}
  if(el.matches('.collection-meta > span:first-child')){const node=[...el.childNodes].find(n=>n.nodeType===Node.TEXT_NODE&&n.textContent.trim());if(node)node.textContent=' '+kn;return;}
  if(el.matches('.city-pill,#listViewBtn,#mapViewBtn')){const node=[...el.childNodes].find(n=>n.nodeType===Node.TEXT_NODE&&n.textContent.trim());if(node)node.textContent=kn;return;}
  el.textContent=kn;
 });
 originalAttributes.forEach(({el,attr,kn,en})=>el.setAttribute(attr,lang==='kn'?kn:en));
 $('headerLocationText').textContent=state.position?tr('Your current location','ನಿಮ್ಮ ಪ್ರಸ್ತುತ ಸ್ಥಳ'):tr('Explore Bengaluru','ಬೆಂಗಳೂರನ್ನು ಅನ್ವೇಷಿಸಿ');
 window.dispatchEvent(new CustomEvent('olh-language-change',{detail:{lang}}));
}

const labels={en:{availability:'Availability',unknown:'Data unavailable',zero:'None available',limited:'available',available:'available',sites:'sites found',directions:'Get directions',share:'Share site',photos:'Photos & videos',noMedia:'No photos or videos have been published for this site yet.'},kn:{availability:'ಲಭ್ಯತೆ',unknown:'ಮಾಹಿತಿ ಲಭ್ಯವಿಲ್ಲ',zero:'ಲಭ್ಯವಿಲ್ಲ',limited:'ಲಭ್ಯ',available:'ಲಭ್ಯ',sites:'ಸ್ಥಳಗಳು',directions:'ಮಾರ್ಗ ನೋಡಿ',share:'ಸ್ಥಳ ಹಂಚಿಕೊಳ್ಳಿ',photos:'ಚಿತ್ರಗಳು ಮತ್ತು ವೀಡಿಯೊಗಳು',noMedia:'ಈ ಸ್ಥಳಕ್ಕೆ ಇನ್ನೂ ಚಿತ್ರಗಳು ಅಥವಾ ವೀಡಿಯೊಗಳನ್ನು ಪ್ರಕಟಿಸಲಾಗಿಲ್ಲ.'}};
const text=k=>labels[lang][k];
const tr=(en,kn)=>lang==='kn'?kn:en;
function displayName(s){return lang==='kn'&&s.nameKn?s.nameKn:s.name;}
function toast(message){$('toast').textContent=message;$('toast').hidden=false;clearTimeout(toast.timer);toast.timer=setTimeout(()=>$('toast').hidden=true,3500);}
async function loadJSON(path){const response=await fetch(path);if(!response.ok)throw new Error(`Could not load ${path}`);return response.json();}
function initMap(){if(!window.L){$('mapError').hidden=false;$('mapError').textContent='Map could not load. Browse the site list and use directions.';return;}
 map=L.map('map',{zoomControl:true}).setView([12.9716,77.5946],10);layer=L.layerGroup().addTo(map);
 let errors=0;L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',{maxZoom:19,attribution:'© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'}).on('tileerror',()=>{if(++errors>=3){$('mapError').textContent='Map tiles are unavailable. Site markers, the list and directions still work.';$('mapError').hidden=false;}}).on('tileload',()=>{$('mapError').hidden=true;errors=0;}).addTo(map);
 map.on('zoomend',renderMarkers);
}
function badge(s){
 const status=OLH.status(s);
 const value=s.available===null?text('unknown'):s.available===0?text('zero'):s.available<0?`${s.available.toLocaleString('en-IN')} ${tr('reported','ವರದಿಯಾಗಿದೆ')}`:`${s.available.toLocaleString('en-IN')} ${text(status)}`;
 return `<span class="badge ${status}${s.available<0?' negative-quota':''}"><i class="dot ${status}"></i>${tr('Public','ಸಾರ್ವಜನಿಕ ಕೋಟಾ')} · ${value}</span>`;
}
function distanceText(s){return !OLH.validCoordinates(s)?tr('Coordinates unavailable','ನಿರ್ದೇಶಾಂಕಗಳು ಲಭ್ಯವಿಲ್ಲ'):state.position?`${OLH.distance(...state.position,s.latitude,s.longitude).toFixed(1)} km`:tr('View details','ವಿವರಗಳನ್ನು ನೋಡಿ');}
function render(){clearTimeout(searchReadTimer);reader?.stop();const activeCount=Number(Boolean(state.constituency))+Number(Boolean(state.availability));$('activeFilterCount').textContent=activeCount?`${activeCount} ${tr('active','ಸಕ್ರಿಯ')}`:'';filtered=OLH.filterSites(sites,state);if(state.savedOnly)filtered=filtered.filter(s=>saved.has(s.key));$('savedCount').textContent=saved.size;$('savedBtn').setAttribute('aria-pressed',state.savedOnly);$('collectionCount').textContent=OLHLocations.group(sites.filter(s=>s.mode===state.mode)).length;if(state.selected&&!filtered.some(s=>s.key===state.selected)){state.selected=null;closeDetails(false);writeURL();}
 const locationCount = OLHLocations.group(filtered).length;

$('resultCount').textContent = lang === 'kn'
  ? `${locationCount} ಸ್ಥಳಗಳು · ${filtered.length} ಯೋಜನೆಗಳು`
  : `${locationCount} ${locationCount === 1 ? 'location' : 'locations'} · ${filtered.length} ${filtered.length === 1 ? 'project' : 'projects'}`;

const known = filtered.filter(s => s.available !== null);

$('resultSummary').textContent = state.mode === '1'
  ? (lang === 'kn'
      ? `${state.sort === 'nearest' ? 'ಹತ್ತಿರದ ಸ್ಥಳಗಳು ಮೊದಲು · ' : ''}${known.length} ಯೋಜನೆಗಳಿಗೆ ಲಭ್ಯತೆಯ ಮಾಹಿತಿ ವರದಿಯಾಗಿದೆ`
      : `${state.sort === 'nearest' ? 'Nearest first · ' : ''}${known.length} with reported availability`)
  : (lang === 'kn'
      ? '2 BHK ಯೋಜನೆಗಳ ಸ್ಥಳಗಳನ್ನು ಅನ್ವೇಷಿಸಿ'
      : 'Explore 2 BHK project locations'); $('mapTitle').textContent=`${state.mode} BHK ${lang==='kn'?'ಯೋಜನೆಯ ಸ್ಥಳಗಳು':'project locations'}`;
 $('legend').innerHTML=state.mode==='2'?`<strong>2 BHK</strong><span><i class="dot unknown"></i> ${text('unknown')}</span>`:`<strong>${tr('Public quota','ಸಾರ್ವಜನಿಕ ಕೋಟಾ')}</strong><span><i class="dot available"></i> &gt;10</span><span><i class="dot limited"></i> 1–10</span><span><i class="dot zero"></i> ≤0</span><span><i class="dot unknown"></i> ${text('unknown')}</span>`;
 $('siteList').innerHTML=filtered.length?OLHLocations.group(filtered).map(groupCard).join(''):`<div class="empty"><strong>${state.savedOnly?tr('Your saved list starts here.','ನೀವು ಉಳಿಸಿದ ಸ್ಥಳಗಳು ಇಲ್ಲಿ ಕಾಣಿಸುತ್ತವೆ.'):tr('No matching sites','ಹೊಂದಿಕೆಯಾಗುವ ಸ್ಥಳಗಳಿಲ್ಲ')}</strong>${state.savedOnly?tr('Tap the heart on a project to save it.','ಯೋಜನೆಯನ್ನು ಉಳಿಸಲು ಹೃದಯದ ಗುರುತನ್ನು ಒತ್ತಿ.'):tr('Try another neighbourhood or clear your filters.','ಬೇರೆ ಸ್ಥಳವನ್ನು ಹುಡುಕಿ ಅಥವಾ ಫಿಲ್ಟರ್‌ಗಳನ್ನು ತೆರವುಗೊಳಿಸಿ.')}<br><button class="text-button" id="emptyReset">${state.savedOnly?tr('Explore all sites','ಎಲ್ಲಾ ಸ್ಥಳಗಳನ್ನು ನೋಡಿ'):tr('Clear filters','ಫಿಲ್ಟರ್ ತೆರವುಗೊಳಿಸಿ')}</button></div>`;
 $('emptyReset')?.addEventListener('click',resetFilters);
 renderMarkers();
}
function negativeQuotaNote(s){
 const categories=lang==='kn'?['SC','ಸಾಮಾನ್ಯ','ಅಲ್ಪಸಂಖ್ಯಾತರು']:['SC','General','Minority'];
 return [[tr('Public','ಸಾರ್ವಜನಿಕ ಕೋಟಾ'),s.breakdown],[tr('MLA','ಶಾಸಕರ ಕೋಟಾ'),s.mlaBreakdown]].flatMap(([quota,values])=>(values||[]).map((n,i)=>Number.isFinite(n)&&n<0?`${quota} ${categories[i]}: ${n.toLocaleString('en-IN')}`:'')).filter(Boolean).join(' · ');
}
function projectCard(s,child=false){
  const photo=coverPhoto(s.key);
  const constituencyLabel=lang==='kn'?'ವಿಧಾನಸಭಾ ಕ್ಷೇತ್ರ':'Constituency';
  const surveyLabel=lang==='kn'?'ಸರ್ವೆ ಸಂಖ್ಯೆ':'Survey';
  const readLabel=lang==='kn'?'ಧ್ವನಿಯಲ್ಲಿ ಓದಿ':'Read aloud';
  const mlaLabel=lang==='kn'?'ಶಾಸಕರ ಕೋಟಾ':'MLA quota';
  const reportedLabel=lang==='kn'?'ವರದಿಯಾದ ಸಂಖ್ಯೆ':'reported';return `<article class="site-card ${state.selected===s.key?'selected':''}" data-key="${s.key}"><button class="card-main" aria-label="${escapeHTML(`${s.number}. ${displayName(s)}, ${tr('survey','ಸರ್ವೆ ಸಂಖ್ಯೆ')} ${s.survey}, ${s.area}`)}"><span class="card-cover cover-${s.number%5+1}">${photo?`<img src="${escapeHTML(photo.src)}" alt="${escapeHTML(photo.alt||s.name)}" loading="lazy">`:icon('building')}<span class="cover-site-no">${escapeHTML(s.displayNumber)}</span></span><span class="card-body"><strong>${escapeHTML(displayName(s))}</strong>${child?`<span class="parcel-label">${escapeHTML(s.parcelLabel)}</span>`:''}<small>${constituencyLabel}: ${escapeHTML(s.area)} · ${s.mode} BHK</small><small>${surveyLabel} ${escapeHTML(s.survey||'—')}</small><span class="card-bottom">${badge(s)}<span class="card-distance">${state.position?icon('pin'):icon('arrow')}${escapeHTML(distanceText(s))}</span></span>${s.approximate?`<span class="card-mla">${tr('Availability needs confirmation','ಲಭ್ಯತೆಯನ್ನು ದೃಢೀಕರಿಸಬೇಕು')}</span>`:''}${s.sourceIssue?`<span class="card-mla">${tr('Source figures need review','ಮೂಲ ಸಂಖ್ಯೆಗಳ ಪರಿಶೀಲನೆ ಅಗತ್ಯ')}</span>`:''}${negativeQuotaNote(s)?`<span class="negative-quota">${escapeHTML(negativeQuotaNote(s))} · ${reportedLabel}</span>`:''}${s.mlaAvailable!==null&&s.mlaAvailable!==undefined?`<span class="card-mla${s.mlaAvailable<0?' negative-quota':''}">${mlaLabel} · ${s.mlaAvailable.toLocaleString('en-IN')} ${reportedLabel}</span>`:''}</span></button><button class="save-site" data-save="${s.key}" aria-pressed="${saved.has(s.key)}" aria-label="${saved.has(s.key)?tr('Remove saved site','ಉಳಿಸಿದ ಸ್ಥಳವನ್ನು ತೆಗೆದುಹಾಕಿ'):tr('Save site','ಸ್ಥಳವನ್ನು ಉಳಿಸಿ')}">${icon('heart')}</button><button class="read-project" data-read="${s.key}" aria-label="${tr('Read aloud','ಧ್ವನಿಯಲ್ಲಿ ಓದಿ')}: ${escapeHTML(displayName(s))}, ${escapeHTML(s.parcelLabel)}"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true"><path d="M11 4 5 9H2v6h3l6 5V4ZM15 8a6 6 0 0 1 0 8M18 4a11 11 0 0 1 0 16"/></svg><span>${readLabel}</span></button></article>`;}
function groupCard(g){
 const all=sites.filter(s=>s.mode===state.mode&&s.locationId===g.id);
 if(all.length===1)return projectCard(g.sites[0]);
 const open=state.expanded===g.id||g.sites.some(s=>s.key===state.selected);
 const photo=all.map(s=>coverPhoto(s.key)).find(Boolean),name=lang==='kn'&&g.nameKn?g.nameKn:g.name;
 const projectCount=g.sites.length===all.length?String(all.length):lang==='kn'?`${all.length}ರಲ್ಲಿ ${g.sites.length}`:`${g.sites.length} of ${all.length}`;
 return `<section class="location-group ${open?'expanded':''}" data-location="${g.id}"><button class="group-toggle" data-group="${g.id}" aria-expanded="${open}" aria-controls="parcels-${g.id}"><span class="group-art">${photo?`<img src="${escapeHTML(photo.src)}" alt="">`:icon('building')}<b>${String(g.number).padStart(2,'0')}</b></span><span class="group-description"><strong>${escapeHTML(name)}</strong><small>${tr('Constituency','ವಿಧಾನಸಭಾ ಕ್ಷೇತ್ರ')}: ${escapeHTML(all[0].constituency)}</small><span class="parcel-count">${projectCount} ${tr('parcels / projects','ಉಪಯೋಜನೆಗಳು / ಯೋಜನೆಗಳು')} · ${state.mode} BHK</span></span><span class="group-chevron" aria-hidden="true">⌄</span></button><button class="read-group" data-read-group="${g.id}" aria-label="${tr('Read location summary','ಸ್ಥಳದ ಸಾರಾಂಶವನ್ನು ಓದಿ')}: ${escapeHTML(name)}">${tr('Read location summary','ಸ್ಥಳದ ಸಾರಾಂಶವನ್ನು ಓದಿ')}</button><div class="parcel-list" id="parcels-${g.id}" ${open?'':'hidden'}>${g.sites.map(s=>projectCard(s,true)).join('')}</div></section>`;
}
function toggleGroup(id){
 if(state.selected){state.selected=null;closeDetails(false);writeURL();}
 state.expanded=state.expanded===id?null:id;render();
 const button=document.querySelector(`[data-group="${id}"]`);button?.focus({preventScroll:true});button?.scrollIntoView({block:'nearest'});
 const group=OLHLocations.group(filtered).find(g=>g.id===id);
 if(map&&group&&Number.isFinite(group.latitude))map.panTo([group.latitude,group.longitude],{animate:!matchMedia('(prefers-reduced-motion: reduce)').matches});
}
function getGroupRead(key){const project=sites.find(s=>s.key===key);if(project)reader?.readSite(key);else reader?.readGroup(key);}
function renderMarkers(){if(!map)return;layer.clearLayers();markers.clear();
 for(const g of OLHLocations.group(filtered)){
  const items=g.sites.filter(OLH.validCoordinates);if(!items.length)continue;
  const expanded=state.expanded===g.id||g.sites.some(s=>s.key===state.selected);
  const add=(key,point,html,title,action)=>{const marker=L.marker(point,{icon:L.divIcon({className:'location-marker',html,iconSize:[40,40],iconAnchor:[20,20]}),title,alt:title,keyboard:true}).bindTooltip(escapeHTML(title),{direction:'top',permanent:map.getZoom()>=13&&filtered.length<=15}).on('click',action).addTo(layer);markers.set(key,marker);const read=()=>getGroupRead(key);marker.on('mouseover',()=>reader?.schedule(marker,read));marker.on('mouseout',()=>reader?.leave(marker));const el=marker.getElement();el?.addEventListener('focus',()=>reader?.schedule(marker,read));el?.addEventListener('blur',()=>reader?.leave(marker));};
  if(items.length>1&&!expanded){add(g.id,[g.latitude,g.longitude],`<span class="group-pin">${g.number}<b>${items.length}</b></span>`,`${lang==='kn'&&g.nameKn?g.nameKn:g.name} · ${items.length} ${tr('projects','ಯೋಜನೆಗಳು')}`,()=>toggleGroup(g.id));continue;}
  items.forEach((s,i)=>{
   let point=L.latLng(s.latitude,s.longitude);
   if(items.length>1){const base=map.latLngToLayerPoint([g.latitude,g.longitude]),angle=(i/items.length)*Math.PI*2-Math.PI/2;point=map.layerPointToLatLng(base.add([Math.cos(angle)*58,Math.sin(angle)*58]));L.polyline([[s.latitude,s.longitude],point],{weight:1,color:'#8b9ed0',dashArray:'3 4',interactive:false}).addTo(layer);}
   add(s.key,point,`<span class="site-pin ${OLH.status(s)} ${state.selected===s.key?'selected':''}">${escapeHTML(s.displayNumber)}</span>`,`${s.locationName} · ${s.parcelLabel}`,()=>selectSite(s.key));
  });
 }
}
function populateAreas(){const areas=[...new Set(sites.filter(s=>s.mode===state.mode).map(s=>s.constituency))].sort();$('constituencyFilter').innerHTML=`<option value="">${tr('All constituencies','ಎಲ್ಲಾ ವಿಧಾನಸಭಾ ಕ್ಷೇತ್ರಗಳು')}</option>`+areas.map(a=>`<option value="${escapeHTML(a)}">${escapeHTML(a)}</option>`).join('');$('constituencyFilter').value=state.constituency;}
function changeMode(mode){state.expanded=null;state.mode=mode;state.location='';state.constituency='';state.selected=null;closeDetails(false);populateAreas();document.querySelectorAll('[data-mode]').forEach(b=>{b.classList.toggle('active',b.dataset.mode===mode);b.setAttribute('aria-pressed',b.dataset.mode===mode);});render();writeURL();fit();}
function selectSite(key,update=true){const s=filtered.find(s=>s.key===key);if(!s)return;state.selected=key;state.expanded=s.locationId;render();renderDetails(s);if(!$('siteDialog').open){if(innerWidth<=700)$('siteDialog').showModal();else $('siteDialog').show();}$('detailTitle').focus({preventScroll:true});if(map&&OLH.validCoordinates(s))map.panTo([s.latitude,s.longitude],{animate:!matchMedia('(prefers-reduced-motion: reduce)').matches});if(update)writeURL();}
function availabilityTable(s) {
  const kn = lang === 'kn';

  const missing = kn ? 'ಮಾಹಿತಿ ಲಭ್ಯವಿಲ್ಲ' : 'Data unavailable';
  const publicLabel = kn ? 'ಸಾರ್ವಜನಿಕ ಕೋಟಾ' : 'Public quota availability';
  const mlaLabel = kn ? 'ಶಾಸಕರ ಕೋಟಾ' : 'MLA quota availability';

  const categories = kn
    ? ['ಪರಿಶಿಷ್ಟ ಜಾತಿ (SC)', 'ಸಾಮಾನ್ಯ (General)', 'ಅಲ್ಪಸಂಖ್ಯಾತರು (Minority)', 'ಒಟ್ಟು']
    : ['SC', 'General', 'Minority', 'Total'];

  const value = n =>
    n === null || n === undefined
      ? `<span class="quota-missing">${missing}</span>`
      : n < 0
        ? `<span class="negative-quota">${n.toLocaleString('en-IN')}</span>`
        : n.toLocaleString('en-IN');

  const rows = categories.map((label, i) =>
    `<tr${i === 3 ? ' class="quota-total"' : ''}>
      <th scope="row">${label}</th>
      <td>${value(i === 3 ? s.available : s.breakdown?.[i])}</td>
      <td>${value(i === 3 ? s.mlaAvailable : s.mlaBreakdown?.[i])}</td>
    </tr>`
  ).join('');

  const caption = kn
    ? 'ಕೋಟಾವಾರು ವರದಿಯಾದ ಲಭ್ಯತೆ'
    : 'Reported availability by quota';

  const categoryHeading = kn ? 'ವರ್ಗ' : 'Category';

  const fallbackReason = kn
    ? 'ಈ ಯೋಜನೆಗೆ ಶಾಸಕರ ಕೋಟಾದ ಸಂಖ್ಯೆಗಳು ಲಭ್ಯವಾಗಿಲ್ಲ.'
    : 'MLA quota counts were not supplied for this project.';

  const explanation = kn
    ? 'ಸಾರ್ವಜನಿಕ ಮತ್ತು ಶಾಸಕರ ಕೋಟಾಗಳನ್ನು ಪ್ರತ್ಯೇಕವಾಗಿ ತೋರಿಸಲಾಗಿದೆ.'
    : 'Public and MLA quotas are shown separately.';

  // Preserve the original source explanation if one exists.
  const reason = s.mlaReason || fallbackReason;

  return `
    <table class="quota-table">
      <caption>${caption}</caption>
      <thead>
        <tr>
          <th scope="col">${categoryHeading}</th>
          <th scope="col">${publicLabel}</th>
          <th scope="col">${mlaLabel}</th>
        </tr>
      </thead>
      <tbody>${rows}</tbody>
    </table>
    <p class="quota-note">
      ${escapeHTML(reason)} ${explanation}
    </p>`;
}
function renderDetails(s) {
  const kn = lang === 'kn';
  const t = (en, kannada) => kn ? kannada : en;

  const pair = (name, value) => `
    <div>
      <dt>${escapeHTML(name)}</dt>
      <dd>${escapeHTML(value ?? t('Not supplied', 'ಮಾಹಿತಿ ನೀಡಲಾಗಿಲ್ಲ'))}</dd>
    </div>`;

  const photo = coverPhoto(s.key);

  const sourceNote = `
    <details class="source-note">
      <summary>${t('About this availability data', 'ಈ ಲಭ್ಯತೆಯ ಮಾಹಿತಿಯ ಕುರಿತು')}</summary>

      ${s.approximate
        ? `<p>${t(
            'Availability for this parcel needs confirmation with RGHCL.',
            'ಈ ಯೋಜನೆಯ ಲಭ್ಯತೆಯನ್ನು RGHCL ಮೂಲಕ ದೃಢೀಕರಿಸಬೇಕು.'
          )}</p>`
        : ''}

      <p>${s.available === null
        ? escapeHTML(s.reason || t(
            'Availability information was not supplied.',
            'ಲಭ್ಯತೆಯ ಮಾಹಿತಿ ನೀಡಲಾಗಿಲ್ಲ.'
          ))
        : t(
            'These are reported counts in the supplied Ashraya data, not a guarantee of allotment.',
            'ಇವು ಆಶ್ರಯ ಮಾಹಿತಿಯಲ್ಲಿ ವರದಿಯಾದ ಸಂಖ್ಯೆಗಳು. ಇವು ಮನೆ ಹಂಚಿಕೆಯ ಖಾತರಿಯಲ್ಲ.'
          )}</p>

      ${s.records.length > 0 && s.matchMethod === 'unresolved'
        ? `
          <p>${t(
            'These source rows refer to the location. They have not been assigned to this individual parcel.',
            'ಈ ಮೂಲ ದಾಖಲೆಗಳು ಸ್ಥಳಕ್ಕೆ ಸಂಬಂಧಿಸಿವೆ. ಇವುಗಳನ್ನು ನಿರ್ದಿಷ್ಟ ಉಪಯೋಜನೆಗೆ ಇನ್ನೂ ಹೊಂದಿಸಲಾಗಿಲ್ಲ.'
          )}</p>

          ${s.records.map(r => `
            <div class="source-row">
              <strong lang="kn">${escapeHTML(r.name)}</strong>
              ${escapeHTML(r.category)} ·
              ${r.total === null
                ? t('Counts need review', 'ಸಂಖ್ಯೆಗಳ ಪರಿಶೀಲನೆ ಅಗತ್ಯ')
                : `${r.total} ${t('reported flats', 'ವರದಿಯಾದ ಮನೆಗಳು')}`}
              ${r.survey
                ? ` · ${t('Survey', 'ಸರ್ವೆ ಸಂಖ್ಯೆ')} ${escapeHTML(r.survey)}`
                : ''}
            </div>
          `).join('')}
        `
        : ''}

      <p>
        <a href="https://ashraya.karnataka.gov.in/cm_selection_flat/frmConstwise_Report_Available.aspx"
           target="_blank"
           rel="noopener noreferrer">
          ${t('Check the official report ↗', 'ಅಧಿಕೃತ ವರದಿಯನ್ನು ಪರಿಶೀಲಿಸಿ ↗')}
        </a>
      </p>
    </details>`;

  const availableContent = s.available !== null
    ? `
      <span class="count">
        ${s.available.toLocaleString('en-IN')}
        <small style="font-size:11px;font-weight:500;letter-spacing:0">
          ${t('reported available', 'ವರದಿಯಾದ ಲಭ್ಯತೆ')}
        </small>
      </span>
      <p>${t(
        'Confirm current availability before applying.',
        'ಅರ್ಜಿ ಸಲ್ಲಿಸುವ ಮೊದಲು ಪ್ರಸ್ತುತ ಲಭ್ಯತೆಯನ್ನು ದೃಢೀಕರಿಸಿ.'
      )}</p>`
    : `
      <span class="count unknown-count">
        ${t('Availability data unavailable', 'ಲಭ್ಯತೆಯ ಮಾಹಿತಿ ಲಭ್ಯವಿಲ್ಲ')}
      </span>
      <p>${t(
        'Please confirm current availability with RGHCL.',
        'ಪ್ರಸ್ತುತ ಲಭ್ಯತೆಯನ್ನು RGHCL ಮೂಲಕ ದೃಢೀಕರಿಸಿ.'
      )}</p>

      ${s.units !== undefined
        ? `<p style="margin-top:8px">
            <strong>${s.units === null
              ? t('Unknown', 'ತಿಳಿದಿಲ್ಲ')
              : s.units.toLocaleString('en-IN')}</strong>
            ${t(
              'project units in the source file. Available stock is not supplied.',
              'ಮೂಲ ದಾಖಲೆಯಲ್ಲಿರುವ ಒಟ್ಟು ಮನೆಗಳು. ಲಭ್ಯವಿರುವ ಮನೆಗಳ ಸಂಖ್ಯೆ ನೀಡಲಾಗಿಲ್ಲ.'
            )}
          </p>`
        : ''}`;

  $('details').innerHTML = `
    <div class="detail-body">

      <div class="detail-hero">
        ${photo
          ? `<img src="${escapeHTML(photo.src)}"
                  alt="${escapeHTML(photo.alt || s.name)}">`
          : icon('building')}

        <span class="detail-hero-label">
          ${icon(photo ? 'camera' : 'building')}
          ${photo
            ? t('Site photography', 'ಯೋಜನೆಯ ಛಾಯಾಚಿತ್ರ')
            : t(
                'Project location · Site photos coming soon',
                'ಯೋಜನೆಯ ಸ್ಥಳ · ಛಾಯಾಚಿತ್ರಗಳು ಶೀಘ್ರದಲ್ಲೇ'
              )}
        </span>
      </div>

      <div class="detail-title-row">
        <span class="project-type">
          ${s.mode} BHK · ${t('LOCATION', 'ಸ್ಥಳ')} ${s.number}
          · ${escapeHTML(s.parcelLabel)}
        </span>

        <button class="save-site"
                data-save="${escapeHTML(s.key)}"
                aria-pressed="${saved.has(s.key)}"
                aria-label="${t('Save site', 'ಸ್ಥಳವನ್ನು ಉಳಿಸಿ')}">
          ${icon('heart')}
        </button>
      </div>

      <h2 id="detailTitle" tabindex="-1">
        ${escapeHTML(displayName(s))}
      </h2>

      ${s.nameKn && lang === 'en'
        ? `<p class="kn-name" lang="kn">${escapeHTML(s.nameKn)}</p>`
        : ''}

      <p class="detail-subtitle">
        ${t('Constituency', 'ವಿಧಾನಸಭಾ ಕ್ಷೇತ್ರ')}:
        ${escapeHTML(s.constituency || s.area)}
      </p>

      <div class="availability-box">
        <span class="eyebrow">
          ${t('PUBLIC QUOTA AVAILABILITY', 'ಸಾರ್ವಜನಿಕ ಕೋಟಾ ಲಭ್ಯತೆ')}
        </span>

        ${availableContent}
        ${availabilityTable(s)}
        ${sourceNote}
      </div>

      <div class="detail-reader">
        <button class="quiet"
                data-read="${escapeHTML(s.key)}"
                aria-label="${t('Read project details aloud', 'ಯೋಜನೆಯ ವಿವರಗಳನ್ನು ಧ್ವನಿಯಲ್ಲಿ ಓದಿ')}">
          ${t('Read this project', 'ಈ ಯೋಜನೆಯನ್ನು ಓದಿ')}
        </button>

        <button class="quiet" data-reader-pause>
          ${t('Pause', 'ವಿರಾಮ')}
        </button>

        <button class="quiet" data-reader-stop>
          ${t('Stop reading', 'ಓದುವುದನ್ನು ನಿಲ್ಲಿಸಿ')}
        </button>

        <p data-reader-message role="status"></p>
      </div>

      <div class="detail-actions">
        ${OLH.validCoordinates(s)
          ? `<a class="primary"
                target="_blank"
                rel="noopener noreferrer"
                href="https://www.google.com/maps/dir/?api=1&destination=${s.latitude},${s.longitude}">
                ${icon('arrow')}${text('directions')}
             </a>`
          : ''}

        <button class="quiet" id="shareBtn">
          ${icon('share')}${text('share')}
        </button>
      </div>

      <dl class="detail-meta">
        ${pair(
          t('Assembly constituency', 'ವಿಧಾನಸಭಾ ಕ್ಷೇತ್ರ'),
          s.constituency
        )}

        ${pair(
          t('Project stock', 'ಯೋಜನೆಯ ಒಟ್ಟು ಮನೆಗಳು') + ' · ' + s.mode + ' BHK',
          s.units?.toLocaleString('en-IN')
        )}

        ${pair(
          t('Survey number', 'ಸರ್ವೆ ಸಂಖ್ಯೆ'),
          s.survey
        )}

        ${pair(
          t('Contractor', 'ಗುತ್ತಿಗೆದಾರ'),
          s.agency
        )}

        ${pair(
          t('Distance · straight-line', 'ದೂರ · ನೇರ ರೇಖೆಯಲ್ಲಿ'),
          !OLH.validCoordinates(s)
            ? t('Not available', 'ಲಭ್ಯವಿಲ್ಲ')
            : state.position
              ? distanceText(s)
              : t(
                  'Allow location to calculate',
                  'ದೂರ ತಿಳಿಯಲು ಸ್ಥಳದ ಅನುಮತಿ ನೀಡಿ'
                )
        )}
      </dl>

      <section class="media-section">
        <h3>${text('photos')}</h3>

        <p>${t(
          'A closer look at the project, published by the maintainer.',
          'ನಿರ್ವಾಹಕರು ಪ್ರಕಟಿಸಿದ ಯೋಜನೆಯ ಚಿತ್ರಗಳು ಮತ್ತು ವೀಡಿಯೊಗಳು.'
        )}</p>

        <div id="siteGallery" class="media-grid"></div>

        <div id="galleryStatus" class="media-empty">
          ${t('Loading gallery…', 'ಚಿತ್ರಗಳನ್ನು ಲೋಡ್ ಮಾಡಲಾಗುತ್ತಿದೆ…')}
        </div>
      </section>

    </div>`;

  $('shareBtn').addEventListener('click', share);

  $('details')
    .querySelector('[data-save]')
    .addEventListener('click', e => {
      toggleSaved(e.currentTarget.dataset.save);
    });

  renderGallery(s);
}
async function renderGallery(s){const token=++galleryToken;galleryURLs.forEach(URL.revokeObjectURL);galleryURLs=[];
 try{const result=await OLHMedia.gallery(manifest,s.key,preview);if(token!==galleryToken||state.selected!==s.key)return;
 const items=result.items;$('galleryStatus').hidden=items.length>0;if(!items.length)$('galleryStatus').textContent=text('noMedia');
 items.forEach((item,i)=>{let src=item.src;if(item.blob){src=URL.createObjectURL(item.blob);galleryURLs.push(src);}const b=document.createElement('button');b.className='media-thumb';b.setAttribute('aria-label',`${tr('View','ನೋಡಿ')} ${item.type==='video'?tr('video','ವೀಡಿಯೊ'):tr('photo','ಚಿತ್ರ')}: ${item.caption||displayName(s)}`);const media=document.createElement(item.type==='video'?'video':'img');media.src=src;if(item.type==='image'){media.alt=item.alt||item.caption||s.name;media.loading='lazy';}else{media.preload='metadata';media.muted=true;const tag=document.createElement('div');tag.className='video-indicator';tag.textContent=tr('▶ Video','▶ ವೀಡಿಯೊ');b.appendChild(tag);}const caption=document.createElement('span');caption.textContent=item.caption||`${item.type==='video'?tr('Video','ವೀಡಿಯೊ'):tr('Photo','ಚಿತ್ರ')} ${i+1}`;b.append(media,caption);b.addEventListener('click',()=>openViewer(item,src));$('siteGallery').appendChild(b);});
 if(result.draft){const note=document.createElement('p');note.className='manager-note';note.textContent=tr('Local draft preview — this media is not public until published.','ಸ್ಥಳೀಯ ಕರಡು ಮುನ್ನೋಟ — ಪ್ರಕಟಿಸುವವರೆಗೆ ಈ ಮಾಧ್ಯಮ ಸಾರ್ವಜನಿಕವಾಗಿರುವುದಿಲ್ಲ.');$('siteGallery').after(note);}
 }catch(e){if(token===galleryToken&&$('galleryStatus'))$('galleryStatus').textContent=tr('Unable to load local draft. Published media remains available in the normal view.','ಸ್ಥಳೀಯ ಕರಡನ್ನು ಲೋಡ್ ಮಾಡಲು ಸಾಧ್ಯವಾಗಲಿಲ್ಲ. ಪ್ರಕಟಿತ ಮಾಧ್ಯಮ ಸಾಮಾನ್ಯ ವೀಕ್ಷಣೆಯಲ್ಲಿ ಲಭ್ಯವಿದೆ.');}
}
function openViewer(item,src){$('viewerContent').replaceChildren();const el=document.createElement(item.type==='video'?'video':'img');el.src=src;if(item.type==='video'){el.controls=true;el.preload='metadata';el.playsInline=true;}else el.alt=item.alt||item.caption||'Site photo';const p=document.createElement('p');p.textContent=item.caption||'';$('viewerContent').append(el,p);$('viewer').showModal();}
function closeDetails(clear=true){const previousKey=state.selected;reader?.stop();if($('viewer').open)$('viewer').close();$('siteDialog').close();galleryToken++;if(clear){state.selected=null;render();writeURL();document.querySelector(`[data-key="${previousKey}"] .card-main`)?.focus({preventScroll:true});}}
function writeURL(){const p=new URLSearchParams();p.set('bhk',state.mode);if(state.selected)p.set('site',state.selected);if(state.search)p.set('q',state.search);if(state.constituency)p.set('constituency',state.constituency);if(state.availability)p.set('status',state.availability);if(preview)p.set('preview','1');const url=new URL(location.href);url.search=p.toString();history.replaceState(null,'',url);}
async function share(){const u=new URL(location.href);u.searchParams.delete('preview');try{if(navigator.share)await navigator.share({title:sites.find(s=>s.key===state.selected).name,url:u.href});else{await navigator.clipboard.writeText(u.href);toast(tr('Site link copied.','ಸ್ಥಳದ ಲಿಂಕ್ ನಕಲಿಸಲಾಗಿದೆ.'));}}catch(e){if(e.name!=='AbortError'){const box=document.createElement('input');box.value=u.href;$('details').append(box);box.select();toast(tr('Copy the selected site link.','ಆಯ್ಕೆ ಮಾಡಿದ ಸ್ಥಳದ ಲಿಂಕ್ ನಕಲಿಸಿ.'));}}}
function fit(){if(!map)return;const points=filtered.filter(OLH.validCoordinates).map(s=>[s.latitude,s.longitude]);if(points.length)map.fitBounds(points,{paddingTopLeft:map.getSize().x<500?[24,85]:[40,95],paddingBottomRight:map.getSize().x<500?[24,45]:[40,50],maxZoom:13});else map.setView([12.9716,77.5946],10);}
function resetFilters(){Object.assign(state,{search:'',location:'',constituency:'',availability:'',sort:state.position?'nearest':'number',savedOnly:false});$('searchBox').value='';$('constituencyFilter').value='';$('availabilityFilter').value='';$('sortBy').value=state.sort;render();writeURL();fit();}
function setView(mode){document.body.classList.toggle('map-mode',mode==='map');$('listViewBtn').classList.toggle('active',mode==='list');$('mapViewBtn').classList.toggle('active',mode==='map');$('listViewBtn').setAttribute('aria-pressed',mode==='list');$('mapViewBtn').setAttribute('aria-pressed',mode==='map');if(map)requestAnimationFrame(()=>{map.invalidateSize();fit();});}
$('siteList').addEventListener('click',e=>{if(e.target.closest('[data-read],[data-read-group]'))return;const group=e.target.closest('[data-group]');if(group){toggleGroup(group.dataset.group);return;}const save=e.target.closest('[data-save]');if(save){toggleSaved(save.dataset.save);return;}const card=e.target.closest('[data-key]');if(card)selectSite(card.dataset.key);});
$('savedBtn').addEventListener('click',()=>{state.savedOnly=!state.savedOnly;render();fit();});
document.addEventListener('keydown',e=>{if(e.key==='Escape'&&$('siteDialog').open&&!$('viewer').open){e.preventDefault();closeDetails();}});
$('searchBox').addEventListener('input',e=>{state.search=e.target.value;render();writeURL();clearTimeout(searchReadTimer);searchReadTimer=setTimeout(()=>reader?.results(),800);});
$('constituencyFilter').addEventListener('change',e=>{state.constituency=e.target.value;render();writeURL();fit();});
$('availabilityFilter').addEventListener('change',e=>{state.availability=e.target.value;render();writeURL();fit();});
$('sortBy').addEventListener('change',e=>{state.sort=e.target.value;render();});
document.querySelectorAll('[data-mode]').forEach(b=>b.addEventListener('click',()=>changeMode(b.dataset.mode)));
$('resetBtn').addEventListener('click',resetFilters);$('fitBtn').addEventListener('click',fit);$('closeDetails').addEventListener('click',()=>closeDetails());
$('siteDialog').addEventListener('cancel',()=>{state.selected=null;render();writeURL();});
$('closeViewer').addEventListener('click',()=>$('viewer').close());$('viewer').addEventListener('close',()=>$('viewerContent').replaceChildren());
$('mapViewBtn').addEventListener('click',()=>setView('map'));$('listViewBtn').addEventListener('click',()=>setView('list'));
function requestLocation(){if($('locateBtn').disabled)return;if(!navigator.geolocation){$('locationStatus').textContent=tr('Location is not supported. You can still browse every site.','ಸ್ಥಳ ಸೇವೆ ಲಭ್ಯವಿಲ್ಲ. ಆದರೂ ಎಲ್ಲಾ ಸ್ಥಳಗಳನ್ನು ನೋಡಬಹುದು.');$('headerLocationText').textContent=tr('Explore Bengaluru','ಬೆಂಗಳೂರನ್ನು ಅನ್ವೇಷಿಸಿ');return;}$('locateBtn').disabled=true;$('headerLocation').disabled=true;$('locationStatus').textContent=tr('Finding your location…','ನಿಮ್ಮ ಸ್ಥಳವನ್ನು ಹುಡುಕಲಾಗುತ್ತಿದೆ…');$('headerLocationText').textContent=tr('Finding your location…','ನಿಮ್ಮ ಸ್ಥಳವನ್ನು ಹುಡುಕಲಾಗುತ್ತಿದೆ…');navigator.geolocation.getCurrentPosition(pos=>{state.position=[pos.coords.latitude,pos.coords.longitude];$('locateBtn').disabled=false;$('headerLocation').disabled=false;$('headerLocationText').textContent=tr('Your current location','ನಿಮ್ಮ ಪ್ರಸ್ತುತ ಸ್ಥಳ');$('locationStatus').textContent=tr('Distances are approximate straight-line distances.','ದೂರಗಳು ಅಂದಾಜು ನೇರ ರೇಖೆಯ ದೂರಗಳಾಗಿವೆ.');$('sortBy').querySelector('[value="nearest"]').disabled=false;state.sort='nearest';$('sortBy').value='nearest';if(map){if(userMarker)map.removeLayer(userMarker);userMarker=L.marker(state.position,{icon:L.divIcon({className:'',html:'<div class="user-pin"></div>',iconSize:[18,18],iconAnchor:[9,9]})}).bindTooltip(tr('You are here','ನೀವು ಇಲ್ಲಿದ್ದೀರಿ'),{permanent:true,direction:'right'}).addTo(map);}render();if(state.selected)renderDetails(sites.find(s=>s.key===state.selected));},err=>{$('locateBtn').disabled=false;$('headerLocation').disabled=false;$('headerLocationText').textContent=tr('Explore Bengaluru','ಬೆಂಗಳೂರನ್ನು ಅನ್ವೇಷಿಸಿ');$('locationStatus').textContent=err.code===1?tr('Location permission was denied. You can browse sites manually.','ಸ್ಥಳದ ಅನುಮತಿ ನಿರಾಕರಿಸಲಾಗಿದೆ. ಸ್ಥಳಗಳನ್ನು ಸ್ವತಃ ಹುಡುಕಬಹುದು.'):err.code===3?tr('Location timed out. Try again or browse manually.','ಸ್ಥಳ ಪತ್ತೆಗೆ ಸಮಯ ಮೀರಿದೆ. ಮತ್ತೆ ಪ್ರಯತ್ನಿಸಿ.'):tr('Location is unavailable. You can still explore every site.','ಸ್ಥಳದ ಮಾಹಿತಿ ಲಭ್ಯವಿಲ್ಲ. ಆದರೂ ಎಲ್ಲಾ ಸ್ಥಳಗಳನ್ನು ನೋಡಬಹುದು.');},{timeout:12000,maximumAge:60000});}
$('locateBtn').addEventListener('click',requestLocation);$('headerLocation').addEventListener('click',requestLocation);
$('languageBtn').addEventListener('click',()=>{lang=lang==='en'?'kn':'en';document.documentElement.lang=lang;$('languageBtn').textContent=lang==='en'?'ಕನ್ನಡ':'English';applyStaticLanguage();populateAreas();render();if(state.selected)renderDetails(sites.find(s=>s.key===state.selected));});
function applyURL(){const p=new URLSearchParams(location.search);state.mode=p.get('bhk')==='2'?'2':'1';state.search=p.get('q')||'';state.location='';state.constituency=p.get('constituency')||p.get('area')||'';state.availability=['available','limited','zero','unknown'].includes(p.get('status'))?p.get('status'):'';state.selected=null;$('searchBox').value=state.search;$('availabilityFilter').value=state.availability;populateAreas();if(!$('constituencyFilter').value)state.constituency='';document.querySelectorAll('[data-mode]').forEach(b=>{b.classList.toggle('active',b.dataset.mode===state.mode);b.setAttribute('aria-pressed',b.dataset.mode===state.mode);});render();fit();if(p.get('site'))selectSite(p.get('site'),false);}
window.addEventListener('popstate',()=>{closeDetails(false);applyURL();});
initMap();
Promise.all([loadJSON('data/project-master.json'),loadJSON('ashraya_master_report.json'),loadJSON('data/media.json').catch(()=>({sites:{}}))]).then(async ([master,report,media])=>{sites=OLHLocations.decorate(OLH.buildMasterSites(master,report));manifest=media;await loadPreviewCovers();applyURL();requestLocation();}).catch(e=>{$('resultCount').textContent='Unable to load sites';$('siteList').innerHTML='<div class="empty"><strong>Project data could not load</strong>Please check your connection and reload the page.</div>';console.error(e);});
// Voice is explicitly started by the user; transcripts are reviewed before filtering.
(function initVoice(){
 const Recognition=window.SpeechRecognition||window.webkitSpeechRecognition;
 let recognition=null,listening=false,timer;
 const voiceText=(en,kn)=>tr(en,kn);
 function stop(){clearTimeout(timer);if(recognition){recognition.abort();recognition=null;}listening=false;$('startVoice').textContent=voiceText('Start listening','ಆಲಿಸಲು ಪ್ರಾರಂಭಿಸಿ');$('startVoice').classList.remove('listening');}
 $('voiceBtn').addEventListener('click',()=>{$('voiceLanguage').value=lang==='kn'?'kn-IN':'en-IN';$('voiceDialog').showModal();$('voiceStatus').textContent=Recognition?voiceText('Choose your language, then start listening.','ಭಾಷೆಯನ್ನು ಆಯ್ಕೆ ಮಾಡಿ, ನಂತರ ಮಾತನಾಡಲು ಪ್ರಾರಂಭಿಸಿ.'):voiceText('Voice recognition is unavailable in this browser. Type your request below instead.','ಈ ಬ್ರೌಸರ್‌ನಲ್ಲಿ ಧ್ವನಿ ಗುರುತಿಸುವಿಕೆ ಲಭ್ಯವಿಲ್ಲ. ಕೆಳಗೆ ಟೈಪ್ ಮಾಡಿ.');$('startVoice').disabled=!Recognition;$('startVoice').textContent=voiceText('Start listening','ಆಲಿಸಲು ಪ್ರಾರಂಭಿಸಿ');});
 $('clearVoice').addEventListener('click',()=>{stop();$('voiceTranscript').value='';$('voiceStatus').textContent=voiceText('Cleared. Start a new search when ready.','ತೆರವುಗೊಳಿಸಲಾಗಿದೆ. ಹೊಸ ಹುಡುಕಾಟವನ್ನು ಪ್ರಾರಂಭಿಸಿ.');});
 $('closeVoice').addEventListener('click',()=>$('voiceDialog').close());$('voiceDialog').addEventListener('close',stop);$('voiceDialog').addEventListener('cancel',stop);window.addEventListener('pagehide',stop);
 $('voiceLanguage').addEventListener('change',()=>{stop();$('voiceStatus').textContent=voiceText('Language changed. Start listening when ready.','ಭಾಷೆ ಬದಲಾಗಿದೆ. ಸಿದ್ಧರಾದಾಗ ಮಾತನಾಡಿ.');});
 $('startVoice').addEventListener('click',()=>{
  if(listening){stop();$('voiceStatus').textContent=voiceText('Listening stopped. Review or type your search.','ಆಲಿಸುವಿಕೆ ನಿಂತಿದೆ. ಹುಡುಕಾಟವನ್ನು ಪರಿಶೀಲಿಸಿ ಅಥವಾ ಟೈಪ್ ಮಾಡಿ.');return;}
  if(!Recognition)return;clearTimeout(searchReadTimer);reader?.stop();
  const prior=$('voiceTranscript').value.trim();const session=new Recognition();recognition=session;session.lang=$('voiceLanguage').value;session.continuous=true;session.interimResults=false;session.maxAlternatives=1;listening=true;
  $('startVoice').textContent=voiceText('Stop listening','ಆಲಿಸುವುದನ್ನು ನಿಲ್ಲಿಸಿ');$('startVoice').classList.add('listening');$('voiceStatus').textContent=voiceText('Listening…','ಆಲಿಸಲಾಗುತ್ತಿದೆ…');
  session.onresult=e=>{if(recognition!==session)return;const parts=Array.from(e.results).filter(r=>r.isFinal!==false).map(r=>r[0].transcript.trim()).filter(Boolean);$('voiceTranscript').value=[prior,...parts].filter(Boolean).join(', ');$('voiceStatus').textContent=voiceText('Check the words below, then apply your search.','ಕೆಳಗಿನ ಪದಗಳನ್ನು ಪರಿಶೀಲಿಸಿ, ನಂತರ ಹುಡುಕಾಟವನ್ನು ಅನ್ವಯಿಸಿ.');};
  session.onerror=e=>{if(recognition!==session)return;const messages={'not-allowed':['Microphone permission was denied. You can type below.','ಮೈಕ್ರೊಫೋನ್ ಅನುಮತಿ ನಿರಾಕರಿಸಲಾಗಿದೆ. ಕೆಳಗೆ ಟೈಪ್ ಮಾಡಿ.'],'service-not-allowed':['Speech recognition is blocked. You can type below.','ಧ್ವನಿ ಗುರುತಿಸುವಿಕೆಯನ್ನು ನಿರ್ಬಂಧಿಸಲಾಗಿದೆ. ಕೆಳಗೆ ಟೈಪ್ ಮಾಡಿ.'],'no-speech':['No speech detected. Try again or type below.','ಮಾತು ಪತ್ತೆಯಾಗಿಲ್ಲ. ಮತ್ತೆ ಪ್ರಯತ್ನಿಸಿ ಅಥವಾ ಟೈಪ್ ಮಾಡಿ.'],'network':['The speech service could not connect. Try again or type below.','ಧ್ವನಿ ಸೇವೆಗೆ ಸಂಪರ್ಕ ಸಾಧ್ಯವಾಗಲಿಲ್ಲ. ಮತ್ತೆ ಪ್ರಯತ್ನಿಸಿ.'],'audio-capture':['No working microphone was found.','ಕಾರ್ಯನಿರ್ವಹಿಸುವ ಮೈಕ್ರೊಫೋನ್ ಕಂಡುಬಂದಿಲ್ಲ.'],'language-not-supported':['This speech service does not support the selected language.','ಆಯ್ಕೆ ಮಾಡಿದ ಭಾಷೆಗೆ ಧ್ವನಿ ಸೇವೆಯ ಬೆಂಬಲವಿಲ್ಲ.']};const message=messages[e.error];$('voiceStatus').textContent=message?voiceText(...message):voiceText('Voice search could not finish. You can type below.','ಧ್ವನಿ ಹುಡುಕಾಟ ಪೂರ್ಣಗೊಂಡಿಲ್ಲ. ಕೆಳಗೆ ಟೈಪ್ ಮಾಡಿ.');};
  session.onend=()=>{if(recognition!==session)return;recognition=null;listening=false;clearTimeout(timer);$('startVoice').textContent=voiceText('Start listening','ಆಲಿಸಲು ಪ್ರಾರಂಭಿಸಿ');$('startVoice').classList.remove('listening');if(['Listening…','ಆಲಿಸಲಾಗುತ್ತಿದೆ…'].includes($('voiceStatus').textContent))$('voiceStatus').textContent=voiceText('Listening finished. Try again or type your search.','ಆಲಿಸುವಿಕೆ ಪೂರ್ಣಗೊಂಡಿದೆ. ಮತ್ತೆ ಪ್ರಯತ್ನಿಸಿ ಅಥವಾ ಟೈಪ್ ಮಾಡಿ.');};
  try{session.start();timer=setTimeout(()=>{stop();$('voiceStatus').textContent=voiceText('Listening timed out. Try again or type below.','ಆಲಿಸುವ ಸಮಯ ಮುಗಿದಿದೆ. ಮತ್ತೆ ಪ್ರಯತ್ನಿಸಿ ಅಥವಾ ಟೈಪ್ ಮಾಡಿ.');},30000);}catch{stop();$('voiceStatus').textContent=voiceText('Unable to start the microphone. Type your search below.','ಮೈಕ್ರೊಫೋನ್ ಪ್ರಾರಂಭಿಸಲು ಸಾಧ್ಯವಾಗಲಿಲ್ಲ. ಕೆಳಗೆ ಟೈಪ್ ಮಾಡಿ.');}
 });
 $('applyVoice').addEventListener('click',()=>{const transcript=$('voiceTranscript').value.trim();if(!transcript){$('voiceStatus').textContent=voiceText('Say or type a search first.','ಮೊದಲು ಮಾತನಾಡಿ ಅಥವಾ ಹುಡುಕಾಟವನ್ನು ಟೈಪ್ ಮಾಡಿ.');return;}
  const intent=OLHLocations.voiceIntent(transcript,sites);stop();$('voiceDialog').close();closeDetails(false);state.selected=null;state.expanded=null;state.savedOnly=false;state.availability='';state.constituency='';state.location='';state.search='';
  if(intent.mode)changeMode(intent.mode);state.constituency=intent.constituency;state.search=intent.query;$('searchBox').value=state.search;$('availabilityFilter').value='';populateAreas();
  if(intent.near){if(state.position){state.sort='nearest';$('sortBy').value='nearest';}else requestLocation();}
  render();writeURL();fit();toast(`${voiceText('Search applied','ಹುಡುಕಾಟ ಅನ್ವಯಿಸಲಾಗಿದೆ')}: ${transcript}`);reader?.results();
 });
})();

reader=OLHAccessibility.create({getSite:key=>sites.find(s=>s.key===key),getGroups:()=>OLHLocations.group(filtered)});