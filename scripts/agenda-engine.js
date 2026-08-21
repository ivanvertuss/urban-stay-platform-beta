(() => {
'use strict';

const TM_CONFIG_KEY='usp-ticketmaster-config';
const TM_CACHE_KEY='usp-ticketmaster-event-cache-v1';
const TM_REFRESH_MS=7*24*60*60*1000;
const TM_SIZE=12;
const $=(s,r=document)=>r.querySelector(s);
const $$=(s,r=document)=>Array.from(r.querySelectorAll(s));

const COUNTRY_CODES={
 'españa':'ES','espana':'ES','spain':'ES',
 'portugal':'PT','francia':'FR','france':'FR',
 'italia':'IT','italy':'IT','alemania':'DE','germany':'DE',
 'reino unido':'GB','united kingdom':'GB','uk':'GB'
};

function esc(v=''){
 return String(v).replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
}
function readJson(key,fallback){try{return JSON.parse(localStorage.getItem(key)||'')||fallback}catch{return fallback}}
function writeJson(key,value){localStorage.setItem(key,JSON.stringify(value))}
function config(){return readJson(TM_CONFIG_KEY,{apiKey:''})}
function cache(){return readJson(TM_CACHE_KEY,{})}
function setCache(v){writeJson(TM_CACHE_KEY,v)}
function cityKey(city,country){return `${String(city||'').trim().toLowerCase()}|${String(country||'').trim().toLowerCase()}`}
function countryCode(country=''){
 const n=country.trim().toLowerCase();
 return COUNTRY_CODES[n]||(/^[A-Za-z]{2}$/.test(country.trim())?country.trim().toUpperCase():'');
}
function parseCityCountry(p){
 const wd=p?.wizardData||{};
 if(wd.city) return {city:wd.city.trim(),country:(wd.country||'').trim()};
 const raw=String(p?.city||'').trim();
 if(!raw)return {city:'',country:''};
 const parts=raw.split(',').map(x=>x.trim()).filter(Boolean);
 return {city:parts[0]||'',country:parts.slice(1).join(', ')||''};
}
function properties(){
 const base=(window.URBAN_STAY_DATA?.properties||[]).map(x=>({...x}));
 const user=readJson('usp-v1-properties',[]);
 const map=new Map();
 [...base,...user].forEach(p=>map.set(p.id||p.name,p));
 return [...map.values()].filter(p=>parseCityCountry(p).city);
}
function isFutureEvent(e){
 const d=e?.date||'';
 if(!d)return true;
 const today=new Date();today.setHours(0,0,0,0);
 const when=new Date(`${d}T23:59:59`);
 return Number.isNaN(+when)||when>=today;
}
function cleanEvents(items=[]){
 const seen=new Set();
 return items.filter(isFutureEvent).filter(e=>{
  const k=`${e.name}|${e.date}|${e.venue}`.toLowerCase();
  if(seen.has(k))return false;seen.add(k);return true;
 }).sort((a,b)=>String(a.date).localeCompare(String(b.date))).slice(0,TM_SIZE);
}
function mapTicketmasterEvent(e){
 const venue=e?._embedded?.venues?.[0]||{};
 const image=(e.images||[]).sort((a,b)=>(b.width||0)-(a.width||0))[0]?.url||'';
 return {
  id:e.id||'',name:e.name||'Evento',date:e.dates?.start?.localDate||'',time:e.dates?.start?.localTime||'',
  venue:venue.name||'',city:venue.city?.name||'',url:e.url||'',image,
  category:e.classifications?.[0]?.segment?.name||'Evento',source:'Ticketmaster'
 };
}
async function fetchTicketmaster(city,country,{force=false}={}){
 const cfg=config();
 if(!cfg.apiKey)throw new Error('NO_API_KEY');
 const cc=countryCode(country);
 const key=cityKey(city,country);
 const all=cache();
 const existing=all[key];
 if(!force && existing && Date.now()-(existing.updatedAt||0)<TM_REFRESH_MS){
  existing.events=cleanEvents(existing.events||[]);all[key]=existing;setCache(all);return existing;
 }
 const params=new URLSearchParams({apikey:cfg.apiKey,city,sort:'date,asc',size:String(TM_SIZE),locale:'*'});
 if(cc)params.set('countryCode',cc);
 const now=new Date();params.set('startDateTime',now.toISOString().replace(/\.\d{3}Z$/,'Z'));
 const url=`https://app.ticketmaster.com/discovery/v2/events.json?${params}`;
 const res=await fetch(url,{headers:{Accept:'application/json'}});
 if(!res.ok)throw new Error(`Ticketmaster ${res.status}`);
 const json=await res.json();
 const events=cleanEvents((json?._embedded?.events||[]).map(mapTicketmasterEvent));
 const entry={city,country,updatedAt:Date.now(),events,source:'Ticketmaster'};
 all[key]=entry;setCache(all);return entry;
}
function cachedCity(city,country){
 const all=cache(),k=cityKey(city,country),entry=all[k];
 if(!entry)return null;
 entry.events=cleanEvents(entry.events||[]);all[k]=entry;setCache(all);return entry;
}
function formatDate(d){
 if(!d)return 'Fecha por confirmar';
 const x=new Date(`${d}T12:00:00`);if(Number.isNaN(+x))return d;
 return new Intl.DateTimeFormat('es-ES',{day:'2-digit',month:'short'}).format(x).replace('.','').toUpperCase();
}
function eventCards(events=[]){
 if(!events.length)return `<div class="usp-agenda-empty">No hay próximos eventos de Ticketmaster para esta ciudad en este momento.</div>`;
 return `<div class="usp-agenda-events">${events.slice(0,6).map(e=>`<a class="usp-agenda-event" href="${esc(e.url||'#')}" ${e.url?'target="_blank" rel="noopener"':''}>
  <span class="usp-agenda-date">${esc(formatDate(e.date))}</span><div><b>${esc(e.name)}</b><small>${esc([e.venue,e.city].filter(Boolean).join(' · '))}</small></div><em>${esc(e.category||'Evento')}</em>
 </a>`).join('')}</div>`;
}
function styleOnce(){
 if($('#uspAgendaStyles'))return;
 const s=document.createElement('style');s.id='uspAgendaStyles';s.textContent=`
 .usp-agenda-page{display:grid;gap:18px}.usp-agenda-hero{padding:24px;border:1px solid var(--line,#dfe6ea);border-radius:18px;background:linear-gradient(135deg,#071f34,#0d3b5b);color:#fff;display:flex;justify-content:space-between;gap:18px;align-items:center}.usp-agenda-hero h1{margin:6px 0 8px;font:600 32px Georgia,serif}.usp-agenda-hero p{margin:0;max-width:720px;color:#dbe7ef;line-height:1.55}.usp-agenda-badge{padding:9px 12px;border-radius:999px;background:rgba(212,175,55,.16);border:1px solid rgba(212,175,55,.45);color:#efd98e;font-size:11px;font-weight:900;white-space:nowrap}.usp-agenda-setup,.usp-agenda-property{padding:20px}.usp-agenda-setup h2,.usp-agenda-property h2{margin:0 0 8px}.usp-agenda-setup p,.usp-agenda-property p{color:var(--muted,#6d7b86)}.usp-agenda-keyrow{display:flex;gap:10px;align-items:end;flex-wrap:wrap}.usp-agenda-keyrow label{display:grid;gap:6px;flex:1;min-width:250px;font-size:11px;font-weight:800}.usp-agenda-keyrow input{border:1px solid var(--line,#dfe6ea);border-radius:10px;padding:11px 12px}.usp-agenda-property-head{display:flex;justify-content:space-between;align-items:start;gap:14px}.usp-agenda-property-head span{display:block;color:var(--muted,#6d7b86);font-size:11px;margin-top:4px}.usp-agenda-events{display:grid;gap:8px;margin-top:16px}.usp-agenda-event{display:grid;grid-template-columns:74px 1fr auto;gap:12px;align-items:center;padding:11px 12px;border:1px solid var(--line,#dfe6ea);border-radius:12px;text-decoration:none;color:inherit;background:#fff}.usp-agenda-event:hover{border-color:#cfae5b}.usp-agenda-date{font-size:10px;font-weight:900;color:#9a7828}.usp-agenda-event b,.usp-agenda-event small{display:block}.usp-agenda-event b{font-size:12px}.usp-agenda-event small{font-size:10px;color:var(--muted,#6d7b86);margin-top:3px}.usp-agenda-event em{font-size:9px;font-style:normal;padding:5px 7px;border-radius:999px;background:#f3f5f6;color:#52616c}.usp-agenda-meta{font-size:10px;color:var(--muted,#6d7b86);margin-top:10px}.usp-agenda-empty{padding:14px;margin-top:14px;background:#f6f8f9;border-radius:10px;color:var(--muted,#6d7b86);font-size:11px}.usp-agenda-live{margin-top:16px;padding:14px;border:1px solid #d8b66f;border-radius:13px;background:#fffaf0}.usp-agenda-live-head{display:flex;justify-content:space-between;gap:10px;align-items:center}.usp-agenda-live h4{margin:0}.usp-agenda-live p{margin:5px 0 0;color:#6d7b86;font-size:11px}.usp-agenda-mini{display:grid;gap:6px;margin-top:10px}.usp-agenda-mini span{display:flex;justify-content:space-between;gap:10px;font-size:10px;padding:7px 8px;background:#fff;border-radius:8px}.usp-agenda-mini b{font-weight:800}.usp-agenda-mini em{font-style:normal;color:#8a6c28}
 @media(max-width:720px){.usp-agenda-hero{align-items:flex-start;flex-direction:column}.usp-agenda-event{grid-template-columns:62px 1fr}.usp-agenda-event em{display:none}.usp-agenda-property-head{flex-direction:column}}
 `;document.head.appendChild(s);
}
function renderAgendaRoute(){
 const content=$('#appContent');if(!content)return;
 const agendaBtn=$('[data-route="agenda"]');
 if(!agendaBtn?.classList.contains('active'))return;
 styleOnce();
 const cfg=config(),props=properties();
 content.innerHTML=`<section class="page usp-agenda-page">
 <div class="usp-agenda-hero"><div><span class="section-label">AGENDA DINÁMICA</span><h1>Eventos por ciudad</h1><p>Cada propiedad utiliza su propia ciudad. Urban Stay consulta los próximos eventos, elimina automáticamente los que ya han pasado y renueva la agenda semanalmente.</p></div><span class="usp-agenda-badge">Ticketmaster · actualización 7 días</span></div>
 ${!cfg.apiKey?`<article class="card usp-agenda-setup"><div class="section-label">ACTIVACIÓN ÚNICA</div><h2>Conecta Ticketmaster</h2><p>Introduce una vez tu Consumer Key de Ticketmaster. Se guardará únicamente en este navegador de administración y no se escribe en el repositorio.</p><div class="usp-agenda-keyrow"><label>Ticketmaster Consumer Key<input type="password" id="uspTicketmasterKey" autocomplete="off" placeholder="Pega aquí tu API key"></label><button class="btn primary" id="uspSaveTicketmaster">Guardar y activar</button></div></article>`:''}
 <div id="uspAgendaProperties">${props.length?props.map(p=>agendaPropertyCard(p)).join(''):`<article class="card usp-agenda-property"><h2>Aún no hay propiedades con ciudad</h2><p>Cuando un propietario dé de alta un alojamiento, su ciudad aparecerá aquí automáticamente.</p></article>`}</div>
 </section>`;
 bindAgendaRoute();
}
function agendaPropertyCard(p){
 const {city,country}=parseCityCountry(p);const entry=cachedCity(city,country);const age=entry?.updatedAt?new Date(entry.updatedAt).toLocaleString('es-ES'):'Pendiente';
 return `<article class="card usp-agenda-property" data-agenda-property="${esc(p.id||p.name)}"><div class="usp-agenda-property-head"><div><h2>${esc(p.name||'Alojamiento')}</h2><span>📍 ${esc([city,country].filter(Boolean).join(', '))}</span></div><button class="btn secondary usp-refresh-city" data-city="${esc(city)}" data-country="${esc(country)}">Actualizar eventos</button></div>
 ${entry?eventCards(entry.events):`<div class="usp-agenda-empty">Agenda todavía no consultada para ${esc(city)}.</div>`}<div class="usp-agenda-meta">Última actualización: ${esc(age)} · Los eventos pasados se eliminan automáticamente.</div></article>`;
}
function bindAgendaRoute(){
 $('#uspSaveTicketmaster')?.addEventListener('click',async()=>{
  const input=$('#uspTicketmasterKey'),key=input?.value.trim();if(!key)return;
  writeJson(TM_CONFIG_KEY,{apiKey:key});
  renderAgendaRoute();await refreshAllCities(true);
 });
 $$('.usp-refresh-city').forEach(b=>b.addEventListener('click',async()=>{
  b.disabled=true;b.textContent='Actualizando…';
  try{await fetchTicketmaster(b.dataset.city,b.dataset.country,{force:true});renderAgendaRoute()}
  catch(e){b.disabled=false;b.textContent='Reintentar';alert(e.message==='NO_API_KEY'?'Conecta primero Ticketmaster.':`No se pudo actualizar Ticketmaster: ${e.message}`)}
 }));
}
async function refreshAllCities(force=false){
 if(!config().apiKey)return;
 const unique=new Map();properties().forEach(p=>{const x=parseCityCountry(p);unique.set(cityKey(x.city,x.country),x)});
 for(const x of unique.values()){
  try{await fetchTicketmaster(x.city,x.country,{force})}catch(e){console.warn('Urban Stay Agenda:',x.city,e)}
 }
 renderAgendaRoute();augmentWizardAgenda();
}
function augmentWizardAgenda(){
 const box=$('#wizardStepContent'),title=$('#wizardStepTitle');if(!box||!title||!/^Agenda$/i.test(title.textContent.trim()))return;
 if($('#uspAgendaLive'))return;
 const d=readJson('usp-v1-draft',{}),city=(d.city||'').trim(),country=(d.country||'').trim();
 const holder=document.createElement('div');holder.id='uspAgendaLive';holder.className='usp-agenda-live';
 if(!city){holder.innerHTML=`<div class="usp-agenda-live-head"><h4>Agenda automática</h4></div><p>Cuando indiques la ciudad en Datos básicos, Urban Stay preparará automáticamente los eventos de ese destino.</p>`;box.appendChild(holder);return}
 const entry=cachedCity(city,country),cfg=config();
 holder.innerHTML=`<div class="usp-agenda-live-head"><div><h4>Agenda automática de ${esc(city)}</h4><p>Los eventos se actualizarán por la ciudad de esta propiedad y los caducados se eliminarán solos.</p></div><span class="usp-agenda-badge">AUTO</span></div>
 ${!cfg.apiKey?`<p><b>Ticketmaster pendiente de activar en el módulo Agenda del Dashboard.</b></p>`:entry?.events?.length?`<div class="usp-agenda-mini">${entry.events.slice(0,4).map(e=>`<span><b>${esc(e.name)}</b><em>${esc(formatDate(e.date))}</em></span>`).join('')}</div>`:`<p>La agenda se cargará automáticamente al guardar/publicar la propiedad.</p>`}`;
 box.appendChild(holder);
 if(cfg.apiKey && !entry)fetchTicketmaster(city,country).then(()=>{holder.remove();augmentWizardAgenda()}).catch(()=>{});
}
function observe(){
 document.addEventListener('click',e=>{
  const route=e.target.closest?.('[data-route="agenda"]');if(route)setTimeout(renderAgendaRoute,30);
 });
 const mo=new MutationObserver(()=>{
  if($('[data-route="agenda"]')?.classList.contains('active'))setTimeout(renderAgendaRoute,0);
  augmentWizardAgenda();
 });
 const start=()=>{
  const app=$('#appContent'),wizard=$('#wizardStepContent');
  if(app)mo.observe(app,{childList:true,subtree:false});
  if(wizard)mo.observe(wizard,{childList:true,subtree:true});
  augmentWizardAgenda();
 };
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start);else start();
}
function weeklyRefresh(){
 if(!config().apiKey)return;
 const all=cache();
 Object.keys(all).forEach(k=>{all[k].events=cleanEvents(all[k].events||[])});setCache(all);
 const stale=Object.values(all).some(x=>Date.now()-(x.updatedAt||0)>=TM_REFRESH_MS);
 if(stale||properties().some(p=>!cachedCity(parseCityCountry(p).city,parseCityCountry(p).country)))refreshAllCities(false);
}

styleOnce();observe();
setTimeout(weeklyRefresh,1200);
window.URBAN_STAY_AGENDA={refreshAll:()=>refreshAllCities(true),clearTicketmaster:()=>{localStorage.removeItem(TM_CONFIG_KEY);localStorage.removeItem(TM_CACHE_KEY);renderAgendaRoute()}};
})();
