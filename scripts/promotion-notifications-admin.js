(()=>{'use strict';
const db=window.URBAN_STAY_DB;
const escapeHtml=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
async function render(){
 const page=document.querySelector('.usp-urban-admin-page');
 if(!page||document.querySelector('#uspPromotionAlerts'))return;
 const section=document.createElement('article');section.className='card';section.style.padding='20px';
 section.innerHTML='<h2>Avisos de promociones</h2><p>Altas y cambios realizados por propietarios.</p><div id="uspPromotionAlerts">Cargando avisos…</div>';
 page.appendChild(section);
 const box=section.querySelector('#uspPromotionAlerts');
 try{
  const {data:user}=await db.auth.getUser();
  if(!user?.user)throw Error('Inicia sesión');
  const {data:profile,error:pe}=await db.from('profiles').select('role,account_status').eq('id',user.user.id).single();
  if(pe||profile?.role!=='admin'||profile?.account_status!=='approved')throw Error('Acceso solo para administración');
  const {data:alerts,error}=await db.from('property_collaborator_notifications').select('id,collaborator_id,event_type,created_at,is_read').order('created_at',{ascending:false}).limit(30);
  if(error)throw error;
  const ids=[...new Set((alerts||[]).map(x=>x.collaborator_id))];
  const {data:partners,error:partnerError}=ids.length?await db.from('property_collaborators').select('id,name,promotion,guest_publication_enabled,moderation_status,moderation_reason').in('id',ids):{data:[],error:null};
  if(partnerError)throw partnerError;
  const lookup=new Map((partners||[]).map(x=>[x.id,x]));
  box.innerHTML=(alerts||[]).map(a=>{const p=lookup.get(a.collaborator_id);return '<div class="usp-urban-admin-card"><strong>'+escapeHtml(p?.name||'Colaborador eliminado')+'</strong>'+(p?.moderation_status==='needs_review'?'<p><strong>Revisión requerida:</strong> '+escapeHtml(p.moderation_reason||'Contenido señalado')+'</p>':'')+'<p>'+escapeHtml(p?.promotion||'')+'</p><small>'+escapeHtml(a.event_type)+' · '+escapeHtml(new Date(a.created_at).toLocaleString('es-ES'))+'</small><div class="usp-urban-actions">'+(p&&p.guest_publication_enabled?'<button data-hide="'+escapeHtml(p.id)+'">Ocultar de la guía</button>':'')+(p?.moderation_status==='needs_review'?'<button data-moderate="'+escapeHtml(p.id)+'" data-allow="true">Aprobar</button><button data-moderate="'+escapeHtml(p.id)+'" data-allow="false">Rechazar</button>':'')+(!a.is_read?'<button data-read="'+a.id+'">Marcar revisada</button>':'Revisada')+'</div></div>'}).join('')||'Sin avisos pendientes.';
  box.querySelectorAll('[data-moderate]').forEach(b=>b.onclick=async()=>{const allow=b.dataset.allow==='true';if(!confirm(allow?'¿Aprobar publicación?':'¿Rechazar esta promoción?'))return;const {error}=await db.rpc('review_property_collaborator',{p_id:b.dataset.moderate,p_approve:allow});if(error)alert(error.message);else{section.remove();render()}});
  box.querySelectorAll('[data-read]').forEach(b=>b.onclick=async()=>{const {error}=await db.from('property_collaborator_notifications').update({is_read:true}).eq('id',b.dataset.read);if(error)alert(error.message);else{section.remove();render()}});
  box.querySelectorAll('[data-hide]').forEach(b=>b.onclick=async()=>{if(!confirm('¿Ocultar esta promoción de la guía?'))return;const {error}=await db.from('property_collaborators').update({guest_publication_enabled:false}).eq('id',b.dataset.hide);if(error)alert(error.message);else{section.remove();render()}});
 }catch(e){box.textContent='No se pudieron cargar los avisos: '+e.message}
}
window.URBAN_STAY_PROMOTION_NOTICES={render};
new MutationObserver(()=>{if(document.querySelector('.usp-urban-admin-page'))render()}).observe(document.body,{childList:true,subtree:true});
})();