(() => {
'use strict';
const CFG=window.URBAN_STAY_SUPABASE||null;
const DB=CFG&&window.supabase?.createClient?window.supabase.createClient(CFG.url,CFG.publishableKey):null;
const PROPS_KEY='usp-v1-properties';
const ACCESS_TYPES=['Llaves','Código','Cerradura inteligente','Recepción','Otro'];
let bypass=false;
let latestContent=null;
function readProps(){try{return JSON.parse(localStorage.getItem(PROPS_KEY)||'[]')}catch{return []}}
function writeProps(v){localStorage.setItem(PROPS_KEY,JSON.stringify(v))}
function canonicalAccessType(type){
 return ({'Caja de llaves':'Código','Smart Lock':'Cerradura inteligente','Cerradura Inteligente':'Cerradura inteligente'})[type]||type||'Llaves';
}
function normalizeForWizard(content={}){
 const access=content.access||{};
 return {
  ...content,
  wifiName:access.wifiName ?? content.wifiName ?? '',
  wifiPassword:access.wifiPassword ?? content.wifiPassword ?? '',
  accessType:canonicalAccessType(access.accessType ?? content.accessType ?? 'Llaves'),
  accessNotes:access.accessInstructions ?? content.accessNotes ?? ''
 };
}
async function syncProperty(id){
 if(!DB||!id)return null;
 const {data:row,error}=await DB.from('property_content').select('content').eq('property_id',id).maybeSingle();
 if(error)throw error;
 if(!row?.content)return null;
 latestContent=normalizeForWizard(row.content);
 const props=readProps();
 const idx=props.findIndex(p=>String(p.id)===String(id));
 if(idx>=0){props[idx]={...props[idx],wizardData:latestContent,updated:new Date().toLocaleDateString('es-ES')};writeProps(props)}
 return latestContent;
}
function patchAccessStep(content){
 const dlg=document.querySelector('#propertyWizard');if(!dlg?.open||!content)return;
 const labels=[...dlg.querySelectorAll('label')];
 const accessLabel=labels.find(l=>/tipo de acceso/i.test(l.textContent||''));
 const select=accessLabel?.querySelector('select');
 if(select){
  const wanted=canonicalAccessType(content.access?.accessType ?? content.accessType);
  select.innerHTML=ACCESS_TYPES.map(x=>`<option value="${x}">${x}</option>`).join('');
  select.value=ACCESS_TYPES.includes(wanted)?wanted:'Llaves';
  if(window.draft)window.draft.accessType=select.value;
 }
}
function patchWizardPreview(content){
 const dlg=document.querySelector('#propertyWizard');
 if(!dlg?.open||!content)return;
 patchAccessStep(content);
 const guide=content.guideBuilder?.published||content.guideBuilder?.draft||null;
 const access=content.access||{};
 const sections=[...dlg.querySelectorAll('.guest-section')];
 if(guide){
  const welcomeSection=sections.find(s=>s.querySelector('h2')?.textContent.trim()==='Bienvenido');
  if(welcomeSection&&guide.welcome){const p=welcomeSection.querySelector('p');if(p)p.textContent=guide.welcome}
  let info=dlg.querySelector('.usp-wizard-guide-sync');
  if(!info){info=document.createElement('div');info.className='guest-section usp-wizard-guide-sync';const anchor=welcomeSection||sections[0];anchor?.insertAdjacentElement('afterend',info)}
  const times=[guide.checkin&&`Entrada: ${guide.checkin}`,guide.checkout&&`Salida: ${guide.checkout}`].filter(Boolean).join(' · ');
  info.innerHTML=`<h3>Guía del huésped</h3>${times?`<p>${times}</p>`:''}${guide.houseRules?`<p><b>Normas:</b> ${guide.houseRules}</p>`:''}${guide.notes?`<p>${guide.notes}</p>`:''}`;
 }
 const wifiSection=sections.find(s=>s.querySelector('h3')?.textContent.trim()==='WiFi');
 if(wifiSection&&(access.wifiName||content.wifiName)){const p=wifiSection.querySelector('p');if(p)p.innerHTML=`Red: <b>${(access.wifiName||content.wifiName)}</b>`}
}
function patchRepeatedly(content){[60,140,280,500].forEach(ms=>setTimeout(()=>patchWizardPreview(content),ms))}
document.addEventListener('click',async e=>{
 const trigger=e.target.closest?.('[data-open-property]');if(!trigger||bypass)return;
 const id=trigger.dataset.openProperty;if(!id)return;
 e.preventDefault();e.stopImmediatePropagation();
 let content=null;try{content=await syncProperty(id)}catch(err){console.warn('Urban Stay wizard sync failed',err)}
 bypass=true;try{trigger.click()}finally{setTimeout(()=>{bypass=false},0)}
 if(content)patchRepeatedly(content);
},true);
document.addEventListener('click',e=>{if(!latestContent)return;if(e.target.closest?.('#wizardNext,#wizardBack,[data-step]'))patchRepeatedly(latestContent)},false);
})();