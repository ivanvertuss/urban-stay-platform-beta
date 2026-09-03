
(() => {
'use strict';
const DATA = window.URBAN_STAY_DATA || {properties:[]};
 const SUPABASE_CONFIG = window.URBAN_STAY_SUPABASE || null;
const DB = SUPABASE_CONFIG && window.supabase?.createClient
  ? window.supabase.createClient(
      SUPABASE_CONFIG.url,
      SUPABASE_CONFIG.publishableKey
    )
  : null;
const $=(s,r=document)=>r.querySelector(s);
const $$=(s,r=document)=>Array.from(r.querySelectorAll(s));

const KEYS={owner:'usp-v1-owner',session:'usp-v1-session',props:'usp-v1-properties',draft:'usp-v1-draft',lang:'usp-v1-lang',propState:'usp-v1-property-state',test:'usp-v1-test-events',feedback:'usp-v1-feedback'};
const I18N={
 es:{dashboard:'Dashboard',properties:'Propiedades',guide:'Guía',access:'Accesos',discover:'Descubrir',agenda:'Agenda',partners:'Colaboradores',lab:'Urban Stay Lab',settings:'Configuración',owner:'Propietario',system:'Sistema operativo',working:'Todo funcionando correctamente',hello:'Buenos días',intro:'Gestiona tus propiedades y la experiencia de tus huéspedes desde un único lugar.',add:'Añadir propiedad',preview:'Vista previa',publish:'Publicar',back:'Atrás',saveDraft:'Guardar borrador',next:'Continuar',finish:'Crear propiedad',close:'Cerrar',mobile:'Móvil',desktop:'Escritorio'},
 en:{dashboard:'Dashboard',properties:'Properties',guide:'Guide',access:'Access',discover:'Discover',agenda:'Agenda',partners:'Partners',lab:'Urban Stay Lab',settings:'Settings',owner:'Owner',system:'System online',working:'Everything is working correctly',hello:'Good morning',intro:'Manage your properties and guest experience from one place.',add:'Add property',preview:'Preview',publish:'Publish',back:'Back',saveDraft:'Save draft',next:'Continue',finish:'Create property',close:'Close',mobile:'Mobile',desktop:'Desktop'},
 fr:{dashboard:'Tableau de bord',properties:'Propriétés',guide:'Guide',access:'Accès',discover:'Découvrir',agenda:'Agenda',partners:'Partenaires',lab:'Urban Stay Lab',settings:'Paramètres',owner:'Propriétaire',system:'Système opérationnel',working:'Tout fonctionne correctement',hello:'Bonjour',intro:'Gérez vos propriétés et l’expérience de vos voyageurs depuis un seul endroit.',add:'Ajouter une propriété',preview:'Aperçu',publish:'Publier',back:'Retour',saveDraft:'Enregistrer brouillon',next:'Continuer',finish:'Créer la propriété',close:'Fermer',mobile:'Mobile',desktop:'Ordinateur'},
 de:{dashboard:'Dashboard',properties:'Unterkünfte',guide:'Guide',access:'Zugang',discover:'Entdecken',agenda:'Kalender',partners:'Partner',lab:'Urban Stay Lab',settings:'Einstellungen',owner:'Eigentümer',system:'System aktiv',working:'Alles funktioniert korrekt',hello:'Guten Morgen',intro:'Verwalten Sie Unterkünfte und Gästeerlebnis an einem Ort.',add:'Unterkunft hinzufügen',preview:'Vorschau',publish:'Veröffentlichen',back:'Zurück',saveDraft:'Entwurf speichern',next:'Weiter',finish:'Unterkunft erstellen',close:'Schließen',mobile:'Mobil',desktop:'Desktop'},
 it:{dashboard:'Dashboard',properties:'Proprietà',guide:'Guida',access:'Accessi',discover:'Scopri',agenda:'Agenda',partners:'Partner',lab:'Urban Stay Lab',settings:'Impostazioni',owner:'Proprietario',system:'Sistema operativo',working:'Tutto funziona correttamente',hello:'Buongiorno',intro:'Gestisci proprietà ed esperienza degli ospiti da un unico posto.',add:'Aggiungi proprietà',preview:'Anteprima',publish:'Pubblica',back:'Indietro',saveDraft:'Salva bozza',next:'Continua',finish:'Crea proprietà',close:'Chiudi',mobile:'Mobile',desktop:'Desktop'},
 pt:{dashboard:'Dashboard',properties:'Propriedades',guide:'Guia',access:'Acessos',discover:'Descobrir',agenda:'Agenda',partners:'Parceiros',lab:'Urban Stay Lab',settings:'Definições',owner:'Proprietário',system:'Sistema operacional',working:'Tudo a funcionar corretamente',hello:'Bom dia',intro:'Gira propriedades e a experiência dos hóspedes num único lugar.',add:'Adicionar propriedade',preview:'Pré-visualizar',publish:'Publicar',back:'Voltar',saveDraft:'Guardar rascunho',next:'Continuar',finish:'Criar propriedade',close:'Fechar',mobile:'Móvel',desktop:'Computador'}
};

const state={
 route:'dashboard',
 lang:localStorage.getItem(KEYS.lang)||'es',
 selectedProperty:null,
 wizardStep:0,
 previewOpen:false,
 previewDevice:'mobile',
 admin:new URLSearchParams(location.search).get('admin')==='1'
};
const tr=k=>(I18N[state.lang]||I18N.es)[k]||I18N.es[k]||k;


const CLEANUP_KEY='usp-rc56-cleanup-done';
function cleanupLegacyTestData(){
 if(localStorage.getItem(CLEANUP_KEY)==='1')return;
 try{
   // External Test RC5.3 must always start as a brand-new tester.
   localStorage.removeItem(KEYS.owner);
   localStorage.removeItem(KEYS.session);
   localStorage.removeItem(KEYS.props);
   localStorage.removeItem(KEYS.draft);
   localStorage.removeItem(KEYS.propState);
   localStorage.removeItem(KEYS.test);
   localStorage.removeItem(KEYS.feedback);

   // Remove legacy Urban Stay test keys from earlier beta/RC versions.
   Object.keys(localStorage).forEach(k=>{
     if(k.startsWith('usp-') && k!==CLEANUP_KEY){
       localStorage.removeItem(k);
     }
   });
 }catch{}
 localStorage.setItem(CLEANUP_KEY,'1');
}

function toast(msg){
 const el=$('#toast'); if(!el)return;
 el.textContent=msg; el.classList.add('show');
 clearTimeout(window.__toast); window.__toast=setTimeout(()=>el.classList.remove('show'),1800);
}
function getOwner(){try{return JSON.parse(localStorage.getItem(KEYS.owner)||'null')}catch{return null}}
function setOwner(v){localStorage.setItem(KEYS.owner,JSON.stringify(v))}
function getUserProps(){try{return JSON.parse(localStorage.getItem(KEYS.props)||'[]')}catch{return []}}
function saveUserProps(v){try{localStorage.setItem(KEYS.props,JSON.stringify(v));return true}catch(e){toast('No se pudieron guardar todos los datos. Reduce el número de fotos.');return false}}
function getPropState(){try{return JSON.parse(localStorage.getItem(KEYS.propState)||'{}')}catch{return {}}}
function savePropState(v){localStorage.setItem(KEYS.propState,JSON.stringify(v))}
function demoProps(){
  return (DATA.properties||[]).map(p=>({
    ...p,
    isDemo:true,
    status:'demo'
  }));
}

function allProps(){
  const st=getPropState();
  return getUserProps()
    .filter(p=>st[p.id]?.deleted!==true)
    .map(p=>({...p,status:st[p.id]?.status||p.status||'draft'}));
}
function setPropertyStatus(id,status){
 const st=getPropState();st[id]={...(st[id]||{}),status,deleted:false};savePropState(st);render();toast(status==='inactive'?'Propiedad inactiva':'Propiedad activa');
}
function deleteProperty(id){
 const p=allProps().find(x=>x.id===id);if(!p)return;
 if(!confirm(`¿Seguro que quieres eliminar "${p.name}"? Esta acción quitará la propiedad del panel.`))return;
 const users=getUserProps();
 if(users.some(x=>x.id===id)){saveUserProps(users.filter(x=>x.id!==id))}
 else{const st=getPropState();st[id]={...(st[id]||{}),deleted:true};savePropState(st)}
 render();toast('Propiedad eliminada');
}
function blankDraft(){
 return {
  name:'',address:'',city:'',postal:'',country:'',guests:'',bedrooms:'',bathrooms:'',
  template:'urban-classic',logo:'',photos:[],coverIndex:0,bedSummary:'',
  amenities:{tvBedrooms:false,bedLinen:true,towels:true,smartTv:false,lift:false,fridge:true,freezer:false,oven:false,microwave:true,dishwasher:false,washingMachine:true,coffeeMaker:true,toaster:false,sandwichMaker:false,kettle:false,kitchenware:true,dishes:true,cutlery:true,potsPans:true,wineGlasses:false,hairDryer:false,toiletries:false,heating:true,airConditioning:false,crib:false,highChair:false,pets:false},
  wifiName:'',wifiPassword:'',accessType:'Llaves',accessNotes:'',
  parking:{free:{on:false,info:''},ora:{on:false,info:''},private:{on:false,info:''},public:{on:false,info:''},ev:{on:false,info:''}},
  restaurants:'',services:'',events:true,eventNotes:'',slug:''
 };
}
function normalizeDraft(raw={}){
 const base=blankDraft();
 const out={...base,...raw};
 out.amenities={...base.amenities,...(raw.amenities||{})};
 const rp=raw.parking||{};
 out.parking={
  free:{...base.parking.free,...(rp.free||{})},
  ora:{...base.parking.ora,...(rp.ora||{})},
  private:{...base.parking.private,...(rp.private||{})},
  public:{...base.parking.public,...(rp.public||{})},
  ev:{...base.parking.ev,...(rp.ev||{})}
 };
 out.photos=Array.isArray(raw.photos)?raw.photos:[];
 out.coverIndex=Math.max(0,Math.min(Number(raw.coverIndex)||0,Math.max(0,out.photos.length-1)));
 return out;
}
let draft=loadDraft();
function loadDraft(){try{return normalizeDraft(JSON.parse(localStorage.getItem(KEYS.draft)||'{}'))}catch{return normalizeDraft()}}
let __draftStorageWarned=false;
function saveDraft(){
 try{localStorage.setItem(KEYS.draft,JSON.stringify(draft));return true}
 catch(e){
   try{
     const light={...draft,photos:[],logo:''};
     localStorage.setItem(KEYS.draft,JSON.stringify(light));
     if(!__draftStorageWarned){__draftStorageWarned=true;toast('Borrador guardado. Las fotos se mantienen en esta sesión para no saturar el navegador.')}
     return false;
   }catch{return false}
 }
}



function externalDemoMarkup(kind){
 const isBarcelona=kind==='barcelona';
 const name=isBarcelona?'Barcelona 80':'Zamora 89';
 const subtitle=isBarcelona?'Guía urbana · Vigo':'Experiencia premium · Vigo';
 return `<div class="external-guide ${isBarcelona?'classic':'premium'}">
   <div class="external-guide-brand"><div class="demo-mark">US</div><b>${name}</b></div>
   <section class="external-guide-hero"><span>${subtitle.toUpperCase()}</span><h1>Bienvenido a ${name}</h1><p>Todo lo que necesitas para disfrutar tu estancia, en un solo lugar.</p></section>
   <div class="external-guide-grid"><article><span>⌂</span><b>El alojamiento</b><small>Información, habitaciones y equipamiento</small></article><article><span>🔑</span><b>Acceso</b><small>Entrada, WiFi e instrucciones</small></article><article><span>◎</span><b>Descubre</b><small>Restaurantes y recomendaciones</small></article><article><span>🅿</span><b>Aparcamiento</b><small>Opciones y consejos para llegar</small></article></div>
   <section class="external-guide-section"><span class="eyebrow">TU ESTANCIA</span><h2>Una guía clara, visual y siempre disponible.</h2><p>El propietario decide qué información mostrar y el huésped la consulta desde su móvil.</p></section>
 </div>`;
}
function openExternalDemo(kind){
 const dlg=$('#externalDemoDialog');if(!dlg)return;
 $('#externalDemoTitle').textContent=kind==='barcelona'?'Barcelona 80':'Zamora 89';
 $('#externalDemoPreview').innerHTML=externalDemoMarkup(kind);
 if(!dlg.open)dlg.showModal();
}
function closeExternalDemo(){const d=$('#externalDemoDialog');if(d?.open)d.close()}
function buildTestSummary(feedback){
 let events=[];try{events=JSON.parse(localStorage.getItem(KEYS.test)||'[]')}catch{}
 const steps=events.filter(x=>x.event==='wizard_step');
 const created=events.find(x=>x.event==='property_created');
 const sent=events.find(x=>x.event==='sent_for_review');
 const first=events[0]?.at,last=events[events.length-1]?.at;
 let minutes='—';
 if(first&&last){minutes=Math.max(1,Math.round((new Date(last)-new Date(first))/60000))+' min'}
 return `URBAN STAY PLATFORM · PRUEBA EXTERNA
Facilidad: ${feedback.ease}/5
Tiempo aproximado registrado: ${minutes}
Pasos visitados: ${steps.length}
Propiedad creada: ${created?'Sí':'No'}
Enviada a revisión: ${sent?'Sí':'No'}

Dudas:
${feedback.doubts||'—'}

Qué ha echado en falta:
${feedback.missing||'—'}`;
}

function track(event,detail={}){
 try{
  const rows=JSON.parse(localStorage.getItem(KEYS.test)||'[]');
  rows.push({event,detail,at:new Date().toISOString(),step:state.wizardStep});
  localStorage.setItem(KEYS.test,JSON.stringify(rows.slice(-500)));
 }catch{}
}
function moderationScan(data){
 const issues=[];
 const badWords=['casino','apuestas','crypto','porn','xxx','spam'];
 const text=[data.name,data.address,data.accessNotes,data.restaurants,data.services,data.eventNotes,...Object.values(data.parking||{}).map(x=>x?.info||'')].join(' ').toLowerCase();
 badWords.forEach(w=>{if(text.includes(w))issues.push({type:'Texto',level:'review',message:`Revisar contenido relacionado con "${w}".`})});
 if(!data.photos?.length)issues.push({type:'Fotos',level:'warning',message:'No hay fotografías del alojamiento.'});
 if(data.photos?.length>0 && data.photos.length<3)issues.push({type:'Fotos',level:'warning',message:'Recomendamos al menos 3 fotografías.'});
 if(!data.name?.trim())issues.push({type:'Datos',level:'block',message:'Falta el nombre del alojamiento.'});
 if(!data.city?.trim())issues.push({type:'Datos',level:'block',message:'Falta la ciudad.'});
 if(!data.address?.trim())issues.push({type:'Datos',level:'warning',message:'Falta la dirección.'});
 return issues;
}
function workflowLabel(s){return ({draft:'Borrador',pending_review:'Pendiente de revisión',changes_requested:'Cambios solicitados',approved:'Aprobada',active:'Activa',inactive:'Inactiva'})[s]||'Borrador'}
function sendForReview(id){
 const props=getUserProps(), p=props.find(x=>x.id===id);if(!p){toast('Esta propiedad de demostración no se puede enviar.');return}
 const issues=moderationScan(p.wizardData||{});
 if(issues.some(x=>x.level==='block')){alert('Antes de enviar a revisión:\n\n'+issues.filter(x=>x.level==='block').map(x=>'• '+x.message).join('\n'));return}
 p.status='pending_review';p.moderation={issues,submittedAt:new Date().toISOString()};
 saveUserProps(props);track('sent_for_review',{id,issues:issues.length});render();toast('Prueba enviada correctamente');setTimeout(openFeedback,500);
}
function moderationPanel(){
 const pending=getUserProps().filter(p=>['pending_review','changes_requested','approved'].includes(p.status));
 return `<section class="page"><div class="page-title"><div><span class="section-label">CONTROL URBAN STAY</span><h1>Revisión de propiedades</h1><p>Simulación local del flujo de moderación antes de publicar.</p></div></div>
 <div class="moderation-list">${pending.length?pending.map(p=>{
  const issues=p.moderation?.issues||moderationScan(p.wizardData||{});
  return `<article class="card moderation-card"><div class="moderation-head"><div><h2>${esc(p.name)}</h2><span class="status">${workflowLabel(p.status)}</span></div><b>${issues.length} avisos</b></div>
  <div class="moderation-issues">${issues.length?issues.map(x=>`<div class="moderation-issue ${x.level}"><b>${x.type}</b><span>${esc(x.message)}</span></div>`).join(''):'<div class="moderation-ok">✓ Sin incidencias automáticas</div>'}</div>
  <div class="moderation-actions"><button class="btn secondary" data-request-changes="${p.id}">Solicitar cambios</button><button class="btn primary" data-approve="${p.id}">✓ Aprobar</button></div></article>`;
 }).join(''):`<article class="card"><h2>No hay propiedades pendientes</h2><p>Cuando un propietario pulse “Enviar a revisión”, aparecerá aquí.</p></article>`}</div></section>`;
}
function moderationAction(id,status){
 const props=getUserProps(),p=props.find(x=>x.id===id);if(!p)return;
 p.status=status;p.moderation={...(p.moderation||{}),reviewedAt:new Date().toISOString()};
 saveUserProps(props);track('moderation_action',{id,status});render();toast(status==='approved'?'Propiedad aprobada':'Cambios solicitados');
}
function closeFeedbackDialog(){const dlg=$('#feedbackDialog');if(dlg?.open)dlg.close();state.route='dashboard';render()}
function openFeedback(){
 const dlg=$('#feedbackDialog');if(dlg&&!dlg.open)dlg.showModal();
}

function setStage(name){
 $$('.onboard-stage').forEach(x=>x.classList.toggle('active',x.dataset.stage===name));
}
function showOnboarding(stage='welcome'){
 $('#onboarding')?.classList.remove('hidden'); document.body.classList.add('onboarding-open'); setStage(stage);
}
function hideOnboarding(){ $('#onboarding')?.classList.add('hidden'); document.body.classList.remove('onboarding-open'); }

async function register(){
 const first=$('#regFirstName')?.value.trim()||'', last=$('#regLastName')?.value.trim()||'';
 const email=$('#regEmail')?.value.trim()||'', pass=$('#regPassword')?.value||'', terms=$('#regTerms')?.checked;
 const msg=$('#registerMessage');
 const fail=t=>{msg.textContent=t;msg.className='form-message error'};
 if(!first)return fail('Añade tu nombre para continuar.');
 if(!last)return fail('Añade tus apellidos para continuar.');
 if(!email || !$('#regEmail').checkValidity())return fail('Escribe un correo electrónico válido.');
 if(pass.length<6)return fail('La contraseña debe tener al menos 6 caracteres.');
 if(!terms)return fail('Acepta las condiciones de la prueba para continuar.');
if(!DB)return fail('No se pudo conectar con el servidor. Inténtalo de nuevo.');

const { data, error } = await DB.auth.signUp({
  email,
  password: pass,
  options: {
    data: {
      full_name: `${first} ${last}`.trim()
    }
  }
});

if(error)return fail(error.message || 'No se pudo crear la cuenta.');

setOwner({
  firstName:first,
  lastName:last,
  email,
  phone:$('#regPhone')?.value.trim()||'',
  country:$('#regCountry')?.value||'',
  company:$('#regCompany')?.value.trim()||''
});
if(data.session){
  localStorage.setItem(KEYS.session,'1');
  msg.textContent='';
  $('#welcomeOwnerName').textContent=`Bienvenido, ${first}.`;
  syncOwner();
  setStage('success');
}else{
  localStorage.removeItem(KEYS.session);
  msg.textContent='Cuenta creada. Revisa tu correo, confirma tu dirección y después inicia sesión.';
  msg.className='form-message success';
  setTimeout(()=>setStage('login'),1200);
}
} 
 async function loadServerProperties(userId){
  if(!DB || !userId)return;

  const {data:properties,error:propertiesError}=await DB
    .from('properties')
    .select('*')
    .eq('owner_id',userId)
    .order('created_at',{ascending:false});

  if(propertiesError){
    console.error('Error loading properties',propertiesError);
    toast('No se pudieron cargar tus propiedades.');
    return;
  }

  if(!properties?.length){
    saveUserProps([]);
    return;
  }

  const ids=properties.map(p=>p.id);

  const {data:contents,error:contentsError}=await DB
    .from('property_content')
    .select('property_id,content')
    .in('property_id',ids);

  if(contentsError){
    console.error('Error loading property content',contentsError);
  }

  const contentMap=new Map(
    (contents||[]).map(row=>[row.property_id,row.content])
  );

  const localProps=properties.map(p=>{
    const content=normalizeDraft(contentMap.get(p.id)||{});

    return {
      id:p.id,
      name:p.name,
      city:[p.city,p.country].filter(Boolean).join(', '),
      visits:0,
      updated:p.updated_at
        ? new Date(p.updated_at).toLocaleDateString('es-ES')
        : new Date().toLocaleDateString('es-ES'),
      rating:'—',
      status:p.status||'draft',
      wizardData:content
    };
  });

  saveUserProps(localProps);
}
async function login(){
  const msg=$('#loginMessage');
  const email=$('#loginEmail')?.value.trim()||'';
  const password=$('#loginPassword')?.value||'';

  const fail=t=>{
    msg.textContent=t;
    msg.className='form-message error';
  };

  if(!DB)return fail('No se pudo conectar con el servidor. Inténtalo de nuevo.');
  if(!email || !password)return fail('Escribe tu correo y contraseña.');

  const { data, error } = await DB.auth.signInWithPassword({
    email,
    password
  });

  if(error)return fail('El correo o la contraseña no coinciden.');

  const { data: profile } = await DB
    .from('profiles')
    .select('full_name, phone, company_name')
    .eq('id', data.user.id)
    .single();

  const fullName=(profile?.full_name||'').trim();
  const parts=fullName.split(/\s+/);
  const firstName=parts.shift()||'';
  const lastName=parts.join(' ');

  setOwner({
    firstName,
    lastName,
    email:data.user.email||email,
    phone:profile?.phone||'',
    company:profile?.company_name||''
  });

  localStorage.setItem(KEYS.session,'1');
  msg.textContent='';

 await loadServerProperties(data.user.id);
 
  hideOnboarding();
  syncOwner();
  render();
}
function syncOwner(){
 const o=getOwner(); if(!o)return;
 const b=$('.profile-button b'), av=$('.profile-button>span'), role=$('.profile-button small');
 if(b)b.textContent=`${o.firstName} ${o.lastName}`.trim();
 if(av)av.textContent=((o.firstName[0]||'')+(o.lastName[0]||'')).toUpperCase();
 if(role)role.textContent=tr('owner');
}

function applyStatic(){
 const map={dashboard:'dashboard',properties:'properties',guide:'guide',accessManager:'access',discover:'discover',agenda:'agenda',partners:'partners',settings:'settings',systemOnline:'system',allWorking:'working',owner:'owner'};
 $$('[data-i18n]').forEach(el=>{const k=map[el.dataset.i18n]||el.dataset.i18n;el.textContent=tr(k)});
 const sel=$('#ownerLanguage'); if(sel)sel.value=state.lang;
 syncOwner();
}

function nav(route){
 state.route=route;
 $$('.nav').forEach(b=>b.classList.toggle('active',b.dataset.route===route));
 $('#breadcrumb').textContent=`Urban Stay / ${tr(route==='properties'?'properties':route==='settings'?'settings':route==='agenda'?'agenda':route==='partners'?'partners':route==='discover'?'discover':route==='access'?'access':route==='guide'?'guide':route==='lab'?'lab':'dashboard')}`;
 render();
}
function propertyCard(p){
  const cover=p.wizardData?.photos?.[p.wizardData.coverIndex||0];
  const inactive=p.status==='inactive';
  const ownerMade=!!p.wizardData;
  const isDemo=!!p.isDemo;

  const statusLabel=isDemo
    ? '<span class="status status--demo">● Demo</span>'
    : `<span class="status status--${p.status||'draft'}">● ${workflowLabel(p.status||'draft')}</span>`;

  const actions=isDemo
    ? `<div class="property-actions demo-actions">
         <span class="demo-readonly">Ejemplo Urban Stay · Solo lectura</span>
       </div>`
    : `<div class="property-actions" data-property-actions="${p.id}">
         ${ownerMade&&['draft','changes_requested'].includes(p.status)?`<button type="button" class="property-review-btn" data-send-review="${p.id}">🛡 Enviar a revisión</button>`:''}
         ${p.status==='approved'?`<button type="button" class="property-state-btn" data-status-property="${p.id}" data-status="active">✓ Activar</button>`:''}
         ${['active','inactive'].includes(p.status)?`<button type="button" class="property-state-btn ${p.status==='active'?'active':''}" data-status-property="${p.id}" data-status="active">✓ Activa</button><button type="button" class="property-state-btn ${p.status==='inactive'?'active':''}" data-status-property="${p.id}" data-status="inactive">⏸ Inactiva</button>`:''}
         <button type="button" class="property-delete-btn" data-delete-property="${p.id}">Eliminar propiedad</button>
       </div>`;

  return `<article class="property-mini ${inactive?'property-inactive':''} ${isDemo?'property-demo':''}" data-open-property="${p.id}">
    <div class="property-photo ${p.imageClass||''}" ${cover?`style="background-image:url('${cover}')"`:''}></div>
    <div class="property-data">
      <div class="property-head">
        <div>
          <h2>${p.name}</h2>
          <p>${p.city}</p>
        </div>
        ${statusLabel}
      </div>
      <div class="property-stats">
        <div><small>Visitas hoy</small><b>${p.visits||0}</b></div>
        <div><small>Última actualización</small><b>${p.updated||'Hoy'}</b></div>
        <div><small>Valoración</small><b>${p.rating||'—'}</b></div>
        <div><small>Plantilla</small><b>${templateName(p.wizardData?.template)}</b></div>
      </div>
      ${actions}
    </div>
  </article>`;
}
function templateName(k){return ({'urban-classic':'Urban Classic','urban-premium':'Urban Premium','boutique':'Boutique','mediterranean':'Mediterranean'})[k]||'Urban Classic'}
function dashboard(){
 const o=getOwner();
 const name=o?.firstName||'';
 const greeting=name?`${tr('hello')}, ${name} 👋`:'Bienvenido a Urban Stay Platform 👋';
 const userProps=allProps();
 const demos=demoProps();

 return `<section class="page">
   <div class="command-hero">
     <div>
       <span class="overline">URBAN STAY PLATFORM · EXTERNAL TEST</span>
       <h1>${greeting}</h1>
       <p>${tr('intro')}</p>
     </div>
     <div class="hero-actions">
       ${state.admin?`<button class="btn secondary" id="openModeration">🛡 Revisión Urban Stay</button>`:''}
       <button class="btn primary" id="newPropertyTop">＋ ${tr('add')}</button>
     </div>
   </div>

   <div class="overview-grid">
     <article class="overview-card">
       <span class="overview-icon">⌂</span>
       <div>
         <small>PROPIEDADES</small>
         <strong>${userProps.length}</strong>
         <em>Tu portfolio</em>
       </div>
     </article>

     <article class="overview-card">
       <span class="overview-icon">✓</span>
       <div><small>ESTADO</small><strong>OK</strong><em>Núcleo estable</em></div>
     </article>

     <article class="overview-card">
       <span class="overview-icon">👁</span>
       <div><small>PREVIEW</small><strong>LIVE</strong><em>Durante el alta</em></div>
     </article>

     <article class="overview-card">
       <span class="overview-icon">🌐</span>
       <div><small>IDIOMAS</small><strong>6</strong><em>Interfaz</em></div>
     </article>
   </div>

   <div class="dashboard-grid dashboard-grid--v07">
     <article class="card portfolio-card">
       <div class="card-head">
         <div>
           <div class="section-label">MIS PROPIEDADES</div>
           <h2>Portfolio</h2>
         </div>
       </div>

       ${userProps.length
         ? userProps.map(propertyCard).join('')
         : `<p class="empty-state">Todavía no has creado ninguna propiedad.</p>`}

       <button class="btn secondary full-button" id="newProperty">＋ ${tr('add')}</button>
     </article>

     <article class="card portfolio-card">
       <div class="card-head">
         <div>
           <div class="section-label">EJEMPLOS URBAN STAY</div>
           <h2>Living Labs</h2>
           <p>Ejemplos reales para explorar. No se pueden modificar.</p>
         </div>
       </div>

       ${demos.map(propertyCard).join('')}
     </article>
   </div>
 </section>`;
}

function properties(){
 const userProps=allProps();
 const demos=demoProps();

 return `<section class="page">
   <div class="page-title">
     <div>
       <h1>${tr('properties')}</h1>
       <p>Gestiona únicamente los alojamientos asociados a tu cuenta.</p>
     </div>
     <button class="btn primary" id="newPropertyTop">＋ ${tr('add')}</button>
   </div>

   <div class="property-list card">
     <div class="card-head">
       <div>
         <div class="section-label">MIS PROPIEDADES</div>
         <h2>Tu portfolio</h2>
       </div>
     </div>

     ${userProps.length
       ? userProps.map(propertyCard).join('')
       : `<p class="empty-state">Todavía no has creado ninguna propiedad.</p>`}
   </div>

   <div class="property-list card">
     <div class="card-head">
       <div>
         <div class="section-label">EJEMPLOS URBAN STAY</div>
         <h2>Barcelona 80 · Zamora 89</h2>
         <p>Ejemplos de referencia disponibles únicamente en modo lectura.</p>
       </div>
     </div>

     ${demos.map(propertyCard).join('')}
   </div>
 </section>`;
} 
function generic(route){
 const labels={guide:'Constructor de guía',access:'Gestor de accesos',discover:'Descubrir',agenda:'Agenda',partners:'Colaboradores',lab:'Urban Stay Lab',settings:'Configuración'};
 return `<section class="page"><div class="page-title"><div><h1>${labels[route]||route}</h1><p>Módulo preparado en la nueva arquitectura v1.0 RC.</p></div></div><article class="card"><div class="section-label">ESTADO DEL MÓDULO</div><p>Esta versión se centra en estabilizar cuenta, alta de propiedad y vista previa. El módulo se conserva para las siguientes iteraciones.</p></article></section>`;
}
function render(){
 const c=$('#appContent'); if(!c)return;
 c.innerHTML=state.route==='dashboard'?dashboard():state.route==='properties'?properties():state.route==='moderation'?moderationPanel():generic(state.route);
 bindPage(); applyStatic();
}

const STEPS=[
 ['identity','Identidad'],['template','Diseño'],['photos','Fotos y logo'],['equipment','Equipamiento'],['wifi','WiFi y acceso'],['parking','Aparcamiento'],['local','Restaurantes'],['agenda','Agenda'],['publish','Revisión']
];

function openWizard(){
 draft=loadDraft(); state.wizardStep=0; state.previewOpen=false;
 renderWizard();
 const dlg=$('#propertyWizard'); if(dlg && !dlg.open)dlg.showModal();
}
 function openNewPropertyWizard(){
  state.selectedProperty=null;
  localStorage.removeItem(KEYS.draft);
  draft=blankDraft();
  saveDraft();
  openWizard();
}
function closeWizard(){const d=$('#propertyWizard');if(d?.open)d.close()}
function wizardProgress(){
 return STEPS.map((s,i)=>`<button type="button" class="wizard-progress-item ${i===state.wizardStep?'active':''} ${i<state.wizardStep?'done':''}" data-jump="${i}"><span>${i<state.wizardStep?'✓':i+1}</span><b>${s[1]}</b></button>`).join('');
}
function fld(label,key,type='text',ph=''){return `<div class="field"><label>${label}</label><input data-bind="${key}" type="${type}" value="${esc(draft[key]??'')}" placeholder="${ph}"></div>`}
function esc(v=''){return String(v).replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]))}
function amenity(key,label,icon){return `<label class="amenity-option ${draft.amenities[key]?'selected':''}"><input type="checkbox" data-amenity="${key}" ${draft.amenities[key]?'checked':''}><span>${icon}</span><b>${label}</b><em>${draft.amenities[key]?'Incluido':'No marcado'}</em></label>`}
function parkingCard(key,title,icon,placeholder){
 const v=(draft.parking&&draft.parking[key])?draft.parking[key]:{on:false,info:''};
 return `<section class="parking-detail-card ${v.on?'active':''}" data-parking-card="${key}">
   <div class="parking-detail-toggle">
     <span class="parking-icon">${icon}</span>
     <div><b>${title}</b><small>${v.on?'Activo en la guía':'No activo'}</small></div>
     <button type="button" class="parking-action-btn ${v.on?'is-on':''}" data-parking-action="${key}" aria-pressed="${v.on?'true':'false'}">${v.on?'Desactivar':'Activar'}</button>
   </div>
   <div class="parking-detail-body" ${v.on?'':'hidden'}><label>Información para el huésped<textarea data-parking-info="${key}" placeholder="${placeholder}">${esc(v.info)}</textarea></label></div>
 </section>`;
}
function templateCard(key,name,desc,cls,origin){
 return `<label class="template-card ${draft.template===key?'selected':''}"><input type="radio" name="template" data-template="${key}" ${draft.template===key?'checked':''}><div class="template-preview ${cls}"><span>URBAN STAY</span><b>${name}</b><i></i><i></i><i></i></div><div class="template-copy"><strong>${name}</strong><small>${desc}</small><em>${origin}</em></div></label>`;
}

