(()=>{'use strict';
const el=document.getElementById('page');
const safe=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;','"':'&#39;'}[c]));
const text=v=>safe(v).replace(/\n/g,'<br>');
const slug=new URLSearchParams(location.search).get('p')||'';
const cfg=window.URBAN_STAY_SUPABASE;
if(!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)||!cfg||!window.supabase){el.innerHTML='<div class="status">Esta página no está disponible.</div>';return}
const db=window.supabase.createClient(cfg.url,cfg.publishableKey);
function render(p){
 const pics=Array.isArray(p.photos)?p.photos:[],cover=pics[p.coverIndex||0]||pics[0]||'';
 const coverCss=typeof cover==='string'&&(/^(https:\/\/|data:image\/(?:jpeg|png|webp|gif);base64,)/i.test(cover))?'background-image:linear-gradient(#102c3d99,#102c3d99),url('+JSON.stringify(cover)+')':'';
 const amenities=Object.entries(p.amenities||{}).filter(([,v])=>v===true).map(([k])=>'<span class="chip">'+safe(k.replace(/([A-Z])/g,' $1'))+'</span>').join('');
 const manual=(Array.isArray(p.manualEvents)?p.manualEvents:[]).filter(x=>x&&x.active!==false&&(!x.date||new Date(x.date+'T23:59:59')>=new Date()));
 el.innerHTML='<section class="hero" id="guestHero"><p>'+safe(p.city||'')+'</p><h1>'+safe(p.name||'Urban Stay')+'</h1><p>Tu alojamiento, tu ciudad, tu experiencia</p></section>'+
 '<section class="card"><h2>Bienvenido</h2><p>'+text(p.welcome||'Disfruta de tu estancia.')+'</p></section>'+
 (amenities?'<section class="card"><h2>Equipamiento</h2>'+amenities+'</section>':'')+
 (p.restaurants?'<section class="card"><h2>Restaurantes</h2><p>'+text(p.restaurants)+'</p></section>':'')+
 (p.services?'<section class="card"><h2>Recomendaciones</h2><p>'+text(p.services)+'</p></section>':'')+
 (p.events?'<section class="card"><h2>Agenda</h2><p class="muted">'+safe(p.eventNotes||'Próximos eventos de la ciudad')+'</p><div id="guestEvents">'+manual.map(eventHtml).join('')+'</div></section>':'');
 if(coverCss)document.getElementById('guestHero').style.cssText=coverCss;
 if(p.events)loadCityEvents(p,manual);
}
function eventHtml(e){const url=typeof e.url==='string'&&/^https:\/\//i.test(e.url)?e.url:'';return '<div class="event"><b>'+safe(e.name||'Evento')+'</b><small>'+safe(e.date||'')+(e.venue?' · '+safe(e.venue):'')+'</small>'+(url?'<a target="_blank" rel="noopener noreferrer" href="'+safe(url)+'">Más información →</a>':'')+'</div>'}
async function loadCityEvents(p,manual){
 const target=document.getElementById('guestEvents');if(!target)return;
 try{
 const {data,error}=await db.functions.invoke('agenda-city',{body:{city:p.city,country:p.country}});
 if(error)throw error;
 const arr=Array.isArray(data)?data:Array.isArray(data?.events)?data.events:[];
 const seen=new Set();const events=[...manual,...arr].filter(e=>{const k=[e.name,e.date,e.venue].join('|').toLowerCase();if(seen.has(k))return false;seen.add(k);return true}).sort((a,b)=>String(a.date||'9999').localeCompare(String(b.date||'9999'))).slice(0,12);
 target.innerHTML=events.length?events.map(eventHtml).join(''):'<p class="muted">No hay eventos disponibles por el momento.</p>';
 }catch{if(!manual.length)target.innerHTML='<p class="muted">La agenda de la ciudad estará disponible próximamente.</p>'}
}
db.rpc('get_public_property',{requested_slug:slug}).then(({data,error})=>{if(error||!data){el.innerHTML='<div class="status"><h1>Página no disponible</h1><p>Este alojamiento no está publicado o todavía no está disponible.</p></div>';return}document.title=safe(data.name)+' · Urban Stay';render(data)}).catch(()=>{el.innerHTML='<div class="status">No se pudo cargar esta página.</div>'});
})();