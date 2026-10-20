# Integración pública de El Almendro (Vigo) — revisión 2026-10-20

## Verificado directamente en Supabase
- Proyecto Urban Stay Platform, región eu-west-1, operativo.
- RLS activado en properties, property_publications, events, property_collaborators y urban_stay_partners.
- Existe una publicación con slug real `el-almendro-509ab578` e `is_published=true`. La ruta comercial `/el-almendro` debe resolverse a esa publicación sin modificar el slug existente.
- `events` y `property_collaborators` solo tienen lectura de propietario autenticado. No conceder SELECT a anon.
- `urban_stay_partners` tiene una política de SELECT para authenticated con condición true además de otra limitada a activos y vigentes; revisar esta superposición antes de exponer datos. No cambiar políticas existentes sin prueba de regresión.
- `agenda-city` y `enrich-place` activas y con JWT requerido.

## Contrato del futuro endpoint público
- Entrada: ruta `/el-almendro` resuelta en servidor a publicación `el-almendro-509ab578`.
- Salida exclusivamente campos autorizados: `property.slug`, `property.city`, y arrays `agenda`, `collaborators`, `promotions`, cada elemento con `title`, `description`, `url`, `published`, `active`, `expiresAt` cuando aplique.
- Autorizar servidor: publicación activa, propiedad publicada y aprobada, ciudad Vigo, fechas vigentes y ámbito geográfico aplicable. Nunca devolver `owner_id`, direcciones privadas, sesiones ni claves.
- Las fuentes externas de agenda se normalizarán y validarán por servidor; no se mostrarán eventos caducados.
- La guía `vista-diseno-original.html` tiene `public-guide-adapter.js` incorporado pero sin URL de endpoint: muestra un estado de espera y no inventa contenidos.

## Pendiente
1. Revisar la política redundante de urban_stay_partners y el modelo de aprobación/publicación.
2. Implementar endpoint de solo lectura y pruebas de aislamiento entre propiedades, preferiblemente primero en entorno de pruebas.
3. Conectar URL del endpoint a la guía, verificar cargas y estados vacíos.
4. Mantener sin cambios DNS, CNAME de Beta y sitios Barcelona 80 / Zamora 89.
