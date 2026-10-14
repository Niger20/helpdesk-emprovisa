# Administración de identidad local

Fuentes leídas: AGENTS.md; Word SPEC-TI-2026-002 v2.0 (RF-18, HU-02/HU-03); ER de identidad y seguridad; P-09.

Archivos previstos: contracts/admin-identity.ts; módulos users/rbac/groups (index, routes, service, repository, policies/mapper); feature admin-identity (api/hooks/components/pages/index); test/admin-identity-checks.ts.

Integración del coordinador:
- Exportar `* from './admin-identity.js'` desde contracts/index y compilar contracts antes de typecheck.
- Factories `createUsersService(database)`, `createRbacService(database)`, `createGroupsService(database)`; registros `registerUsersRoutes`, `registerRbacRoutes`, `registerGroupsRoutes`.
- Ruta lazy `/administracion/identidad`: default export de `features/admin-identity/pages/AdminIdentityPage`; navegación con permiso usuario.administrar o rol.administrar.
- Helper `adminIdentityChecks(database, env)` para integración: no ejecutarlo en paralelo con otras recreaciones.
- Mantener el catálogo permisos y los roles del sistema inmutables. Auditor no recibe los permisos de escritura en seed.
- Evidencia sanitizada se inserta en auditoria_sistema dentro de cada transacción; compatible con trigger de hash existente. No incluye correo, contraseña ni tokens.
- Auditoría conserva `context.direccionIp` del request, incorporado por coordinador a SessionContext.

Decisión conservadora para registrar en DECISIONS: RF-18 menciona editar permisos, pero esta fase autorizada administra exclusivamente vínculos; catálogo y roles permanecen inmutables. No se implementa directorio real conforme alcance local vigente.

Reglas conservadoras para registrar en DECISIONS:
- Conservar al menos un usuario LOCAL activo, desbloqueado, en sede activa, con ambos permisos administrativos globales y vigencia indefinida. Evita dejar la aplicación sin administrador por vencimiento de fechas.
- Quien administra usuarios solo puede alterar una cuenta si posee todos sus permisos no vencidos dentro de sus alcances (también asignaciones futuras); evita escalar privilegios mediante reset de contraseña o activación.
- `nivel_dominio` se conserva como entero positivo dentro de smallint; no se inventa una escala 1–5 ausente del ER. Grupos niveles 1/2 corresponden a N1/N2.
- Cambios de acceso propio requieren otro administrador. Se aplica también a membresía y grupos de los que el actor sea miembro.
- Antes de trasladar un usuario entre sedes se deben retirar sus membresías no vencidas en grupos activos limitados a otra sede. El endpoint rechaza el traslado completo sin cambios parciales.

Estado: implementación completa e integrada por coordinador. El index expone `loadAdminIdentityPage` para conservar la división lazy de la pantalla.

Verificación específica realizada: contratos build, API typecheck, web typecheck, eslint de archivos asignados, Vitest identity-policies (7/7). Coordinador completó integración y cuatro controles globales: 262 pruebas y build 290,2 KB gzip. El chat adicional no recreó helpdesk_test ni hizo commits; los commits se consolidan aquí.

Helper de integración: 7 casos (sesión/permisos/auditor; Argon2/CSRF/payload/auditoría; referencias/autoexclusión; roles/revocación/reset/desactivar/desbloquear; grupos/especialidades; sede/no escalación; último administrador/rollback). Registra una app Fastify por caso y usa datos de seed ficticios.

La gestión de roles incluye alta, edición atómica de rol/alcance/vigencia y retirada. La UI ofrece edición directa de vínculos. La UI con solo rol.administrar consulta `/admin/grupos/catalogos` y ofrece roles/especialidades sin exigir usuario.administrar.
