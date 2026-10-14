# Aceptación técnica del prototipo local EMPROVISA

Fecha: 14/10/2026, America/Managua. Estado: cierre técnico completo con limitaciones.
Este informe distingue implementación, pruebas técnicas y aceptación por usuarios.
El porcentaje funcional orientativo no representa cobertura de requisitos ni UAT.
Los cuatro controles finales pasaron; la aceptación visual/funcional completa
sigue pendiente. Avance funcional orientativo: 97 %, sin cálculo por testcount.

## Línea base y método

Fuentes: AGENTS.md, docs/specs/SPEC-TI-2026-002 Sistema Helpdesk EMPROVISA
v2.0.docx, docs/er/ER_EMPROVISA_completo.puml, docs/mockups/P-01 a P-10,
docs/DECISIONS.md y pruebas del repositorio. El texto DOCX se extrajo de OOXML;
no se certifica su presentación. D-001/D-002/D-008 adaptan stack, 45 tablas y
alcance local. No se exigen AD, correo real, VPN, TLS, NAS ni producción.

En las tablas, rutas de módulos son relativas a apps/api/src/modules; pruebas
de integración son relativas a apps/api/test y las unitarias viven en los módulos.
Los helpers se registran en database.integration.test.ts y requieren PostgreSQL
real. Su existencia acredita trazabilidad; el resultado final se registra aparte.
La revisión visual y el teclado dinámico pertenecen a las sesiones correspondientes.

## Requerimientos funcionales

| ID | Implementación y evidencia técnica | Alcance o límite de aceptación |
|---|---|---|
| RF-01 | auth; auth-checks.ts, auth-security-checks.ts, seed-checks.ts | LOCAL Argon2id, cinco fallos, sesión hash y CSRF; AD sustituido por D-008. |
| RF-02 | tickets; tickets-checks.ts, ticket-operations-checks.ts; web features/tickets | Alta, cola propia y ficha por número; navegación humana pendiente de evidencia visual. |
| RF-03 | mail-ingest; notifications-mail-checks.ts | Ingesta/hilos simulados, sin IMAP institucional. |
| RF-04 | catalog y tickets; catalog-checks.ts, tickets-checks.ts | Tipo, jerarquía, activo obligatorio y cambios concurrentes. |
| RF-05 | tickets/domain; sla-calendar/pauses/compliance/validation.test.ts; calendars-checks.ts, sla-settings-checks.ts | Matriz, continuo/laboral, feriados y ciclos protegidos; norma consultable. |
| RF-06 | tickets/assignments; automatic-assignment-checks.ts | Categoría, especialidad, sede, permisos vigentes, concurrencia y reasignación. |
| RF-07 | jobs; jobs-checks.ts | Umbral idempotente, escalamiento sin reiniciar reloj, exclusión de pausados/atendidos. |
| RF-08 | assets; assets-checks.ts | Alta, custodia, ficha e incidentes por alcance; no acredita inventario patrimonial real. |
| RF-09 | knowledge; knowledge-checks.ts, knowledge-feedback-checks.ts | Publicación/versiones, búsqueda, votos y vínculos; privados filtrados en servidor. |
| RF-10 | audit y migraciones de cadena; audit-checks.ts, audit-api-checks.ts | Triggers, concurrencia, solo inserción, IP y verificación; no certificación C-TPAT/WRAP. |
| RF-11 | surveys; surveys-checks.ts, surveys.test.ts, jobs-checks.ts | Escala 1–5, token único hash, caducidad, CSRF y concurrencia. Invitaciones visibles en memoria; un enlace ya copiado conserva su vigencia después del reinicio. Formulario válido no revisado visualmente. |
| RF-12 | reports/domain/metrics.ts; reports.test.ts, reports-checks.ts | MTTA/MTTR/SLA/CSAT y agregados; fórmulas y denominadores documentados en decisiones. |
| RF-13 | reports; reports-checks.ts, audit-api-checks.ts | PDF/Excel autorizados y evidencia de consulta/exportación; impresión humana no certificada aquí. |
| RF-14 | rbac, tickets y assets; auth-checks.ts, tickets-checks.ts, assets-checks.ts | Tres sedes, dueño/grupo/sede/global, auditor lectura; VPN fuera del alcance. |
| RF-15 | tickets/attachments, infra/storage; attachments-checks.ts, local-storage.test.ts | Tipo real, UUID, SHA-256, tamaño, descarga autorizada y notas privadas. |
| RF-16 | tickets/pauses; ticket-lifecycle-checks.ts, sla-pauses.test.ts, calendars-checks.ts | Motivo restringido/escrito, pausa/reanudación y calendario del ciclo. |
| RF-17 | notifications y jobs; notifications-mail-checks.ts, jobs-checks.ts | Cola/despacho/reintentos simulados; no entrega de correo real. |
| RF-18 | users, groups, rbac/role-catalog; admin-identity-checks.ts, role-catalog-checks.ts | Usuarios, roles personalizados y permisos existentes; roles de sistema protegidos, último administrador y revocación. |
| RF-19 | catalog, settings/calendars, settings/parameters, settings/sla; catalog/calendars/parameters/sla-settings-checks.ts | Parcial: consulta de matriz/plazos y edición auditada de nombres; valores operativos no editables por AGENTS. D-027. |
| RF-20 | tickets/reopenings; ticket-lifecycle-checks.ts, sla-reopening.test.ts, calendars-checks.ts | Cinco días hábiles y nuevo ciclo; referencia de origen después del plazo. |

