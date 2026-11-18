'use strict';
const $=id=>document.getElementById(id);
const escapeHTML=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const state={mode:'1',search:'',location:'',constituency:'',availability:'',quota:'public',sort:'number',position:null,selected:null,savedOnly:false,expanded:null};
let reader=null,searchReadTimer=null;
let sites=[],filtered=[],manifest={sites:{}},staticMedia={sites:{}},map,layer,userMarker,markers=new Map(),lang='en',galleryURLs=[],galleryToken=0;
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
    eyebrow: 'ಮುಖ್ಯಮಂತ್ರಿಗಳ ಒಂದು ಲಕ್ಷ ವಸತಿ ಯೋಜನೆ · ಬೆಂಗಳೂರು',
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
const labels={en:{availability:'Availability',unknown:'Availability not published',zero:'None available',limited:'available',available:'available',sites:'sites found',directions:'Get directions',share:'Share site',photos:'Photos & videos',noMedia:'No photos or videos have been published for this site yet.',documents:'Project documents',noDocuments:'No project documents have been published for this site yet.',documentIssuer:'Issuing authority',documentDate:'Document date',viewDocument:'View PDF ↗'},kn:{availability:'ಲಭ್ಯತೆ',unknown:'ಲಭ್ಯತೆ ಪ್ರಕಟಿಸಲಾಗಿಲ್ಲ',zero:'ಲಭ್ಯವಿಲ್ಲ',limited:'ಲಭ್ಯ',available:'ಲಭ್ಯ',sites:'ಸ್ಥಳಗಳು',directions:'ಮಾರ್ಗ ನೋಡಿ',share:'ಸ್ಥಳ ಹಂಚಿಕೊಳ್ಳಿ',photos:'ಚಿತ್ರಗಳು ಮತ್ತು ವೀಡಿಯೊಗಳು',noMedia:'ಈ ಸ್ಥಳಕ್ಕೆ ಇನ್ನೂ ಚಿತ್ರಗಳು ಅಥವಾ ವೀಡಿಯೊಗಳನ್ನು ಪ್ರಕಟಿಸಲಾಗಿಲ್ಲ.',documents:'ಯೋಜನೆಯ ದಾಖಲೆಗಳು',noDocuments:'ಈ ಸ್ಥಳಕ್ಕೆ ಯಾವುದೇ ಯೋಜನಾ ದಾಖಲೆಗಳನ್ನು ಇನ್ನೂ ಪ್ರಕಟಿಸಲಾಗಿಲ್ಲ.',documentIssuer:'ದಾಖಲೆ ನೀಡಿದ ಪ್ರಾಧಿಕಾರ',documentDate:'ದಾಖಲೆಯ ದಿನಾಂಕ',viewDocument:'PDF ನೋಡಿ ↗'}};
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
function render(){renderSearchChips();clearTimeout(searchReadTimer);reader?.stop();const activeCount=Number(Boolean(state.constituency))+Number(Boolean(state.availability))+Number(state.quota==='mla');$('activeFilterCount').textContent=activeCount?`${activeCount} ${tr('active','ಸಕ್ರಿಯ')}`:'';filtered=OLH.filterSites(sites,{...state,availability:state.quota==='public'?state.availability:''});if(state.quota==='mla'&&state.availability)filtered=filtered.filter(s=>OLH.status({available:s.mlaAvailable})===state.availability);if(state.savedOnly)filtered=filtered.filter(s=>saved.has(s.key));$('savedCount').textContent=saved.size;$('savedBtn').setAttribute('aria-pressed',state.savedOnly);$('collectionCount').textContent=OLHLocations.group(sites.filter(s=>s.mode===state.mode)).length;if(state.selected&&!filtered.some(s=>s.key===state.selected)){state.selected=null;closeDetails(false);writeURL();}
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
function photoLabel(photo){return photo?/demo|sample/i.test(`${photo.caption||''} ${photo.alt||''}`)?tr('Demo photo','ಮಾದರಿ ಚಿತ್ರ'):tr('Project photo','ಯೋಜನೆಯ ಚಿತ್ರ'):tr('Illustration · no photo yet','ಚಿತ್ರಣ · ಛಾಯಾಚಿತ್ರ ಇಲ್ಲ');}
function quotaSummary(s){
 return `<span class="quota-pair">${[[tr('Public quota','ಸಾರ್ವಜನಿಕ ಕೋಟಾ'),s.available],[tr('MLA quota','ಶಾಸಕರ ಕೋಟಾ'),s.mlaAvailable]].map(([label,n])=>`<span class="quota-stat ${n==null?'unknown':n<0?'negative':n===0?'zero':'positive'}"><span class="quota-label">${label}</span><strong>${n==null?tr('Not published','ಪ್ರಕಟಿಸಲಾಗಿಲ್ಲ'):n.toLocaleString('en-IN')}</strong><span class="quota-unit">${n==null?tr('Confirm with RGHCL','RGHCL ಮೂಲಕ ದೃಢೀಕರಿಸಿ'):tr('reported available','ವರದಿಯಾದ ಲಭ್ಯತೆ')}</span></span>`).join('')}</span>`;
}
function projectCard(s,child=false){
 const photo=coverPhoto(s.key),label=displayName(s);
 return `<article class="site-card ${state.selected===s.key?'selected':''}" data-key="${escapeHTML(s.key)}">
 <button class="card-main" aria-label="${escapeHTML(`${s.displayNumber}. ${label}, ${tr('survey','ಸರ್ವೆ ಸಂಖ್ಯೆ')} ${s.survey}, ${s.area}`)}">
  <span class="card-cover ${photo?'has-photo':'illustrated'} ${photo&&/demo|sample/i.test(`${photo.caption||''} ${photo.alt||''}`)?'demo-photo':''}"><img src="${escapeHTML(photo?.src||'assets/neighbourhood.svg')}" alt="${photo?escapeHTML(photo.alt||label):''}" loading="lazy"><span class="cover-site-no">${escapeHTML(s.displayNumber)}</span><span class="cover-caption">${photoLabel(photo)}</span></span>
  <span class="card-body"><span class="card-type">${s.mode} BHK ${tr('HOMES','ಮನೆಗಳು')}</span><strong>${escapeHTML(label)}</strong>${child?`<span class="parcel-label">${escapeHTML(s.parcelLabel)}</span>`:''}<small>${tr('Constituency','ವಿಧಾನಸಭಾ ಕ್ಷೇತ್ರ')}: ${escapeHTML(s.area)}</small><small>${tr('Survey','ಸರ್ವೆ ಸಂಖ್ಯೆ')} ${escapeHTML(s.survey||'—')}</small>${quotaSummary(s)}</span>
  ${s.approximate||s.sourceIssue?`<span class="card-review">${tr('Reported figures · confirmation needed','ವರದಿಯಾದ ಸಂಖ್ಯೆಗಳು · ದೃಢೀಕರಣ ಅಗತ್ಯ')}</span>`:''}
  ${negativeQuotaNote(s)?`<span class="negative-quota card-negative">${escapeHTML(negativeQuotaNote(s))} · ${tr('reported','ವರದಿಯಾಗಿದೆ')}</span>`:''}
 </button>
 <button class="save-site" data-save="${escapeHTML(s.key)}" aria-pressed="${saved.has(s.key)}" aria-label="${saved.has(s.key)?tr('Remove saved site','ಉಳಿಸಿದ ಸ್ಥಳವನ್ನು ತೆಗೆದುಹಾಕಿ'):tr('Save site','ಸ್ಥಳವನ್ನು ಉಳಿಸಿ')}">${icon('heart')}</button>
 <div class="card-footer"><button class="read-project" data-read="${escapeHTML(s.key)}" aria-label="${tr('Read aloud','ಧ್ವನಿಯಲ್ಲಿ ಓದಿ')}: ${escapeHTML(label)}"><svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true"><path d="M11 4 5 9H2v6h3l6 5V4ZM15 8a6 6 0 0 1 0 8M18 4a11 11 0 0 1 0 16"/></svg>${tr('Read aloud','ಧ್ವನಿಯಲ್ಲಿ ಓದಿ')}</button><button class="card-open">${state.position&&OLH.validCoordinates(s)?escapeHTML(distanceText(s))+' · ':''}${tr('Explore project','ಯೋಜನೆ ನೋಡಿ')} ${icon('arrow')}</button></div></article>`;
}
function renderSearchChips(){
 const box=$('searchChips');box.replaceChildren();
 const terms=state.search.split(/[,;]|\s+(?:and|or|ಮತ್ತು)\s+|&/).map(x=>x.trim()).filter(Boolean);
 const add=(name,action)=>{const b=document.createElement('button');b.type='button';b.textContent=name+' ×';b.setAttribute('aria-label',tr('Remove search: ','ಹುಡುಕಾಟ ತೆಗೆದುಹಾಕಿ: ')+name);b.addEventListener('click',()=>{action();$('searchBox').value=state.search;render();writeURL();fit();$('searchBox').focus();});box.append(b);};
 terms.forEach((term,i)=>add(term,()=>{state.search=terms.filter((_,j)=>j!==i).join(', ');}));
 if(state.constituency)add(state.constituency,()=>{state.constituency='';$('constituencyFilter').value='';});
 if(state.quota==='mla')add('MLA quota',()=>{state.quota='public';$('quotaFilter').value='public';});
 if(state.availability)add(`${state.quota==='mla'?'MLA':'Public'}: ${$('availabilityFilter').selectedOptions[0]?.textContent||state.availability}`,()=>{state.availability='';$('availabilityFilter').value='';});
 box.hidden=!box.childElementCount;
}
function markerPreview(key,title){
 const s=sites.find(x=>x.key===key),g=s?null:OLHLocations.group(filtered).find(x=>x.id===key);
 const photo=s?coverPhoto(s.key):g?.sites.map(x=>coverPhoto(x.key)).find(Boolean);
 return `<span class="pin-preview"><img src="${escapeHTML(photo?.src||'assets/neighbourhood.svg')}" alt=""><span><small>${photoLabel(photo)}</small><strong>${escapeHTML(title)}</strong>${s?`<span>${tr('Public','ಸಾರ್ವಜನಿಕ')}: ${s.available??'—'} · ${tr('MLA','ಶಾಸಕರು')}: ${s.mlaAvailable??'—'}</span>`:''}</span></span>`;
}

function groupCard(g){
 const all=sites.filter(s=>s.mode===state.mode&&s.locationId===g.id);
 if(all.length===1)return projectCard(g.sites[0]);
 const open=state.expanded===g.id||g.sites.some(s=>s.key===state.selected);
 const photo=all.map(s=>coverPhoto(s.key)).find(Boolean),name=lang==='kn'&&g.nameKn?g.nameKn:g.name;
 const projectCount=g.sites.length===all.length?String(all.length):lang==='kn'?`${all.length}ರಲ್ಲಿ ${g.sites.length}`:`${g.sites.length} of ${all.length}`;
 return `<section class="location-group ${open?'expanded':''}" data-location="${g.id}"><button class="group-toggle" data-group="${g.id}" aria-expanded="${open}" aria-controls="parcels-${g.id}"><span class="group-art"><img src="${escapeHTML(photo?.src||'assets/neighbourhood.svg')}" alt=""><b>${String(g.number).padStart(2,'0')}</b></span><span class="group-description"><strong>${escapeHTML(name)}</strong><small>${tr('Constituency','ವಿಧಾನಸಭಾ ಕ್ಷೇತ್ರ')}: ${escapeHTML(all[0].constituency)}</small><span class="parcel-count">${projectCount} ${tr('parcels / projects','ಉಪಯೋಜನೆಗಳು / ಯೋಜನೆಗಳು')} · ${state.mode} BHK</span></span><span class="group-chevron" aria-hidden="true">⌄</span></button><button class="read-group" data-read-group="${g.id}" aria-label="${tr('Read location summary','ಸ್ಥಳದ ಸಾರಾಂಶವನ್ನು ಓದಿ')}: ${escapeHTML(name)}">${tr('Read location summary','ಸ್ಥಳದ ಸಾರಾಂಶವನ್ನು ಓದಿ')}</button><div class="parcel-list" id="parcels-${g.id}" ${open?'':'hidden'}>${g.sites.map(s=>projectCard(s,true)).join('')}</div></section>`;
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
  const add=(key,point,html,title,action)=>{const marker=L.marker(point,{icon:L.divIcon({className:'location-marker',html,iconSize:[40,40],iconAnchor:[20,20]}),title,alt:title,keyboard:true}).bindTooltip(markerPreview(key,title),{direction:'top',className:'project-map-preview',permanent:false,opacity:1}).on('click',action).addTo(layer);markers.set(key,marker);const read=()=>getGroupRead(key);marker.on('mouseover',()=>reader?.schedule(marker,read));marker.on('mouseout',()=>reader?.leave(marker));const el=marker.getElement();el?.addEventListener('focus',()=>reader?.schedule(marker,read));el?.addEventListener('blur',()=>reader?.leave(marker));};
  if(items.length>1&&!expanded){add(g.id,[g.latitude,g.longitude],`<span class="group-pin">${g.number}<b>${items.length}</b></span>`,`${lang==='kn'&&g.nameKn?g.nameKn:g.name} · ${items.length} ${tr('projects','ಯೋಜನೆಗಳು')}`,()=>toggleGroup(g.id));continue;}
  items.forEach((s,i)=>{
   let point=L.latLng(s.latitude,s.longitude);
   if(items.length>1){const base=map.latLngToLayerPoint([g.latitude,g.longitude]),angle=(i/items.length)*Math.PI*2-Math.PI/2;point=map.layerPointToLatLng(base.add([Math.cos(angle)*58,Math.sin(angle)*58]));L.polyline([[s.latitude,s.longitude],point],{weight:1,color:'#8b9ed0',dashArray:'3 4',interactive:false}).addTo(layer);}
   add(s.key,point,`<span class="site-pin ${OLH.status(s)} ${state.selected===s.key?'selected':''}">${escapeHTML(s.displayNumber)}</span>`,`${s.locationName} · ${s.parcelLabel}`,()=>selectSite(s.key));
  });
 }
}
function populateAreas(){const areas=[...new Set(sites.filter(s=>s.mode===state.mode).map(s=>s.constituency))].sort();$('constituencyFilter').innerHTML=`<option value="">${tr('All constituencies','ಎಲ್ಲಾ ವಿಧಾನಸಭಾ ಕ್ಷೇತ್ರಗಳು')}</option>`+areas.map(a=>`<option value="${escapeHTML(a)}">${escapeHTML(a)}</option>`).join('');$('constituencyFilter').value=state.constituency;const suggestions=[...new Set(sites.filter(s=>s.mode===state.mode).flatMap(s=>[s.name,s.nameKn,s.locationName,s.locationNameKn,s.constituency,s.agency]).filter(Boolean))].sort((a,b)=>a.localeCompare(b));$('siteSuggestions').innerHTML=suggestions.map(v=>`<option value="${escapeHTML(v)}"></option>`).join('');}
function changeMode(mode){state.expanded=null;state.mode=mode;state.location='';state.constituency='';state.selected=null;closeDetails(false);populateAreas();document.querySelectorAll('[data-mode]').forEach(b=>{b.classList.toggle('active',b.dataset.mode===mode);b.setAttribute('aria-pressed',b.dataset.mode===mode);});render();writeURL();fit();}
function presentSiteDialog(){const dialog=$('siteDialog'),mobile=matchMedia('(max-width:700px)').matches,presentation=mobile?'modal':'modeless';if(dialog.open&&dialog.dataset.presentation===presentation)return;if(dialog.open)dialog.close();if(mobile&&typeof dialog.showModal==='function'){dialog.showModal();dialog.dataset.presentation='modal';}else{dialog.show();dialog.dataset.presentation='modeless';}}
function selectSite(key,update=true){const s=filtered.find(s=>s.key===key);if(!s)return;state.selected=key;state.expanded=s.locationId;render();renderDetails(s);presentSiteDialog();$('detailTitle').focus({preventScroll:true});if(map&&OLH.validCoordinates(s))map.panTo([s.latitude,s.longitude],{animate:!matchMedia('(prefers-reduced-motion: reduce)').matches});if(update)writeURL();}
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

  $('details').innerHTML = `
    <div class="detail-body">

      <button type="button" class="detail-hero" id="detailCover" ${photo?'':'disabled'} aria-label="${t('View project photo','ಯೋಜನೆಯ ಚಿತ್ರ ನೋಡಿ')}">
        ${photo
          ? `<img src="${escapeHTML(photo.src)}"
                  alt="${escapeHTML(photo.alt || s.name)}">`
          : '<img src="assets/neighbourhood.svg" alt="">'}

        <span class="detail-hero-label">
          ${icon(photo ? 'camera' : 'building')}
          ${photoLabel(photo)}
        </span>
        ${photo?`<span class="hero-open">${icon('camera')} ${t('View photo','ಚಿತ್ರ ನೋಡಿ')}</span>`:''}
      </button>

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

      <section class="project-documents"><h3>${text("documents")}</h3><div id="siteDocuments" class="project-document-list"><p class="media-empty">${t("Loading project documents…","ಯೋಜನೆಯ ದಾಖಲೆಗಳನ್ನು ಲೋಡ್ ಮಾಡಲಾಗುತ್ತಿದೆ…")}</p></div></section><div class="availability-box">
        <span class="eyebrow">
          ${t('AVAILABILITY AT A GLANCE', 'ಲಭ್ಯತೆಯ ಸಂಕ್ಷಿಪ್ತ ಮಾಹಿತಿ')}
        </span>

        ${quotaSummary(s)}
        <p class="availability-confirm">${t('Reported availability. Please confirm before applying.','ವರದಿಯಾದ ಲಭ್ಯತೆ. ಅರ್ಜಿ ಸಲ್ಲಿಸುವ ಮೊದಲು ದೃಢೀಕರಿಸಿ.')}</p>
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


    </div>`;

  $('shareBtn').addEventListener('click', share);
  if(photo)$('detailCover').addEventListener('click',()=>openViewer(photo,photo.src));

  $('details')
    .querySelector('[data-save]')
    .addEventListener('click', e => {
      toggleSaved(e.currentTarget.dataset.save);
    });

  renderGallery(s);
  renderProjectDocuments(s);
}
async function renderProjectDocuments(s){const host=$('siteDocuments');if(!host)return;host.replaceChildren();try{const docs=await OLHCloudMedia.listDocuments(s.key);if(state.selected!==s.key)return;if(!docs.length){const p=document.createElement('p');p.className='media-empty';p.textContent=text('noDocuments');host.append(p);return;}for(const doc of docs){const card=document.createElement('article');card.className='project-document-card';const h=document.createElement('h4');h.textContent=doc.title;const type=document.createElement('span');type.className='project-document-type';type.textContent=doc.document_type;const issuer=document.createElement('p');issuer.textContent=text('documentIssuer')+': '+doc.issuing_authority;card.append(type,h,issuer);if(doc.document_date){const date=document.createElement('p');date.textContent=text('documentDate')+': '+new Date(doc.document_date+'T00:00:00').toLocaleDateString(lang==='kn'?'kn-IN':'en-IN');card.append(date);}const link=document.createElement('a');link.href=doc.src;link.target='_blank';link.rel='noopener noreferrer';link.textContent=text('viewDocument');card.append(link);host.append(card);}}catch(error){if(state.selected!==s.key)return;const p=document.createElement('p');p.className='media-empty';p.textContent=tr('Project documents could not be loaded right now.','ಯೋಜನೆಯ ದಾಖಲೆಗಳನ್ನು ಈಗ ಲೋಡ್ ಮಾಡಲು ಸಾಧ್ಯವಾಗಲಿಲ್ಲ.');host.append(p);console.warn('Could not load public project documents.',error);}}
async function renderGallery(s){const token=++galleryToken;galleryURLs.forEach(URL.revokeObjectURL);galleryURLs=[];
 try{const result=await OLHMedia.gallery(manifest,s.key,preview);if(token!==galleryToken||state.selected!==s.key)return;
 const items=result.items;$('galleryStatus').hidden=items.length>0;if(!items.length)$('galleryStatus').textContent=text('noMedia');
 items.forEach((item,i)=>{let src=item.src;if(item.blob){src=URL.createObjectURL(item.blob);galleryURLs.push(src);}const b=document.createElement('button');b.className='media-thumb';b.setAttribute('aria-label',`${tr('View','ನೋಡಿ')} ${item.type==='video'?tr('video','ವೀಡಿಯೊ'):tr('photo','ಚಿತ್ರ')}: ${item.caption||displayName(s)}`);const media=document.createElement(item.type==='video'?'video':'img');media.src=src;if(item.type==='image'){media.alt=item.alt||item.caption||s.name;media.loading='lazy';}else{media.preload='metadata';media.muted=true;const tag=document.createElement('div');tag.className='video-indicator';tag.textContent=tr('▶ Video','▶ ವೀಡಿಯೊ');b.appendChild(tag);}const caption=document.createElement('span');caption.textContent=item.caption||`${item.type==='video'?tr('Video','ವೀಡಿಯೊ'):tr('Photo','ಚಿತ್ರ')} ${i+1}`;b.append(media,caption);b.addEventListener('click',()=>openViewer(item,src));$('siteGallery').appendChild(b);});
 if(result.draft){const note=document.createElement('p');note.className='manager-note';note.textContent=tr('Local draft preview — this media is not public until published.','ಸ್ಥಳೀಯ ಕರಡು ಮುನ್ನೋಟ — ಪ್ರಕಟಿಸುವವರೆಗೆ ಈ ಮಾಧ್ಯಮ ಸಾರ್ವಜನಿಕವಾಗಿರುವುದಿಲ್ಲ.');$('siteGallery').after(note);}
 }catch(e){if(token===galleryToken&&$('galleryStatus'))$('galleryStatus').textContent=tr('Unable to load local draft. Published media remains available in the normal view.','ಸ್ಥಳೀಯ ಕರಡನ್ನು ಲೋಡ್ ಮಾಡಲು ಸಾಧ್ಯವಾಗಲಿಲ್ಲ. ಪ್ರಕಟಿತ ಮಾಧ್ಯಮ ಸಾಮಾನ್ಯ ವೀಕ್ಷಣೆಯಲ್ಲಿ ಲಭ್ಯವಿದೆ.');}
}
function openViewer(item,src){$('viewerContent').replaceChildren();const el=document.createElement(item.type==='video'?'video':'img');el.src=src;if(item.type==='video'){el.controls=true;el.preload='metadata';el.playsInline=true;}else el.alt=item.alt||item.caption||'Site photo';const p=document.createElement('p');p.textContent=item.caption||'';$('viewerContent').append(el,p);$('viewer').showModal();}
function closeDetails(clear=true){const previousKey=state.selected;reader?.stop();if($('viewer').open)$('viewer').close();$('siteDialog').close();galleryToken++;if(clear){state.selected=null;render();writeURL();document.querySelector(`[data-key="${previousKey}"] .card-main`)?.focus({preventScroll:true});}}
function writeURL(){const p=new URLSearchParams();p.set('bhk',state.mode);if(state.selected)p.set('site',state.selected);if(state.search)p.set('q',state.search);if(state.constituency)p.set('constituency',state.constituency);if(state.availability)p.set('status',state.availability);if(state.quota==='mla')p.set('quota','mla');if(preview)p.set('preview','1');const url=new URL(location.href);url.search=p.toString();history.replaceState(null,'',url);}
async function share(){const u=new URL(location.href);u.searchParams.delete('preview');try{if(navigator.share)await navigator.share({title:sites.find(s=>s.key===state.selected).name,url:u.href});else{await navigator.clipboard.writeText(u.href);toast(tr('Site link copied.','ಸ್ಥಳದ ಲಿಂಕ್ ನಕಲಿಸಲಾಗಿದೆ.'));}}catch(e){if(e.name!=='AbortError'){const box=document.createElement('input');box.value=u.href;$('details').append(box);box.select();toast(tr('Copy the selected site link.','ಆಯ್ಕೆ ಮಾಡಿದ ಸ್ಥಳದ ಲಿಂಕ್ ನಕಲಿಸಿ.'));}}}
function fit(){if(!map)return;const points=filtered.filter(OLH.validCoordinates).map(s=>[s.latitude,s.longitude]);if(points.length)map.fitBounds(points,{paddingTopLeft:map.getSize().x<500?[24,85]:[40,95],paddingBottomRight:map.getSize().x<500?[24,45]:[40,50],maxZoom:13});else map.setView([12.9716,77.5946],10);}
function resetFilters(){Object.assign(state,{search:'',location:'',constituency:'',availability:'',quota:'public',sort:state.position?'nearest':'number',savedOnly:false});$('searchBox').value='';$('constituencyFilter').value='';$('availabilityFilter').value='';$('quotaFilter').value='public';$('sortBy').value=state.sort;render();writeURL();fit();}
function setView(mode){document.body.classList.toggle('map-mode',mode==='map');$('listViewBtn').classList.toggle('active',mode==='list');$('mapViewBtn').classList.toggle('active',mode==='map');$('listViewBtn').setAttribute('aria-pressed',mode==='list');$('mapViewBtn').setAttribute('aria-pressed',mode==='map');if(map)requestAnimationFrame(()=>{map.invalidateSize();fit();});}
$('siteList').addEventListener('click',e=>{if(e.target.closest('[data-read],[data-read-group]'))return;const group=e.target.closest('[data-group]');if(group){toggleGroup(group.dataset.group);return;}const save=e.target.closest('[data-save]');if(save){toggleSaved(save.dataset.save);return;}const card=e.target.closest('[data-key]');if(card)selectSite(card.dataset.key);});
$('savedBtn').addEventListener('click',()=>{state.savedOnly=!state.savedOnly;render();fit();});
document.addEventListener('keydown',e=>{if(e.key==='Escape'&&$('siteDialog').open&&!$('viewer').open){e.preventDefault();closeDetails();}});
$('searchBox').addEventListener('input',e=>{state.search=e.target.value;render();writeURL();clearTimeout(searchReadTimer);searchReadTimer=setTimeout(()=>reader?.results(),800);});
$('constituencyFilter').addEventListener('change',e=>{state.constituency=e.target.value;render();writeURL();fit();});
$('availabilityFilter').addEventListener('change',e=>{state.availability=e.target.value;render();writeURL();fit();});
$('quotaFilter').addEventListener('change',e=>{state.quota=e.target.value;render();writeURL();fit();});
$('sortBy').addEventListener('change',e=>{state.sort=e.target.value;render();});
document.querySelectorAll('[data-mode]').forEach(b=>b.addEventListener('click',()=>changeMode(b.dataset.mode)));
$('resetBtn').addEventListener('click',resetFilters);$('fitBtn').addEventListener('click',fit);$('closeDetails').addEventListener('click',()=>closeDetails());
$('siteDialog').addEventListener('cancel',()=>{state.selected=null;render();writeURL();});
$('closeViewer').addEventListener('click',()=>$('viewer').close());$('viewer').addEventListener('close',()=>$('viewerContent').replaceChildren());
$('mapViewBtn').addEventListener('click',()=>setView('map'));$('listViewBtn').addEventListener('click',()=>setView('list'));
function requestLocation(){if($('locateBtn').disabled)return;if(!navigator.geolocation){$('locationStatus').textContent=tr('Location is not supported. You can still browse every site.','ಸ್ಥಳ ಸೇವೆ ಲಭ್ಯವಿಲ್ಲ. ಆದರೂ ಎಲ್ಲಾ ಸ್ಥಳಗಳನ್ನು ನೋಡಬಹುದು.');$('headerLocationText').textContent=tr('Explore Bengaluru','ಬೆಂಗಳೂರನ್ನು ಅನ್ವೇಷಿಸಿ');return;}$('locateBtn').disabled=true;$('headerLocation').disabled=true;$('locationStatus').textContent=tr('Finding your location…','ನಿಮ್ಮ ಸ್ಥಳವನ್ನು ಹುಡುಕಲಾಗುತ್ತಿದೆ…');$('headerLocationText').textContent=tr('Finding your location…','ನಿಮ್ಮ ಸ್ಥಳವನ್ನು ಹುಡುಕಲಾಗುತ್ತಿದೆ…');navigator.geolocation.getCurrentPosition(pos=>{state.position=[pos.coords.latitude,pos.coords.longitude];$('locateBtn').disabled=false;$('headerLocation').disabled=false;$('headerLocationText').textContent=tr('Your current location','ನಿಮ್ಮ ಪ್ರಸ್ತುತ ಸ್ಥಳ');$('locationStatus').textContent=tr('Distances are approximate straight-line distances.','ದೂರಗಳು ಅಂದಾಜು ನೇರ ರೇಖೆಯ ದೂರಗಳಾಗಿವೆ.');$('sortBy').querySelector('[value="nearest"]').disabled=false;state.sort='nearest';$('sortBy').value='nearest';if(map){if(userMarker)map.removeLayer(userMarker);userMarker=L.marker(state.position,{icon:L.divIcon({className:'',html:'<div class="user-pin"></div>',iconSize:[18,18],iconAnchor:[9,9]})}).bindTooltip(tr('You are here','ನೀವು ಇಲ್ಲಿದ್ದೀರಿ'),{permanent:true,direction:'right'}).addTo(map);}render();if(state.selected)renderDetails(sites.find(s=>s.key===state.selected));},err=>{$('locateBtn').disabled=false;$('headerLocation').disabled=false;$('headerLocationText').textContent=tr('Explore Bengaluru','ಬೆಂಗಳೂರನ್ನು ಅನ್ವೇಷಿಸಿ');$('locationStatus').textContent=err.code===1?tr('Location permission was denied. You can browse sites manually.','ಸ್ಥಳದ ಅನುಮತಿ ನಿರಾಕರಿಸಲಾಗಿದೆ. ಸ್ಥಳಗಳನ್ನು ಸ್ವತಃ ಹುಡುಕಬಹುದು.'):err.code===3?tr('Location timed out. Try again or browse manually.','ಸ್ಥಳ ಪತ್ತೆಗೆ ಸಮಯ ಮೀರಿದೆ. ಮತ್ತೆ ಪ್ರಯತ್ನಿಸಿ.'):tr('Location is unavailable. You can still explore every site.','ಸ್ಥಳದ ಮಾಹಿತಿ ಲಭ್ಯವಿಲ್ಲ. ಆದರೂ ಎಲ್ಲಾ ಸ್ಥಳಗಳನ್ನು ನೋಡಬಹುದು.');},{timeout:12000,maximumAge:60000});}
$('locateBtn').addEventListener('click',requestLocation);$('headerLocation').addEventListener('click',requestLocation);
$('languageBtn').addEventListener('click',()=>{lang=lang==='en'?'kn':'en';document.documentElement.lang=lang;$('languageBtn').textContent=lang==='en'?'ಕನ್ನಡ':'English';original.forEach((v,el)=>{if(lang==='kn')el.textContent=translations.kn[el.dataset.i18n]||el.textContent;else el.innerHTML=v;});$('searchBox').placeholder=lang==='kn'?'ಹೆಸರು, ಸ್ಥಳ ಸಂಖ್ಯೆ ಅಥವಾ ಸ್ಥಳ ಹುಡುಕಿ':'Search site, constituency or contractor';populateAreas();render();if(state.selected)renderDetails(sites.find(s=>s.key===state.selected));});
function applyURL(){const p=new URLSearchParams(location.search);state.mode=p.get('bhk')==='2'?'2':'1';state.search=p.get('q')||'';state.location='';state.constituency=p.get('constituency')||p.get('area')||'';state.availability=['available','limited','zero','unknown'].includes(p.get('status'))?p.get('status'):'';state.quota=p.get('quota')==='mla'?'mla':'public';state.selected=null;$('searchBox').value=state.search;$('availabilityFilter').value=state.availability;$('quotaFilter').value=state.quota;populateAreas();if(!$('constituencyFilter').value)state.constituency='';document.querySelectorAll('[data-mode]').forEach(b=>{b.classList.toggle('active',b.dataset.mode===state.mode);b.setAttribute('aria-pressed',b.dataset.mode===state.mode);});render();fit();if(p.get('site'))selectSite(p.get('site'),false);}
window.addEventListener('popstate',()=>{closeDetails(false);applyURL();});
initMap();
async function refreshOnlineMedia(){if(!OLHCloudMedia.ready()||!sites.length)return;try{const cloud=await OLHCloudMedia.load();manifest=OLHCloudMedia.merge(staticMedia,cloud);render();if(state.selected)renderDetails(sites.find(s=>s.key===state.selected));}catch(e){console.warn('Could not refresh online site photos right now.',e);}}
Promise.all([loadJSON('data/project-master.json'),loadJSON('ashraya_master_report.json'),loadJSON('data/media.json').catch(()=>({sites:{}}))]).then(async ([master,report,media])=>{sites=OLHLocations.decorate(OLH.buildMasterSites(master,report));staticMedia=media;let cloud={sites:{}};try{cloud=await OLHCloudMedia.load();}catch(e){console.warn('Online galleries are temporarily unavailable; showing the published project photos.',e);}manifest=OLHCloudMedia.merge(staticMedia,cloud);await loadPreviewCovers();applyURL();requestLocation();}).catch(e=>{$('resultCount').textContent='Unable to load sites';$('siteList').innerHTML='<div class="empty"><strong>Project data could not load</strong>Please check your connection and reload the page.</div>';console.error(e);});
window.addEventListener('focus',refreshOnlineMedia);document.addEventListener('visibilitychange',()=>{if(!document.hidden)refreshOnlineMedia();});setInterval(refreshOnlineMedia,120000);
// Voice UI owns recording and review; the explorer applies only confirmed selections.
OLHVoice.mount({
 getSites:()=>sites,getMode:()=>state.mode,getLanguage:()=>lang,
 beforeListen:()=>{clearTimeout(searchReadTimer);reader?.stop();},
 apply:(intent,summary)=>{
  closeDetails(false);state.selected=null;state.expanded=null;state.savedOnly=false;
  state.availability='';state.constituency='';state.location='';state.search='';
  if(intent.mode!==state.mode)changeMode(intent.mode);
  state.constituency=intent.constituency;state.search=intent.query;
  $('searchBox').value=state.search;$('availabilityFilter').value='';populateAreas();
  if(intent.near){if(state.position){state.sort='nearest';$('sortBy').value='nearest';}else requestLocation();}
  else{state.sort='number';$('sortBy').value='number';}
  render();writeURL();fit();toast(`${tr('Search applied','ಹುಡುಕಾಟ ಅನ್ವಯಿಸಲಾಗಿದೆ')}: ${summary}`);reader?.results();
 }
});

reader=OLHAccessibility.create({getSite:key=>sites.find(s=>s.key===key),getGroups:()=>OLHLocations.group(filtered)});
