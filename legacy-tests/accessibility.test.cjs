const assert=require('node:assert/strict'),A=require('../accessibility');
const s={name:'Sadenahalli',nameKn:'ಸಾದೇನಹಳ್ಳಿ',mode:'1',survey:'30',constituency:'Yelahanka',report_identity:{category_kn:'ಯಲಹಂಕ'},available:0,breakdown:[0,0,0],mlaAvailable:0,mlaBreakdown:[47,-70,23]};
const en=A.siteText(s);assert(en.includes('MLA quota reported availability 0'));assert(en.includes('General minus 70'));assert(en.includes('Public quota reported availability 0'));assert(en.includes('Confirm current availability'));assert(!en.includes('undefined'));
const kn=A.siteText(s,true);assert(kn.includes('ಸಾದೇನಹಳ್ಳಿ'));assert(kn.includes('ಮೈನಸ್ 70'));assert(kn.includes('ಯಲಹಂಕ'));
assert(A.siteText({...s,available:null,mlaAvailable:null,breakdown:null,mlaBreakdown:null}).includes('data unavailable'));
assert(A.siteText({...s,approximate:true}).includes('parcel needs confirmation'));
assert(A.resultText([]).includes('0 locations found'));const gs=Array.from({length:6},(_,i)=>({name:'Place '+i}));assert(!A.resultText(gs).includes('Place 5'));assert(A.resultText(gs).includes('6 locations found'));
console.log('PASS bilingual announcements, signed/zero/missing quota values, approximate caveat and bounded result summary');
