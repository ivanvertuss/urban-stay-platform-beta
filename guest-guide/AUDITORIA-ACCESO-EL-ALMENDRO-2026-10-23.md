# Auditoria de acceso a El Almendro - 2026-10-23

## Incidencia
La propiedad aparece a veces Aprobada (23/10) y a veces Borrador (16/10). El boton Editar propiedad no abre el asistente. No se ha confirmado el estado actual en la base de datos.

## Hallazgos confirmados en codigo
- `allProps()` sobreescribia el estado del servidor con `localStorage` (`getPropState()`). Corregido en rama para tomar el estado de la propiedad cargada.
- `setPropertyStatus()` solo escribia estado en localStorage, sin persistir en Supabase. Desactivada temporalmente la mutacion en rama hasta definir una conversion segura entre estados de interfaz y valores de la tabla.
- El editor tenia escasa gestion de excepciones. Se ha reforzado el manejo de errores en rama.
- `loadServerProperties()` obtiene `properties` y `property_content` al iniciar sesion y cachea el resultado. El estado puede estar desactualizado si la consulta falla o no se reinicia sesion.
- En Supabase el campo `properties.status` admite `draft`, `published`, `archived`; la interfaz usa `active`, `inactive`, `approved`, `draft`. Requiere diseno de flujo consistente con `review_status`.
- `openWizard()` carga promociones y presenta el dialogo; falta prueba de navegador para identificar por que no abre.

## Pendiente antes de produccion
1. Verificar estado real, review_status y fecha de la propiedad en Supabase mediante una consulta autorizada. Las consultas SQL anteriores fueron bloqueadas.
2. Auditar estados y flujo de moderacion antes de habilitar Activar/Inactivar.
3. Verificar en navegador el clic y los errores de consola, sin modificar ni borrar datos.
4. Comprobar guardado de property_content, RLS y Agenda.
5. No desplegar esta rama en `main` ni alterar beta hasta pruebas y aprobacion expresa.

## Referencias
- Correccion editor: 570509438c2899e93348c6007092497ac3d38313
- Estado desde servidor: c65003ed72c6d68035b96deaed7fcaad49e5f171
- Proteccion de estados incompatibles: 08bce1dd328aa1a619f45c2b622ccbca8c6fe3df
