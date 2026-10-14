# Reportes y exportaciones

Estado: implementación completa; API/frontend, exportadores y reportsChecks listos. Unitarias específicas: 5 pasan; ESLint específico pasa; pnpm typecheck global pasa tras conexión al router. No ejecuté integración, pnpm test, build ni recreé helpdesk_test por coordinación. Propiedad exclusiva de esta sesión: contracts/reports.ts, módulos y feature reports, test/reports-checks.ts y este documento.

Dependencias solicitadas al coordinador: API exceljs, pdfmake y @types/pdfmake (dev); web recharts. Ya instaladas y contracts/index exporta reports. Pdfmake 0.3 usa createPdf/getBuffer con Roboto resuelto desde el paquete local, independiente del cwd.

Archivos previstos: contracts/reports.ts; API reports/{index,reports.routes,reports.service,reports.repository,reports.policies,reports.mapper}.ts, domain/{metrics,date-range,export-cells}.ts, exports/{excel,pdf}.ts y __tests__/reports.test.ts; web reports/{index.ts,api/reports.api.ts,api/reports.keys.ts,hooks/useReports.ts,hooks/useReportFilters.ts,lib/format.ts,components/ReportFilters.tsx,components/ReportSummary.tsx,components/ReportCharts.tsx,components/ReportBreakdowns.tsx,components/ReportExport.tsx,pages/ReportsPage.tsx}; api/test/reports-checks.ts. Respetan capas y límites.

Integración prevista: createReportsService(readonlyDatabase), registerReportsRoutes(app, service); ruta lazy /reportes desde feature index. API GET /api/v1/reportes, /reportes/catalogos, /reportes/exportar/:formato (pdf|xlsx). Query desde/hasta YYYY-MM-DD inclusivos Managua, idSede/idCategoria opcionales. reportsChecks(database,env) lo ejecuta únicamente coordinador.

Interpretaciones para trasladar a DECISIONS: cohorte por fecha de creación inclusiva de Managua; MTTA usa denominador total de tickets del período literalmente según SPEC, con suma de respuestas registradas y contador visible de respuestas; MTTR solo tickets con resolución vigente y descuenta minutosPausa. Sin resolución vigente (reabierto) no entra en cumplimiento. SLA: cumplidos / total resueltos, incluidos resueltos sin marca como no cumplidos conservadoramente (contador slaEvaluados muestra cuántos tienen marca). slaPorPrioridad distingue resueltos (denominador), evaluados (marcas no nulas) y cumplidos. CSAT: encuestas respondidas de la cohorte. Carga por analista: asignado actual, no evaluación histórica del resolutor. Fórmulas y denominadores se incluyen en tablero/exportaciones. No se agregan tablas ni vistas.

reportsChecks incluye jefe real admin.emergencia y auditor.demo, anónimo/solicitante denegados, PDF/XLSX, vacío y fechas inválidas, filtros, alcance limitado de BD en consulta/catálogo/exportación y denegación en service. Crea y destruye pool readonly propio (3); no recrea base. Un test limita temporalmente usuarioRol del auditor y restaura en finally.

Frontend: ReportsPage es exportación nombrada conforme router existente. Cuatro estados con QueryBoundary, filtros conservados al vacío, descargas con errores/reintento, gráficos con datos textuales accesibles, fechas dd/mm/aaaa. No cambios en archivos compartidos.

Validación global, registro PROGRESS/DECISIONS y commit: responsabilidad del coordinador al integrar.
