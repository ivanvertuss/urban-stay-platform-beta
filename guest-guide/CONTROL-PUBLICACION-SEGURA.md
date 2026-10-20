# Bloqueo de publicación pública — 2026-10-20

## Verificaciones
- Supabase confirmó que la publicación `el-almendro-509ab578` está activa, que la propiedad tiene ciudad `Vigo`, estado `published` y revisión `approved`.
- La Edge Function `guest-guide-public` v1 está desplegada y activa, pero con `verify_jwt=true`. No es accesible directamente por huéspedes anónimos.
- Las tablas tienen RLS habilitado. No modificar sus políticas para permitir acceso anónimo.
- Las columnas de `property_collaborators` y `urban_stay_partners` incluyen `is_active`, pero **no** un consentimiento/estado independiente de `publicado para huéspedes`. `is_active` no debe considerarse autorización pública por sí solo.
- La tabla `events` no contiene bandera de aprobación/publicación por evento.
- Conteos generales actuales observados: 0 filas en `events`, 3 en `property_collaborators`, 9 en `urban_stay_partners`. No inferir que son todos visibles para El Almendro.

## Requisito antes de permitir acceso público
Introducir un mecanismo de selección editorial explícita por elemento (p.ej. tabla de publicaciones públicas con propiedad, tipo, referencia, estado y auditoría). El endpoint anónimo debe consultar solo elementos aprobados para huéspedes, con proyección mínima de campos y filtro por propiedad, ciudad, fechas y ámbito. El administrador debe poder retirar publicaciones. Añadir pruebas de aislamiento entre propiedades y de revocación. Evitar devolver direcciones privadas o datos de propietarios.

## Estado de la implementación
- La función desplegada es **preparación interna**, no canal público aprobado.
- No activar `verify_jwt=false` en la función v1 actual, porque su lógica considera activo = publicable.
- La guía no debe mostrar datos de producción hasta superar la revisión.
- No cambiar DNS, CNAME, Beta, Barcelona 80 ni Zamora 89.