function photoGalleryMarkup(){
 return (draft.photos||[]).map((p,i)=>`<article class="uploaded-photo ${i===draft.coverIndex?'is-cover':''}" data-photo-card="${i}"><img src="${p}" alt="Foto ${i+1}" loading="lazy"><div class="uploaded-photo-actions"><button type="button" data-cover="${i}">${i===draft.coverIndex?'★ Portada':'☆ Portada'}</button><button type="button" data-remove="${i}">Eliminar</button></div></article>`).join('');
}
function bindPhotoActionButtons(){
 $$('[data-cover]').forEach(b=>b.onclick=()=>{
   draft.coverIndex=Number(b.dataset.cover);saveDraft();refreshMediaStep();try{updatePreview()}catch{}
 });
 $$('[data-remove]').forEach(b=>b.onclick=()=>{
   draft.photos.splice(Number(b.dataset.remove),1);
   draft.coverIndex=Math.min(draft.coverIndex,Math.max(0,draft.photos.length-1));
   saveDraft();refreshMediaStep();try{updatePreview()}catch{}
 });
}
function refreshMediaStep(){
 const gallery=$('#uploadedGallery'),count=$('#photoCount'),logo=$('#logoUploadPreview');
 if(gallery)gallery.innerHTML=photoGalleryMarkup();
 if(count)count.textContent=`${draft.photos.length} fotos`;
 if(logo)logo.innerHTML=draft.logo?`<img src="${draft.logo}" alt="Logo"><span>Cambiar logo</span>`:`<span class="upload-plus">＋</span><b>Subir logo</b><small>PNG, JPG o WEBP</small>`;
 bindPhotoActionButtons();
}

