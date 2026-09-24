(() => {
'use strict';
const $=(s,r=document)=>r.querySelector(s);
const $$=(s,r=document)=>Array.from(r.querySelectorAll(s));
const KEY='usp-v1-properties';
const SELECTED='usp-guide-selected-property';
const GUIDE_KEY=id=>`usp-guide-${id}`;
const CFG=window.URBAN_STAY_SUPABASE||null;
const DB=CFG&&window.supabase?.createClient?window.supabase.createClient(CFG.url,CFG.publishableKey):null;
let serverProps=[];
let guestBenefits=[];
function readJson(k,f){try{return JSON.parse(localStorage.getItem(k)||'')||f}catch{return f}}
function writeJson(k,v){localStorage.setItem(k,JSON.stringify(v))}
function localProps(){return readJson(KEY,[]).filter(p=>!p.isDemo)}
function props(){return serverProps.length?serverProps:localProps()}
function activeProps(){return props().filter(p=>p.reviewStatus==='approved'||['active','approved','inactive'].includes(p.status))}
function emptyGuide(){return {welcome:'',houseRules:'',checkin:'',checkout:'',contact:'',notes:'',published:false,updatedAt:null}}
function guideData(id){return readJson(GUIDE_KEY(id),emptyGuide())}
function saveGuide(id,data){writeJson(GUIDE_KEY(id),data)}
function esc(v=''){return String(v).replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]))}
function propName(p){return p?.name||p?.wizardData?.name||'Propiedad'}
function propCity(p){return p?.cityLabel||p?.city||p?.wizardData?.city||''}
function norm(v=''){return String(v||'').trim().toLocaleLowerCase('es')}
function propLocation(p){
 const wd=p?.wizardData||{};
 const rawCity=wd.city||p?.city||'';
 const city=String(rawCity).split(',')[0].trim();
 const country=wd.country||p?.country||String(rawCity).split(',').slice(1).join(',').trim();
 const region=wd.region||p?.region||'';
 return {city,region,country};
}
function urbanApplies(x,loc){
 const type=x.partner_type||'local';
 if(type==='global')return true;
 if(type==='national')return !!loc.country&&norm(x.country)===norm(loc.country);
 if(type==='regional')return !!loc.region&&!!loc.country&&norm(x.region)===norm(loc.region)&&norm(x.country)===norm(loc.country);
 return !!loc.city&&!!loc.country&&norm(x.city)===norm(loc.city)&&norm(x.country)===norm(loc.country);
}
function propCover(p){const wd=p?.wizardData||{};return wd.photos?.[wd.coverIndex||0]||wd.photos?.[0]||''}
function current(){const list=activeProps();let id=localStorage.getItem(SELECTED);let p=list.find(x=>String(x.id)===String(id));if(!p&&list[0]){p=list[0];localStorage.setItem(SELECTED,p.id)}return p||null}
async function loadGuideProperties(){if(!DB)return;try{const {data:{user},error:userError}=await DB.auth.getUser();if(userError||!user)return;const {data,error}=await DB.from('properties').select('*').eq('owner_id',user.id).order('created_at',{ascending:false});if(error)throw error;const localMap=new Map(localProps().map(p=>[String(p.id),p]));serverProps=(data||[]).map(row=>{const old=localMap.get(String(row.id))||{};const uiStatus=row.review_status==='approved'?(old.status==='active'||old.status==='inactive'?old.status:'approved'):(row.review_status==='rejected'?'changes_requested':'pending_review');return {...old,...row,id:row.id,name:row.name,city:row.city||'',cityLabel:[row.city,row.country].filter(Boolean).join(', '),country:row.country||'',region:row.region||old.region||old.wizardData?.region||'',status:uiStatus,reviewStatus:row.review_status||'pending',updatedAt:row.updated_at||old.updatedAt}})}catch(e){console.warn('Urban Stay guide property load failed',e);serverProps=[]}}
function style(){if($('#uspGuideBuilderStyle'))return;const s=document.createElement('style');s.id='uspGuideBuilderStyle';s.textContent=`#appContent,.usp-guide,.usp-guide *{pointer-events:auto!important}.usp-guide{position:relative;z-index:5;display:grid;gap:18px}.usp-guide input,.usp-guide textarea,.usp-guide select,.usp-guide button{position:relative;z-index:20!important;pointer-events:auto!important}.usp-guide-head{display:flex;justify-content:space-between;gap:18px;align-items:flex-start}.usp-guide-head h1{margin:5px 0 6px;font:600 38px Georgia,serif}.usp-guide-head p{margin:0;color:#6b7b88}.usp-guide-select{display:grid;gap:6px;min-width:260px}.usp-guide-select label{font-size:11px;font-weight:800;color:#7b6b45}.usp-guide-select select{padding:12px 14px;border:1px solid #dbe3e8;border-radius:12px;background:#fff;font:inherit}.usp-guide-grid{display:grid;grid-template-columns:minmax(0,1.1fr) minmax(320px,.9fr);gap:18px}.usp-guide-editor,.usp-guide-preview{padding:22px}.usp-guide-editor h2,.usp-guide-preview h2{margin:0 0 14px}.usp-guide-fields{display:grid;gap:14px}.usp-guide-fields label{display:grid;gap:7px;font-size:12px;font-weight:800}.usp-guide-fields input,.usp-guide-fields textarea{width:100%;box-sizing:border-box;border:1px solid #dbe3e8;border-radius:12px;padding:12px 14px;font:inherit;background:#fff;color:#102638}.usp-guide-fields textarea{min-height:92px;resize:vertical}.usp-guide-actions{display:flex;gap:10px;justify-content:flex-end;margin-top:16px}.usp-guide-preview-card{overflow:hidden;border:1px solid #e1e7eb;border-radius:18px;background:#fff}.usp-guide-cover{min-height:180px;background:linear-gradient(135deg,#0a2e45,#164f6f);background-size:cover;background-position:center;display:flex;align-items:flex-end;padding:22px;color:#fff}.usp-guide-cover h3{margin:0;font:600 34px Georgia,serif}.usp-guide-cover span{display:block;font-size:12px;margin-bottom:6px;letter-spacing:.08em}.usp-guide-preview-body{padding:18px;display:grid;gap:12px}.usp-guide-preview-body article{padding:14px;border-radius:12px;background:#f7f9fb}.usp-guide-preview-body b{display:block;margin-bottom:5px}.usp-guide-benefit-list{display:grid;gap:9px;margin-top:9px}.usp-guide-benefit{display:grid;gap:4px;padding:11px;border-radius:10px;background:#fff;border:1px solid #e5e9ec}.usp-guide-benefit small{color:#6b7b88}.usp-guide-benefit em{font-style:normal;font-weight:800;color:#7b5b18}.usp-guide-benefit span{font-size:12px;color:#526473}.usp-guide-status{display:inline-flex;gap:6px;align-items:center;padding:7px 10px;border-radius:999px;font-size:11px;font-weight:800;background:#eef3f7}.usp-guide-status.published{background:#eef8f1;color:#1c7b4b}.usp-guide-empty{padding:38px;text-align:center}.usp-guide-empty h2{margin:0 0 8px}.usp-guide-empty p{color:#6b7b88}.usp-guide-toolbar{display:flex;justify-content:space-between;gap:12px;align-items:center;margin-bottom:14px}.usp-guide-published-note{font-size:11px;color:#6b7b88}.usp-guide-flash{margin-top:12px;padding:10px 12px;border-radius:10px;background:#eef8f1;color:#1c7b4b;font-size:12px;font-weight:800}.usp-guide-flash.error{background:#fff1f0;color:#b42318}@media(max-width:900px){.usp-guide-grid{grid-template-columns:1fr}.usp-guide-head{flex-direction:column}.usp-guide-select{width:100%}}`;document.head.appendChild(s)}
function renderBenefits(){
 if(!guestBenefits.length)return '<article><b>✨ Sugerencias y promociones</b><span>Las ventajas para tus huéspedes aparecerán aquí automáticamente.</span></article>';
 return `<article class="usp-guide-benefits"><b>✨ Sugerencias y promociones</b><div class="usp-guide-benefit-list">${guestBenefits.map(x=>`<div class="usp-guide-benefit"><strong>${esc(x.name)}</strong>${x.category?`<small>${esc(x.category)}${x.source==='urban'?` · Ventaja Urban Stay`:''}</small>`:''}${x.promotion?`<em>🎁 ${esc(x.promotion)}</em>`:''}${x.description?`<span>${esc(x.description)}</span>`:''}</div>`).join('')}</div></article>`;
}
async function loadBenefits(propertyId){
 guestBenefits=[];
 if(!DB||!propertyId)return;
 try{
  const property=props().find(p=>String(p.id)===String(propertyId));
  const loc=propLocation(property);
  const [ownRes,urbanRes]=await Promise.all([
   DB.from('property_collaborators').select('id,name,category,promotion,description,address,website,image_url,distance_meters,is_active').eq('property_id',propertyId).eq('is_active',true).order('created_at',{ascending:false}),
   DB.from('urban_stay_partners').select('id,name,category,promotion,description,partner_type,city,region,country,is_active').eq('is_active',true).order('created_at',{ascending:false})
  ]);
  if(ownRes.error)throw ownRes.error;
  if(urbanRes.error)throw urbanRes.error;
  const own=(ownRes.data||[]).map(x=>({...x,source:'property'}));
  const urban=(urbanRes.data||[]).filter(x=>urbanApplies(x,loc)).map(x=>({...x,source:'urban'}));
  guestBenefits=[...own,...urban];
 }catch(e){console.warn('Urban Stay guest benefits load failed',e)}
}
function renderPreview(p,g){const cover=propCover(p);return `<div class="usp-guide-preview-card"><div class="usp-guide-cover" ${cover?`style="background-image:linear-gradient(rgba(0,0,0,.25),rgba(0,0,0,.45)),url('${cover}')"`:''}><div><span>URBAN STAY GUIDE</span><h3>${esc(propName(p))}</h3><small>${esc(propCity(p))}</small></div></div><div class="usp-guide-preview-body"><article><b>Bienvenida</b><span>${esc(g.welcome||'Añade un mensaje de bienvenida para tus huéspedes.')}</span></article><article><b>Check-in / Check-out</b><span>${esc([g.checkin&&`Entrada: ${g.checkin}`,g.checkout&&`Salida: ${g.checkout}`].filter(Boolean).join(' · ')||'Todavía sin horarios.')}</span></article><article><b>Normas de la casa</b><span>${esc(g.houseRules||'Todavía sin normas añadidas.')}</span></article><article><b>Información adicional</b><span>${esc(g.notes||'Puedes añadir recomendaciones o indicaciones útiles.')}</span></article>${renderBenefits()}</div></div>`}
function renderGuide(){const c=$('#appContent');if(!c)return;style();const list=activeProps();if(!list.length){c.innerHTML=`<section class="page usp-guide"><div class="usp-guide-empty card"><h2>No hay propiedades disponibles para crear una guía</h2><p>Primero necesitas una propiedad aprobada por Urban Stay.</p></div></section>`;return}const p=current();const g=guideData(p.id);c.innerHTML=`<section class="page usp-guide"><div class="usp-guide-head"><div><span class="section-label">CONSTRUCTOR DE GUÍA</span><h1>Guía del alojamiento</h1><p>Cada propiedad tiene su propia guía independiente para huéspedes.</p></div><div class="usp-guide-select"><label>Propiedad</label><select id="uspGuideProperty">${list.map(x=>`<option value="${esc(x.id)}" ${String(x.id)===String(p.id)?'selected':''}>${esc(propName(x))}</option>`).join('')}</select></div></div><div class="usp-guide-grid"><article class="card usp-guide-editor"><div class="usp-guide-toolbar"><div><h2>Contenido de la guía</h2><span class="usp-guide-status ${g.published?'published':''}">${g.published?'● Publicada':'● Borrador'}</span></div><span class="usp-guide-published-note">${g.updatedAt?'Actualizada '+new Date(g.updatedAt).toLocaleString('es-ES'):''}</span></div><div class="usp-guide-fields"><label>Mensaje de bienvenida<textarea id="uspWelcome" placeholder="Ej. Bienvenidos a El almendro. Esperamos que disfrutéis vuestra estancia.">${esc(g.welcome||'')}</textarea></label><label>Check-in<input id="uspCheckin" value="${esc(g.checkin||'')}" placeholder="Ej. 16:00"></label><label>Check-out<input id="uspCheckout" value="${esc(g.checkout||'')}" placeholder="Ej. 12:00"></label><label>Normas de la casa<textarea id="uspRules" placeholder="Ruido, mascotas, fumar, etc.">${esc(g.houseRules||'')}</textarea></label><label>Contacto o asistencia<input id="uspContact" value="${esc(g.contact||'')}" placeholder="Opcional"></label><label>Información adicional<textarea id="uspNotes" placeholder="Recomendaciones, instrucciones, observaciones...">${esc(g.notes||'')}</textarea></label></div><div id="uspGuideFlash"></div><div class="usp-guide-actions"><button type="button" class="btn secondary" id="uspGuideSave">Guardar borrador</button><button type="button" class="btn primary" id="uspGuidePublish">${g.published?'Actualizar guía':'Publicar guía'}</button></div></article><article class="card usp-guide-preview"><h2>Vista del huésped</h2><div id="uspGuidePreview">${renderPreview(p,g)}</div></article></div></section>`;bindGuide()}
function collect(g){return {...g,welcome:$('#uspWelcome')?.value.trim()||'',checkin:$('#uspCheckin')?.value.trim()||'',checkout:$('#uspCheckout')?.value.trim()||'',houseRules:$('#uspRules')?.value.trim()||'',contact:$('#uspContact')?.value.trim()||'',notes:$('#uspNotes')?.value.trim()||'',updatedAt:new Date().toISOString()}}
function flash(text,isError=false){const el=$('#uspGuideFlash');if(!el)return;el.className='usp-guide-flash'+(isError?' error':'');el.textContent=text;setTimeout(()=>{const cur=$('#uspGuideFlash');if(cur){cur.className='';cur.textContent=''}},3200)}
async function readServerContent(propertyId){if(!DB)return null;const {data,error}=await DB.from('property_content').select('id,content,updated_at').eq('property_id',propertyId).maybeSingle();if(error)throw error;return data||null}
async function hydrateFromServer(propertyId,{rerender=true}={}){if(!DB||!propertyId)return;try{const row=await readServerContent(propertyId);const remote=row?.content?.guideBuilder?.draft;if(!remote)return;saveGuide(propertyId,{...emptyGuide(),...remote});if(rerender&&String(current()?.id)===String(propertyId))renderGuide()}catch(e){console.warn('Urban Stay guide sync read failed',e)}}
async function writeServerGuide(propertyId,guide,published){
 if(!DB)throw new Error('Supabase no disponible');
 const row=await readServerContent(propertyId);
 const existing=row?.content&&typeof row.content==='object'?row.content:{};
 const currentBuilder=existing.guideBuilder&&typeof existing.guideBuilder==='object'?existing.guideBuilder:{};
 const nextBuilder={...currentBuilder,draft:guide};
 if(published)nextBuilder.published={...guide,published:true,publishedAt:new Date().toISOString()};
 const nextContent={...existing,guideBuilder:nextBuilder};
 let result;
 if(row?.id){result=await DB.from('property_content').update({content:nextContent}).eq('id',row.id).select('content').single()}
 else{result=await DB.from('property_content').insert({property_id:propertyId,content:nextContent}).select('content').single()}
 if(result.error)throw result.error;
 const saved=result.data?.content?.guideBuilder?.draft;
 if(!saved||saved.welcome!==guide.welcome||saved.updatedAt!==guide.updatedAt)throw new Error('Supabase no confirmó el contenido guardado');
 return saved;
}
async function persist(published){const p=current();if(!p)return;const btn=published?$('#uspGuidePublish'):$('#uspGuideSave');if(btn)btn.disabled=true;const g=collect(guideData(p.id));const localGuide={...g,published};saveGuide(p.id,localGuide);try{await writeServerGuide(p.id,localGuide,published);flash(published?'✓ Guía publicada y verificada en Urban Stay':'✓ Borrador guardado y verificado en Urban Stay');if(published)setTimeout(renderGuide,300)}catch(e){console.error('Urban Stay guide sync write failed',e);flash('No se pudo verificar el guardado en Urban Stay. La copia local se conserva.',true)}finally{if(btn)btn.disabled=false}}
function bindGuide(){$('#uspGuideProperty')?.addEventListener('change',async e=>{localStorage.setItem(SELECTED,e.target.value);await loadBenefits(e.target.value);renderGuide();await hydrateFromServer(e.target.value)});const refresh=()=>{const p=current(),holder=$('#uspGuidePreview');if(!p||!holder)return;holder.innerHTML=renderPreview(p,collect(guideData(p.id)))};$$('#uspWelcome,#uspCheckin,#uspCheckout,#uspRules,#uspContact,#uspNotes').forEach(el=>el.addEventListener('input',refresh))}
window.addEventListener('click',e=>{const save=e.target.closest?.('#uspGuideSave');const publish=e.target.closest?.('#uspGuidePublish');if(!save&&!publish)return;e.preventDefault();e.stopImmediatePropagation();persist(!!publish)},true);
async function openGuide(){await loadGuideProperties();const p=current();if(p)await loadBenefits(p.id);renderGuide();if(p)await hydrateFromServer(p.id)}
function shouldRender(){return $('[data-route="guide"]')?.classList.contains('active')}
document.addEventListener('click',e=>{if(e.target.closest?.('[data-route="guide"]'))setTimeout(openGuide,120)});
document.addEventListener('DOMContentLoaded',()=>{if(shouldRender())setTimeout(openGuide,120)});
})();