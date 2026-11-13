const assert=require('node:assert/strict'),O=require('../core'),G=require('../locations'),m=require('../data/project-master.json'),r=require('../ashraya_master_report.json');
const raw=O.buildMasterSites(m,r),s=G.decorate(structuredClone(raw));
assert.deepEqual(s.map(x=>[x.key,x.available,x.mlaAvailable]),raw.map(x=>[x.key,x.available,x.mlaAvailable]));
const groups=G.group(s),nel=s.filter(x=>x.mode==='1'&&x.locationName==='Nelaguli');assert.equal(nel.length,2);assert.equal(nel[0].number,nel[1].number);assert.notEqual(nel[0].displayNumber,nel[1].displayNumber);assert.deepEqual(nel.map(x=>x.parcelLabel).sort(),['Parcel 2','Parcel 3']);
assert.equal(groups.length,62);assert.equal(G.group(s.filter(x=>x.mode==='1')).length,51);assert.equal(new Set(s.map(x=>x.key)).size,76);
assert(G.group(s.filter(x=>x.mode==='1')).slice(-2).every(x=>x.latitude===null));assert(s.every(x=>!x.name.includes('in lieu')||x.locationName!==x.name.split('in lieu')[1]));
const reversed=G.decorate(structuredClone(raw).reverse());for(const a of s)assert.equal(a.number,reversed.find(b=>b.key===a.key).number);
const d=G.voiceIntent('Show sites in Yelahanka',s);assert.equal(d.constituency,'Yelahanka');assert.equal(d.query,'');assert.equal(G.voiceIntent('Find Nelaguli',s).query,'Nelaguli');assert.equal(G.voiceIntent('Show two-bedroom homes',s).mode,'2');assert(G.voiceIntent('Show sites near me',s).near);assert.equal(G.voiceIntent('ನೆಲಗುಳಿ',s).query,'Nelaguli');assert.equal(G.voiceIntent('ಯಲಹಂಕ',s).constituency,'Yelahanka');
console.log('PASS grouping, keys/quotas preserved, clockwise order stable, missing-coordinate groups last, voice commands in English and Kannada');
const multi=G.voiceIntent('Find Nelaguli and Sadenahalli',s);const both=O.filterSites(s,{search:multi.query});assert(both.some(x=>x.locationName==='Nelaguli'));assert(both.some(x=>x.name==='Sadenahalli'));assert.equal(both.length,3);
const kn=G.voiceIntent('ನೆಲಗುಳಿ ಮತ್ತು ಸಾದೇನಹಳ್ಲಿ',s);assert.equal(O.filterSites(s,{search:kn.query}).length,3);
const twoC=G.voiceIntent('Yelahanka and Yeshwanthapura',s);assert.equal(twoC.constituency,'');const cs=O.filterSites(s,{search:twoC.query});assert(cs.some(x=>x.constituency==='Yelahanka'));assert(cs.some(x=>x.constituency==='Yeshwanthapura'));
assert.equal(O.filterSites(s,{search:'Nelaguli, Sadenahalli'}).length,3);assert.equal(O.filterSites(s,{search:'Nelaguli and Sadenahalli'}).length,3);
console.log('PASS multi-location and multi-constituency OR search, including Kannada');

for(const mode of ['1','2']){const subset=s.filter(x=>x.mode===mode),gs=G.group(subset);assert.deepEqual([...new Set(subset.map(x=>x.number))].sort((a,b)=>a-b),Array.from({length:gs.length},(_,i)=>i+1));const isolated=G.decorate(structuredClone(raw.filter(x=>x.mode===mode)));for(const x of subset)assert.equal(x.number,isolated.find(y=>y.key===x.key).number);}
assert.equal(G.group(s.filter(x=>x.mode==='2')).length,11);
const shared=s.filter(x=>x.project_id==='xls-025');assert.equal(shared.length,2);assert.notEqual(shared[0].locationId,shared[1].locationId);assert.notEqual(shared[0].number,shared[1].number);
console.log('PASS independent contiguous clockwise sequences: 1 BHK 1–51; 2 BHK 1–11; separate group IDs and preserved media keys');
