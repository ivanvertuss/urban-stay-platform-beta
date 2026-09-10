(() => {
'use strict';
const CFG=window.URBAN_STAY_SUPABASE||null;
const DB=CFG&&window.supabase?.createClient?window.supabase.createClient(CFG.url,CFG.publishableKey):null;
const STORAGE_KEY='usp-v1-properties';
const SYNC_FLAG='usp-review-sync-reloaded';

function readProps(){try{return JSON.parse(localStorage.getItem(STORAGE_KEY)||'[]')}catch{return []}}
function writeProps(v){localStorage.setItem(STORAGE_KEY,JSON.stringify(v))}
function mapReviewToUi(status){
  if(status==='approved') return 'approved';
  if(status==='rejected') return 'changes_requested';
  return 'pending_review';
}
function addReviewMessages(){
  const props=readProps();
  if(!props.length)return;
  document.querySelectorAll('.property-mini[data-open-property]').forEach(card=>{
    const id=card.getAttribute('data-open-property');
    const p=props.find(x=>String(x.id)===String(id));
    if(!p||!p.reviewStatus)return;
    const data=card.querySelector('.property-data');
    if(!data||data.querySelector('.usp-review-message'))return;
    const box=document.createElement('div');
    box.className='usp-review-message usp-review-message--'+p.reviewStatus;
    if(p.reviewStatus==='approved'){
      box.innerHTML='<b>✓ Aprobada por Urban Stay</b><span>Esta propiedad ya puede activarse y gestionarse con normalidad.</span>';
    }else if(p.reviewStatus==='rejected'){
      box.innerHTML='<b>Cambios solicitados por Urban Stay</b><span>'+(p.reviewNote||'Revisa la información de la propiedad y vuelve a enviarla cuando esté corregida.')+'</span>';
    }else{
      box.innerHTML='<b>Pendiente de revisión</b><span>Urban Stay está revisando esta propiedad. Tus demás alojamientos siguen disponibles.</span>';
    }
    data.appendChild(box);
  });
}
function injectStyles(){
  if(document.getElementById('uspReviewSyncStyles'))return;
  const s=document.createElement('style');
  s.id='uspReviewSyncStyles';
  s.textContent='.usp-review-message{margin-top:14px;padding:12px 14px;border-radius:12px;background:#f6f8fa;border:1px solid #e1e7eb;display:grid;gap:4px}.usp-review-message b{font-size:12px}.usp-review-message span{font-size:11px;color:#667786;line-height:1.45}.usp-review-message--approved{background:#f1f8f4;border-color:#cfe7d7}.usp-review-message--rejected{background:#fff6f4;border-color:#efd5cf}.usp-review-message--pending{background:#fffaf0;border-color:#ead9ad}';
  document.head.appendChild(s);
}
async function syncReviewStatus({reload=true}={}){
  if(!DB)return;
  const {data:{user}}=await DB.auth.getUser();
  if(!user)return;
  const {data,error}=await DB.from('properties').select('id,review_status,review_note,reviewed_at').eq('owner_id',user.id);
  if(error||!data)return;
  const server=new Map(data.map(x=>[String(x.id),x]));
  const local=readProps();
  let changed=false;
  const next=local.map(p=>{
    const row=server.get(String(p.id));
    if(!row)return p;
    const uiStatus=mapReviewToUi(row.review_status);
    if(p.status!==uiStatus||p.reviewStatus!==row.review_status||p.reviewNote!==(row.review_note||null)||p.reviewedAt!==(row.reviewed_at||null))changed=true;
    return {...p,status:uiStatus,reviewStatus:row.review_status,reviewNote:row.review_note||null,reviewedAt:row.reviewed_at||null};
  });
  if(changed){
    writeProps(next);
    if(reload&&sessionStorage.getItem(SYNC_FLAG)!=='1'){
      sessionStorage.setItem(SYNC_FLAG,'1');
      location.reload();
      return;
    }
  }
  sessionStorage.removeItem(SYNC_FLAG);
  injectStyles();
  addReviewMessages();
}

document.addEventListener('DOMContentLoaded',()=>setTimeout(()=>syncReviewStatus(),450));
window.addEventListener('focus',()=>setTimeout(()=>syncReviewStatus({reload:true}),150));
const mo=new MutationObserver(()=>{injectStyles();addReviewMessages();});
document.addEventListener('DOMContentLoaded',()=>{
  const target=document.getElementById('appContent');
  if(target)mo.observe(target,{childList:true,subtree:true});
});
})();