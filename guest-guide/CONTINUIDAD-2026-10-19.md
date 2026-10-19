# Punto de continuidad — 19/10/2026

## Decisiones aprobadas
- Usar urbanstayguide.com (Arsys) como dominio de las guías para huéspedes, con rutas por propiedad.
- Conservar beta.urban-stay-platform.com como plataforma de administración sin modificar su CNAME.
- Primera propiedad piloto: El Almendro.
- Reutilizar el formato y diseño ya existente de Barcelona 80 y Zamora 89; no diseñar una plantilla nueva.
- Cada huésped verá en móvil su propiedad, información local, Agenda, Colaboradores y Promociones.
- No modificar DNS ni publicar hasta validar la guía.

## Trabajo existente
- Rama feature/guest-guide-el-almendro creada desde main.
- Prototipo aislado: guest-guide/el-almendro/index.html (estructura provisional, sin datos reales).
- Plan de arquitectura y seguridad: guest-guide/README.md.
- Se ha comprobado que el CNAME actual de la beta es beta.urban-stay-platform.com.

## Primer paso de la próxima sesión
Preparar una vista previa navegable de El Almendro y comparar con el diseño real de Barcelona 80 / Zamora 89. No confundir prototipo provisional con guía terminada. Luego conectar datos públicos seguros desde Supabase, comprobar Agenda y promociones por ámbito, probar móvil/PWA y finalmente preparar despliegue independiente y DNS.

## Precauciones
No afectar a las webs ya publicadas ni a la Beta; no exponer datos privados, credenciales ni información administrativa en la guía pública. Estado: rama de trabajo, no desplegado.
