# Revisión técnica de seguridad del prototipo local

Fecha: 14/10/2026, America/Managua. Resultado: controles inspeccionados y
sondeos HTTP acotados aprobados; RNF-02 conserva pendientes. No hay certificado
OWASP ni declaración de ausencia de vulnerabilidades altas/críticas.

## Alcance y método

Fuentes: AGENTS.md, texto OOXML de SPEC-TI-2026-002 v2.0 (RNF-02, RN-08,
sección de seguridad), ER completo y vistas núcleo/auditoría, mockups P-01/P-03
y guía CLAUDE.md; ACCEPTANCE, VISUAL, ACCESSIBILITY, DECISIONS y coordinaciones.
El alcance local sustituye TLS/AD/correo institucional de la especificación.
Se conservan Argon2, hash de sesiones, permisos, CSRF y cadenas inmutables.

Tres evidencias distintas:

1. Inspección de fuentes y pruebas existentes: trazabilidad de controles, sin
   sustituir su ejecución global por Final QA.
2. Sondeos HTTP reales el 14/10/2026, 01:34 America/Managua, API
   `http://127.0.0.1:3000`, frontend `http://127.0.0.1:5173`. Cuentas ficticias
   ana.managua/admin.emergencia; sin intento de contraseña incorrecta, carga
   masiva, adjunto real, alta efectiva ni modificación de tickets.
3. SCA `pnpm audit --json`, salida 1 sobre el lockfile del momento. Analiza
   dependencias contra avisos del registry; no explora rutas HTTP ni demuestra
   explotabilidad. Evidencia local en `.data/quality/security/`, ignorada.

No se encontró ZAP, Nikto, Nuclei o Semgrep en PATH mediante Get-Command ni
directorio ZAP/OWASP en la raíz de Program Files revisada. No es inventario
exhaustivo del equipo. No se instaló scanner, servicio ni contenedor. No se
ejecutó DAST automatizado; el criterio de escaneo de RNF-02 sigue abierto.

## Controles frente a riesgos OWASP

Esta lista agrupa riesgos para revisar el proyecto; no certifica una edición
del estándar ni una metodología completa de pruebas de penetración.

| Riesgo | Control observado y fuente | Evidencia o límite |
|---|---|---|
| Acceso indebido | plugins/route-access.ts, tickets.policies.ts y servicios; permisos BD, alcance dueño/sede/grupo y notas filtradas en servidor | HTTP cola anónima 401; ticket ajeno 404; admin solicitante 403. Helpers de cada capacidad cubren denegaciones. app.test.ts prueba lista blanca/registro, pero su recorrido aislado no inventaría todos los módulos productivos. |
| Criptografía y sesiones | common/crypto/session-tokens.ts, auth/sessions.service.ts, auth/login.service.ts | 32 bytes aleatorios, SHA-256 en BD, HMAC CSRF y timingSafeEqual; Argon2id en seed. Cookie real HttpOnly/SameSite=Strict. HTTP/Secure=false permitido solo por alcance local. No inspección de secretos reales. |
| Inyección SQL | Repositorios Kysely y sql con parámetros interpolados; Zod en contracts/rutas | Cadena `' OR 1=1 --` en search devuelve 200 y total 0. Sin sql.raw/sql.ref/sql.id en módulos revisados. Un sondeo no prueba todos los campos ni consultas. |
| XSS | React presenta contenido como texto; búsqueda estática sin dangerouslySetInnerHTML/innerHTML/eval en web/src | Search con `<script>alert(1)</script>` devuelve JSON, total 0; no ejecución de payload almacenado ni prueba en navegador. CSP del HTML Vite ausente, ver S-02. |
| Diseño y reglas | Servicio de tickets valida RN-04/RN-05/RN-08, máquina y SLA puros; transacciones con bitácora | Nuevo helper RN-08 prepara positivos/denegaciones y fallo tardío para rollback; integración pendiente de Final QA. Sin evaluación exhaustiva de abuso de todo el dominio. |
| Configuración insegura | HOST literal 127.0.0.1, CORS exacto, Helmet, límites cuerpo y rate limit | Puertos 3000/5173 observados escuchando en 127.0.0.1; health con nosniff/CSP API; Origin externo 403 sin allow-origin. No agotamiento deliberado de límites. |
| Componentes vulnerables | Versiones fijadas y lockfile; SCA real | Cinco avisos, incluidos alto/críticos; S-01 abierto. No se alteró el lockfile en esta sesión. |
| Autenticación | auth/login.service.ts y pruebas auth-checks/auth-security-checks | Código de cinco fallos, bloqueo, límite por usuario y límite por IP; intento registrado, expiración y revocación. No se bloquearon cuentas para repetirlo sobre helpdesk. |
| Integridad de software/datos | Triggers 202610120009_audit-chain.sql y privilegios 202610120010_grants.sql | Endpoint real: bitácora 78 registros válida, sistema 21 válida en ese instante. No se modificaron hashes ni historia. SCA no acredita seguridad de la cadena de suministro completa. |
| Registro y monitoreo | app.ts/error-handler.ts: request id, redacción, errores sin stack; job audit-chain-verify | Código limita req a método/id y redacta cookies/tokens/correo. Sondeos dejan intentos y sesiones/logout legítimos; no exportan cookies. No SIEM ni monitoreo operacional en este prototipo. |
| Solicitudes externas inducidas | Integraciones simuladas; revisión de módulos/mail sin fetch HTTP externo ni entradas URL usadas para llamadas | No DAST SSRF ni prueba de todos los paquetes transitivos. Correo real y servicios institucionales fuera del alcance. |