function stepHtml(key){
 if(key==='identity')return `<div class="wizard-intro"><span class="wizard-icon">⌂</span><div><h3>Datos básicos</h3><p>Lo mínimo para empezar a construir tu guía.</p></div></div><div class="form-grid wizard-form">${fld('Nombre del alojamiento','name','text','Ej. Apartamento Centro')}${fld('Ciudad','city','text','Ej. Vigo')}${fld('Dirección','address','text','Calle, número')}${fld('Código postal','postal')}<div class="field"><label>País</label><select data-bind="country"><option value="">Selecciona país</option>${['España','Portugal','Francia','Italia','Alemania','Reino Unido','Otro'].map(x=>`<option value="${x}" ${draft.country===x?'selected':''}>${x}</option>`).join('')}</select></div>${fld('Capacidad máxima','guests','number','Ej. 6')}${fld('Habitaciones','bedrooms','number','Ej. 3')}${fld('Baños','bathrooms','number','Ej. 2')}${fld('URL deseada','slug','text','apartamento-centro')}</div>`;
 if(key==='template')return `<div class="wizard-intro"><span class="wizard-icon">◇</span><div><h3>Elige el diseño</h3><p>Las cuatro plantillas son seleccionables y la vista previa cambia al instante.</p></div></div><div class="template-grid">${templateCard('urban-classic','Urban Classic','Limpia y urbana.','template-preview--classic','Inspirada en Barcelona 80')}${templateCard('urban-premium','Urban Premium','Cálida y editorial.','template-preview--premium','Inspirada en Zamora 89')}${templateCard('boutique','Boutique','Minimalista y fotográfica.','template-preview--boutique','Nueva plantilla')}${templateCard('mediterranean','Mediterranean','Luminosa y fresca.','template-preview--med','Nueva plantilla')}</div>`;
 if(key==='photos')return `<div class="wizard-intro"><span class="wizard-icon">▣</span><div><h3>Fotos y logo</h3><p>Sube imágenes reales y comprueba el resultado en la vista previa.</p></div></div><div class="media-section"><b>Logo del alojamiento o empresa</b><label class="logo-upload-box"><input id="logoInput" type="file" accept="image/jpeg,image/png,image/webp"><div id="logoUploadPreview">${draft.logo?`<img src="${draft.logo}" alt="Logo"><span>Cambiar logo</span>`:`<span class="upload-plus">＋</span><b>Subir logo</b><small>PNG, JPG o WEBP</small>`}</div></label></div><div class="media-section"><div class="media-section-head"><b>Fotografías</b><span class="photo-count" id="photoCount">${draft.photos.length} fotos</span></div><label class="real-upload-drop"><input id="photosInput" type="file" accept="image/jpeg,image/png,image/webp" multiple><span class="upload-plus">＋</span><b>Subir fotografías</b><small>Puedes seleccionar varias · máximo 12</small></label><div class="upload-status" id="photoUploadStatus"></div><div class="uploaded-gallery" id="uploadedGallery">${photoGalleryMarkup()}</div></div>`;
 if(key==='equipment')return `<div class="wizard-intro"><span class="wizard-icon">▦</span><div><h3>Equipamiento</h3><p>Marca lo que realmente tiene tu alojamiento.</p></div></div><div class="form-grid wizard-form"><div class="field full"><label>Resumen de camas</label><textarea data-bind="bedSummary" placeholder="Ej. 2 camas dobles + 2 individuales">${esc(draft.bedSummary)}</textarea></div></div><div class="amenity-groups"><section class="amenity-group"><h4>Dormitorios</h4><div class="amenity-grid">${amenity('tvBedrooms','TV en habitaciones','📺')}${amenity('bedLinen','Juegos de cama','🛏')}${amenity('towels','Toallas','🧺')}${amenity('heating','Calefacción','♨')}${amenity('airConditioning','Aire acondicionado','❄')}</div></section><section class="amenity-group"><h4>Salón</h4><div class="amenity-grid">${amenity('smartTv','Smart TV','📺')}</div></section><section class="amenity-group"><h4>Cocina</h4><div class="amenity-grid">${amenity('fridge','Nevera','🧊')}${amenity('freezer','Congelador','❄')}${amenity('oven','Horno','🔥')}${amenity('microwave','Microondas','◫')}${amenity('dishwasher','Lavavajillas','◉')}${amenity('washingMachine','Lavadora','◉')}${amenity('coffeeMaker','Cafetera','☕')}${amenity('toaster','Tostadora','▤')}${amenity('sandwichMaker','Sandwichera','▱')}${amenity('kettle','Hervidor','♨')}${amenity('kitchenware','Menaje','🍽')}${amenity('dishes','Vajilla','🍽')}${amenity('cutlery','Cubiertos','🍴')}${amenity('potsPans','Ollas y sartenes','◉')}${amenity('wineGlasses','Copas de vino','🍷')}</div></section><section class="amenity-group"><h4>Edificio y accesibilidad</h4><div class="amenity-grid">${amenity('lift','Ascensor','↕')}</div></section><section class="amenity-group"><h4>Baño y familia</h4><div class="amenity-grid">${amenity('hairDryer','Secador','♨')}${amenity('toiletries','Gel y champú','🧴')}${amenity('crib','Cuna','◫')}${amenity('highChair','Trona','♧')}${amenity('pets','Admite mascotas','🐾')}</div></section></div>`;
 if(key==='wifi')return `<div class="wizard-intro"><span class="wizard-icon">⌁</span><div><h3>WiFi y acceso</h3><p>Información práctica para reducir preguntas antes de la llegada.</p></div></div><div class="form-grid wizard-form">${fld('Red WiFi','wifiName')}${fld('Contraseña WiFi','wifiPassword')}<div class="field"><label>Tipo de acceso</label><select data-bind="accessType">${['Llaves','Caja de llaves','Smart Lock','Recepción'].map(x=>`<option ${draft.accessType===x?'selected':''}>${x}</option>`).join('')}</select></div><div class="field full"><label>Instrucciones</label><textarea data-bind="accessNotes">${esc(draft.accessNotes)}</textarea></div></div>`;
 if(key==='parking')return `<div class="wizard-intro"><span class="wizard-icon">P</span><div><h3>Aparcamiento</h3><p>Activa todas las opciones disponibles y añade información distinta para cada una.</p></div></div><div class="parking-detail-list">${parkingCard('free','Aparcamiento gratuito','🚗','Calles recomendadas, restricciones...')}${parkingCard('ora','Zona regulada / ORA','🅿','Horarios, precio, app, límites...')}${parkingCard('private','Parking privado','🔑','Dirección, plaza, acceso, altura...')}${parkingCard('public','Parking público cercano','🏢','Nombre, dirección, precio, distancia...')}${parkingCard('ev','Carga de vehículo eléctrico','⚡','Ubicación, potencia, conector, coste...')}</div>`;
 if(key==='local')return `<div class="wizard-intro"><span class="wizard-icon">⌖</span><div><h3>Restaurantes y entorno</h3><p>Escribe solo nombres. La futura IA podrá completar fichas con dirección, precio, horarios, distancia y enlaces para que el propietario los revise.</p></div></div><div class="form-grid wizard-form"><div class="field full"><label>Restaurantes recomendados</label><textarea data-bind="restaurants" placeholder="Los Abetos&#10;La Central&#10;Nikko">${esc(draft.restaurants)}</textarea></div><div class="field full"><label>Servicios cercanos</label><textarea data-bind="services" placeholder="Supermercado&#10;Farmacia&#10;Taxi">${esc(draft.services)}</textarea></div></div><div class="ai-prep-note"><b>✨ Preparado para IA</b><span>En la versión online, Urban Assistant propondrá la información completa y tú decidirás qué publicar.</span></div>`;
 if(key==='agenda')return `<div class="wizard-intro"><span class="wizard-icon">□</span><div><h3>Agenda</h3><p>Decide si quieres mostrar próximos eventos y añade observaciones.</p></div></div><label class="agenda-switch"><input id="eventsToggle" type="checkbox" ${draft.events?'checked':''}><span class="toggle ${draft.events?'on':''}"></span><div><b>Mostrar agenda de eventos</b><small>${draft.events?'Activada':'Desactivada'}</small></div></label><div class="form-grid wizard-form" style="margin-top:15px"><div class="field full"><label>Observaciones</label><textarea data-bind="eventNotes" placeholder="Fiestas locales, conciertos o notas para la agenda">${esc(draft.eventNotes)}</textarea></div></div>`;
 return reviewHtml();
}
function reviewHtml(){
 const quality=qualityScore(), issues=moderationScan(draft);
 const blockers=issues.filter(x=>x.level==='block').length;
 return `<div class="wizard-success-head"><span>✓</span><div><h3>Tu guía ya tiene una base sólida</h3><p>Comprueba la vista previa antes de crear la propiedad.</p></div></div><div class="review-grid"><article><small>ALOJAMIENTO</small><b>${esc(draft.name||'Sin nombre')}</b><span>${esc(draft.city||'')}</span></article><article><small>DISEÑO</small><b>${templateName(draft.template)}</b><span>Se puede cambiar</span></article><article><small>FOTOS</small><b>${draft.photos.length}</b><span>${draft.logo?'Logo añadido':'Logo pendiente'}</span></article><article><small>PARKING</small><b>${Object.values(draft.parking).filter(x=>x.on).length} opciones</b><span>Información independiente</span></article><article><small>AGENDA</small><b>${draft.events?'Activa':'Desactivada'}</b><span>${draft.eventNotes?'Con notas':'Sin notas'}</span></article><article><small>CALIDAD</small><b>${quality}%</b><span>${quality>=80?'Lista para revisar':'Completa algunos campos'}</span></article></div><div class="preflight-card"><div><b>🛡 Control previo Urban Stay</b><span>${blockers?`${blockers} elementos obligatorios pendientes`:(issues.length?`${issues.length} recomendaciones antes de enviar`:'Sin incidencias detectadas')}</span></div>${issues.slice(0,4).map(x=>`<p class="${x.level}">• ${esc(x.message)}</p>`).join('')}</div><button type="button" class="btn secondary preview-final-btn" id="openPreviewFromReview">👁 Ver página completa antes de crearla</button>`;
}
function qualityScore(){
 let s=20;if(draft.name)s+=10;if(draft.address)s+=8;if(draft.photos.length)s+=15;if(draft.logo)s+=8;if(draft.wifiName)s+=8;if(Object.values(draft.parking).some(x=>x.on))s+=10;if(draft.restaurants.trim())s+=10;if(draft.events)s+=6;if(draft.bedSummary)s+=5;return Math.min(100,s);
}

