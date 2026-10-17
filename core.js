/* Source identity rules: use original Kannada names, never fuzzy English labels. */
(function(root){
'use strict';
const norm = v => String(v ?? '').trim().toLowerCase().replace(/\s+/g,' ');
const count = v => v === null || v === undefined || String(v).trim() === '' || !Number.isInteger(Number(v)) || Number(v) < 0 ? null : Number(v);
const distance = (a,b,c,d) => {const rad=x=>x*Math.PI/180;const h=Math.sin(rad(c-a)/2)**2+Math.cos(rad(a))*Math.cos(rad(c))*Math.sin(rad(d-b)/2)**2;return 6371*2*Math.atan2(Math.sqrt(h),Math.sqrt(1-h));};
const fingerprint = (category,r) => {let h=2166136261;const values=[category,r.location_kn,r.location_en,r['SC flats'],r['GEN flats'],r['Min Flats'],r.Total];if(r.mla_quota)values.push(r.mla_quota);const str=JSON.stringify(values);for(let i=0;i<str.length;i++){h^=str.charCodeAt(i);h=Math.imul(h,16777619);}return 'report-'+(h>>>0).toString(16);};
function quotaCounts(raw){const values=raw?[count(raw.SC),count(raw.General),count(raw.Minority)]:[null,null,null],total=count(raw?.Total);const valid=total!==null&&values.every(n=>n!==null)&&values.reduce((a,b)=>a+b,0)===total;return {available:valid?total:null,breakdown:valid?values:null,reason:!raw?'MLA quota counts were not supplied in this report.':valid?(raw.provenance?.kind==='user_report_screenshot'?'MLA quota transcribed from your supplied report screenshots; capture time is unknown.':'Reported MLA quota availability.'):'MLA quota counts are missing, negative or inconsistent.'};}
const area = v => ({Yelhanka:'Yelahanka',Yeshanthapura:'Yeshwanthapura'}[v] || v);
// Narrow spelling aliases visible in supplied Kannada source data. No general fuzzy matching.
const knAliases={ 'ಆನೇಕಲ್ಗ್ರಾಮಾಂತರ':'ಅನೆಕಲ್ಗ್ರಾಮಾಂತರ','ಕೂಗೂರು':'ಕೂಗುರು','ಚಿಕ್ಕನಹಳ್ಳಿಕಮ್ಮನಹಳ್ಳಿ':'ಚಿಕ್ಕನಹಳ್ಳಿಕಾಮನಹಳ್ಳಿ','ಹೊರಮಾವುಆಗರ':'ಹೊರಮಾವುಅಗರ','ಗಾಣಿಗರಹಳ್ಳಿ':'ಗಾಣಿಗಾರನಹಳ್ಳಿ','ಜೆಭಿಂಗಿಪುರ':'ಜೆಭಂಗಿಪುರ','ಅಗರಹಾರಪಾಳ್ಯ':'ಅಗ್ರಹಾರಪಾಳ್ಯ','ಕೋಲವೂರಾಯನಹಳ್ಳಿ':'ಕೊಲುವರಾಯನಹಳ್ಳಿ','ಮುತ್ತುಗದಹಳ್ಳಿ':'ಮುತ್ತಗದಹಳ್ಳಿ','ಸಾದೇನಹಳ್ಲಿ':'ಸಾದೇನಹಳ್ಳಿ','ಕೆಂಚನಾಪುರ':'ಕೆಂಚನಪುರ','ಚಿಕ್ಕೆಲ್ಲೂರುರಾಂಪುರ':'ಚಿಕ್ಕಲೂರುರಾಮಪುರ','ಪುನಗಮಾರನಹಳ್ಲಿ':'ಪುನಾಗಮಾರನಹಳ್ಳಿ','ಮುದ್ದಯನಪಾಳ್ಯ':'ಮುದ್ದಯ್ಯನಪಾಳ್ಯ'};
function knIdentity(value){let name=String(value||'').normalize('NFC').trim();const match=name.match(/(?:\s|-)(\d+(?:\/\d+)?)\s*$/);const survey=match?match[1]:'';if(match)name=name.slice(0,match.index);let key=name.replace(/[\s.\-–—()]/g,'');return {key:knAliases[key]||key,survey};}
function buildSites(one, report, two, mappings={}) {
 const rows=report.flatMap(c=>c.data.map(r=>({...r,category:c.category_name,ref:fingerprint(c.category_name,r),identity:knIdentity(r.location_kn)})));
 const result=one.map(s=>{
  const key=`1-${s.id}`, identity=knIdentity(s.grama_name_kn);
  const family=one.filter(x=>knIdentity(x.grama_name_kn).key===identity.key);
  const candidates=rows.filter(r=>r.identity.key===identity.key || (!r.location_kn&&norm(r.location_en)===norm(s.grama_name_en)));
  const qualified=candidates.filter(r=>r.identity.survey&&norm(r.identity.survey)===norm(s.survey_number));
  const familySurvey=family.filter(x=>norm(x.survey_number)===norm(s.survey_number));
  const explicit=rows.find(r=>r.ref===mappings[key]);
  const match=mappings[key]?explicit:(qualified.length===1&&familySurvey.length===1?qualified[0]:candidates.length===1&&family.length===1&&!candidates[0].identity.survey?candidates[0]:null);
  const breakdown=match?[count(match['SC flats']),count(match['GEN flats']),count(match['Min Flats'])]:[null,null,null];
  const total=match?count(match.Total):null;
  const valid=total!==null&&breakdown.every(n=>n!==null)&&breakdown.reduce((a,b)=>a+b,0)===total;
  const mla=match?quotaCounts(match.mla_quota):{available:null,breakdown:null,reason:'No uniquely matched MLA quota entry for this parcel.'};
  const reason=!match?(candidates.length?'The report has location-level entries, but it does not identify this parcel clearly.':'No matching availability entry was supplied for this site.'):'The source contains negative or inconsistent counts. Current availability needs checking.';
  return {...s,key,number:s.id,mode:'1',name:s.grama_name_en.trim(),nameKn:s.grama_name_kn,area:area(s.taluk),survey:s.survey_number,available:valid?total:null,breakdown:valid?breakdown:null,mlaAvailable:mla.available,mlaBreakdown:mla.breakdown,mlaReason:mla.reason,reason,source:match?.category,matchMethod:match?(qualified.includes(match)?'Kannada name + survey number':'Kannada name'):'unresolved',records:candidates.map(r=>({name:r.location_kn,category:r.category,total:count(r.Total),ref:r.ref,survey:r.identity.survey}))};
 });
 const sorted=[...two].sort((a,b)=>{const angle=s=>(Math.atan2(s.longitude-77.5946,s.latitude-12.9716)+2*Math.PI)%(2*Math.PI);return angle(a)-angle(b);});
 sorted.forEach((s,i)=>result.push({...s,key:`2-${s.id}`,number:i+1,mode:'2',name:s.name.trim(),nameKn:'',area:area(s.taluk),survey:s.survey_no,available:null,units:count(s.two_bhk),reason:'The supplied 2 BHK file gives project units, not the number available for allotment.',records:[]}));
 return result;
}
// Preserve numbered labels: parcel 2 must never collapse into parcel 3.
function reportLabel(value){const id=knIdentity(value);return id.key+'|'+id.survey;}
const signedCount=v=>v===null||v===undefined||String(v).trim()===''||!Number.isInteger(Number(v))?null:Number(v);
function reportedQuota(raw){
 const breakdown=raw?[signedCount(raw.SC),signedCount(raw.General),signedCount(raw.Minority)]:null;
 const available=signedCount(raw?.Total);
 const negative=available<0||breakdown?.some(n=>n!==null&&n<0);
 const inconsistent=available!==null&&breakdown?.every(n=>n!==null)&&breakdown.reduce((a,b)=>a+b,0)!==available;
 return {available,breakdown,reason:!raw?'Quota data not supplied.':negative?'Negative figures are displayed exactly as reported by the source.':inconsistent?'Source category figures do not sum to the reported total.':'Figures displayed as reported.',negative,inconsistent};
}
function stockTotal(r){const a=count(r.public_stock?.Total),b=count(r.mla_stock?.Total);return a!==null&&b!==null?a+b:null;}
function matchMaster(master,rows){
 const assignments=new Map(),groups=new Map();
 const groupKey=(category,label)=>norm(category)+'|'+knIdentity(label).key;
 for(const p of master.projects.filter(p=>p.one_bhk_units>0&&p.report_identity.location_kn)){
  const key=groupKey(p.report_identity.category_kn,p.report_identity.location_kn);
  if(!groups.has(key))groups.set(key,[]);groups.get(key).push(p);
 }
 for(const [key,projects] of groups){
  let ps=[...projects],rs=rows.filter(r=>groupKey(r.category,r.location_kn)===key);
  const compatible=(p,r)=>{const suffix=knIdentity(r.location_kn).survey;return !suffix||suffix===knIdentity(p.report_identity.location_kn).survey||suffix===String(p.survey);};
  const assign=(p,r,method)=>{assignments.set(p.project_id,{row:r,method});ps=ps.filter(x=>x!==p);rs=rs.filter(x=>x!==r);};
  // Consume unique equal stock first; a report row may only be used once.
  let progress=true;while(progress){progress=false;for(const p of [...ps]){
   const hits=rs.filter(r=>compatible(p,r)&&stockTotal(r)===p.one_bhk_units);
   if(hits.length===1&&ps.filter(x=>compatible(x,hits[0])&&x.one_bhk_units===stockTotal(hits[0])).length===1){assign(p,hits[0],'Exact stock + name + constituency');progress=true;}
  }}
  // An explicit survey/parcel label also resolves identity independently of stock.
  for(const p of [...ps]){const hits=rs.filter(r=>knIdentity(r.location_kn).survey&&compatible(p,r));if(hits.length===1&&ps.filter(x=>compatible(x,hits[0])).length===1)assign(p,hits[0],stockTotal(hits[0])!==null&&stockTotal(hits[0])!==p.one_bhk_units?'Approximate stock; explicit parcel label':'Explicit parcel + constituency');}
  if(ps.length===1&&rs.length===1&&compatible(ps[0],rs[0])){
   const p=ps[0],r=rs[0];
   if(stockTotal(r)!==null)assign(p,r,'Approximate stock; remaining same-name row');
   else if(projects.length===1&&p.serial!==12)assign(p,r,'Name + constituency; stock unavailable');
  }else if(ps.length>1&&ps.length===rs.length&&rs.every(r=>stockTotal(r)!==null)&&new Set(ps.map(p=>p.one_bhk_units)).size===ps.length&&new Set(rs.map(stockTotal)).size===rs.length){
   const pp=[...ps].sort((a,b)=>a.one_bhk_units-b.one_bhk_units),rr=[...rs].sort((a,b)=>stockTotal(a)-stockTotal(b));
   if(pp.every((p,i)=>compatible(p,rr[i])))pp.forEach((p,i)=>assign(p,rr[i],'Approximate stock; remaining rows ranked by units'));
  }
 }
 return assignments;
}
function buildMasterSites(master,report){
 const rows=report.flatMap(c=>c.data.map(r=>({...r,category:c.category_name,ref:fingerprint(c.category_name,r)})));
 const matches=matchMaster(master,rows),result=[];
 for(const p of master.projects){for(const mode of ['1','2']){
  const units=count(mode==='1'?p.one_bhk_units:p.two_bhk_units);if(!units)continue;
  const assignment=mode==='1'?matches.get(p.project_id):null,match=assignment?.row;
  const pub=reportedQuota(match?{SC:match['SC flats'],General:match['GEN flats'],Minority:match['Min Flats'],Total:match.Total}:null),mla=reportedQuota(match?.mla_quota);
  const candidates=p.report_identity.location_kn?rows.filter(r=>norm(r.category)===norm(p.report_identity.category_kn)&&knIdentity(r.location_kn).key===knIdentity(p.report_identity.location_kn).key):[];
  const approximate=assignment?.method.startsWith('Approximate')||false;
  const reason=mode==='2'?'The workbook supplies project stock, not 2 BHK availability.':!match?'No unique report row could be assigned to this contract. Refresh the report with the updated scraper to include stock totals.':pub.reason;
  result.push({...p,key:p.legacy_keys?.[mode]||mode+'-'+p.project_id,number:p.serial,mode,name:p.name,nameKn:p.report_identity.location_kn||'',area:p.constituency,constituency:p.constituency,units,phase:'Package '+p.package,available:pub.available,breakdown:pub.breakdown,mlaAvailable:mla.available,mlaBreakdown:mla.breakdown,mlaReason:mla.reason,reason,source:match?.category,matchMethod:assignment?.method||'unresolved',approximate,sourceStock:match?stockTotal(match):null,publicStock:count(match?.public_stock?.Total),mlaStock:count(match?.mla_stock?.Total),sourceLocation:match?.location_kn||'',sourceRef:match?.ref||'',sourceIssue:pub.negative||pub.inconsistent||mla.negative||mla.inconsistent,records:candidates.map(r=>({name:r.location_kn,category:r.category,total:signedCount(r.Total),ref:r.ref})),workbookSource:master.source.filename});
 }}return result;
}
function status(site) {return site.available===null?'unknown':site.available<=0?'zero':site.available<=10?'limited':'available';}
function filterSites(sites,{mode='1',search='',location='',constituency='',availability='',sort='number',position=null}={}){
 const queries=norm(search).split(/[,;]|\s+(?:and|or|ಮತ್ತು)\s+|&/).map(q=>q.replace(/\s/g,'')).filter(Boolean);
 return sites.filter(s=>s.mode===mode&&(!location||s.area===location)&&(!constituency||s.constituency===constituency)&&(!availability||status(s)===availability)&&(!queries.length||queries.some(q=>[s.name,s.nameKn,s.locationName,s.locationNameKn,s.number,s.area,s.survey,s.constituency,s.agency,s.parcelLabel].some(v=>norm(v).replace(/\s/g,'').includes(q))))).sort((a,b)=>sort==='name'?a.name.localeCompare(b.name):sort==='nearest'&&position?(validCoordinates(a)?distance(...position,a.latitude,a.longitude):Infinity)-(validCoordinates(b)?distance(...position,b.latitude,b.longitude):Infinity):a.number-b.number);
}
function validCoordinates(s){return Number.isFinite(s.latitude)&&Number.isFinite(s.longitude)&&Math.abs(s.latitude)<=90&&Math.abs(s.longitude)<=180;}
const api={norm,count,quotaCounts,distance,area,fingerprint,knIdentity,buildSites,buildMasterSites,matchMaster,stockTotal,reportedQuota,status,filterSites,validCoordinates};if(typeof module!=='undefined'&&module.exports)module.exports=api;else root.OLH=api;
})(typeof window!=='undefined'?window:globalThis);