## Requerimientos no funcionales

| ID | Evidencia | Alcance o límite de aceptación |
|---|---|---|
| RNF-01 | [PERFORMANCE.md](PERFORMANCE.md), ops/perf | Lecturas: 63 VUs, 3.225 solicitudes, p95 47,69 ms, 100 % checks. Medición anterior al lote final; no carga de escrituras, exports, login ni jobs. |
| RNF-02 | auth-security-checks.ts, app.test.ts, cors.test.ts, adjuntos y pruebas denegadas por capacidad | CSRF, sesión, RBAC, validación, consultas parametrizadas y Helmet. HTTP local autorizado; escaneo OWASP sin hallazgos altos/críticos no ejecutado. |
| RNF-03 | database.integration.test.ts, migraciones y ER de 45 tablas | PostgreSQL local 18.1 autorizado; no ejecución contra versión 15. |
| RNF-04 | D-008, guía local | Respaldo NAS, RTO/RPO y restauración operativa fuera del prototipo; no acreditados. |
| RNF-05 | [VISUAL.md](VISUAL.md), [ACCESSIBILITY.md](ACCESSIBILITY.md) | Escritorio/360 px observados en navegador integrado; teclado parcial. Sin todos los perfiles, navegadores, flujos, zoom ni lector de pantalla. Hallazgos abiertos abajo. |
| RNF-06 | audit-checks.ts, audit-api-checks.ts; triggers encadenados | Usuario, fecha/IP, integridad y permisos comprobables; no valida certificaciones institucionales. |
| RNF-07 | Build con size-limit, rutas lazy | 308,39 KB gzip sumados de todos los JS compilados, bajo 499 KB. Peso total de página y navegación a 256 Kbps no medidos. |
| RNF-08 | pnpm/lockfile, módulos y ESLint, rama feature/fundacion-tecnica | Host local y helpdesk_test separados; staging/producción fuera del alcance; historial GitFlow completo no auditado. |
| RNF-09 | Rendimiento local, stack sin hardware nuevo | No hay medición final de CPU/memoria ni servidor institucional. |
| RNF-10 | web/lib/format.ts, reports/domain/date-range.ts, pruebas y VISUAL.md | Formatos de datos en español/Managua; V-01/V-02 incumplen presentación de fecha/idioma en controles nativos del navegador observado. Requisito no aceptado completo. |
| RNF-11 | DTO/mapper, redacción de logs y pruebas de alcance/notas privadas | Datos ficticios y minimización técnica; no dictamen legal ni inventario formal de tratamiento. |
| RNF-12 | Auditoría solo inserción y ausencia de borrado operativo | No demuestra 24 meses transcurridos ni procedimiento de archivo histórico; aceptación pendiente. |