function renderWizard(){
 const [key,title]=STEPS[state.wizardStep];
 $('#wizardStepCounter').textContent=`Paso ${state.wizardStep+1} de ${STEPS.length}`;
 $('#wizardStepTitle').textContent=title;
 let pct=$('#wizardProgressPct');if(!pct){pct=document.createElement('span');pct.id='wizardProgressPct';pct.className='wizard-progress-pct';$('#wizardStepCounter')?.parentElement?.appendChild(pct)}
 pct.textContent=`${Math.round(((state.wizardStep+1)/STEPS.length)*100)}% completado`;
 track('wizard_step',{step:state.wizardStep,name:title});
 $('#wizardProgressList').innerHTML=wizardProgress();
 $('#wizardStepContent').innerHTML=`<div class="wizard-editor-pane">${stepHtml(key)}</div><aside class="wizard-live-panel ${state.previewOpen?'open':''}" id="wizardLivePanel">${livePreviewHtml()}</aside>`;
 $('#wizardBack').textContent=`← ${tr('back')}`;
 $('#wizardSaveDraft').textContent=tr('saveDraft');
 $('#wizardNext').textContent=state.wizardStep===STEPS.length-1?tr('finish'):`${tr('next')} →`;
 $('#wizardBack').style.visibility=state.wizardStep===0?'hidden':'visible';
 ensurePreviewButton();
 bindWizard();
 updatePreview();
}
function ensurePreviewButton(){
 let btn=$('#wizardPreviewToggle');
 if(!btn){btn=document.createElement('button');btn.type='button';btn.id='wizardPreviewToggle';btn.className='btn secondary wizard-preview-toggle';$('.wizard-topline').appendChild(btn)}
 btn.textContent=`👁 ${tr('preview')}`;
}
function livePreviewHtml(){
 return `<div class="live-preview-head"><div><span class="eyebrow">VISTA PREVIA EN VIVO</span><b>${templateName(draft.template)}</b></div><div class="live-preview-actions"><div class="device-switch"><button type="button" data-device="mobile" class="${state.previewDevice==='mobile'?'active':''}">📱</button><button type="button" data-device="desktop" class="${state.previewDevice==='desktop'?'active':''}">💻</button></div><button type="button" id="closeLivePreview" class="live-preview-close" aria-label="Cerrar vista previa">×</button></div></div><div class="preview-stage"><div class="guest-phone ${state.previewDevice==='desktop'?'desktop':''}" id="guestPhone">${guestPreviewMarkup()}</div></div>`;
}
function guestPreviewMarkup(){
 const cover=draft.photos[draft.coverIndex]||draft.photos[0]||'';
 const parking=Object.entries((draft&&draft.parking)||{}).filter(([,v])=>v&&v.on);
 const amenities=Object.entries((draft&&draft.amenities)||{}).filter(([,v])=>v).slice(0,8).map(([k])=>amenityLabel(k));
 return `<div class="guest-theme theme-${draft.template}">
 <div class="guest-brand">${draft.logo?`<img src="${draft.logo}" alt="Logo">`:`<div class="guest-brand-text">${esc(draft.name||'Tu alojamiento')}</div>`}</div>
 <div class="guest-cover" ${cover?`style="background-image:url('${cover}')"`:''}><div><span>${esc((draft.city||'Tu ciudad').toUpperCase())}</span><h1>${esc(draft.name||'Tu alojamiento')}</h1><p>${draft.address?esc(draft.address):'Añade la dirección para verla aquí'}</p></div></div>
 <div class="guest-section"><h2>Bienvenido</h2><p>${draft.bedSummary?esc(draft.bedSummary):'Completa los datos del alojamiento y los verás al instante.'}</p></div>
 <div class="guest-section"><h3>Equipamiento</h3><div class="guest-chips">${amenities.length?amenities.map(x=>`<span>${x}</span>`).join(''):'<em>Marca equipamiento para verlo aquí</em>'}</div></div>
 <div class="guest-section"><h3>WiFi</h3><p>${draft.wifiName?`Red: <b>${esc(draft.wifiName)}</b>`:'Añade la red WiFi'}</p></div>
 <div class="guest-section"><h3>Aparcamiento</h3>${parking.length?parking.map(([k,v])=>`<div class="guest-parking"><b>${parkingLabel(k)}</b><p>${esc(v.info||'Añade información para el huésped')}</p></div>`).join(''):'<p>Este apartado no se mostrará hasta que actives una opción.</p>'}</div>
 ${draft.restaurants.trim()?`<div class="guest-section"><h3>Restaurantes</h3>${draft.restaurants.split('\n').filter(Boolean).slice(0,5).map(x=>`<div class="guest-list-item">${esc(x)}</div>`).join('')}</div>`:''}
 ${draft.events?`<div class="guest-section"><h3>Agenda</h3><p>${esc(draft.eventNotes||'Próximos eventos de la ciudad.')}</p></div>`:''}
 </div>`;
}
function amenityLabel(k){return ({tvBedrooms:'TV habitaciones',bedLinen:'Ropa de cama',towels:'Toallas',smartTv:'Smart TV',lift:'Ascensor',fridge:'Nevera',freezer:'Congelador',oven:'Horno',microwave:'Microondas',dishwasher:'Lavavajillas',washingMachine:'Lavadora',coffeeMaker:'Cafetera',toaster:'Tostadora',sandwichMaker:'Sandwichera',kettle:'Hervidor',kitchenware:'Menaje',dishes:'Vajilla',cutlery:'Cubiertos',potsPans:'Ollas',wineGlasses:'Copas',hairDryer:'Secador',toiletries:'Gel/champú',heating:'Calefacción',airConditioning:'Aire acondicionado',crib:'Cuna',highChair:'Trona',pets:'Mascotas'})[k]||k}
function parkingLabel(k){return ({free:'Parking gratuito',ora:'Zona ORA',private:'Parking privado',public:'Parking público',ev:'Carga eléctrica'})[k]||k}
function updatePreview(){
 const box=$('#guestPhone'); if(box)box.innerHTML=guestPreviewMarkup();
 const quality=$('#liveQuality'); if(quality)quality.textContent=qualityScore()+'%';
}

