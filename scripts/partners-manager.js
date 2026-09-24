(() => {
'use strict';

const DB=window.URBAN_STAY_DB||null;
const $=(s,r=document)=>r.querySelector(s);
const $$=(s,r=document)=>Array.from(r.querySelectorAll(s));
const esc=(v='')=>String(v).replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
let selectedPropertyId=null;
let busy=false;

function readProps(){try{return JSON.parse(localStorage.getItem('usp-v1-properties')||'[]')}catch{return []}}
async function getProperties(){
 if(!DB)return readProps();
 const {data:auth,error:authError}=await DB.auth.getUser();
 if(authError)throw authError;
 const userId=auth?.user?.id;
 if(!userId)return [];
 const {data:rows,error}=await DB.from('properties').select('id,owner_id,name,city,country,address').eq('owner_id',userId).order('created_at',{ascending:false});
 if(error)throw error;
 return rows||[];
}
function locationOf(p){
 const w=p?.wizardData||{};
 if(w.city)return {city:w.city||'',region:w.region||'',country:w.country||''};
 const parts=String(p?.city||'').split(',').map(x=>x.trim());
 return {city:parts[0]||'',region:'',country:parts.slice(1).join(', ')||''};
}
function styleOnce(){
 if($('#uspPartnerStyles'))return;
 const s=document.createElement('style');s.id='uspPartnerStyles';s.textContent=`
 .usp-partners-page{display:grid;gap:18px}.usp-partners-hero{padding:24px;border:1px solid var(--line,#dfe6ea);border-radius:18px;background:linear-gradient(135deg,#071f34,#0d3b5b);color:#fff;display:flex;justify-content:space-between;gap:18px;align-items:center}.usp-partners-hero h1{margin:6px 0 8px;font:600 32px Georgia,serif}.usp-partners-hero p{margin:0;max-width:760px;color:#dbe7ef;line-height:1.55}.usp-ai-badge{padding:9px 12px;border-radius:999px;background:rgba(212,175,55,.16);border:1px solid rgba(212,175,55,.45);color:#efd98e;font-size:11px;font-weight:900;white-space:nowrap}.usp-partner-toolbar{padding:18px;display:flex;justify-content:space-between;align-items:end;gap:14px}.usp-partner-toolbar label{display:grid;gap:6px;min-width:260px;font-size:11px;font-weight:800}.usp-partner-toolbar select,.usp-partner-form input{border:1px solid var(--line,#dfe6ea);border-radius:10px;padding:11px 12px;background:#fff}.usp-partner-form{padding:20px}.usp-partner-form h2,.usp-partner-section h2{margin:0 0 7px}.usp-partner-form p,.usp-partner-section p{color:var(--muted,#6d7b86)}.usp-partner-fields{display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-top:15px}.usp-partner-fields label{display:grid;gap:6px;font-size:11px;font-weight:800}.usp-partner-fields .wide{grid-column:1/-1}.usp-partner-form-actions{display:flex;justify-content:flex-end;margin-top:14px}.usp-partner-section{padding:20px}.usp-partner-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:12px;margin-top:14px}.usp-partner-card{border:1px solid var(--line,#dfe6ea);border-radius:14px;padding:15px;background:#fff}.usp-partner-card.off{opacity:.58}.usp-partner-card-head{display:flex;justify-content:space-between;gap:10px}.usp-partner-card h3{margin:0 0 4px}.usp-partner-card small{color:var(--muted,#6d7b86)}.usp-promo{margin:12px 0;padding:10px;border-radius:10px;background:#fff8e8;color:#72591f;font-weight:800;font-size:12px}.usp-partner-actions{display:flex;gap:8px;flex-wrap:wrap}.usp-partner-actions button{border:1px solid var(--line,#dfe6ea);background:#fff;border-radius:9px;padding:8px 10px;cursor:pointer;font-weight:800;font-size:10px}.usp-partner-actions .danger{color:#a33}.usp-urban-card{border-color:#d8b66f}.usp-urban-label{font-size:9px;font-weight:900;color:#9a7828;letter-spacing:.08em}.usp-empty{padding:14px;background:#f6f8f9;border-radius:10px;color:var(--muted,#6d7b86);font-size:11px}
 @media(max-width:720px){.usp-partners-hero,.usp-partner-toolbar{align-items:flex-start;flex-direction:column}.usp-partner-fields,.usp-partner-grid{grid-template-columns:1fr}.usp-partner-fields .wide{grid-column:auto}.usp-partner-toolbar label{min-width:100%;width:100%}}
 `;document.head.appendChild(s);
}
async function getUser(){if(!DB)return null;const {data,error}=await DB.auth.getUser();if(error)throw error;return data?.user||null}
async function enrichPartner(place,property){
 const {data,error}=await DB.functions.invoke('enrich-place',{body:{property:{name:property?.name||'',city:property?.city||'',country:property?.country||'',address:property?.address||''},place:{name:place.name,city:place.city}}});
 if(error)throw error;
 return data||{};
}
async function loadRows(propertyId){
 if(!DB)return [];
 const {data,error}=await DB.from('property_collaborators').select('*').eq('property_id',propertyId).order('created_at',{ascending:false});
 if(error)throw error;
 return data||[];
}
function mineCard(x){
 return `<article class="usp-partner-card ${x.is_active?'':'off'}"><div class="usp-partner-card-head"><div><h3>${esc(x.name)}</h3><small>${esc(x.category||x.city||'Colaborador')}</small></div><span>${x.is_active?'● Activo':'○ Inactivo'}</span></div>${x.promotion?`<div class="usp-promo">🎁 ${esc(x.promotion)}</div>`:''}<div class="usp-partner-actions"><button data-partner-toggle="${x.id}" data-next="${x.is_active?'false':'true'}">${x.is_active?'Desactivar':'Activar'}</button><button data-partner-edit="${x.id}" data-promo="${esc(x.promotion||'')}">Editar promoción</button><button class="danger" data-partner-delete="${x.id}">Eliminar</button></div></article>`;
}

async function renderPartnersRoute(){
 const content=$('#appContent');if(!content||!$('[data-route="partners"]')?.classList.contains('active'))return;
 styleOnce();
 let props=[];
 try{props=await getProperties()}catch(e){console.error('Partners properties:',e);props=readProps()}
 if(!selectedPropertyId||!props.some(p=>String(p.id)===String(selectedPropertyId)))selectedPropertyId=props[0]?.id||null;
 const selected=props.find(p=>String(p.id)===String(selectedPropertyId));
 content.innerHTML=`<section class="page usp-partners-page"><div class="usp-partners-hero"><div><span class="section-label">COLABORADORES</span><h1>Ventajas para tus huéspedes</h1><p>Añade solo el negocio, la ciudad y la oferta. Urban Stay deja preparada la ficha para completar el resto automáticamente.</p></div><span class="usp-ai-badge">✨ Preparado para IA</span></div>
 ${props.length?`<article class="card usp-partner-toolbar"><label>Propiedad<select id="uspPartnerProperty">${props.map(p=>`<option value="${esc(p.id)}" ${String(p.id)===String(selectedPropertyId)?'selected':''}>${esc(p.name)}</option>`).join('')}</select></label><span>Colaboradores de esta propiedad</span></article>
 <article class="card usp-partner-form"><div class="section-label">AÑADIR COLABORADOR</div><h2>Tú dinos quién es y qué ofrece.</h2><p>Urban Stay buscará el negocio y completará automáticamente su ficha con IA antes de guardarlo.</p><div class="usp-partner-fields"><label>Nombre del negocio<input id="uspPartnerName" placeholder="Ej. Casa Moncho"></label><label>Ciudad<input id="uspPartnerCity" value="${esc(locationOf(selected).city)}" placeholder="Ej. Vigo"></label><label class="wide">Promoción o ventaja<input id="uspPartnerPromo" placeholder="Ej. 10% de descuento para huéspedes"></label></div><div class="usp-partner-form-actions"><button class="btn primary" id="uspPartnerCreate">✨ Crear colaborador</button></div></article>
 <article class="card usp-partner-section"><div class="section-label">MIS COLABORADORES</div><h2>Seleccionados por ti</h2><div id="uspMinePartners"><div class="usp-empty">Cargando colaboradores…</div></div></article>
`:`<article class="card usp-partner-section"><h2>Primero crea una propiedad</h2><p>Cuando tengas un alojamiento, podrás añadir colaboradores y recibir automáticamente las Ventajas Urban Stay de su zona.</p></article>`}</section>`;
 if(!props.length)return;
 bindBase();
 try{
  const rows=await loadRows(selectedPropertyId);
  $('#uspMinePartners').innerHTML=rows.length?`<div class="usp-partner-grid">${rows.map(mineCard).join('')}</div>`:'<div class="usp-empty">Todavía no has añadido colaboradores a esta propiedad.</div>';
  bindRowActions();
 }catch(e){
  console.error('Urban Stay Partners:',e);
  const msg='<div class="usp-empty">No se pudieron cargar los colaboradores. Comprueba la sesión y vuelve a intentarlo.</div>';
  if($('#uspMinePartners'))$('#uspMinePartners').innerHTML=msg;
 }
}
function bindBase(){
 $('#uspPartnerProperty')?.addEventListener('change',e=>{selectedPropertyId=e.target.value;renderPartnersRoute()});
 $('#uspPartnerCreate')?.addEventListener('click',async()=>{
  if(busy)return;
  const name=$('#uspPartnerName')?.value.trim(),city=$('#uspPartnerCity')?.value.trim(),promotion=$('#uspPartnerPromo')?.value.trim();
  if(!name||!city){alert('Indica al menos el nombre del negocio y la ciudad.');return}
  let user;try{user=await getUser()}catch(e){console.error(e)}
  if(!user){alert('Tu sesión ha caducado. Vuelve a iniciar sesión.');return}
  busy=true;const b=$('#uspPartnerCreate');if(b){b.disabled=true;b.textContent='✨ Buscando y completando con IA…'}
  try{
   const props=await getProperties();
   const property=props.find(p=>String(p.id)===String(selectedPropertyId));
   if(!property)throw new Error('property_not_found');
   const ai=await enrichPartner({name,city},property);
   if(b)b.textContent='Guardando colaborador…';
   const distanceText=String(ai.distance||'');
   const metersMatch=distanceText.match(/(\d+(?:[.,]\d+)?)\s*(km|m)\b/i);
   let distanceMeters=null;
   if(metersMatch){const n=Number(metersMatch[1].replace(',','.'));distanceMeters=metersMatch[2].toLowerCase()==='km'?Math.round(n*1000):Math.round(n)}
   const payload={
    property_id:selectedPropertyId,owner_id:user.id,
    name:ai.name||name,city:ai.city||city,promotion:promotion||null,
    category:ai.type||null,description:ai.description||null,address:ai.address||null,
    website:ai.website||null,image_url:ai.imageUrl||null,distance_meters:distanceMeters,
    enrichment_status:'completed',is_active:true
   };
   const {error}=await DB.from('property_collaborators').insert(payload);
   if(error)throw error;
   await renderPartnersRoute();
  }catch(e){
   console.error('Create collaborator:',e);
   const detail=e?.message||e?.context?.message||e?.error_description||String(e||'Error desconocido');
   alert('No se pudo crear el colaborador.\n\nDetalle técnico: '+detail);
  }finally{busy=false;if(b&&document.body.contains(b)){b.disabled=false;b.textContent='✨ Crear colaborador'}}
 
 });
}
function bindRowActions(){
 $$('[data-partner-toggle]').forEach(b=>b.onclick=async()=>{const {error}=await DB.from('property_collaborators').update({is_active:b.dataset.next==='true',updated_at:new Date().toISOString()}).eq('id',b.dataset.partnerToggle);if(error)alert('No se pudo actualizar.');else renderPartnersRoute()});
 $$('[data-partner-delete]').forEach(b=>b.onclick=async()=>{if(!confirm('¿Eliminar este colaborador?'))return;const {error}=await DB.from('property_collaborators').delete().eq('id',b.dataset.partnerDelete);if(error)alert('No se pudo eliminar.');else renderPartnersRoute()});
 $$('[data-partner-edit]').forEach(b=>b.onclick=async()=>{const promotion=prompt('Promoción o ventaja para los huéspedes:',b.dataset.promo||'');if(promotion===null)return;const {error}=await DB.from('property_collaborators').update({promotion:promotion.trim()||null,updated_at:new Date().toISOString()}).eq('id',b.dataset.partnerEdit);if(error)alert('No se pudo actualizar la promoción.');else renderPartnersRoute()});
}
function observe(){
 document.addEventListener('click',e=>{if(e.target.closest?.('[data-route="partners"]'))setTimeout(renderPartnersRoute,30)});
 let queued=false;const mo=new MutationObserver(()=>{if($('[data-route="partners"]')?.classList.contains('active')&&!$('.usp-partners-page')&&!queued){queued=true;setTimeout(()=>{queued=false;renderPartnersRoute()},0)}});
 const start=()=>{const app=$('#appContent');if(app)mo.observe(app,{childList:true,subtree:false})};
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start);else start();
}
styleOnce();observe();
window.URBAN_STAY_PARTNERS={render:renderPartnersRoute};
})();