## Reglas de negocio

| ID | Evidencia verificable | Límite |
|---|---|---|
| RN-01 | Alta portal y correo simulado, tickets-checks.ts | Adopción del canal por empleados no puede probarse en datos ficticios. |
| RN-02 | Matriz/seed, sla-validation.test.ts y plazos calculados | Valores normativos P1 15/120, P2 30/240, P3 120/480, P4 240/1440. |
| RN-03 | ticket-lifecycle-checks.ts, sla-pauses.test.ts | Solo REPUESTOS/PROVEEDOR_EXTERNO con motivo y responsable. |
| RN-04 | seed-checks.ts, tickets-checks.ts, catalog-checks.ts | Hardware requiere activo real del catálogo ficticio; no regularización por texto libre. |
| RN-05 | seed-checks.ts, ticket-lifecycle-checks.ts, automatic-assignment-checks.ts | Segregación en servidor y restricciones BD, aunque solicitante tenga perfil técnico. |
| RN-06 | ticket-lifecycle-checks.ts, jobs-checks.ts, parameters-checks.ts | Confirmación o 48 h de inactividad; comentario manual reinicia ventana. |
| RN-07 | jobs-checks.ts | Umbral 50 %, idempotencia y exclusión de pausados. |
| RN-08 | tickets.service.ts, tickets.policies.ts; tickets-checks.ts | Código exige permiso de sede y canal alterno para tercero; prueba existente deniega al solicitante. No se identificó prueba positiva específica del alta por tercero. |
| RN-09 | sla-calendar/validation.test.ts, calendars-checks.ts | Continuo P1/P2, laboral P3/P4; fotografías protegen ciclos previos. |
| RN-10 | sla-reopening.test.ts, ticket-lifecycle-checks.ts | Cinco días hábiles; nuevo ciclo y referencia de origen fuera de plazo. |
| RN-11 | seed-checks.ts, ticket-lifecycle-checks.ts | Justificación requerida para prioridad manual y evidencia transaccional. |
| RN-12 | audit-checks.ts, database.integration.test.ts, audit-api-checks.ts | Roles BD sin UPDATE/DELETE, hashes y serialización concurrente. |

## Casos de uso y criterios de la sección 6.7

CU-01/03/04/05/06/07 tienen evidencia de alta, clasificación, atención,
escalamiento, pausa, resolución/cierre en los helpers tickets, operations y lifecycle.
CU-02 usa recepción simulada; CU-08/09/10 corresponden a knowledge/assets/reports.
Estos helpers prueban servicios y HTTP mediante fastify.inject, no las diez tareas
completas ejecutadas por una persona en el navegador.

Los ocho criterios de la sección 6.7 se trazan a alta/avisos simulados (tickets y
notifications-mail), prioridades/plazos (SLA y calendars), cola/SLA (visual),
escalamiento (lifecycle/jobs), pausa (lifecycle/SLA), cadena (audit), cierre
(lifecycle/jobs) y multisede (tickets/RBAC). El criterio de VPN se adapta a acceso
local según D-008. La evidencia visual de cada recorrido se detalla en su informe.

Excepciones de CU-01 no acreditadas completamente: useTicketForm conserva el
formulario montado al fallar un envío, pero no persiste borradores tras recargar
o cerrar la página. La alternativa de introducir un activo como texto libre
se restringe a seleccionar un activo existente por RN-04/ER. No se afirma haber
implementado regularización patrimonial ni el protocolo de cinco participantes
de la sección 5.5. Esas diferencias requieren constancia en la aceptación.

## Controles finales ejecutados

