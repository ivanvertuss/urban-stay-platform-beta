(() => {
'use strict';
const CONFIG=window.URBAN_STAY_SUPABASE||null;
const DB=CONFIG&&window.supabase?.createClient?window.supabase.createClient(CONFIG.url,CONFIG.publishableKey):null;
const $=s=>document.querySelector(s);
const esc=(v='')=>String(v).replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
let currentAdmin=null;
let profiles=[];

function message(text,error=false){const el=$('#adminMessage');el.textContent=text;el.className='form-message '+(error?'error':'');}
function toast(text){const el=$('#toast');el.textContent=text;el.classList.add('show');clearTimeout(window.__adminToast);window.__adminToast=setTimeout(()=>el.classList.remove('show'),1800);}
function statusLabel(status){return ({pending:'Pendiente',approved:'Aprobado',rejected:'Rechazado'})[status]||status;}
function formatDate(value){if(!value)return '—';try{return new Intl.DateTimeFormat('es-ES',{dateStyle:'medium',timeStyle:'short'}).format(new Date(value));}catch{return value;}}

async function getOwnProfile(userId){
 const {data,error}=await DB.from('profiles').select('id,full_name,role,account_status').eq('id',userId).single();
 if(error)throw error;
 return data;
}
async function requireAdmin(session){
 if(!session?.user)return false;
 const profile=await getOwnProfile(session.user.id);
 if(profile.role!=='admin'||profile.account_status!=='approved'){
   await DB.auth.signOut();
   message('Esta cuenta no tiene permisos de administrador.',true);
   return false;
 }
 currentAdmin=profile;
 $('#adminLogin').hidden=true;$('#adminConsole').hidden=false;$('#adminLogout').hidden=false;
 await loadProfiles();
 return true;
}
async function login(){
 const email=$('#adminEmail').value.trim(),password=$('#adminPassword').value;
 if(!DB)return message('No se pudo conectar con el servidor.',true);
 if(!email||!password)return message('Escribe tu correo y contraseña.',true);
 message('Comprobando acceso…');
 const {data,error}=await DB.auth.signInWithPassword({email,password});
 if(error)return message('El correo o la contraseña no coinciden.',true);
 try{await requireAdmin(data.session);}catch(e){message('No se pudo comprobar el permiso de administrador.',true);}
}
async function logout(){await DB.auth.signOut();currentAdmin=null;profiles=[];$('#adminLogin').hidden=false;$('#adminConsole').hidden=true;$('#adminLogout').hidden=true;message('');}
async function loadProfiles(){
 const {data,error}=await DB.from('profiles').select('id,full_name,phone,company_name,role,account_status,created_at,reviewed_at,review_note').order('created_at',{ascending:false});
 if(error){$('#accountList').innerHTML='<article class="card"><h2>No se pudieron cargar las cuentas</h2><p>Comprueba que la migración de aprobación está aplicada en Supabase.</p></article>';return;}
 profiles=data||[];render();
}
function render(){
 const counts={pending:0,approved:0,rejected:0};profiles.forEach(p=>{if(counts[p.account_status]!==undefined)counts[p.account_status]++;});
 $('#adminStats').innerHTML=`<article class="overview-card"><small>PENDIENTES</small><strong>${counts.pending}</strong></article><article class="overview-card"><small>APROBADOS</small><strong>${counts.approved}</strong></article><article class="overview-card"><small>RECHAZADOS</small><strong>${counts.rejected}</strong></article><article class="overview-card"><small>TOTAL</small><strong>${profiles.length}</strong></article>`;
 const filter=$('#accountFilter').value;
 const visible=profiles.filter(p=>filter==='all'||p.account_status===filter);
 $('#accountList').innerHTML=visible.length?visible.map(p=>`<article class="card admin-account"><div class="admin-account-head"><div><span class="status status--${esc(p.account_status)}">● ${statusLabel(p.account_status)}</span><h2>${esc(p.full_name||'Usuario sin nombre')}</h2><p>${esc(p.company_name||'Sin empresa')} · Alta ${formatDate(p.created_at)}</p></div><span class="admin-role">${p.role==='admin'?'Administrador':'Propietario'}</span></div>${p.review_note?`<div class="admin-note"><b>Nota de revisión</b><span>${esc(p.review_note)}</span></div>`:''}${p.id===currentAdmin?.id?'<p class="admin-self">Esta es tu cuenta de administrador.</p>':`<div class="admin-actions"><button class="btn secondary" data-review="rejected" data-id="${p.id}">Rechazar</button><button class="btn primary" data-review="approved" data-id="${p.id}">✓ Aprobar</button></div>`}</article>`).join(''):'<article class="card admin-empty"><h2>No hay cuentas en este estado</h2><p>Las nuevas solicitudes aparecerán aquí automáticamente.</p></article>';
 document.querySelectorAll('[data-review]').forEach(btn=>btn.addEventListener('click',()=>review(btn.dataset.id,btn.dataset.review)));
}
async function review(id,decision){
 const target=profiles.find(p=>p.id===id);if(!target)return;
 const verb=decision==='approved'?'aprobar':'rechazar';
 if(!confirm(`¿Quieres ${verb} la cuenta de ${target.full_name||'este usuario'}?`))return;
 const note=prompt('Nota interna opcional para esta decisión:','')||null;
 const {error}=await DB.rpc('review_account',{target_user_id:id,decision,note});
 if(error){toast('No se pudo guardar la decisión');return;}
 toast(decision==='approved'?'Cuenta aprobada':'Cuenta rechazada');await loadProfiles();
}

$('#adminLoginButton').addEventListener('click',login);
$('#adminPassword').addEventListener('keydown',e=>{if(e.key==='Enter')login();});
$('#adminLogout').addEventListener('click',logout);
$('#accountFilter').addEventListener('change',render);

(async()=>{if(!DB)return message('Falta la configuración de Supabase.',true);const {data}=await DB.auth.getSession();if(data.session){try{await requireAdmin(data.session);}catch{message('No se pudo comprobar la sesión.',true);}}})();
})();
