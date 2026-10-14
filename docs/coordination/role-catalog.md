# RF-18: catálogo de roles y permisos

Implementado en el submódulo `rbac/role-catalog`, contrato `role-catalog.ts` y feature web `role-catalog`.

## Integración del coordinador

- Exportar `./role-catalog.js` desde `packages/contracts/src/index.ts` y compilar contracts.
- Registrar `registerRoleCatalogRoutes(app, createRoleCatalogService(database))` desde `modules/rbac/role-catalog/index.ts` en el arranque y driver integrado.
- Ruta lazy integrada `/administracion/roles`, con `rol.administrar`, usando `loadRoleCatalogPage`. Navegación integrada; backend exige alcance global aunque el guard general solo mire el permiso.
- Incorporar `roleCatalogChecks(database, env)` desde `test/role-catalog-checks.ts` al driver global.
- Tras verificación final, trasladar decisiones a DECISIONS y avance a PROGRESS. No se ejecutaron test/check ni se recreó helpdesk_test en esta tarea.

## Decisiones conservadoras y ER

RF-18 exige administración por interfaz; ER tiene código varchar(30), nombre varchar(60), descripción varchar(200), es_sistema y relaciones usuario_rol/rol_permiso. No existen activo, versión ni vínculo grupo_rol: no se inventan ni migran. No hay borrado de roles ni creación de permisos. Personalizados requieren `auth.sesion` porque el servicio de sesión lo exige para utilizarlos. Los cinco códigos de sistema están reservados mediante el enum único de contracts. Todos los registros con es_sistema son inmutables (incluye AUDITOR).

Edición compara nombre/código/descripción/permisos anteriores y responde 409 ante conflicto. Las mutaciones toman el mismo advisory lock 2026018,1 de identidad, revalidan actor y sesión contra BD dentro de transacción y exigen permisos globales del actor para cada permiso concedido. Los vínculos no vencidos, incluso futuros, se revisan para autoedición y coherencia sede/usuario; las sesiones de todos esos usuarios se revocan. Se reutiliza la protección exacta del último administrador vía users/index. Auditoría, grants y revocaciones están en la misma transacción.

Auth ya admite códigos string en usuarioSesionSchema y auth.mapper sin rolSchema enum: no se modificó auth ni se duplicó el enum. Los grupos del ER no conceden roles; modificar un rol asignado directamente al actor se rechaza aunque sea futuro. Catálogo lista únicamente permisos conocidos en contracts/BD y las asignaciones existentes se preservan.

Fuentes leídas: AGENTS, RF-18 en docs/specs/SPEC-TI-2026-002 Sistema Helpdesk EMPROVISA v2.0.docx (el directorio real es specs), ER de identidad y P-09 (pestaña Usuarios y roles). Sin servicios externos ni correos reales.

## Validación focal

ESLint de todos los archivos nuevos pasó. TypeScript API (incluido helper de pruebas) y web pasaron usando configuraciones temporales ignoradas bajo node_modules/.cache/role-catalog-check; agregan el nuevo contrato mediante paths/barrel para validar sin tocar el root contracts asignado al coordinador. No se modificó dist ni index raíz. Pendiente el coordinador ejecuta los cuatro controles oficiales luego de la integración.

Helper cubre ausencia de sesión, solicitante/auditor, CSRF, roles de sistema/reserva de códigos, permisos inventados, auth.sesion obligatorio, login custom, sesiones de usuarios con vínculo futuro, preservación de asignaciones, autoedición futura, edición concurrente, duplicación concurrente, administración por sede, elevación de permisos, sesión revocada con contexto obsoleto, sede incoherente del usuario afectado y rollback del último administrador sin escritura de auditoría. Cada caso limpia intentos de login para evitar interferencia con el límite real de diez intentos por usuario.

Coordinador completó exports, runtime, driver y navegación. pnpm check pasó con
308 pruebas en 22 archivos y build 305,93 KB gzip. Prueba HTTP local creó/editó
LECTURA_LOCAL; cinco roles de sistema protegidos y ambas cadenas íntegras. D-026.