function openFinalPreview(){
 const dlg=$('#finalPreviewDialog');if(!dlg)return;
 $('#finalPreviewTitle').textContent=`${draft.name||'Tu alojamiento'} · ${templateName(draft.template)}`;
 const frame=$('#finalPreviewFrame');frame.innerHTML=guestPreviewMarkup();
 frame.className='final-preview-frame mobile';
 $('#finalPreviewMobile')?.classList.add('active');$('#finalPreviewDesktop')?.classList.remove('active');
 if(!dlg.open)dlg.showModal();
}
function closeFinalPreview(){const dlg=$('#finalPreviewDialog');if(dlg?.open)dlg.close()}
function setFinalPreviewDevice(device){
 const frame=$('#finalPreviewFrame');if(!frame)return;
 frame.className=`final-preview-frame ${device}`;
 $('#finalPreviewMobile')?.classList.toggle('active',device==='mobile');
 $('#finalPreviewDesktop')?.classList.toggle('active',device==='desktop');
}

function bindWizard(){
 $$('[data-jump]').forEach(b=>b.onclick=()=>{state.wizardStep=Number(b.dataset.jump);renderWizard()});
 $$('[data-bind]').forEach(el=>{
  el.oninput=el.onchange=()=>{draft[el.dataset.bind]=el.value;saveDraft();updatePreview()}
 });
 $$('[data-template]').forEach(el=>el.onchange=()=>{if(el.checked){draft.template=el.dataset.template;saveDraft();renderWizard()}});
 $$('[data-amenity]').forEach(el=>el.onchange=()=>{draft.amenities[el.dataset.amenity]=el.checked;saveDraft();const card=el.closest('.amenity-option');if(card){card.classList.toggle('selected',el.checked);const em=card.querySelector('em');if(em)em.textContent=el.checked?'Incluido':'No marcado';}updatePreview()});
 $$('[data-parking-action]').forEach(btn=>btn.onclick=e=>{
   e.preventDefault();e.stopPropagation();
   const k=btn.dataset.parkingAction;
   draft=normalizeDraft(draft);
   const next=!draft.parking[k].on;
   draft.parking[k].on=next;
   saveDraft();
   const card=btn.closest('[data-parking-card]');
   if(card){
     card.classList.toggle('active',next);
     const sm=card.querySelector('small');if(sm)sm.textContent=next?'Activo en la guía':'No activo';
     btn.classList.toggle('is-on',next);
     btn.setAttribute('aria-pressed',next?'true':'false');
     btn.textContent=next?'Desactivar':'Activar';
     const body=card.querySelector('.parking-detail-body');
     if(body){body.hidden=!next;body.style.display=next?'block':'none'}
   }
   try{updatePreview()}catch(err){console.warn('preview parking',err)}
 });
 $$('[data-parking-info]').forEach(el=>el.oninput=()=>{
   const k=el.dataset.parkingInfo;
   draft=normalizeDraft(draft);
   draft.parking[k].info=el.value;saveDraft();
   try{updatePreview()}catch(err){console.warn('preview parking info',err)}
 });
 const ev=$('#eventsToggle');if(ev)ev.onchange=()=>{draft.events=ev.checked;saveDraft();const wrap=ev.closest('.agenda-switch');const tg=wrap?.querySelector('.toggle');if(tg)tg.classList.toggle('on',ev.checked);const sm=wrap?.querySelector('small');if(sm)sm.textContent=ev.checked?'Activada':'Desactivada';updatePreview()};
 const logo=$('#logoInput');if(logo)logo.onchange=async e=>{
   const file=e.target.files?.[0],status=$('#photoUploadStatus');
   if(!file)return;
   if(status)status.textContent='Procesando logo…';
   try{
     draft.logo=await compressImage(file,600,.72);
     saveDraft();refreshMediaStep();try{updatePreview()}catch{}
     if(status)status.textContent='✓ Logo añadido';
   }catch(err){
     console.error('Logo upload failed',err);
     if(status)status.textContent='No se pudo procesar el logo. Prueba con JPG, PNG o WEBP.';
     toast('No se pudo procesar el logo.');
   }finally{logo.value=''}
 };
 const photos=$('#photosInput');if(photos)photos.onchange=async e=>{
   const files=[...(e.target.files||[])],status=$('#photoUploadStatus');
   if(!files.length)return;
   if(status)status.textContent='Procesando fotografías…';
   const slots=Math.max(0,12-draft.photos.length);
   if(!slots){if(status)status.textContent='Ya has alcanzado el máximo de 12 fotos.';photos.value='';return}
   const selected=files.slice(0,slots),vals=[];
   for(const file of selected){
     try{vals.push(await compressImage(file,900,.60))}
     catch(err){console.error('Photo upload failed',file?.name,err)}
   }
   if(vals.length){
     draft.photos=[...draft.photos,...vals];
     saveDraft();refreshMediaStep();try{updatePreview()}catch{}
     if(status)status.textContent=`✓ ${vals.length} foto(s) añadida(s)${vals.length<selected.length?' · alguna no pudo procesarse':''}`;
   }else{
     if(status)status.textContent='No se pudo procesar ninguna foto. Prueba con JPG, PNG o WEBP.';
     toast('No se pudieron procesar las fotografías.');
   }
   photos.value='';
 };
 bindPhotoActionButtons();
 $$('[data-device]').forEach(b=>b.onclick=()=>{state.previewDevice=b.dataset.device;$$('[data-device]').forEach(x=>x.classList.toggle('active',x.dataset.device===state.previewDevice));const phone=$('#guestPhone');if(phone)phone.classList.toggle('desktop',state.previewDevice==='desktop')});
 $('#openPreviewFromReview')?.addEventListener('click',openFinalPreview);
const previewToggle=$('#wizardPreviewToggle');
if(previewToggle)previewToggle.onclick=()=>{
  state.previewOpen=!state.previewOpen;
  const panel=$('#wizardLivePanel');
  if(panel)panel.classList.toggle('open',state.previewOpen);
};
 $('#closeLivePreview')?.addEventListener('click',()=>{state.previewOpen=false;const panel=$('#wizardLivePanel');if(panel)panel.classList.remove('open')});
}
function compressImage(file,maxSide=1000,quality=.65){
 return new Promise((resolve,reject)=>{
  if(!file||file.size===0)return reject(new Error('empty'));
  const r=new FileReader();
  r.onerror=()=>reject(new Error('read'));
  r.onload=()=>{
   const img=new Image();
   img.onerror=()=>reject(new Error('image'));
   img.onload=()=>{
    try{
     let w=img.naturalWidth||img.width,h=img.naturalHeight||img.height;
     if(!w||!h)return reject(new Error('dimensions'));
     const scale=Math.min(1,maxSide/Math.max(w,h));
     w=Math.max(1,Math.round(w*scale));h=Math.max(1,Math.round(h*scale));
     const c=document.createElement('canvas');c.width=w;c.height=h;
     const ctx=c.getContext('2d',{alpha:false});if(!ctx)return reject(new Error('canvas'));
     ctx.drawImage(img,0,0,w,h);
     resolve(c.toDataURL('image/jpeg',quality));
    }catch(err){reject(err)}
   };
   img.src=r.result;
  };
  r.readAsDataURL(file);
 });
}
async function createProperty(){
  if(!draft.name){
    toast('Añade un nombre al alojamiento.');
    state.wizardStep=0;
    renderWizard();
    return;
  }

  const slug=(draft.slug||draft.name)
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g,'')
    .replace(/[^a-z0-9]+/g,'-')
    .replace(/(^-|-$)/g,'');

  if(!DB){
    toast('No hay conexión con Supabase.');
    return;
  }

  const {data:{user},error:userError}=await DB.auth.getUser();

  if(userError || !user){
    toast('Tu sesión ha caducado. Vuelve a iniciar sesión.');
    return;
  }

  const normalized=normalizeDraft(draft);

  const {data:property,error:propertyError}=await DB
    .from('properties')
    .insert({
      owner_id:user.id,
      name:draft.name,
      slug:slug||null,
      city:draft.city||'',
      country:draft.country||null,
      address:draft.address||null,
      status:'draft'
    })
    .select()
    .single();

  if(propertyError){
    console.error(propertyError);
    toast('No se pudo guardar la propiedad en el servidor.');
    return;
  }

  const {error:contentError}=await DB
    .from('property_content')
    .insert({
      property_id:property.id,
      content:normalized
    });

  if(contentError){
    console.error(contentError);
    toast('La propiedad se creó, pero no se pudo guardar su contenido.');
    return;
  }

  const props=getUserProps();
  props.push({
    id:property.id,
    name:draft.name,
    city:`${draft.city}, ${draft.country}`,
    visits:0,
    updated:new Date().toLocaleDateString('es-ES'),
    rating:'—',
    status:'draft',
    wizardData:JSON.parse(JSON.stringify(normalized))
  });

  saveUserProps(props);
  localStorage.removeItem(KEYS.draft);
  draft=blankDraft();
  closeWizard();
  state.route='properties';
  render();

  toast('Propiedad guardada en Urban Stay');
  track('property_created',{id:property.id});

  setTimeout(()=>{
    if(confirm('Propiedad guardada. ¿Quieres enviar ahora tu prueba a Revisión Urban Stay?')){
      sendForReview(property.id);
    }
  },250);
}

