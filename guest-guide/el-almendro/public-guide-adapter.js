/* Urban Stay Guide - public guest data adapter.
   Never use service_role credentials or administrative table queries in a browser.
   The endpoint must enforce publication, property and geography scopes server-side. */
(function(){
"use strict";
const ROOT=document.documentElement;
const slug=ROOT.dataset.propertySlug||"el-almendro";
const endpoint=ROOT.dataset.publicApi||"";
const ids={agenda:"eventos",collaborators:"colaboradores",promotions:"promociones"};
const messages={
 es:{demo:"Vista de demostración: conexión con datos publicados pendiente.",loaded:"Contenidos publicados para Vigo.",empty:"Sin contenidos publicados para esta propiedad.",error:"No se han podido cargar los contenidos públicos. Consulta las fuentes oficiales o inténtalo más tarde.",more:"Más información ↗"},
 en:{demo:"Demo: connection to published data pending.",loaded:"Published content for Vigo.",empty:"No published content for this property.",error:"Public content is currently unavailable. Check official sources or try again later.",more:"More information ↗"},
 fr:{demo:"Démo : connexion aux données publiées en attente.",loaded:"Contenus publiés pour Vigo.",empty:"Aucun contenu publié pour ce logement.",error:"Le contenu public est indisponible. Consultez les sources officielles ou réessayez plus tard.",more:"Plus d'informations ↗"},
 pt:{demo:"Demonstração: ligação aos dados publicados pendente.",loaded:"Conteúdos publicados para Vigo.",empty:"Sem conteúdos publicados para este alojamento.",error:"Os conteúdos públicos estão indisponíveis. Consulte as fontes oficiais ou tente novamente.",more:"Mais informações ↗"},
 de:{demo:"Demo: Verbindung zu veröffentlichten Daten ausstehend.",loaded:"Veröffentlichte Inhalte für Vigo.",empty:"Keine veröffentlichten Inhalte für diese Unterkunft.",error:"Öffentliche Inhalte sind derzeit nicht verfügbar. Bitte offizielle Quellen prüfen oder später erneut versuchen.",more:"Mehr erfahren ↗"}
};
const msg=key=>(messages[ROOT.lang]||messages.es)[key];
const statuses=new Map();
function refreshLanguage(){for(const [section,key] of statuses)setStatus(section,key);for(const node of document.querySelectorAll("[data-more-link]"))node.textContent=msg("more")}
window.addEventListener("urbanstayguide:languagechange",refreshLanguage);
const esc=s=>String(s??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
function setStatus(section,key){
 statuses.set(section,key);
 const host=document.getElementById(section);
 if(!host)return;
 let node=host.querySelector("[data-live-status]");
 if(!node){node=document.createElement("p");node.setAttribute("data-live-status","");host.append(node)}
 node.textContent=msg(key);
}
function render(section,items){
 const host=document.getElementById(section);
 if(!host)return;
 const container=host.querySelector("[data-public-items]")||document.createElement("div");
 container.setAttribute("data-public-items","");
 container.className="preview-grid";
 container.innerHTML=items.map(item=>'<article class="guide-panel"><h3>'+esc(item.title)+'</h3><p>'+esc(item.description||"")+'</p>'+(item.url&&/^https:\/\//i.test(item.url)?'<a href="'+esc(item.url)+'" target="_blank" rel="noopener noreferrer" data-more-link>'+esc(msg("more"))+'</a>':"")+'</article>').join("");
 host.append(container);
}
async function load(){
 if(!endpoint){Object.values(ids).forEach(id=>setStatus(id,"demo"));return}
 if(!/^https:\/\//i.test(endpoint)){return}
 try{
  const u=new URL(endpoint);
  u.searchParams.set("property",slug);
  const response=await fetch(u.toString(),{method:"GET",credentials:"omit",cache:"no-store",headers:{"Accept":"application/json"}});
  if(!response.ok)throw new Error("HTTP "+response.status);
  const payload=await response.json();
  if(payload.property?.slug!==slug||payload.property?.city?.toLowerCase()!=="vigo")throw new Error("Property scope mismatch");
  for(const [key,id] of Object.entries(ids)){
   const items=payload[key];
   if(!Array.isArray(items))continue;
   const approved=items.filter(x=>x&&x.published===true&&x.active===true&&(!x.expiresAt||new Date(x.expiresAt).getTime()>=Date.now()));
   render(id,approved);
   refreshLanguage();
   setStatus(id,approved.length?"loaded":"empty");
  }
 }catch(err){Object.values(ids).forEach(id=>setStatus(id,"error"));console.warn("Guest public feed unavailable:",err.message)}
}
if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",load);else load();
})();