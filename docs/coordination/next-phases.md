# Dos fases en paralelo — 13/10/2026

1. Operación inicial de tickets (esta sesión): asignación y toma, inicio de atención, respuestas públicas y notas internas; primera respuesta SLA, control de versión y bitácora transaccional. Propiedad tickets API/web, ticket-actions.ts, permisos/migración/seed y archivos compartidos de integración.
2. Base de conocimientos (chat 01a13422-b5fd-7ed2-9b34-a668ec1fa38c): listado/búsqueda, consulta y edición con historial de versiones. Propiedad knowledge API, knowledge-base web, knowledge.ts, knowledge-checks.ts y coordination/knowledge.md.

Esta sesión integra exports/rutas y ejecuta los cuatro controles globales. La nueva sesión no recrea helpdesk_test ni ejecuta integración/globales. No se desplegará ni creará infraestructura externa. Adjuntos, escalamiento/pausas, resolución/cierre/reapertura, jobs y CSAT se mantienen pendientes.

Ambas entregas integradas y verificadas: pnpm check pasó con 170 pruebas;
pantallas comprobadas a 360 px. El avance y pendientes están en PROGRESS,
con decisiones D-010/D-011. La sesión de conocimientos terminó su entrega.

## Automatizaciones y CSAT — siguiente entrega

Esta sesión integra jobs/pg-boss, avisos y correo simulados, emisión de encuesta en
cierre y archivos compartidos. Chat nuevo de CSAT:
01a138a5-70c1-7430-b86a-f7c4879243a0, entregó contratos, módulo surveys, pantalla y
helper de integración (commit d347bd6). Entrega integrada; pnpm check pasó con
219 pruebas y 171,07 KB gzip. Pendientes y límites en PROGRESS; decisiones D-014–D-016.

## Asignación inicial y reportes — nueva entrega

Esta sesión: RF-06 en portal/correo, selector transaccional, séptima tarea de reintento,
migración/seed y ficha con responsable. Chat adicional de reportes:
01a138be-dee2-7d83-a5dc-96bf9f98053c, con propiedad de contracts/reports.ts,
API/web reports y reports-checks.ts. Integrados por coordinador; validación global
con 241 pruebas y build en verde. Decisiones D-017/D-018 y pendientes en PROGRESS.

## Administración local y auditoría — entrega integrada

Esta sesión: auditoría API/web, verificación readonly, instrumentación de reportes
y propagación de IP. Chat adicional 01a138d3-5516-7800-8996-efe2eb673d1e:
usuarios LOCAL, roles vinculados, grupos, membresías y especialidades.
Coordinador integró contratos, rutas lazy, navegación, runtime y pruebas; migración
021 reconcilia permisos de jefatura de la base anterior con evidencia.
Cuatro controles en verde: 262 pruebas, build 290,2 KB gzip. Decisiones D-019/D-020.

## Categorías y utilidad de conocimientos — entrega integrada

Esta sesión: gestión de categorías, jerarquía, grupo por defecto y reglas tipo/activo,
integración global y prueba HTTP. Chat adicional 01a13902-9146-7331-9184-a64ec599cd20:
votos y vínculos KB-ticket. Integradas ambas capacidades; 282 pruebas en 21 archivos,
cuatro controles en verde y build 295,11 KB gzip. Decisiones D-021/D-022.

## Calendarios y parámetros — entrega integrada

Esta sesión: calendarios/feriados, asignación a sedes y protección del calendario de
cada ciclo en bitácora; migración 022 y seed. Chat adicional de parámetros:
01a1390f-79b8-7d22-99c7-3a696fb4afab. Integrados runtime, rutas, navegación y pruebas.
301 pruebas en 22 archivos, cuatro controles en verde y 302,51 KB gzip. D-023/D-024.

## Rendimiento y catálogo de roles — entrega integrada

Esta sesión: carga k6 aislada de 63 cuentas/sesiones, runner, umbrales e informe.
Chat adicional 01a13920-f8cd-7632-9a8b-fd9da6400016: catálogo de permisos y roles
personalizados, integrado en /administracion/roles. Cuatro controles en verde,
308 pruebas y 305,93 KB gzip. Carga final: 3.225 solicitudes, 0 errores y p95
47,69 ms. D-025/D-026; límites y reproducción en docs/quality/PERFORMANCE.md.
