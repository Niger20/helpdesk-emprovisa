# Auditoría y verificación

Propiedad de esta sesión: contracts/audit.ts, módulo audit, feature audit y
audit-api-checks.ts; archivos compartidos de integración.

Consultas paginadas por fechas civiles de Managua; filtros exactos de acción,
ticket o entidad. Bitácora por sede autorizada; auditoría del sistema e integridad
global requieren alcance global. DTO solo metadatos/hashes, sin valores internos,
detalle, sesiones ni referencias sensibles. COMENTARIO_INTERNO de ticket propio
se excluye antes de paginar. GET de verificación no escribe evidencia.

Reportes en runtime registran consulta/exportación sanitizada mediante writer con
rol app; snapshots/datos siguen usando readonly. Nuevas operaciones HTTP conservan
IP real en contexto de sesión y registros; no se alteran filas históricas.

Integración: createAuditService(readonly), createReportAuditRecorder(appDatabase),
registerAuditRoutes, ruta /auditoria y auditApiChecks(database,env). Revisión global
junto con administración de identidad. No se incorporan tablas nuevas ni despliegues.

Integración final verificada: pnpm check con 262 pruebas en 20 archivos y build
de 290,2 KB gzip. Prueba HTTP sobre helpdesk confirmó ambas cadenas íntegras.
Revisión visual de pantallas pendiente por fallo de inicialización de cua.
