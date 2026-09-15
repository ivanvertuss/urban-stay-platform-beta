(() => {
'use strict';

const CFG=window.URBAN_STAY_SUPABASE||null;
const DB=CFG&&window.supabase?.createClient?window.supabase.createClient(CFG.url,CFG.publishableKey):null;
const button=document.getElementById('notificationButton');
if(!button)return;

let currentUser=null;
let notifications=[];
let panel=null;
let open=false;

function esc(v=''){return String(v).replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]))}
function readKey(){return `usp-notifications-read-${currentUser?.id||'anon'}`}
function getRead(){try{return new Set(JSON.parse(localStorage.getItem(readKey())||'[]'))}catch{return new Set()}}
function setRead(set){localStorage.setItem(readKey(),JSON.stringify([...set]))}
function unreadCount(){const read=getRead();return notifications.filter(n=>!read.has(n.id)).length}
function formatDate(value){if(!value)return '';const d=new Date(value);if(Number.isNaN(d.getTime()))return '';return d.toLocaleString('es-ES',{day:'2-digit',month:'2-digit',hour:'2-digit',minute:'2-digit'})}
function icon(type){return type==='approved'?'✓':type==='published'?'↗':'!'}

function ensureStyles(){
 if(document.getElementById('uspNotificationStyles'))return;
 const s=document.createElement('style');
 s.id='uspNotificationStyles';
 s.textContent=`
#notificationButton{position:relative}.usp-notification-panel{position:fixed;z-index:9999;width:min(390px,calc(100vw - 24px));max-height:min(560px,calc(100vh - 110px));overflow:hidden;background:#fff;border:1px solid #dfe7ec;border-radius:18px;box-shadow:0 18px 50px rgba(8,35,54,.18);display:none}.usp-notification-panel.open{display:block}.usp-notification-head{display:flex;align-items:center;justify-content:space-between;padding:18px 18px 13px;border-bottom:1px solid #edf1f4}.usp-notification-head h3{margin:0;font:700 21px Georgia,serif;color:#0b2b40}.usp-notification-head button{border:0;background:transparent;color:#607485;font-weight:700;cursor:pointer}.usp-notification-list{max-height:430px;overflow:auto}.usp-notification-item{width:100%;display:grid;grid-template-columns:38px 1fr 9px;gap:11px;text-align:left;padding:14px 18px;border:0;border-bottom:1px solid #edf1f4;background:#fff;cursor:pointer;color:#102638}.usp-notification-item:hover{background:#f7fafb}.usp-notification-item.unread{background:#fbfcf7}.usp-notification-icon{width:38px;height:38px;border-radius:11px;background:#eef4f7;display:grid;place-items:center;font-weight:900;color:#0b3853}.usp-notification-copy b{display:block;font-size:14px;margin-bottom:3px}.usp-notification-copy span{display:block;color:#5e7281;font-size:12px;line-height:1.4}.usp-notification-copy small{display:block;color:#8a9aa6;font-size:10px;margin-top:6px}.usp-notification-dot{width:8px;height:8px;border-radius:50%;background:#d94747;margin-top:8px}.usp-notification-item:not(.unread) .usp-notification-dot{visibility:hidden}.usp-notification-empty{padding:32px 22px;text-align:center;color:#6b7b88}.usp-notification-empty b{display:block;color:#183347;margin-bottom:5px}.usp-notification-foot{display:flex;gap:8px;justify-content:space-between;padding:12px 14px;background:#f8fafb}.usp-notification-foot button{border:1px solid #dbe4e9;background:#fff;border-radius:10px;padding:9px 11px;font-weight:800;color:#17364a;cursor:pointer}.usp-notification-foot button:hover{background:#f0f5f7}#notificationButton em[hidden]{display:none!important}
`;
 document.head.appendChild(s);
}

function ensurePanel(){
 if(panel)return panel;
 panel=document.createElement('section');
 panel.className='usp-notification-panel';
 panel.id='uspNotificationPanel';
 panel.setAttribute('aria-label','Notificaciones');
 document.body.appendChild(panel);
 return panel;
}

function positionPanel(){
 if(!panel)return;
 const r=button.getBoundingClientRect();
 const width=Math.min(390,window.innerWidth-24);
 let left=r.right-width;
 left=Math.max(12,Math.min(left,window.innerWidth-width-12));
 panel.style.left=`${left}px`;
 panel.style.top=`${Math.min(r.bottom+10,window.innerHeight-120)}px`;
}

function renderBadge(){
 const badge=button.querySelector('em');
 if(!badge)return;
 const count=unreadCount();
 badge.textContent=count>99?'99+':String(count);
 badge.hidden=count===0;
 button.setAttribute('aria-label',count?`Notificaciones, ${count} sin leer`:'Notificaciones, ninguna sin leer');
}

