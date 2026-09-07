# Urban Stay Platform · Aprobación de cuentas

## Qué añade esta fase

- Las cuentas existentes se conservan como `approved`.
- Las cuentas creadas después de aplicar la migración nacen como `pending`.
- Solo un perfil con `role = 'admin'` y `account_status = 'approved'` puede aprobar o rechazar usuarios.
- El navegador no puede modificar directamente `role` ni `account_status`.
- Cada decisión queda registrada en `audit_log`.
- La consola está en `admin.html` y comprueba el rol en Supabase; `?admin=1` deja de ser el mecanismo de seguridad.

## Activación

1. Aplicar `supabase/migrations/20260907_0005_account_approval_workflow.sql` en el proyecto Supabase.
2. Elegir la cuenta Urban Stay que será administradora y asignarle `role = 'admin'` desde un entorno administrativo de confianza (por ejemplo, el SQL Editor de Supabase). No se debe permitir esta operación desde el frontend.
3. Confirmar que esa cuenta tiene `account_status = 'approved'`.
4. Abrir `admin.html` e iniciar sesión con la cuenta administradora.

## Comprobaciones antes de integrar en main

- Una cuenta nueva aparece como `pending`.
- Una cuenta `owner` no puede abrir la consola administrativa.
- Un administrador aprobado puede ver todas las solicitudes.
- Aprobar cambia el estado a `approved`.
- Rechazar cambia el estado a `rejected`.
- Un usuario normal no puede cambiar su rol ni su estado mediante el cliente Supabase.
- La cuenta administradora no puede aprobarse/rechazarse a sí misma desde la consola.

## Siguiente integración

El login principal debe consultar `profiles.account_status` y bloquear el acceso funcional cuando el estado sea `pending` o `rejected`. Esa integración debe probarse junto con el flujo real de registro antes de fusionar esta rama.
