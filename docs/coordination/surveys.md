# CSAT: implementación lista para integración

Contratos listos en `packages/contracts/src/surveys.ts`; exportar schemas y tipos desde contracts/index y reconstruir contracts.

Diseño: GET y POST `/api/v1/encuestas/actual`, públicos y expresamente incluidos en route-access. La app actual desactiva HEAD automático; si cambia, incluirlo también en whitelist. El token de 32 bytes hexadecimal viaja en `x-survey-token`, nunca en ruta/query. Enlace web `/encuesta#<token>`; fragmento no llega al servidor. Redactar `req.headers.x-survey-token` y `req.headers.x-csrf-token` en Pino.

CSRF: GET entrega HMAC-SHA256(CSRF_SECRET, `survey:<token>`) como csrfToken. POST exige ese valor en x-csrf-token tanto en service como en plugin. Extender csrfPlugin con caso explícito POST /api/v1/encuestas/actual que valide tokensEqual(csrfToken(secret, `survey:${request.headers['x-survey-token']}`), header), validando primero x-survey-token con surveyTokenSchema. No exceptuar indiscriminadamente rutas públicas.

API de integración: `createSurveyForClosedTicket(executor, idTicket, now?, validityDays?)` desde modules/surveys/index.ts, donde executor puede ser Database o la transacción de cierre. Ejecutarla DESPUÉS de actualizar estado a CERRADO, dentro de la misma transacción. Retorna `{ token, enlace, expiraEn }` solo para creación nueva, null si ya existe. No guardar token/enlace en notificaciones persistentes ni auditoría. Se conserva el token exclusivamente para la demostración en memoria/DTO autorizado del cierre, sin correos reales.

Decisión pendiente de registrar por coordinador en DECISIONS: RF-11/ER exigen vencimiento sin fijar duración. Default 7 días, como seed actual, configurable por argumento validityDays (1–365); una encuesta por ticket significa que reapertura/cierre posterior no reemite ni renueva.

Registrar rutas con createSurveysService(database, env.CSRF_SECRET). Ruta web lazy pública `/encuesta` hacia SurveyPage fuera del guard de sesión. Integrar surveysChecks(database,env) en integration driver. Sin nuevos permisos ni migraciones.

Validación global y actualización de PROGRESS corresponden al coordinador.

Implementado: emisión con bloqueo del ticket e idempotencia, consulta pública mínima sin ids/correos, actualización condicional de respuesta (concurrencia y vencimiento), auditoría CSAT_RESPONDIDA en la misma transacción sin comentario ni tokens; controles de seguridad en service además del plugin. Encabezados Zod passthrough para conservar x-csrf-token. UI pública española con TanStack Query, QueryBoundary, RHF/Zod, radio accesible de 1–5 sin preselección, comentario y recibo. API de emisión acepta transacción existente y no abre una anidada.

Pruebas: 5 unitarias de contrato/service en modules/surveys/__tests__/surveys.test.ts PASAN con el config normal de Vitest; 8 escenarios de integración en surveys-checks.ts (no ejecutados por esta tarea). Lint de archivos asignados pasa. `pnpm --filter api typecheck` y `pnpm --filter web typecheck` PASAN después de exportar/reconstruir contracts e incorporar tipos compartidos del coordinador. También se compiló el helper de integración. No se recreó ni ejecutó helpdesk_test. La integración, build y checks globales quedan a cargo del coordinador.

El usuario pidió directamente hacer commit al terminar esta tarea (posterior a la delegación). Se hará commit únicamente de los archivos asignados, conservando cambios ajenos sin staging.
