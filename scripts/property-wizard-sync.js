(() => {
'use strict';
const CFG=window.URBAN_STAY_SUPABASE||null;
const DB=CFG&&window.supabase?.createClient?window.supabase.createClient(CFG.url,CFG.publishableKey):null;
const PROPS_KEY='usp-v1-properties';
const ACCESS_TYPES=['Llaves','Código','Cerradura inteligente','Recepción','Otro'];
let bypass=false;
let latestContent=null;
let latestPropertyId=null;
function readProps(){try{return JSON.parse(localStorage.getItem(PROPS_KEY)||'[]')}catch{return []}}
function writeProps(v){localStorage.setItem(PROPS_KEY,JSON.stringify(v))}
function canonicalAccessType(type){return ({'Caja de llaves':'Código','Smart Lock':'Cerradura inteligente','Cerradura Inteligente':'Cerradura inteligente'})[type]||type||'Llaves'}
function normalizeForWizard(content={}){
 const access=content.access||{};
 return {...content,wifiName:access.wifiName??content.wifiName??'',wifiPassword:access.wifiPassword??content.wifiPassword??'',accessType:canonicalAccessType(access.accessType??content.accessType??'Llaves'),accessNotes:access.accessInstructions??content.accessNotes??''};
}
async function syncProperty(id){
 if(!DB||!id)return null;
 latestPropertyId=id;
 const {data:row,error}=await DB.from('property_content').select('content').eq('property_id',id).maybeSingle();if(error)throw error;if(!row?.content)return null;
 latestContent=normalizeForWizard(row.content);
 const props=readProps(),idx=props.findIndex(p=>String(p.id)===String(id));
 if(idx>=0){props[idx]={...props[idx],wizardData:latestContent,updated:new Date().toLocaleDateString('es-ES')};writeProps(props)}
 return latestContent;
}
function patchAccessStep(content){
 const dlg=document.querySelector('#propertyWizard');if(!dlg?.open||!content)return;
 const select=dlg.querySelector('select[data-bind="accessType"]');
 if(!select)return;
 const wanted=canonicalAccessType(content.access?.accessType??content.accessType);
 const current=canonicalAccessType(select.value);
 select.innerHTML=ACCESS_TYPES.map(x=>`<option value="${x}">${x}</option>`).join('');
 select.value=ACCESS_TYPES.includes(wanted)?wanted:(ACCESS_TYPES.includes(current)?current:'Llaves');
}
function patchWizardPreview(content){
 const dlg=document.querySelector('#propertyWizard');if(!dlg?.open||!content)return;
 patchAccessStep(content);
 const guide=content.guideBuilder?.published||content.guideBuilder?.draft||null,access=content.access||{},sections=[...dlg.querySelectorAll('.guest-section')];
 if(guide){
  const welcomeSection=sections.find(s=>s.querySelector('h2')?.textContent.trim()==='Bienvenido');
  if(welcomeSection&&guide.welcome){const p=welcomeSection.querySelector('p');if(p)p.textContent=guide.welcome}
  let info=dlg.querySelector('.usp-wizard-guide-sync');
  if(!info){info=document.createElement('div');info.className='guest-section usp-wizard-guide-sync';const anchor=welcomeSection||sections[0];anchor?.insertAdjacentElement('afterend',info)}
  const times=[guide.checkin&&`Entrada: ${guide.checkin}`,guide.checkout&&`Salida: ${guide.checkout}`].filter(Boolean).join(' · ');
  info.innerHTML=`<h3>Guía del huésped</h3>${times?`<p>${times}</p>`:''}${guide.houseRules?`<p><b>Normas:</b> ${guide.houseRules}</p>`:''}${guide.notes?`<p>${guide.notes}</p>`:''}`;
 }
 const wifiSection=sections.find(s=>s.querySelector('h3')?.textContent.trim()==='WiFi');
 if(wifiSection&&(access.wifiName||content.wifiName)){const p=wifiSection.querySelector('p');if(p)p.innerHTML=`Red: <b>${access.wifiName||content.wifiName}</b>`}
}
function benefitsEsc(v=''){return String(v).replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]))}
async function patchPropertyBenefits(propertyId){
 const dlg=document.querySelector('#propertyWizard'),panel=dlg?.querySelector('#propertyBenefitsPanel');if(!panel||!DB||!propertyId)return;
 try{
  const {data,error}=await DB.from('property_collaborators').select('*').eq('property_id',propertyId).order('created_at',{ascending:false});if(error)throw error;
  const rows=data||[];
  panel.innerHTML=`<article class="card" style="padding:16px;margin-bottom:14px"><div class="section-label">AÑADIR COLABORADOR</div><p style="margin:5px 0 12px">Indica el negocio y la promoción. Urban Stay completará su ficha con IA.</p><div class="form-grid wizard-form"><div class="field"><label>Nombre del negocio</label><input id="propertyBenefitName" placeholder="Ej. Casa Moncho"></div><div class="field"><label>Ciudad</label><input id="propertyBenefitCity" placeholder="Ej. Vigo"></div><div class="field full"><label>Promoción o ventaja</label><input id="propertyBenefitPromo" placeholder="Ej. 10% de descuento para huéspedes"></div></div><div style="display:flex;justify-content:flex-end;margin-top:12px"><button type="button" class="btn primary" id="propertyBenefitCreate">✨ Añadir colaborador</button></div></article><div class="ai-prep-note"><b>🎁 Ventajas para tus huéspedes</b><span>Solo las promociones activas aparecen en la guía.</span></div><div style="display:grid;gap:10px;margin-top:14px">${rows.length?rows.map(x=>`<article class="card" style="padding:14px;opacity:${x.is_active?1:.58}"><div style="display:flex;justify-content:space-between"><div><b>${benefitsEsc(x.name||'Colaborador')}</b><small style="display:block">${benefitsEsc(x.category||x.city||'Colaborador')}</small></div><small>${x.is_active?'● Activo':'○ Inactivo'}</small></div>${x.promotion?`<strong style="display:block;margin-top:7px">🎁 ${benefitsEsc(x.promotion)}</strong>`:''}<div style="display:flex;gap:8px;flex-wrap:wrap;margin-top:12px"><button type="button" class="btn secondary" data-pb-toggle="${x.id}" data-next="${x.is_active?'false':'true'}">${x.is_active?'Desactivar':'Activar'}</button><button type="button" class="btn secondary" data-pb-edit="${x.id}" data-promo="${benefitsEsc(x.promotion||'')}">Editar promoción</button><button type="button" class="btn secondary" data-pb-delete="${x.id}">Eliminar</button></div></article>`).join(''):'<article class="card" style="padding:14px"><b>Aún no hay promociones</b><p style="margin:6px 0 0">Añade el primer colaborador de esta propiedad.</p></article>'}</div>`;
  const cityInput=panel.querySelector('#propertyBenefitCity');if(cityInput&&!cityInput.value){const p=readProps().find(x=>String(x.id)===String(propertyId));cityInput.value=String(p?.wizardData?.city||p?.city||'').split(',')[0].trim()}
  panel.querySelector('#propertyBenefitCreate')?.addEventListener('click',async()=>{
   const name=panel.querySelector('#propertyBenefitName')?.value.trim(),city=cityInput?.value.trim(),promotion=panel.querySelector('#propertyBenefitPromo')?.value.trim();if(!name||!city){alert('Indica al menos el nombre del negocio y la ciudad.');return}
   const btn=panel.querySelector('#propertyBenefitCreate');btn.disabled=true;btn.textContent='✨ Buscando y completando con IA…';
   try{
    const {data:auth,error:ae}=await DB.auth.getUser();if(ae)throw ae;if(!auth?.user)throw new Error('Tu sesión ha caducado.');
    const p=readProps().find(x=>String(x.id)===String(propertyId))||{};
    const {data:ai,error:ie}=await DB.functions.invoke('enrich-place',{body:{property:{name:p.name||'',city, country:p.wizardData?.country||'',address:p.wizardData?.address||''},place:{name,city}}});if(ie)throw ie;
    const distanceText=String(ai?.distance||''),m=distanceText.match(/(\d+(?:[.,]\d+)?)\s*(km|m)\b/i);let distanceMeters=null;if(m){const n=Number(m[1].replace(',','.'));distanceMeters=m[2].toLowerCase()==='km'?Math.round(n*1000):Math.round(n)}
    const payload={property_id:propertyId,owner_id:auth.user.id,name:ai?.name||name,city:ai?.city||city,promotion:promotion||null,category:ai?.type||null,description:ai?.description||null,address:ai?.address||null,website:ai?.website||null,image_url:ai?.imageUrl||null,distance_meters:distanceMeters,enrichment_status:'completed',is_active:true};
    const {error}=await DB.from('property_collaborators').insert(payload);if(error)throw error;await patchPropertyBenefits(propertyId);
   }catch(err){console.error(err);alert('No se pudo crear el colaborador.\n\nDetalle técnico: '+(err?.message||String(err)))}finally{if(btn?.isConnected){btn.disabled=false;btn.textContent='✨ Añadir colaborador'}}
  });
  panel.querySelectorAll('[data-pb-toggle]').forEach(b=>b.onclick=async()=>{const {error}=await DB.from('property_collaborators').update({is_active:b.dataset.next==='true',updated_at:new Date().toISOString()}).eq('id',b.dataset.pbToggle);if(error)alert('No se pudo actualizar.');else patchPropertyBenefits(propertyId)});
  panel.querySelectorAll('[data-pb-edit]').forEach(b=>b.onclick=async()=>{const promotion=prompt('Promoción o ventaja para los huéspedes:',b.dataset.promo||'');if(promotion===null)return;const {error}=await DB.from('property_collaborators').update({promotion:promotion.trim()||null,updated_at:new Date().toISOString()}).eq('id',b.dataset.pbEdit);if(error)alert('No se pudo actualizar.');else patchPropertyBenefits(propertyId)});
  panel.querySelectorAll('[data-pb-delete]').forEach(b=>b.onclick=async()=>{if(!confirm('¿Eliminar este colaborador?'))return;const {error}=await DB.from('property_collaborators').delete().eq('id',b.dataset.pbDelete);if(error)alert('No se pudo eliminar.');else patchPropertyBenefits(propertyId)});
 }catch(err){console.warn('Urban Stay property benefits sync failed',err);panel.innerHTML='<div class="ai-prep-note"><b>No se pudieron cargar las promociones</b><span>Vuelve a intentarlo en unos segundos.</span></div>'}
}
function patchRepeatedly(content){[0,50,120,250,500].forEach(ms=>setTimeout(()=>{patchWizardPreview(content);const active=[...document.querySelectorAll('[data-jump]')].find(x=>x.classList.contains('active'));if(active?.textContent.includes('Sugerencias y promociones'))patchPropertyBenefits(latestPropertyId)},ms))}
document.addEventListener('click',async e=>{
 const trigger=e.target.closest?.('[data-open-property]');if(!trigger||bypass)return;const id=trigger.dataset.openProperty;if(!id)return;
 e.preventDefault();e.stopImmediatePropagation();let content=null;
 try{content=await syncProperty(id)}catch(err){console.warn('Urban Stay wizard sync failed',err)}
 bypass=true;try{trigger.click()}finally{setTimeout(()=>{bypass=false},0)}
 if(content)patchRepeatedly(content);
},true);
document.addEventListener('click',e=>{if(!latestContent)return;if(e.target.closest?.('#wizardNext,#wizardBack,[data-step],[data-jump]'))patchRepeatedly(latestContent)},false);
})();