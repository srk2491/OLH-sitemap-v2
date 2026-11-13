const assert=require('node:assert/strict');const fs=require('node:fs');const path=require('node:path');const C=require('../core.js');
const read=f=>JSON.parse(fs.readFileSync(path.join(__dirname,'..',f),'utf8'));const one=read('data/sites.json'),two=read('data/2bhk_sites.json'),report=read('ashraya_master_report.json');const sites=C.buildSites(one,report,two);
assert.equal(sites.length,63);assert.equal(new Set(sites.map(s=>s.key)).size,63);assert(sites.every(C.validCoordinates));
for(const v of [-1,'-3','',null,undefined,'1x','1.5'])assert.equal(C.count(v),null);assert.equal(C.count('0'),0);
assert.equal(sites.find(s=>s.key==='1-46').available,null,'Ambiguous Shettihalli must not use first report');assert.equal(sites.find(s=>s.key==='1-1').available,0,'Sadenahalli screenshot public available is zero');assert.deepEqual(sites.find(s=>s.key==='1-1').breakdown,[0,0,0]);assert.equal(sites.find(s=>s.key==='1-1').mlaAvailable,null,'Sadenahalli MLA remains unverified');assert.equal(sites.find(s=>s.key==='1-3').available,null,'Unmatched count unavailable');
assert.equal(sites.find(s=>s.key==='1-2').available,3);assert.equal(sites.find(s=>s.key==='1-26').available,null);assert(sites.filter(s=>s.mode==='2').every(s=>s.available===null));assert.equal(sites.find(s=>s.mode==='2'&&s.name==='K Narayanapura').number,1);
assert.equal(C.filterSites(sites,{search:'Agrahara',mode:'1'}).length,3);assert.equal(C.filterSites(sites,{search:'ಸಾದೇನಹಳ್ಳಿ'}).length,1);assert.equal(C.filterSites(sites,{search:'nonexistent'}).length,0);
assert(C.filterSites(sites,{mode:'2',location:'Yelahanka'}).every(s=>s.area==='Yelahanka'));assert(C.filterSites(sites,{availability:'available'}).every(s=>s.available>10));assert(C.filterSites(sites,{availability:'unknown'}).every(s=>s.available===null));assert.equal(C.distance(0,0,0,0),0);
assert(Math.abs(C.distance(0,0,0,1)-111.195)<.01);const near=C.filterSites(sites,{sort:'nearest',position:[one[0].latitude,one[0].longitude]});assert.equal(near[0].key,'1-1');
// Unique name must not duplicate a report count across distinct parcels.
assert.equal(sites.find(s=>s.key==='1-28').available,null);assert.equal(sites.find(s=>s.key==='1-29').available,null);
console.log('Data checks passed: 63 stable site keys, safe counts, ambiguous joins, filters, Kannada search, distance and numbering.');
// Verified mapping cannot silently attach a different row after a source refresh.
const row=report[4].data[0],ref=C.fingerprint(report[4].category_name,row);
const mapped=C.buildSites(one,report,two,{'1-46':ref});assert.equal(mapped.find(s=>s.key==='1-46').available,31);
const reordered=[...report].reverse().map(c=>({...c,data:[...c.data].reverse()}));assert.equal(C.buildSites(one,reordered,two,{'1-46':ref}).find(s=>s.key==='1-46').available,31);
const changed=structuredClone(report);changed[4].data[0].Total='32';assert.equal(C.buildSites(one,changed,two,{'1-46':ref}).find(s=>s.key==='1-46').available,null);
console.log('Mapping checks passed: row reorder stable, changed source fails closed.');
// Fuzzy English mistranslations must not select an unrelated Kannada village.
assert.equal(sites.find(s=>s.key==='1-5').available,0); // Kyalasanahalli, not Baiyappanahalli.
assert.equal(sites.find(s=>s.key==='1-6').available,934); // Bidarahalli, not Boyilahalli.
assert.equal(sites.find(s=>s.key==='1-37').available,2); // Pillahalli, not Gollahalli.
assert.equal(sites.find(s=>s.key==='1-27').available,80); // Punagamaranahalli, not Nagadasanahalli.
assert.equal(sites.find(s=>s.key==='1-50').available,132); // Survey 29 explicitly in report.
assert.equal(sites.find(s=>s.key==='1-40').available,null); // Do not allocate residual location count to survey 30.
assert.equal(sites.find(s=>s.key==='1-42').available,null);assert.equal(sites.find(s=>s.key==='1-43').available,null);
assert.equal(sites.filter(s=>s.available!==null).length,25);
console.log('Kannada identity checks passed: false English duplicates rejected; survey-qualified match; true parcel ambiguity retained.');
// MLA counts stay independent from public stock, and use the same parcel identity.
const legacy=structuredClone(report);legacy.forEach(c=>c.data.forEach(r=>delete r.mla_quota));assert(C.buildSites(one,legacy,two).every(s=>s.mlaAvailable==null),'Legacy data must not invent MLA counts');
assert.equal(sites.find(s=>s.key==='1-7').mlaAvailable,61);assert.deepEqual(sites.find(s=>s.key==='1-7').mlaBreakdown,[24,35,2]);assert.equal(sites.find(s=>s.key==='1-5').mlaAvailable,110);assert.equal(sites.find(s=>s.key==='1-9').mlaAvailable,26);
assert.equal(C.quotaCounts({SC:'0',General:'0',Minority:'0',Total:'0'}).available,0);
for(const quota of [{SC:'1',General:'2',Minority:'3',Total:'8'},{SC:'-1',General:'2',Minority:'3',Total:'4'},{Total:'6'}])assert.equal(C.quotaCounts(quota).available,null);
const quotaReport=structuredClone(report),bidarahalli=sites.find(s=>s.key==='1-6');
const quotaRow=quotaReport.flatMap(c=>c.data.map(r=>({category:c.category_name,r}))).find(x=>C.fingerprint(x.category,x.r)===bidarahalli.records[0].ref);
quotaRow.r.mla_quota={SC:'4',General:'6',Minority:'2',Total:'12'};
let quotaSite=C.buildSites(one,quotaReport,two).find(s=>s.key==='1-6');assert.equal(quotaSite.available,934);assert.equal(quotaSite.mlaAvailable,12);
quotaRow.r.Total='-1';quotaSite=C.buildSites(one,quotaReport,two).find(s=>s.key==='1-6');assert.equal(quotaSite.available,null);assert.equal(quotaSite.mlaAvailable,12);
assert.notEqual(C.fingerprint(quotaRow.category,quotaRow.r),bidarahalli.records[0].ref);
console.log('MLA quota checks passed: missing, zero, inconsistent and independent quota counts.');

const saden=sites.find(s=>s.key==='1-1');assert.equal(saden.mlaAvailable,null);assert(saden.mlaReason.includes('negative'));const sadenRaw=report.flatMap(c=>c.data).find(r=>r.location_en==='Sadenahalli');assert.deepEqual([sadenRaw.mla_quota.SC,sadenRaw.mla_quota.General,sadenRaw.mla_quota.Minority,sadenRaw.mla_quota.Total],['47','-70','23','0']);
