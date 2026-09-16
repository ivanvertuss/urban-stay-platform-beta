(() => {
'use strict';
const CFG=window.URBAN_STAY_SUPABASE||null;
const DB=CFG&&window.supabase?.createClient?window.supabase.createClient(CFG.url,CFG.publishableKey):null;
const PROPS_KEY='usp-v1-properties';
let bypass=false;
function readProps(){try{return JSON.parse(localStorage.getItem(PROPS_KEY)||'[]')}catch{return []}}
function writeProps(v){localStorage.setItem(PROPS_KEY,JSON.stringify(v))}
async function syncProperty(id){
 if(!DB||!id)return;
 const {data:row,error}=await DB.from('property_content').select('content').eq('property_id',id).maybeSingle();
 if(error)throw error;
 if(!row?.content)return;
 const props=readProps();
 const idx=props.findIndex(p=>String(p.id)===String(id));
 if(idx<0)return;
 props[idx]={...props[idx],wizardData:row.content,updated:new Date().toLocaleDateString('es-ES')};
 writeProps(props);
}
document.addEventListener('click',async e=>{
 const trigger=e.target.closest?.('[data-open-property]');
 if(!trigger||bypass)return;
 const id=trigger.dataset.openProperty;
 if(!id)return;
 e.preventDefault();
 e.stopImmediatePropagation();
 try{await syncProperty(id)}catch(err){console.warn('Urban Stay wizard sync failed',err)}
 bypass=true;
 try{trigger.click()}finally{setTimeout(()=>{bypass=false},0)}
},true);
})();