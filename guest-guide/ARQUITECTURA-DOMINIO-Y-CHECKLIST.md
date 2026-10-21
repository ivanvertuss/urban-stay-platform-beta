# Arquitectura definitiva de dominios — Urban Stay Guide

## Decisión confirmada
Todas las guías de huéspedes se servirán bajo **https://urbanstayguide.com/**, usando una ruta por alojamiento.

- `https://urbanstayguide.com/el-almendro/` — piloto ficticio en Vigo.
- `https://urbanstayguide.com/barcelona-80/` — migración posterior.
- `https://urbanstayguide.com/zamora-89/` — migración posterior.
- Futuras propiedades: `https://urbanstayguide.com/{slug-de-la-propiedad}/`.

Las páginas existentes de Barcelona 80 y Zamora 89 permanecen intactas hasta revisar migración, redirecciones y enlaces externos. No tocar DNS de Arsys, CNAME, GitHub Pages ni producción sin validación.

## Reglas de arquitectura
- Una única aplicación/plantilla visual compartida, configurada por propiedad y slug.
- Un único origen para recursos compartidos, idiomas, PWA y módulos; cada propiedad con contenido y autorizaciones independientes.
- Los datos de Agenda, Colaboradores y Promociones solo proceden de un servicio público con filtros **en servidor** por propiedad, ciudad, ámbito, vigencia y autorización editorial por elemento.
- La publicación de una propiedad NO autoriza automáticamente la publicación de sus eventos, colaboradores ni ofertas.
- Evitar service_role, datos de propietarios, paneles de administración y secretos en HTML/JS públicos.
- Rutas de carga directa y recarga de navegador deben funcionar: `/el-almendro/`, etc.; verificar 404, enlaces internos y navegación.
- Resolver manifest, iconos y service worker de forma que una guía no invada ni cachee datos privados de otra.
- URLs canónicas y sitemap por propiedad solo cuando se autorice la publicación real.

## Checklist de auditoría de El Almendro (2026-10-21)
- [x] Diseño de trabajo existente en rama `feature/guest-guide-el-almendro`.
- [x] Selector de idiomas ES, EN, FR, PT, DE y traducciones iniciales.
- [x] Modelo de autorizaciones explícitas `guest_guide_item_publications` creado en Supabase (RLS activado, sin acceso directo anon/authenticated).
- [x] Código de Edge Function actualizado en GitHub para comprobar autorizaciones por elemento.
- [ ] Desplegar y verificar Edge Function actualizada con JWT habilitado; ejecutar pruebas negativas de acceso y revocación antes de permitir acceso anónimo.
- [ ] Implementar controles editoriales seguros para aprobar y revocar elementos.
- [ ] Conectar adaptador de contenidos a endpoint seguro y probar con datos autorizados.
- [ ] Comprobar traducción completa, textos dinámicos, cambio de idioma y accesibilidad.
- [ ] Reemplazar dependencia de CSS externo `zamora89urbanstay.com/styles.css` por recursos propios compartidos.
- [ ] Comprobar experiencia móvil, menú, navegación, enlaces, fotos, carga y accesibilidad.
- [ ] Implementar/validar PWA, manifest, iconos y aislamiento del service worker.
- [ ] Probar rutas `/el-almendro/`, recarga y enlaces directos en hosting real.
- [ ] Revisar DNS/hosting de Arsys y configurar dominio solo tras aprobación.
- [ ] Obtener visto bueno visual y funcional antes de publicar.
