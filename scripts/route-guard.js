(() => {
'use strict';
function isManagedRoute(route){return route==='access'||route==='guide'||route==='discover'}
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
}
document.addEventListener('DOMContentLoaded',()=>{
 const host=document.querySelector('#appContent');if(!host)return;
 const obs=new MutationObserver(()=>{guard();releaseWhenReady()});
 obs.observe(host,{childList:true,subtree:true,characterData:true});
 guard();
});
document.addEventListener('click',e=>{
 const nav=e.target.closest?.('[data-route]');if(!nav)return;
 if(isManagedRoute(nav.dataset.route)){
  const host=document.querySelector('#appContent');if(host)host.style.visibility='hidden';
 }
},true);
})();