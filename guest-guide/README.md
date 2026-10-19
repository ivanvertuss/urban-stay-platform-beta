# Urban Stay Guide — piloto El Almendro

## Separación de aplicaciones
- La plataforma de gestión existente conserva su CNAME `beta.urban-stay-platform.com`.
- Las guías públicas tendrán despliegue independiente bajo `urbanstayguide.com`, sin sustituir la Beta.
- Ruta prevista: `/el-almendro/`; rutas adicionales por slug de propiedad.
- Este prototipo está aislado en una rama de trabajo, no está desplegado.

## Condiciones antes de publicar
1. Recuperar y validar el diseño original de Barcelona 80 y Zamora 89, para reutilizarlo sin inventar otra plantilla.
2. Definir una fuente de datos pública segura por propiedad (solo campos aprobados); no exponer tokens de servicio, sesiones, tablas privadas o funciones administrativas.
3. Resolver el slug de propiedad y su ciudad; filtrar eventos, colaboradores y promociones por ámbito, fechas y estado.
4. Verificar permisos RLS y acceso de lectura exclusivamente a contenido publicable.
5. Comprobar enlaces, fotografías, horarios, versión móvil, instalación PWA y privacidad.
6. Preparar un despliegue separado para la web de huéspedes; solo después configurar los registros DNS en Arsys.
7. Probar El Almendro antes de incorporar las demás propiedades.

## Estado
Prototipo visual de estructura: creado. Integración con datos, diseño editorial original, PWA, despliegue y DNS: pendientes. No cambiar DNS aún.
