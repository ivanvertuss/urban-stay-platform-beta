/* Urban Stay Guide - public guest data adapter.
   Never use service_role credentials or administrative table queries in a browser.
   The endpoint must enforce publication, property and geography scopes server-side. */
(function(){
"use strict";
const ROOT=document.documentElement;
const slug=ROOT.dataset.propertySlug||"el-almendro";
const endpoint=ROOT.dataset.publicApi||"";
const ids={agenda:"eventos",collaborators:"colaboradores",promotions:"promociones"};
const esc=s=>String(s??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
function setStatus(section,text){
 const host=document.getElementById(section);
 if(!host)return;
 let node=host.querySelector("[data-live-status]");
 if(!node){node=document.createElement("p");node.setAttribute("data-live-status","");host.append(node)}
 node.textContent=text;
}
function render(section,items){
 const host=document.getElementById(section);
 if(!host)return;
 const container=host.querySelector("[data-public-items]")||document.createElement("div");
 container.setAttribute("data-public-items","");
 container.className="preview-grid";
 container.innerHTML=items.map(item=>'<article class="guide-panel"><h3>'+esc(item.title)+'</h3><p>'+esc(item.description||"")+'</p>'+(item.url&&/^https:\/\//i.test(item.url)?'<a href="'+esc(item.url)+'" target="_blank" rel="noopener noreferrer">Más información ↗</a>':"")+'</article>').join("");
 host.append(container);
}
async function load(){
 if(!endpoint){Object.values(ids).forEach(id=>setStatus(id,"Vista de demostración: conexión con datos publicados pendiente."));return}
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
   setStatus(id,approved.length?"Contenidos publicados para Vigo.":"Sin contenidos publicados para esta propiedad.");
  }
 }catch(err){Object.values(ids).forEach(id=>setStatus(id,"No se han podido cargar los contenidos públicos. Consulta las fuentes oficiales o inténtalo más tarde."));console.warn("Guest public feed unavailable:",err.message)}
}
if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",load);else load();
})();