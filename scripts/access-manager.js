(() => {
'use strict';
const DB = window.URBAN_STAY_SUPABASE && window.supabase?.createClient
  ? window.supabase.createClient(window.URBAN_STAY_SUPABASE.url, window.URBAN_STAY_SUPABASE.publishableKey)
  : null;
const ROOT_ID='accessManagerRoot';
const SELECTED_KEY='usp-v1-selected-property';
const PROPS_KEY='usp-v1-properties';
const esc=v=>String(v??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
const toast=msg=>{const e=document.querySelector('#toast');if(!e)return;e.textContent=msg;e.classList.add('show');clearTimeout(window.__accessToast);window.__accessToast=setTimeout(()=>e.classList.remove('show'),2200)};
let properties=[], selected=null, data={};
const defaults=()=>({accessType:'Llaves',accessCode:'',accessInstructions:'',wifiName:'',wifiPassword:'',parking:'',arrivalNotes:''});
function wizardAccessType(type){return ({'Código':'Caja de llaves','Cerradura inteligente':'Smart Lock','Recepción':'Recepción','Llaves':'Llaves'})[type]||type||'Llaves'}
function managerAccessType(type){return ({'Caja de llaves':'Código','Smart Lock':'Cerradura inteligente','Recepción':'Recepción','Llaves':'Llaves'})[type]||type||'Llaves'}
function hideHost(){const host=document.querySelector('#appContent');if(host){host.style.visibility='hidden';host.style.minHeight='70vh'}}
function showHost(){const host=document.querySelector('#appContent');if(host){host.style.visibility='visible';host.style.minHeight=''}}
async function getProperties(){
 if(!DB)return [];
 const {data:auth}=await DB.auth.getUser(); const uid=auth?.user?.id;if(!uid)return [];
 const {data:rows,error}=await DB.from('properties').select('id,name,city,country,address').eq('owner_id',uid).order('created_at',{ascending:false});
 if(error)throw error;return rows||[];
}
async function loadAccess(id){
 data=defaults(); if(!DB||!id)return;
 const {data:row,error}=await DB.from('property_content').select('content,updated_at').eq('property_id',id).maybeSingle();
 if(error)throw error;
 const content=row?.content||{};
 const a=content.access||{};
 data={
  ...data,
  wifiName:a.wifiName ?? content.wifiName ?? '',
  wifiPassword:a.wifiPassword ?? content.wifiPassword ?? '',
  accessType:managerAccessType(a.accessType ?? content.accessType ?? 'Llaves'),
  accessCode:a.accessCode ?? '',
  accessInstructions:a.accessInstructions ?? content.accessNotes ?? '',
  parking:a.parking ?? '',
  arrivalNotes:a.arrivalNotes ?? ''
 };
 data.updatedAt=row?.updated_at||null;
}
function field(label,key,placeholder,type='input'){
 const val=esc(data[key]);
 return `<label class="access-field"><b>${label}</b>${type==='textarea'?`<textarea data-access-field="${key}" placeholder="${placeholder}">${val}</textarea>`:`<input data-access-field="${key}" value="${val}" placeholder="${placeholder}">`}</label>`;
}
function renderMarkup(){
 const p=properties.find(x=>x.id===selected)||properties[0];
 if(!p)return `<section class="page"><div class="page-title"><div><span class="section-label">ACCESOS</span><h1>Gestor de accesos</h1><p>Añade primero una propiedad para configurar su acceso.</p></div></div></section>`;
 return `<style>
 #${ROOT_ID}{max-width:1320px;margin:0 auto}.access-head{display:flex;justify-content:space-between;gap:28px;align-items:end;margin-bottom:26px}.access-head h1{font-family:Georgia,serif;font-size:48px;color:#09243a;margin:6px 0}.access-head p{font-size:19px;color:#6c8196;margin:0}.access-property{min-width:300px}.access-property b,.access-field>b{display:block;margin-bottom:8px;color:#102b40}.access-property select,.access-field input,.access-field textarea,.access-field select{width:100%;box-sizing:border-box;border:1px solid #d6e0e8;border-radius:15px;background:#fff;padding:15px 17px;font:inherit;color:#102b40}.access-field textarea{min-height:116px;resize:vertical}.access-grid{display:grid;grid-template-columns:1fr 1fr;gap:22px}.access-card{background:#fff;border:1px solid #dbe4eb;border-radius:25px;padding:28px;box-shadow:0 10px 30px rgba(10,35,55,.04)}.access-card h2{font-size:25px;color:#09243a;margin:0 0 20px}.access-field{display:block;margin:0 0 18px}.access-preview{background:#f5f8fa;border-radius:20px;padding:22px}.access-preview h3{margin:0 0 8px;color:#09243a}.access-preview p{white-space:pre-wrap;color:#526b80;margin:0 0 17px}.access-actions{display:flex;justify-content:flex-end;gap:12px;margin-top:24px}.access-save{border:0;border-radius:14px;padding:15px 24px;background:#062a43;color:#fff;font-weight:800;font-size:17px;cursor:pointer}.access-updated{color:#71869a;font-size:14px}.access-code-wrap{display:${data.accessType==='Código'||data.accessType==='Cerradura inteligente'?'block':'none'}}@media(max-width:900px){.access-head{display:block}.access-property{margin-top:20px;min-width:0}.access-grid{grid-template-columns:1fr}.access-head h1{font-size:38px}}
 </style><section id="${ROOT_ID}"><div class="access-head"><div><span class="section-label">ACCESOS DEL ALOJAMIENTO</span><h1>Gestor de accesos</h1><p>Configura cómo llegan y entran tus huéspedes. Esta información podrá mostrarse en su guía.</p></div><label class="access-property"><b>Propiedad</b><select id="accessProperty">${properties.map(x=>`<option value="${x.id}" ${x.id===p.id?'selected':''}>${esc(x.name)}</option>`).join('')}</select></label></div>
 <div class="access-grid"><div class="access-card"><h2>Entrada al alojamiento</h2><label class="access-field"><b>Tipo de acceso</b><select data-access-field="accessType"><option ${data.accessType==='Llaves'?'selected':''}>Llaves</option><option ${data.accessType==='Código'?'selected':''}>Código</option><option ${data.accessType==='Cerradura inteligente'?'selected':''}>Cerradura inteligente</option><option ${data.accessType==='Recepción'?'selected':''}>Recepción</option><option ${data.accessType==='Otro'?'selected':''}>Otro</option></select></label><div class="access-code-wrap">${field('Código o referencia de acceso','accessCode','Ej. 2580#')}</div>${field('Instrucciones de entrada','accessInstructions','Ej. Recoge las llaves en la caja situada junto al portal…','textarea')}</div>
 <div class="access-card"><h2>Conectividad y llegada</h2>${field('Nombre de la red Wi-Fi','wifiName','Ej. UrbanStay_Guest')}${field('Contraseña Wi-Fi','wifiPassword','Contraseña de la red')}${field('Aparcamiento','parking','Ej. Parking público a 150 m…','textarea')}${field('Indicaciones de llegada','arrivalNotes','Portal, planta, ascensor, referencias útiles…','textarea')}</div></div>
 <div class="access-card" style="margin-top:22px"><h2>Vista para el huésped</h2><div class="access-preview" id="accessPreview"></div><div class="access-actions"><span class="access-updated" id="accessUpdated">${data.updatedAt?'Última actualización: '+new Date(data.updatedAt).toLocaleString('es-ES'):''}</span><button class="access-save" id="saveAccess">Guardar accesos</button></div></div></section>`;
}
function updatePreview(){const e=document.querySelector('#accessPreview');if(!e)return;e.innerHTML=`<h3>🔑 ${esc(data.accessType||'Acceso')}</h3><p>${esc(data.accessInstructions||'Añade las instrucciones de entrada para tus huéspedes.')}</p>${data.accessCode?`<h3>Código de acceso</h3><p>${esc(data.accessCode)}</p>`:''}<h3>📶 Wi-Fi</h3><p>${data.wifiName?esc(data.wifiName)+(data.wifiPassword?' · '+esc(data.wifiPassword):''):'Todavía sin información Wi-Fi.'}</p><h3>🅿 Aparcamiento y llegada</h3><p>${esc([data.parking,data.arrivalNotes].filter(Boolean).join('\n')||'Todavía sin indicaciones añadidas.')}</p>`}
function syncLocalWizardData(){
 try{
  const props=JSON.parse(localStorage.getItem(PROPS_KEY)||'[]');
  const idx=props.findIndex(p=>String(p.id)===String(selected));
  if(idx<0)return;
  const wd=props[idx].wizardData||{};
  props[idx]={...props[idx],updated:new Date().toLocaleDateString('es-ES'),wizardData:{...wd,wifiName:data.wifiName,wifiPassword:data.wifiPassword,accessType:wizardAccessType(data.accessType),accessNotes:data.accessInstructions}};
  localStorage.setItem(PROPS_KEY,JSON.stringify(props));
 }catch(e){console.warn('Urban Stay local access sync failed',e)}
}
async function save(){
 if(!DB||!selected)return toast('No se pudo conectar con Supabase');
 const {data:row,error:rerr}=await DB.from('property_content').select('content').eq('property_id',selected).maybeSingle();if(rerr)return toast('No se pudo guardar');
 const previous=row?.content||{};
 const content={
  ...previous,
  wifiName:data.wifiName,
  wifiPassword:data.wifiPassword,
  accessType:wizardAccessType(data.accessType),
  accessNotes:data.accessInstructions,
  access:{accessType:data.accessType,accessCode:data.accessCode,accessInstructions:data.accessInstructions,wifiName:data.wifiName,wifiPassword:data.wifiPassword,parking:data.parking,arrivalNotes:data.arrivalNotes}
 };
 const {error}=await DB.from('property_content').upsert({property_id:selected,content},{onConflict:'property_id'});if(error){console.error(error);return toast('No se pudo guardar el acceso')}
 syncLocalWizardData();
 data.updatedAt=new Date().toISOString();const u=document.querySelector('#accessUpdated');if(u)u.textContent='Actualizado ahora';toast('✓ Accesos guardados y sincronizados');
}
async function renderAccess(){
 const host=document.querySelector('#appContent');if(!host)return;
 hideHost();
 try{properties=await getProperties();const stored=localStorage.getItem(SELECTED_KEY);selected=properties.some(p=>p.id===stored)?stored:properties[0]?.id||null;if(selected)localStorage.setItem(SELECTED_KEY,selected);await loadAccess(selected);host.innerHTML=renderMarkup();updatePreview();bind();}
 catch(err){console.error(err);toast('No se pudo cargar Accesos')}
 finally{showHost()}
}
function bind(){const root=document.querySelector('#'+ROOT_ID);if(!root)return;root.addEventListener('input',e=>{const k=e.target.dataset.accessField;if(!k)return;data[k]=e.target.value;updatePreview()});root.addEventListener('change',async e=>{if(e.target.id==='accessProperty'){hideHost();selected=e.target.value;localStorage.setItem(SELECTED_KEY,selected);await loadAccess(selected);document.querySelector('#appContent').innerHTML=renderMarkup();updatePreview();bind();showHost();return}const k=e.target.dataset.accessField;if(k){data[k]=e.target.value;if(k==='accessType'){document.querySelector('.access-code-wrap').style.display=(data.accessType==='Código'||data.accessType==='Cerradura inteligente')?'block':'none'}updatePreview()}});document.querySelector('#saveAccess')?.addEventListener('click',save)}
document.addEventListener('click',e=>{if(e.target.closest('[data-route="access"]')){hideHost();setTimeout(renderAccess,70)}},true);
if(document.readyState!=='loading'&&document.querySelector('[data-route="access"].active')){hideHost();setTimeout(renderAccess,70)}
})();