function renderPanel(){
 ensurePanel();
 const read=getRead();
 const rows=notifications.length?notifications.map(n=>`<button type="button" class="usp-notification-item ${read.has(n.id)?'':'unread'}" data-notification-id="${esc(n.id)}" data-route-target="${esc(n.route||'')}"><span class="usp-notification-icon">${icon(n.type)}</span><span class="usp-notification-copy"><b>${esc(n.title)}</b><span>${esc(n.message)}</span>${n.date?`<small>${esc(formatDate(n.date))}</small>`:''}</span><i class="usp-notification-dot"></i></button>`).join(''):`<div class="usp-notification-empty"><b>Todo al día</b><span>No tienes avisos pendientes.</span></div>`;
 panel.innerHTML=`<div class="usp-notification-head"><h3>Notificaciones</h3><button type="button" id="uspNotificationClose">Cerrar</button></div><div class="usp-notification-list">${rows}</div><div class="usp-notification-foot"><button type="button" id="uspNotificationRefresh">Actualizar</button><button type="button" id="uspNotificationReadAll">Marcar todo como leído</button></div>`;
 panel.querySelector('#uspNotificationClose')?.addEventListener('click',closePanel);
 panel.querySelector('#uspNotificationRefresh')?.addEventListener('click',refresh);
 panel.querySelector('#uspNotificationReadAll')?.addEventListener('click',()=>{const all=new Set(notifications.map(n=>n.id));setRead(all);renderBadge();renderPanel()});
 panel.querySelectorAll('[data-notification-id]').forEach(item=>item.addEventListener('click',()=>{
  const readNow=getRead();readNow.add(item.dataset.notificationId);setRead(readNow);renderBadge();
  const route=item.dataset.routeTarget;if(route){document.querySelector(`[data-route="${route}"]`)?.click();closePanel()}else renderPanel();
 }));
 renderBadge();
}

async function loadNotifications(){
 notifications=[];
 if(!DB){renderBadge();return}
 try{
  const {data:{user},error:userError}=await DB.auth.getUser();
  if(userError||!user){currentUser=null;renderBadge();return}
  currentUser=user;
  const {data:properties,error:propertyError}=await DB.from('properties').select('id,name,status,review_status,reviewed_at,updated_at').eq('owner_id',user.id).order('created_at',{ascending:false});
  if(propertyError)throw propertyError;
  const list=properties||[];
  const ids=list.map(p=>p.id);
  let contents=[];
  if(ids.length){
   const {data,error}=await DB.from('property_content').select('property_id,content,updated_at').in('property_id',ids);
   if(error)throw error;
   contents=data||[];
  }
  const contentMap=new Map(contents.map(c=>[String(c.property_id),c]));
  for(const p of list){
   const name=p.name||'Tu propiedad';
   if(p.review_status==='approved')notifications.push({id:`approved:${p.id}`,type:'approved',title:'Propiedad aprobada',message:`${name} ha sido aprobada por Urban Stay.`,date:p.reviewed_at||p.updated_at,route:'properties'});
   const content=contentMap.get(String(p.id))?.content;
   const published=content?.guideBuilder?.published;
   if(published)notifications.push({id:`published:${p.id}:${published.publishedAt||'1'}`,type:'published',title:'Guía publicada',message:`La guía de ${name} ya tiene una versión publicada.`,date:published.publishedAt||contentMap.get(String(p.id))?.updated_at,route:'guide'});
   if(p.review_status==='approved'&&p.status!=='active')notifications.push({id:`activate:${p.id}`,type:'action',title:'Acción pendiente',message:`${name} está aprobada. Puedes activarla cuando quieras.`,date:p.updated_at,route:'properties'});
  }
  notifications.sort((a,b)=>new Date(b.date||0)-new Date(a.date||0));
 }catch(e){console.warn('Urban Stay notifications load failed',e)}
 renderBadge();
}

async function refresh(){await loadNotifications();if(open)renderPanel()}
function openPanel(){open=true;renderPanel();positionPanel();panel.classList.add('open');button.setAttribute('aria-expanded','true')}
function closePanel(){open=false;panel?.classList.remove('open');button.setAttribute('aria-expanded','false')}

ensureStyles();
ensurePanel();
button.setAttribute('aria-haspopup','dialog');
button.setAttribute('aria-expanded','false');
button.addEventListener('click',e=>{e.preventDefault();e.stopPropagation();open?closePanel():openPanel()});
document.addEventListener('click',e=>{if(open&&!panel.contains(e.target)&&!button.contains(e.target))closePanel()});
document.addEventListener('keydown',e=>{if(e.key==='Escape')closePanel()});
window.addEventListener('resize',()=>{if(open)positionPanel()});
window.addEventListener('scroll',()=>{if(open)positionPanel()},{passive:true});
document.addEventListener('visibilitychange',()=>{if(!document.hidden)refresh()});
window.addEventListener('focus',refresh);
setTimeout(refresh,500);
})();