function bindPage(){
 $$('[data-route]').forEach(b=>b.onclick=()=>nav(b.dataset.route));
$('#newProperty')?.addEventListener('click',openNewPropertyWizard);
$('#newPropertyTop')?.addEventListener('click',openNewPropertyWizard);
 $('#openModeration')?.addEventListener('click',()=>nav('moderation'));
 $$('[data-send-review]').forEach(b=>b.onclick=e=>{e.stopPropagation();sendForReview(b.dataset.sendReview)});
 $$('[data-approve]').forEach(b=>b.onclick=e=>{e.stopPropagation();moderationAction(b.dataset.approve,'approved')});
 $$('[data-request-changes]').forEach(b=>b.onclick=e=>{e.stopPropagation();moderationAction(b.dataset.requestChanges,'changes_requested')});
 $$('[data-status-property]').forEach(b=>b.onclick=e=>{e.stopPropagation();setPropertyStatus(b.dataset.statusProperty,b.dataset.status)});
 $$('[data-delete-property]').forEach(b=>b.onclick=e=>{e.stopPropagation();deleteProperty(b.dataset.deleteProperty)});
 $$('[data-property-actions]').forEach(x=>x.onclick=e=>e.stopPropagation());
$$('[data-open-property]').forEach(x=>x.onclick=()=>{
  const p=allProps().find(y=>y.id===x.dataset.openProperty);

  if(p?.wizardData){
    state.selectedProperty=p.id;
    draft=normalizeDraft(JSON.parse(JSON.stringify(p.wizardData)));
    saveDraft();
    openWizard();
  }else{
    toast('Living Lab de demostración');
  }
});
}
async function saveCurrentDraft(){
  saveDraft();

 if(!state.selectedProperty){
  const saveBtn=$('#wizardSaveDraft');

  if(saveBtn){
    const oldText=saveBtn.textContent;
    saveBtn.textContent='✓ Guardado';
    saveBtn.disabled=true;

    setTimeout(()=>{
      saveBtn.textContent=oldText;
      saveBtn.disabled=false;
    },1800);
  }

  toast('✓ Borrador guardado correctamente');
  return;
}

  if(!DB){
    toast('No hay conexión con Supabase.');
    return;
  }

  const normalized=normalizeDraft(draft);

  const {error:propertyError}=await DB
    .from('properties')
    .update({
      name:draft.name,
      city:draft.city||'',
      country:draft.country||null,
      address:draft.address||null
    })
    .eq('id',state.selectedProperty);

  if(propertyError){
    console.error(propertyError);
    toast('No se pudo actualizar la propiedad.');
    return;
  }

  const {error:contentError}=await DB
    .from('property_content')
    .update({
      content:normalized
    })
    .eq('property_id',state.selectedProperty);

  if(contentError){
    console.error(contentError);
    toast('No se pudo actualizar el contenido.');
    return;
  }

  const props=getUserProps();
  const index=props.findIndex(p=>p.id===state.selectedProperty);

  if(index>=0){
    props[index]={
      ...props[index],
      name:draft.name,
      city:[draft.city,draft.country].filter(Boolean).join(', '),
      updated:new Date().toLocaleDateString('es-ES'),
      wizardData:JSON.parse(JSON.stringify(normalized))
    };
    saveUserProps(props);
  }

const saveBtn=$('#wizardSaveDraft');

if(saveBtn){
  const oldText=saveBtn.textContent;
  saveBtn.textContent='✓ Guardado';
  saveBtn.disabled=true;

  setTimeout(()=>{
    saveBtn.textContent=oldText;
    saveBtn.disabled=false;
  },1800);
}

toast('✓ Borrador guardado correctamente');
}
function boot(){
 cleanupLegacyTestData();
 $('#startRegistration')?.addEventListener('click',()=>setStage('register'));
 $$('[data-demo-preview]').forEach(b=>b.addEventListener('click',()=>openExternalDemo(b.dataset.demoPreview)));
 $('#closeExternalDemo')?.addEventListener('click',closeExternalDemo);
 $('#startFromDemo')?.addEventListener('click',()=>{closeExternalDemo();setStage('register')});
 $('#showLogin')?.addEventListener('click',()=>setStage('login'));
 $$('[data-back]').forEach(b=>b.addEventListener('click',()=>setStage(b.dataset.back)));
 $('#createAccount')?.addEventListener('click',register);
 $('#loginAccount')?.addEventListener('click',login);
 $('#createFirstProperty')?.addEventListener('click',()=>{hideOnboarding();openWizard()});
 $('#goDashboardInstead')?.addEventListener('click',()=>{hideOnboarding();render()});
 $('#closePropertyWizard')?.addEventListener('click',closeWizard);
 $('#closeFinalPreview')?.addEventListener('click',closeFinalPreview);
 $('#finalPreviewDone')?.addEventListener('click',closeFinalPreview);
 $('#finalPreviewMobile')?.addEventListener('click',()=>setFinalPreviewDevice('mobile'));
 $('#finalPreviewDesktop')?.addEventListener('click',()=>setFinalPreviewDevice('desktop'));
 $('#closeFeedbackDialog')?.addEventListener('click',closeFeedbackDialog);
 $('#finishFeedback')?.addEventListener('click',closeFeedbackDialog);
 $('#saveFeedback')?.addEventListener('click',()=>{
   const row={ease:$('#fbEase')?.value,doubts:$('#fbDoubts')?.value||'',missing:$('#fbMissing')?.value||'',at:new Date().toISOString()};
   try{const a=JSON.parse(localStorage.getItem(KEYS.feedback)||'[]');a.push(row);localStorage.setItem(KEYS.feedback,JSON.stringify(a))}catch{}
   track('feedback_submitted',{ease:row.ease});
   const sum=buildTestSummary(row),ta=$('#feedbackSummary'),box=$('#feedbackResult');
   if(ta)ta.value=sum;if(box){box.hidden=false;box.scrollIntoView({behavior:'smooth',block:'start'})}
   $('#saveFeedback').disabled=true;toast('Gracias. Ya puedes copiar el resumen de la prueba o volver al Dashboard.');
 });
 $('#copyFeedbackSummary')?.addEventListener('click',async()=>{
   const text=$('#feedbackSummary')?.value||'';
   try{await navigator.clipboard.writeText(text);toast('Resumen copiado. Ya puedes enviarlo por WhatsApp o email.')}
   catch{const ta=$('#feedbackSummary');ta?.select();document.execCommand('copy');toast('Resumen copiado.')}
 });
 $('#wizardBack')?.addEventListener('click',()=>{if(state.wizardStep>0){state.wizardStep--;renderWizard()}});
$('#wizardSaveDraft')?.addEventListener('click',saveCurrentDraft);
 $('#wizardNext')?.addEventListener('click',()=>{if(state.wizardStep<STEPS.length-1){state.wizardStep++;renderWizard()}else createProperty()});
 $('#ownerLanguage')?.addEventListener('change',e=>{state.lang=e.target.value;localStorage.setItem(KEYS.lang,state.lang);render()});
 $('#mobileMenu')?.addEventListener('click',()=>$('#sidebar')?.classList.toggle('open'));
 $('#feedbackDialog')?.addEventListener('cancel',e=>{e.preventDefault();closeFeedbackDialog()});
 const logged=localStorage.getItem(KEYS.session)==='1'&&getOwner();
 if(logged)hideOnboarding(); else showOnboarding(getOwner()?'login':'welcome');
 applyStatic();render();
}

document.addEventListener('DOMContentLoaded',boot);
})();
