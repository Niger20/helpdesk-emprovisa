# Parámetros operativos locales

Integración completada por coordinador: contracts/index, factories/routes en runtime, opción parameters y ruta lazy `/administracion/parametros`, con permiso global `parametro.administrar`. Helper `loadParametersPage` y driver `parametersChecks(database, env)` integrados.

Fuentes leídas: AGENTS, SPEC en docs/specs (docs/spec no existe), ER dominio 2, P-09. ER no tiene versión; control mediante valorAnterior y advisory lock transaccional que también protege filas ausentes. Auditoría y relectura validada ocurren dentro de la misma transacción. Solo las cuatro claves reconocidas; nunca secretos ni demo.seed.

Decisiones conservadoras para trasladar a DECISIONS/PROGRESS: sesión 1–30 min; bloqueo 15–1440 min (cinco fallos sin cambios); adjunto 1–10485760 bytes, conservando el máximo sembrado local de 10 MB aunque el servicio admite enteros hasta 2147483647 y multipart recibe el límite por llamada. Cierre 48 h solo consulta RN-06. Solo sesión/bloqueo tienen fallback real: se muestran PREDETERMINADO y se guardan por upsert. Adjuntos/cierre ausentes o corruptos fallan de forma explícita; no se simula un fallback inexistente.

No ejecutar integración ni recrear helpdesk_test en esta fase delegada; verificaciones globales y commits pertenecen al coordinador.

Implementado: contratos, factory, rutas GET/PUT, autorización global en service y ruta, allowlist, validación de configuración almacenada, concurrencia sin columna nueva, auditoría transaccional, UI QueryBoundary/RHF/Zod/TanStack con tokens actuales, invalidación de adjuntos y fechas Managua. Helper de integración cubre autorización/CSRF/strict payload/claves/límites, valores corruptos, efecto sobre sesión/adjuntos/bloqueo de cinco fallos, evidencia mínima, cambios concurrentes sobre fallback ausente y rollback del upsert si falla evidencia.

Verificación: ESLint focal pasó. Contracts build pasó. API/web typecheck inicialmente requieren exports/registro del coordinador; no se ejecutó pnpm test ni integración y no hay commits. P-09 deja estas pestañas sin desarrollar; se conservan shell y tokens existentes con formularios responsivos, sin inventar matriz ni SLA.

Coordinador completó lint/typecheck/test/build: 301 pruebas en 22 archivos y
302,51 KB gzip. Se corrigió respuesta de límites inválidos a 400 en service.
Ocho casos de parámetros incluyen efectos reales en consumidores. Prueba HTTP local
confirmó las cuatro claves y cierre solo consulta; commits consolidados aquí. D-024.
