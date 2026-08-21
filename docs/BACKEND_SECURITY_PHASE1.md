# Urban Stay Platform · Backend y Seguridad · Fase 1

## Objetivo

Preparar la beta actual para evolucionar hacia una plataforma real sin tocar Barcelona 80 ni Zamora 89 y sin exponer secretos en el navegador.

## Regla de trabajo

- Todo se desarrolla primero en la rama `backend-security-phase1`.
- `main` no se modifica hasta validar la fase.
- Barcelona 80 y Zamora 89 quedan fuera de esta fase.
- Ninguna API key privada debe escribirse en el repositorio ni en JavaScript del navegador.

## Arquitectura propuesta

### Frontend

Se conserva la interfaz actual de Urban Stay Platform. El frontend deja progresivamente de usar `localStorage` como fuente principal para usuarios y propiedades.

### Backend

Para la primera versión se propone Supabase porque reúne en una sola capa:

- autenticación segura;
- PostgreSQL;
- Row Level Security;
- almacenamiento de imágenes;
- funciones server-side;
- variables secretas para APIs externas.

La plataforma no guardará contraseñas directamente. La autenticación será responsabilidad del proveedor de identidad.

### Datos principales

- `profiles`: datos públicos del propietario.
- `properties`: alojamientos de cada propietario.
- `property_content`: configuración de la guía.
- `events`: eventos asociados a una ciudad/propiedad.
- `audit_log`: operaciones importantes para trazabilidad.

### Permisos

Cada usuario solo podrá leer o modificar sus propias propiedades. La administración Urban Stay tendrá un rol separado para moderación y soporte.

## Ticketmaster

La Consumer Key no debe estar en `localStorage` en producción. Se guardará como secreto del backend y las consultas se harán desde una función del servidor.

Flujo previsto:

`Propiedad -> ciudad -> función backend -> Ticketmaster -> filtro de fechas -> eventos -> base de datos -> guía`

La función eliminará eventos caducados y actualizará próximos eventos de forma programada.

## Copias y recuperación

- GitHub mantiene el versionado del frontend.
- La base de datos tendrá backups gestionados por el proveedor.
- Los cambios de esquema se guardarán como migraciones SQL versionadas.
- Las publicaciones importantes deberán tener un punto de rollback.

## Fases

### Fase 1A · Preparación segura

1. Crear rama de trabajo aislada.
2. Definir modelo de datos.
3. Preparar variables de entorno de ejemplo sin secretos.
4. Preparar migración SQL inicial.
5. Mantener la beta actual funcionando sin cambios visibles.

### Fase 1B · Autenticación real

1. Registro con email y contraseña mediante Auth.
2. Inicio/cierre de sesión reales.
3. Recuperación de contraseña.
4. Perfil de propietario.
5. Sustituir gradualmente el login almacenado en `localStorage`.

### Fase 1C · Propiedades en base de datos

1. Alta de propiedades.
2. Edición y borrado.
3. Fotos en Storage.
4. Permisos por propietario.
5. Auditoría básica.

### Fase 1D · Agenda segura

1. Ticketmaster desde función server-side.
2. Actualización automática por ciudad.
3. Borrado de eventos caducados.
4. Fallback de fuentes oficiales cuando sea necesario.

## Criterio para pasar a producción

No se integrará esta rama en `main` hasta que:

- el registro funcione;
- el login funcione;
- un usuario no pueda ver propiedades de otro;
- las claves privadas no sean visibles en el navegador;
- exista recuperación de contraseña;
- las pruebas de creación/edición de propiedad sean correctas;
- exista una forma clara de rollback.
