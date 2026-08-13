window.URBAN_STAY_DATA = {
  properties: [
    {id:'zamora-89', name:'Zamora 89', city:'Vigo, España', visits:26, updated:'30/07/2026', rating:'4,9', occupancy:'74%', status:'active', imageClass:'zamora'},
    {id:'barcelona-80', name:'Barcelona 80', city:'Vigo, España', visits:14, updated:'29/07/2026', rating:'4,8', occupancy:'62%', status:'active', imageClass:'barcelona'}
  ],
  languages: [
    {code:'es',label:'Español',flag:'🇪🇸',progress:100,active:true},
    {code:'en',label:'English',flag:'🇬🇧',progress:100,active:true},
    {code:'fr',label:'Français',flag:'🇫🇷',progress:86,active:true},
    {code:'de',label:'Deutsch',flag:'🇩🇪',progress:72,active:true},
    {code:'it',label:'Italiano',flag:'🇮🇹',progress:64,active:true},
    {code:'pt',label:'Português',flag:'🇵🇹',progress:61,active:true},
    {code:'nl',label:'Nederlands',flag:'🇳🇱',progress:45,active:false}
  ],
  translations: {
    es:{dashboard:'Dashboard',properties:'Propiedades',agenda:'Agenda',settings:'Configuración',systemOnline:'Sistema operativo',allWorking:'Todo funcionando correctamente',owner:'Propietario',hello:'¡Buenos días, Iván! 👋',intro:'Gestiona tus propiedades y la experiencia de tus huéspedes desde un único lugar.',myProperties:'MIS PROPIEDADES',recent:'ACTIVIDAD RECIENTE',quick:'ACCIONES RÁPIDAS',addProperty:'Añadir nueva propiedad',active:'Activa',visitsToday:'Visitas hoy',lastUpdate:'Última actualización',rating:'Valoración media',manageLanguages:'Gestionar idiomas',save:'Guardar cambios'},
    en:{dashboard:'Dashboard',properties:'Properties',agenda:'Agenda',settings:'Settings',systemOnline:'System online',allWorking:'Everything is working correctly',owner:'Owner',hello:'Good morning, Iván! 👋',intro:'Manage your properties and guest experience from one place.',myProperties:'MY PROPERTIES',recent:'RECENT ACTIVITY',quick:'QUICK ACTIONS',addProperty:'Add new property',active:'Active',visitsToday:'Visits today',lastUpdate:'Last update',rating:'Average rating',manageLanguages:'Manage languages',save:'Save changes'},
    fr:{dashboard:'Tableau de bord',properties:'Propriétés',agenda:'Agenda',settings:'Paramètres',systemOnline:'Système opérationnel',allWorking:'Tout fonctionne correctement',owner:'Propriétaire',hello:'Bonjour, Iván ! 👋',intro:'Gérez vos propriétés et l’expérience de vos voyageurs depuis un seul endroit.',myProperties:'MES PROPRIÉTÉS',recent:'ACTIVITÉ RÉCENTE',quick:'ACTIONS RAPIDES',addProperty:'Ajouter une propriété',active:'Active',visitsToday:'Visites aujourd’hui',lastUpdate:'Dernière mise à jour',rating:'Note moyenne',manageLanguages:'Gérer les langues',save:'Enregistrer'},
    de:{dashboard:'Dashboard',properties:'Unterkünfte',agenda:'Kalender',settings:'Einstellungen',systemOnline:'System aktiv',allWorking:'Alles funktioniert ordnungsgemäß',owner:'Eigentümer',hello:'Guten Morgen, Iván! 👋',intro:'Verwalte Unterkünfte und Gästeerlebnis an einem Ort.',myProperties:'MEINE UNTERKÜNFTE',recent:'LETZTE AKTIVITÄTEN',quick:'SCHNELLAKTIONEN',addProperty:'Unterkunft hinzufügen',active:'Aktiv',visitsToday:'Besuche heute',lastUpdate:'Letzte Aktualisierung',rating:'Durchschnittsbewertung',manageLanguages:'Sprachen verwalten',save:'Speichern'},
    it:{dashboard:'Dashboard',properties:'Proprietà',agenda:'Agenda',settings:'Impostazioni',systemOnline:'Sistema operativo',allWorking:'Tutto funziona correttamente',owner:'Proprietario',hello:'Buongiorno, Iván! 👋',intro:'Gestisci proprietà ed esperienza degli ospiti da un unico posto.',myProperties:'LE MIE PROPRIETÀ',recent:'ATTIVITÀ RECENTE',quick:'AZIONI RAPIDE',addProperty:'Aggiungi proprietà',active:'Attiva',visitsToday:'Visite oggi',lastUpdate:'Ultimo aggiornamento',rating:'Valutazione media',manageLanguages:'Gestisci lingue',save:'Salva'},
    pt:{dashboard:'Dashboard',properties:'Propriedades',agenda:'Agenda',settings:'Definições',systemOnline:'Sistema operacional',allWorking:'Tudo a funcionar corretamente',owner:'Proprietário',hello:'Bom dia, Iván! 👋',intro:'Gira propriedades e a experiência dos hóspedes num único lugar.',myProperties:'AS MINHAS PROPRIEDADES',recent:'ATIVIDADE RECENTE',quick:'AÇÕES RÁPIDAS',addProperty:'Adicionar propriedade',active:'Ativa',visitsToday:'Visitas hoje',lastUpdate:'Última atualização',rating:'Avaliação média',manageLanguages:'Gerir idiomas',save:'Guardar'}
  }
};

