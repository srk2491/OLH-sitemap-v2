/* Presentation grouping only. Availability joins and persistent media keys remain in core.js. */
(function(root){
'use strict';
const reviewed=[
 ['nelaguli','Nelaguli','ನೆಲಗುಳಿ',[25,26]],
 ['agraharapalya','Agraharapalya','ಅಗ್ರಹಾರ ಪಾಳ್ಯ',[12,49]],
 ['devagere','Devagere','ದೇವಗೆರೆ',[8,28,64,65,66]],
 ['kukkanahalli','Kukkanahalli','ಕುಕ್ಕನಹಳ್ಳಿ',[21,22]],
 ['muddayyanapalya','Muddayyanapalya','ಮುದ್ದಯನಪಾಳ್ಯ',[33,35,63]],
 ['muthagadhahalli','Muthagadhahalli','ಮುತ್ತುಗದಹಳ್ಳಿ',[47,54]],
 ['muddanahalli','Muddanahalli','',[57,58,59,60,61]]
];
const coords=s=>Number.isFinite(s.latitude)&&Number.isFinite(s.longitude);
function decorate(sites){
 for(const mode of new Set(sites.map(s=>s.mode)))decorateMode(sites.filter(s=>s.mode===mode));
 return sites;
}
function decorateMode(sites){
 const groups=new Map();
 for(const s of sites){const entry=reviewed.find(g=>g[3].includes(s.serial));
  s.locationId=s.mode+'-'+(entry?.[0]||s.project_id)+'-'+s.constituency.toLowerCase().replace(/[^a-z0-9]+/g,'-');
  s.locationName=entry?.[1]||s.name;s.locationNameKn=entry?.[2]||s.nameKn;
  if(!groups.has(s.locationId))groups.set(s.locationId,{id:s.locationId,name:s.locationName,sites:[]});groups.get(s.locationId).sites.push(s);
 }
 const all=[...groups.values()];for(const g of all){const ps=[...new Map(g.sites.filter(coords).map(s=>[s.project_id,s])).values()];g.latitude=ps.length?ps.reduce((a,s)=>a+s.latitude,0)/ps.length:null;g.longitude=ps.length?ps.reduce((a,s)=>a+s.longitude,0)/ps.length:null;g.angle=ps.length?(Math.atan2((g.longitude-77.5946)*Math.cos(12.9716*Math.PI/180),g.latitude-12.9716)+2*Math.PI)%(2*Math.PI):Infinity;}
 all.sort((a,b)=>a.angle-b.angle||a.id.localeCompare(b.id));
 all.forEach((g,i)=>{const unique=[...new Set(g.sites.map(s=>s.serial))].sort((a,b)=>a-b);
  for(const s of g.sites){s.number=i+1;s.locationLatitude=g.latitude;s.locationLongitude=g.longitude;
   const parcel=s.name.match(/parcel[-\s]*(\d+)/i);
   const repeat=g.sites.some(x=>x.mode===s.mode&&x.project_id!==s.project_id&&x.survey===s.survey);
   s.parcelLabel=parcel?'Parcel '+parcel[1]:'Survey '+s.survey+(repeat?' · Contract '+s.serial:'');
   s.displayNumber=unique.length>1?`${i+1}.${parcel?parcel[1]:unique.indexOf(s.serial)+1}`:String(i+1);
  }
 });return sites;
}
function group(sites){const map=new Map();for(const s of sites){if(!map.has(s.locationId))map.set(s.locationId,{id:s.locationId,name:s.locationName,nameKn:s.locationNameKn,number:s.number,latitude:s.locationLatitude,longitude:s.locationLongitude,sites:[]});map.get(s.locationId).sites.push(s);}return [...map.values()];}
function voiceIntent(text,sites){
 const normalize=s=>String(s||'').toLowerCase().replace(/[.,!?-]/g,' ').replace(/\s+/g,' ').trim();const t=normalize(text);
 const mode=/(?:\b(?:two|2)\s*(?:b\s*h\s*k|bedroom)|ಎರಡು\s*(?:ಬಿಎಚ್|ಬೆಡ್))/i.test(t)?'2':/(?:\b(?:one|1)\s*(?:b\s*h\s*k|bedroom)|ಒಂದು\s*(?:ಬಿಎಚ್|ಬೆಡ್))/i.test(t)?'1':null;
 const near=/\b(?:near me|nearby|nearest)\b|ನನ್ನ ಹತ್ತಿರ|ಹತ್ತಿರದ/.test(t);
 const aliases={'yelhanka':'Yelahanka','yelahanka':'Yelahanka','ಯಲಹಂಕ':'Yelahanka','yeshwanthpura':'Yeshwanthapura','ಯಶವಂತಪುರ':'Yeshwanthapura'};
 const candidates=sites.flatMap(s=>[{alias:s.name,value:s.name,type:'site'},{alias:s.nameKn,value:s.name,type:'site'},{alias:s.locationName,value:s.locationName,type:'site'},{alias:s.locationNameKn,value:s.locationName,type:'site'},{alias:s.constituency,value:s.constituency,type:'constituency'}]).concat(Object.entries(aliases).map(([alias,value])=>({alias,value,type:'constituency'}))).filter(x=>x.alias);
 const compact=v=>normalize(v).replace(/\s/g,'');let remaining=compact(t);const selected=[];
 // Longest names first prevent 'Horamavu' from swallowing 'Horamavu Agara'.
 candidates.sort((a,b)=>compact(b.alias).length-compact(a.alias).length);
 for(const x of candidates){const key=compact(x.alias);if(remaining.includes(key)){selected.push(x);remaining=remaining.split(key).join(' '.repeat(key.length));}}
 const unique=[...new Map(selected.map(x=>[x.value,x])).values()];
 let constituency=unique.length===1&&unique[0].type==='constituency'?unique[0].value:'';
 let query=constituency?'':unique.map(x=>x.value).join(', ');
 if(!query&&!constituency&&!mode&&!near)query=t.replace(/^(?:please\s+)?(?:show|find|search)(?:\s+me)?\s+/,'').replace(/^(?:sites?|locations?|homes?)\s+(?:in|at)\s+/,'');

 return {mode,near,constituency,query};
}
const api={decorate,group,voiceIntent};if(typeof module!=='undefined'&&module.exports)module.exports=api;else root.OLHLocations=api;
})(typeof window!=='undefined'?window:globalThis);
