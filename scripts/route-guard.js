(() => {
'use strict';
const ADMIN_ROUTES=new Set(['dashboard','guide','access','discover','agenda','urban-partners','lab','settings','moderation']);
function isAdminMode(){return new URLSearchParams(location.search).get('admin')==='1'}
function isManagedRoute(route){return route==='access'||route==='guide'||route==='discover'||route==='partners'||route==='urban-partners'}
function applyRoleNavigation(){
 const admin=isAdminMode();
 document.querySelectorAll('.admin-only-nav').forEach(x=>{x.hidden=!admin;x.style.setProperty('display',admin?'':'none','important')});
 document.querySelectorAll('.owner-nav-hide').forEach(x=>{x.hidden=!admin;x.style.setProperty('display',admin?'':'none','important')});
 if(!admin){
  document.querySelectorAll('[data-route]').forEach(x=>{if(ADMIN_ROUTES.has(x.dataset.route)&&x.dataset.route!=='properties')x.setAttribute('aria-hidden','true')});
  const current=activeRoute();
  if(current!=='properties'){
   document.querySelectorAll('.nav').forEach(x=>x.classList.toggle('active',x.dataset.route==='properties'));
   const properties=document.querySelector('.nav[data-route="properties"]');if(properties)properties.click();
  }
 }
}
function activeRoute(){return document.querySelector('.nav.active')?.dataset?.route||''}
function guard(){
 const host=document.querySelector('#appContent');
 if(!host)return;
 const route=activeRoute();
 const legacy=host.textContent?.includes('Módulo preparado en la nueva arquitectura v1.0 RC.')||host.textContent?.includes('Esta versión se centra en estabilizar cuenta, alta de propiedad y vista previa.');
 if(isManagedRoute(route)&&legacy){host.style.visibility='hidden'}
}
function releaseWhenReady(){
 const host=document.querySelector('#appContent');if(!host)return;
 const route=activeRoute();
 if(route==='access'&&document.querySelector('#accessManagerRoot'))host.style.visibility='visible';
 if(route==='guide'&&document.querySelector('.usp-guide'))host.style.visibility='visible';
 if(route==='discover'&&document.querySelector('#discoverManagerRoot'))host.style.visibility='visible';
 if(route==='partners'&&document.querySelector('.usp-partners-page'))host.style.visibility='visible';
 if(route==='urban-partners'&&document.querySelector('.usp-urban-admin-page'))host.style.visibility='visible';
}
document.addEventListener('DOMContentLoaded',()=>{
 const host=document.querySelector('#appContent');if(!host)return;
 const obs=new MutationObserver(()=>{guard();releaseWhenReady()});
 obs.observe(host,{childList:true,subtree:true,characterData:true});
 applyRoleNavigation();
 guard();
});
document.addEventListener('click',e=>{
 const nav=e.target.closest?.('[data-route]');if(!nav)return;
 if(!isAdminMode()&&ADMIN_ROUTES.has(nav.dataset.route)&&nav.dataset.route!=='properties'){e.preventDefault();e.stopImmediatePropagation();return}
 if(isManagedRoute(nav.dataset.route)){
  const host=document.querySelector('#appContent');if(host)host.style.visibility='hidden';
 }
},true);
})();