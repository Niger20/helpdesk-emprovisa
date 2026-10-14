# Cierre de seguridad y retención — 14/10/2026

Propiedad exclusiva: apps/api/test/requester-registration-checks.ts,
docs/quality/SECURITY-CLOSURE.md, docs/quality/RETENTION.md y este archivo.
No se editarán negocio, contratos, driver, README, PROGRESS, DECISIONS ni ACCEPTANCE.
Sin subagentes, worktrees, navegador, mensajes a chats, commits o pruebas globales.

## Hallazgo temprano para Final QA

`pnpm audit --json` ejecutado sobre el lockfile actual, código 1. Evidencia bruta
local ignorada: `.data/quality/security/dependency-audit.json`.
Resultado SCA: 2 críticos, 1 alto, 2 moderados; no equivale a DAST OWASP.

- Handlebars <=4.7.9: GHSA-8r5x-fm3f-whwj y GHSA-p8wg-vrv2-v86f críticos,
  GHSA-xw65-4hp5-5hc7 moderado. Registry indica parche >=4.7.10.
  Ruta: packages/eslint-config > eslint-plugin-boundaries (directa y
  @boundaries/elements) > handlebars; herramienta de lint.
- braces <=3.0.3: GHSA-vfj7-8cjw-p6xm alto; registry sin versión corregida.
  Rutas: api > kysely-codegen > micromatch y eslint-config > boundaries >
  micromatch, incluida @boundaries/elements; generación/lint.
- uuid <11.1.1: GHSA-w5hq-g745-h8pq moderado; parche >=11.1.1.
  Ruta: api > exceljs > uuid. No forzar salto de major sin evaluar compatibilidad.

Final QA debe evaluar reparación del lockfile/dependencias como propietario de
integración; esta sesión no cambia paquetes compartidos ni oculta avisos.
No se ha demostrado explotación remota; tampoco ausencia de riesgo.

## Integración preparada

Helper exportado `requesterRegistrationChecks(database, env)`. Registrar import
desde `./requester-registration-checks.js` y llamada en
database.integration.test.ts después de los helpers existentes (para preservar
sus expectativas iniciales de nueve tickets). No requiere migración ni seed nueva.
Dos positivos TELÉFONO/PRESENCIAL; cinco denegaciones permiso/sede/canal/auditor;
CSRF; denegación directa de service; rollback real de alta/evidencia al provocar
fallo en alerta dentro de la transacción Kysely. Total: diez casos nuevos.

ESLint focal y typecheck de API aprobados. Primer typecheck detectó nombre de
schema inexistente; corregido al contrato existente ticketActionResultSchema,
segunda ejecución código 0. Integración todavía no ejecutada por esta sesión.

## Evidencia final y límites

Documentos entregados: SECURITY-CLOSURE.md (inspección por riesgos, sondeos,
SCA y límites) y RETENTION.md (conservación actual, procedimiento de copia local
propuesto, sin purga ni reencadenamiento). D-029 ya registra CU-01 activo libre;
mantenerlo conservador y actualizar RN-08 cuando el nuevo helper pase.

HTTP real helpdesk/loopback 01:34 America/Managua: 19 entradas sanitizadas,
sin fallos. 401 anónimo, 404 ajeno, 403 administración, 403 CSRF ausente/inválido,
400 cuerpo inválido y traversal de adjunto; búsquedas literales SQL/XSS con 200
y cero resultados; Origin externo 403 sin allow-origin. API nosniff/CSP y cookie
HttpOnly/Strict. Ambas cadenas válidas 78/21 al consultar. Dos sesiones propias
creadas y cerradas con logout 200; ningún ticket creado ni correo enviado.
Archivos ignorados: .tools/security-probes.cjs y
.data/quality/security/http-probes.json; sin tokens/cookies en evidencia guardada.

S-02 para Final QA: HTML Vite http://127.0.0.1:5173 devuelve 200 SIN CSP;
Helmet CSP corresponde a API y conserva style-src unsafe-inline en defaults.
No afirmar CSP estricta de frontend con cabecera de health. No modificar Vite
en esta sesión: integración debe evaluar/probar esa reparación con HMR/navegador.

No DAST real: scanner no encontrado en PATH y sin instalación. SCA encontró
avisos altos/críticos; no se certifica RNF-02 completo. RNF-12: ningún archivo
histórico ejecutado, parámetro de retención ni 24 meses observados; propuesta
conserva originales/cadenas completas y define copia/manifiesto/verificación.

Los cuatro controles globales, ejecución del helper, correcciones de dependencias
y CSP, commits y porcentaje consolidado quedan a Final QA. Solo los cuatro
archivos de propiedad listados son cambios versionables de esta sesión.

Estado: COMPLETO CON LIMITACIÓN