// v0.9.2 extended interface labels
Object.assign(window.URBAN_STAY_DATA.translations.es,{
  guide:'Guía',accessManager:'Gestor de accesos',discover:'Descubrir',partners:'Colaboradores',lab:'Urban Stay Lab',
  ownerRole:'Propietario',viewProperties:'Ver propiedades',addPropertyLong:'Añadir nueva propiedad',
  activeProperties:'PROPIEDADES ACTIVAS',visitsTodayLong:'VISITAS HOY',averageRatingLong:'VALORACIÓN MEDIA',
  averageOccupancy:'OCUPACIÓN MEDIA',portfolioActive:'Portfolio activo',manageAll:'Gestionar todo',latest:'Lo último',
  manageExperience:'Gestiona la experiencia',guideBuilder:'Constructor de guía',guestContent:'Contenido del huésped',
  accessCodes:'Códigos y accesos',placesExperiences:'Lugares y experiencias',eventsActivities:'Eventos y actividades',
  insightsOptimization:'Insights y optimización',localEcosystem:'Ecosistema local',platformHealth:'ESTADO DE LA PLATAFORMA',
  readyToGrow:'Todo preparado para crecer.',draft:'Borrador',guestPreview:'Vista huésped',publish:'Publicar',
  general:'General',configuration:'Configuración'
});
Object.assign(window.URBAN_STAY_DATA.translations.en,{
  guide:'Guide',accessManager:'Access Manager',discover:'Discover',partners:'Partners',lab:'Urban Stay Lab',ownerRole:'Owner',
  viewProperties:'View properties',addPropertyLong:'Add new property',activeProperties:'ACTIVE PROPERTIES',
  visitsTodayLong:'VISITS TODAY',averageRatingLong:'AVERAGE RATING',averageOccupancy:'AVERAGE OCCUPANCY',
  portfolioActive:'Active portfolio',manageAll:'Manage all',latest:'Latest',manageExperience:'Manage the experience',
  guideBuilder:'Guide Builder',guestContent:'Guest content',accessCodes:'Codes and access',
  placesExperiences:'Places and experiences',eventsActivities:'Events and activities',
  insightsOptimization:'Insights and optimization',localEcosystem:'Local ecosystem',platformHealth:'PLATFORM HEALTH',
  readyToGrow:'Everything ready to grow.',draft:'Draft',guestPreview:'Guest preview',publish:'Publish',
  general:'General',configuration:'Settings'
});
Object.assign(window.URBAN_STAY_DATA.translations.fr,{
  guide:'Guide',accessManager:'Gestion des accès',discover:'Découvrir',partners:'Partenaires',lab:'Urban Stay Lab',
  ownerRole:'Propriétaire',viewProperties:'Voir les propriétés',addPropertyLong:'Ajouter une propriété',
  activeProperties:'PROPRIÉTÉS ACTIVES',visitsTodayLong:'VISITES AUJOURD’HUI',averageRatingLong:'NOTE MOYENNE',
  averageOccupancy:'OCCUPATION MOYENNE',portfolioActive:'Portefeuille actif',manageAll:'Tout gérer',latest:'Dernières activités',
  manageExperience:'Gérer l’expérience',guideBuilder:'Constructeur de guide',guestContent:'Contenu voyageur',
  accessCodes:'Codes et accès',placesExperiences:'Lieux et expériences',eventsActivities:'Événements et activités',
  insightsOptimization:'Insights et optimisation',localEcosystem:'Écosystème local',platformHealth:'ÉTAT DE LA PLATEFORME',
  readyToGrow:'Tout est prêt pour grandir.',draft:'Brouillon',guestPreview:'Aperçu voyageur',publish:'Publier',
  general:'Général',configuration:'Paramètres'
});
Object.assign(window.URBAN_STAY_DATA.translations.de,{
  guide:'Guide',accessManager:'Zugangsverwaltung',discover:'Entdecken',partners:'Partner',lab:'Urban Stay Lab',
  ownerRole:'Eigentümer',viewProperties:'Unterkünfte anzeigen',addPropertyLong:'Unterkunft hinzufügen',
  activeProperties:'AKTIVE UNTERKÜNFTE',visitsTodayLong:'BESUCHE HEUTE',averageRatingLong:'DURCHSCHNITTSBEWERTUNG',
  averageOccupancy:'DURCHSCHNITTSBELEGUNG',portfolioActive:'Aktives Portfolio',manageAll:'Alle verwalten',
  latest:'Neueste Aktivitäten',manageExperience:'Gästeerlebnis verwalten',guideBuilder:'Guide Builder',
  guestContent:'Gästeinhalte',accessCodes:'Codes und Zugänge',placesExperiences:'Orte und Erlebnisse',
  eventsActivities:'Events und Aktivitäten',insightsOptimization:'Insights und Optimierung',localEcosystem:'Lokales Netzwerk',
  platformHealth:'PLATTFORMSTATUS',readyToGrow:'Alles bereit zum Wachsen.',draft:'Entwurf',
  guestPreview:'Gästevorschau',publish:'Veröffentlichen',general:'Allgemein',configuration:'Einstellungen'
});
Object.assign(window.URBAN_STAY_DATA.translations.it,{
  guide:'Guida',accessManager:'Gestione accessi',discover:'Scopri',partners:'Partner',lab:'Urban Stay Lab',
  ownerRole:'Proprietario',viewProperties:'Vedi proprietà',addPropertyLong:'Aggiungi proprietà',
  activeProperties:'PROPRIETÀ ATTIVE',visitsTodayLong:'VISITE OGGI',averageRatingLong:'VALUTAZIONE MEDIA',
  averageOccupancy:'OCCUPAZIONE MEDIA',portfolioActive:'Portfolio attivo',manageAll:'Gestisci tutto',latest:'Ultime attività',
  manageExperience:'Gestisci l’esperienza',guideBuilder:'Costruttore guida',guestContent:'Contenuti ospite',
  accessCodes:'Codici e accessi',placesExperiences:'Luoghi ed esperienze',eventsActivities:'Eventi e attività',
  insightsOptimization:'Insight e ottimizzazione',localEcosystem:'Ecosistema locale',platformHealth:'STATO PIATTAFORMA',
  readyToGrow:'Tutto pronto per crescere.',draft:'Bozza',guestPreview:'Anteprima ospite',publish:'Pubblica',
  general:'Generale',configuration:'Impostazioni'
});
Object.assign(window.URBAN_STAY_DATA.translations.pt,{
  guide:'Guia',accessManager:'Gestor de acessos',discover:'Descobrir',partners:'Parceiros',lab:'Urban Stay Lab',
  ownerRole:'Proprietário',viewProperties:'Ver propriedades',addPropertyLong:'Adicionar propriedade',
  activeProperties:'PROPRIEDADES ATIVAS',visitsTodayLong:'VISITAS HOJE',averageRatingLong:'AVALIAÇÃO MÉDIA',
  averageOccupancy:'OCUPAÇÃO MÉDIA',portfolioActive:'Portfólio ativo',manageAll:'Gerir tudo',latest:'Últimas atividades',
  manageExperience:'Gerir a experiência',guideBuilder:'Construtor do guia',guestContent:'Conteúdo do hóspede',
  accessCodes:'Códigos e acessos',placesExperiences:'Locais e experiências',eventsActivities:'Eventos e atividades',
  insightsOptimization:'Insights e otimização',localEcosystem:'Ecossistema local',platformHealth:'ESTADO DA PLATAFORMA',
  readyToGrow:'Tudo pronto para crescer.',draft:'Rascunho',guestPreview:'Pré-visualização hóspede',publish:'Publicar',
  general:'Geral',configuration:'Definições'
});

// v0.9.5 labels
const USP_LABELS={
 es:{guide:'Guía',accessManager:'Gestor de accesos',discover:'Descubrir',partners:'Colaboradores'},
 en:{guide:'Guide',accessManager:'Access Manager',discover:'Discover',partners:'Partners'},
 fr:{guide:'Guide',accessManager:'Gestion des accès',discover:'Découvrir',partners:'Partenaires'},
 de:{guide:'Guide',accessManager:'Zugangsverwaltung',discover:'Entdecken',partners:'Partner'},
 it:{guide:'Guida',accessManager:'Gestione accessi',discover:'Scopri',partners:'Partner'},
 pt:{guide:'Guia',accessManager:'Gestor de acessos',discover:'Descobrir',partners:'Parceiros'}
};
Object.keys(USP_LABELS).forEach(k=>Object.assign(window.URBAN_STAY_DATA.translations[k],USP_LABELS[k]));