Las cuatro coordinaciones quedaron COMPLETO CON LIMITACIÓN antes de integrar
el helper y ejecutar QA. Se registró slaSettingsChecks en el driver; sin migración.
`pnpm check` terminó con código 0 el 14/10/2026. El script ejecuta en serie:

| Control | Resultado de este lote |
|---|---|
| pnpm lint | Aprobado, sin excepciones nuevas. |
| pnpm typecheck | Aprobado: contracts, API, web, configuración y herramientas incluidas. |
| pnpm test | Aprobado: 316 pruebas en 22 archivos, 51,33 s; incluye ocho casos SLA nuevos. |
| pnpm build | Aprobado: API y web; size-limit 308,39 KB gzip frente a 499 KB. |

Integración recreó public y helpdesk_queue únicamente en helpdesk_test del
contenedor Postgre existente 18.1; migraciones y seed reales, sin k6 simultáneo.
No se recreó helpdesk, no se tocó otra base ni se desplegó infraestructura.
Log bruto local: `.data/quality/acceptance/check.log`, ignorado. No se repitió k6;
PERFORMANCE.md conserva fecha/alcance y resultados del lote anterior.

Prueba HTTP en helpdesk, API 127.0.0.1:3000: consulta de cuatro prioridades/nueve
combinaciones, cambio efectivo y restauración del nombre de P1, norma y matriz
conservadas, ambos plazos de TK-000015 conservados y dos cadenas íntegras.
Primera ejecución falló solo al cerrar sesión por Content-Type JSON sin cuerpo
en el script; segunda ejecución corregida terminó con código 0. Se revocó la
sesión propia restante de la primera ejecución, identificada por su evidencia
SLA_NOMBRE_EDITADO; la segunda cerró por logout. Sin cookies/tokens en el informe.
Las dos ediciones/restauraciones quedan como evidencia real, sin borrar historia.

## Hallazgos y aceptación pendiente

| ID | Situación tras integración |
|---|---|
| V-01 | Abierto: fechas nativas en reportes/auditoría dependen del locale del navegador; se observaron mes/día/año. |
| V-02 | Abierto: selector de adjuntos nativo visible en inglés en el navegador observado. |
| V-03 | Reparación de código: custodia usa ancho mínimo 640 px y fechas sin fragmentar dentro de región desplazable. QA pasó; falta repetir observación a 360 px. |
| V-04 | Reparación de código: texto de página ocupa fila completa, controles en segunda fila de grilla. QA pasó; falta repetir observación a 360 px. |
| V-05 | Abierto: vacíos genéricos de KB/avisos requieren contexto y siguiente paso. |
| V-06 | Abierto: acceso al contenido móvil después de navegación/sesión; propuesta de salto al contenido pendiente. |

La sesión visual acreditó login/logout de jefe y solicitante, pantallas de datos,
carga/error/vacío de KB, Reintentar, foco/scroll de cola, gráfico estabilizado y
alternativa textual operable con Enter. No hubo alta, adjunto ni atención por UI.
Sus capturas son anteriores a las dos reparaciones finales: no prueban su efecto.
Capturas en `.data/quality/visual/`, locales e ignoradas; informe versionado VISUAL.md.

Pendientes dinámicos concretos: repetir V-03/V-04; corregir y validar V-01/V-02,
V-05/V-06; CSAT con token válido, calificación/envío/agradecimiento; crear/atender
completamente con teclado; zoom 200/400 %, lector de pantalla, contraste renderizado,
todos los errores/estados por pantalla; perfiles N1/N2/AUDITOR; subpaneles de
administración, nueva pantalla SLA y Servicio. No se sustituye esta lista por
tests de API ni por medición de contraste de colores opacos.

También siguen los límites de RF-19, borrador/activo de CU-01, prueba positiva
de RN-08 y RNF explicitados arriba. Invitaciones CSAT en memoria y correo
simulado son límites del prototipo. No hay aprobación de Product Owner ni
protocolo UAT de cinco participantes firmado. Entrega técnica aceptable con
reservas documentadas; no aceptación formal del 100 % de la especificación.