## Resultados HTTP conservados

Archivo bruto sanitizado: `.data/quality/security/http-probes.json`.
Script local de reproducción: `.tools/security-probes.cjs`, ignorado; usa la
contraseña ficticia de seed, guarda solo resultados y cierra sus propias sesiones.
Diecinueve entradas de resultado incluyen cabeceras, dos cookies comprobadas,
integridad y dos logout; no son diecinueve vulnerabilidades ni pruebas DAST.

| Caso | Resultado |
|---|---|
| Health | 200, nosniff y CSP API presentes. |
| Sin sesión / ticket ajeno / administración solicitante | 401 / 404 / 403. |
| Alta sin CSRF / CSRF incorrecto / cuerpo inválido con CSRF válido | 403 CSRF_INVALIDO / 403 CSRF_INVALIDO / 400 ENTRADA_INVALIDA. |
| Búsqueda de cadenas SQL y XSS | 200 JSON, cero coincidencias en ambos casos. |
| Adjuntos con id `..%2F..%2F.env` | 400 ENTRADA_INVALIDA, sin contenido DATABASE_URL. No archivo subido ni descargado. |
| Origin `https://example.invalid` | 403, sin Access-Control-Allow-Origin. |
| Cadenas de auditoría | Ambas válidas; 78/21 registros al consultar. |
| Logout | Dos 200; ambas sesiones propias cerradas. |
| HTML Vite | 200, sin Content-Security-Policy. |

## Hallazgos abiertos para integración

### S-01 — Avisos de dependencias

SCA informó 527 dependencias, 126 de desarrollo, 105 opcionales y total 682
(contadores reportados por la herramienta; no se suman como conjuntos disjuntos).
Se conservaron cinco avisos: dos críticos, uno alto y dos moderados.

| Paquete instalado / riesgo | Aviso / ruta / reparación informada |
|---|---|
| handlebars 4.7.9, crítico | [GHSA-8r5x-fm3f-whwj](https://github.com/advisories/GHSA-8r5x-fm3f-whwj) y [GHSA-p8wg-vrv2-v86f](https://github.com/advisories/GHSA-p8wg-vrv2-v86f). eslint-config > eslint-plugin-boundaries (directo y vía @boundaries/elements). Registry informa >=4.7.10. |
| handlebars 4.7.9, moderado | [GHSA-xw65-4hp5-5hc7](https://github.com/advisories/GHSA-xw65-4hp5-5hc7), mismas rutas/parche. |
| braces 3.0.3, alto | [GHSA-vfj7-8cjw-p6xm](https://github.com/advisories/GHSA-vfj7-8cjw-p6xm). api > kysely-codegen > micromatch; eslint-config > boundaries > micromatch, incluido @boundaries/elements. Aviso recibido sin versión corregida. |
| uuid 8.3.2, moderado | [GHSA-w5hq-g745-h8pq](https://github.com/advisories/GHSA-w5hq-g745-h8pq). api > exceljs > uuid; registry informa >=11.1.1. Requiere evaluar compatibilidad antes de forzar major. |

Handlebars/braces aparecen en herramientas de lint/codegen según esas rutas;
uuid aparece en exportaciones Excel. No se ha probado ejecución de payload ni
alcance remoto. La clasificación del registry se conserva, incluso en herramientas.
Final QA debe evaluar y documentar reparación/mitigación y repetir SCA después de
cualquier cambio. Este informe describe el lockfile previo a esa integración.

### S-02 — CSP del documento frontend

Helmet configura CSP en respuestas de Fastify. El documento HTML del dev server
Vite no trae esa cabecera; por tanto la CSP observada en `/health` no acredita
protección CSP de React. Además Helmet conserva defaults con style-src unsafe-inline
y fuentes https; no se presenta ese conjunto como CSP estricta sin excepciones.
Se informa al propietario de integración; esta sesión no cambia Vite ni el shell.
La reparación debe preservar HMR local y probar la política sobre HTML con navegador.

## RN-08 y contradicción de activo

`requester-registration-checks.ts` prepara diez casos: dos altas autorizadas
TELÉFONO/PRESENCIAL por N1, idRegistradoPor 5 distinto de idSolicitante 2,
sede 1, evidencia con sesión/hash y visibilidad para el dueño; cinco denegaciones
por permiso, sede, canal o auditor; CSRF; denegación directa de servicio; rollback
real cuando falla la alerta después de insertar ticket y dos eventos de bitácora.
El fallo es inducido en el adaptador de prueba dentro de la transacción existente,
sin modificar negocio ni base demo. Las secuencias PostgreSQL pueden consumir un id
tras rollback; no se exige numeración sin huecos. ESLint/typecheck focal aprobados;
no se ejecutó este helper ni integración global aquí. Final QA debe registrarlo.

CU-01 permite código de activo libre para regularización, mientras RN-04/ER
requieren id_activo referenciado. Se conserva selección de catálogo y se rechaza
hardware sin activo. La contradicción ya figura en D-029; no se añaden columnas,
activos inventados ni excepciones silenciosas. Final QA conserva esa decisión.

Estado: COMPLETO CON LIMITACIÓN
