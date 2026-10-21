# Urban Stay Guide — punto de recuperación (21 octubre 2026)

## Decisiones confirmadas
- Terminar y verificar **El Almendro** antes de extender las funciones a Barcelona 80 y Zamora 89.
- Rutas finales previstas: `urbanstayguide.com/el-almendro/`, `/barcelona-80/`, `/zamora-89/`.
- No modificar DNS/Arsys, producción, ni ramas principales sin aprobación.
- La plataforma debe ofrecer guías de alojamientos en ES, EN, FR, PT y DE, Agenda, Colaboradores, Promociones y acceso desde móvil.

## Código guardado
- Repo: `ivanvertuss/urban-stay-platform-beta`.
- Rama aislada: `feature/guest-guide-el-almendro`.
- `guest-guide/el-almendro/index.html` y `vista-diseno-original.html`: diseño aprobado.
- `guest-guide/el-almendro/styles.css`: estilos locales, sin depender de Zamora 89.
- `guest-guide/el-almendro/guide-languages.js`: selector de cinco idiomas, preferencia local; traducciones por revisar.
- `guest-guide/el-almendro/public-guide-adapter.js`: cliente sin claves privadas, todavía sin URL pública configurada.
- `guest-guide/supabase/functions/guest-guide-public/index.ts`: función de lectura protegida, ya probada manualmente con HTTP 200 y secciones vacías.
- `guest-guide/supabase/functions/guest-guide-feed/index.ts`: nueva función con consultas limitadas a IDs explícitamente autorizados.

## Supabase
- Proyecto: `wojfialcbjkviwyjiaqa`.
- `guest-guide-public`: ACTIVE v4, `verify_jwt=true`; prueba manual anterior GET `property=el-almendro`: HTTP 200, agenda/colaboradores/promociones vacíos.
- `guest-guide-feed`: ACTIVE v1, `verify_jwt=true` (desplegada el 21/10/2026). **No es todavía pública ni se ha probado extremo a extremo desde navegador.**
- Tabla `guest_guide_item_publications` con aprobaciones por elemento; recuento de aprobaciones positivas al 21/10/2026: **0**.
- Se concedió SELECT a `service_role` en tablas de lectura necesarias, sin ampliar acceso a `anon` o `authenticated`.

## Pruebas y pendientes
- Revisión estática: enlaces internos sin destinos rotos, IDs sin duplicados, hoja CSS local, cinco opciones de idioma y viewport móvil.
- No hay todavía validación visual real en móvil, ni revisión completa de traducciones, ni PWA/instalación probada.
- Fotografías actuales: cuatro imágenes ilustrativas de Unsplash, no definitivas.
- Antes de publicar: probar `guest-guide-feed` (autorización, ámbito geográfico, revocación), establecer mecanismo público seguro sin credenciales privadas en navegador, conectar el adaptador, verificar idiomas y móvil, preparar PWA y despliegue en dominio con autorización.
- Barcelona 80 y Zamora 89 siguen en sus sitios públicos; ramas de preparación `feature/urban-stay-guide-unified` en sus respectivos repos.

**Próxima sesión:** verificar nueva función y su seguridad, completar integración pública, auditar traducciones y habilitar pruebas móviles. No afirmar que está publicado.
