/* Browser-only drafts. Published galleries live in data/media.json + media/. */
(function(root){
'use strict';
let dbPromise;
function openDB(){if(!dbPromise)dbPromise=new Promise((resolve,reject)=>{const r=indexedDB.open('olh-media-drafts-v1',1);r.onupgradeneeded=()=>r.result.createObjectStore('drafts',{keyPath:'key'});r.onsuccess=()=>resolve(r.result);r.onerror=()=>reject(new Error('Browser storage is unavailable. Try a normal browser window.'));});return dbPromise;}
async function transact(mode,action){const db=await openDB();return new Promise((resolve,reject)=>{const tx=db.transaction('drafts',mode);const req=action(tx.objectStore('drafts'));let result;req.onsuccess=()=>{result=req.result};tx.oncomplete=()=>resolve(result);tx.onabort=tx.onerror=()=>reject(tx.error||new Error('Unable to save. Browser storage may be full.'));});}
const get=key=>transact('readonly',s=>s.get(key));const all=()=>transact('readonly',s=>s.getAll());const save=(key,items)=>transact('readwrite',s=>s.put({key,items}));const discard=key=>transact('readwrite',s=>s.delete(key));
function safeSrc(src){if(typeof src!=='string')return '';if(/^media\/[a-zA-Z0-9_./-]+$/.test(src)&&!src.includes('..'))return src;return '';}
function publishedItems(manifest,key){return (Array.isArray(manifest?.sites?.[key])?manifest.sites[key]:[]).filter(x=>x&&['image','video'].includes(x.type)&&safeSrc(x.src)).map(x=>({...x,src:safeSrc(x.src),caption:String(x.caption||''),alt:String(x.alt||x.caption||'Site media')}));}
async function gallery(manifest,key,preview=false){if(preview){const draft=await get(key);if(draft)return {items:draft.items,draft:true};}return {items:publishedItems(manifest,key),draft:false};}
function fileType(file){const ext=file.name.split('.').pop().toLowerCase();if(['jpg','jpeg','png','webp'].includes(ext)&&['image/jpeg','image/png','image/webp'].includes(file.type))return 'image';if(['mp4','webm'].includes(ext)&&['video/mp4','video/webm'].includes(file.type))return 'video';return null;}
function validateFile(file){const type=fileType(file);if(!type)throw new Error(`${file.name}: use JPG, PNG, WebP, MP4 or WebM. Convert HEIC/MOV files first.`);const max=type==='image'?20:90;if(file.size>max*1024*1024)throw new Error(`${file.name}: exceeds the ${max} MB limit.`);if(!file.size)throw new Error(`${file.name}: empty file.`);return type;}
const api={get,all,save,discard,safeSrc,publishedItems,gallery,validateFile,fileType};root.OLHMedia=api;
})(window);
