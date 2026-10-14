# Aceptación técnica del prototipo local EMPROVISA

Fecha: 14/10/2026, America/Managua. Estado: cierre técnico completo con limitaciones.
Este informe distingue implementación, pruebas técnicas y aceptación por usuarios.
El porcentaje funcional orientativo no representa cobertura de requisitos ni UAT.
Los cuatro controles finales pasaron y los recorridos principales se ejecutaron.
Avance funcional orientativo: 99 %, valoración de capacidades y fallos cerrados,
sin fórmula de cobertura ni testcount. UAT y reservas específicas siguen pendientes.

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
| RF-02 | tickets; tickets-checks.ts, ticket-operations-checks.ts; web features/tickets; E2E-CLOSURE.md | Alta/adjunto/atención/cierre por UI en TK-000016 y rama N2 TK-000017; no UAT firmado. |
| RF-03 | mail-ingest; notifications-mail-checks.ts | Ingesta/hilos simulados, sin IMAP institucional. |
| RF-04 | catalog y tickets; catalog-checks.ts, tickets-checks.ts | Tipo, jerarquía, activo obligatorio y cambios concurrentes. |
| RF-05 | tickets/domain; sla-calendar/pauses/compliance/validation.test.ts; calendars-checks.ts, sla-settings-checks.ts | Matriz, continuo/laboral, feriados y ciclos protegidos; norma consultable. |
| RF-06 | tickets/assignments; automatic-assignment-checks.ts | Categoría, especialidad, sede, permisos vigentes, concurrencia y reasignación. |
| RF-07 | jobs; jobs-checks.ts | Umbral idempotente, escalamiento sin reiniciar reloj, exclusión de pausados/atendidos. |
| RF-08 | assets; assets-checks.ts | Alta, custodia, ficha e incidentes por alcance; no acredita inventario patrimonial real. |
| RF-09 | knowledge; knowledge-checks.ts, knowledge-feedback-checks.ts | Publicación/versiones, búsqueda, votos y vínculos; privados filtrados en servidor. |
| RF-10 | audit y migraciones de cadena; audit-checks.ts, audit-api-checks.ts | Triggers, concurrencia, solo inserción, IP y verificación; no certificación C-TPAT/WRAP. |
| RF-11 | surveys; surveys-checks.ts, surveys.test.ts, jobs-checks.ts; E2E/A11Y/FINAL-QA | Formulario válido, flechas, 5/5/recibo y reuso rechazado por UI; tres encuestas reales. Invitaciones pendientes en memoria; enlace copiado conserva vigencia tras reinicio. |
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
| RNF-01 | [NETWORK-RESOURCES.md](NETWORK-RESOURCES.md), PERFORMANCE.md, ops/perf | Lecturas: 63 VUs, 3.216 solicitudes, p95 55,82 ms, 100 % checks y 0 % errores. Medición previa a cambios finales de cabeceras; sin carga de escrituras, exports, login ni jobs. |
| RNF-02 | auth-security-checks.ts, runtime-route-access-checks.ts, SECURITY-CLOSURE.md y [FINAL-QA.md](FINAL-QA.md) | Permisos de todas las rutas, CSRF, sesión, alcance, CSP HTML con nonce y API restringida. SCA final 0 críticos/0 moderados/1 alto Braces con mitigación local. DAST OWASP no ejecutado; no certificación sin hallazgos. |
| RNF-03 | database.integration.test.ts, migraciones y ER de 45 tablas | PostgreSQL local 18.1 autorizado; no ejecución contra versión 15. |
| RNF-04 | D-008, guía local | Respaldo NAS, RTO/RPO y restauración operativa fuera del prototipo; no acreditados. |
| RNF-05 | E2E-CLOSURE.md, A11Y-DYNAMIC.md, FINAL-QA.md | Cinco perfiles; teclado, 360 px/reflow 320, foco, objetivos y contraste de muestras renderizadas comprobados. Sin zoom real 200/400, lector audible, todos los estados/recorridos ni lista de navegadores institucionales. |
| RNF-06 | audit-checks.ts, audit-api-checks.ts; triggers encadenados | Usuario, fecha/IP, integridad y permisos comprobables; no valida certificaciones institucionales. |
| RNF-07 | Build/size-limit, rutas lazy y [FINAL-QA.md](FINAL-QA.md) | 312,6 kB JS gzip bajo 499 kB; inicio/login 148.248 bytes/4,734 s a 256 Kbps; total HTML/JS/CSS 317.863 bytes. Descarga real de cuerpos del build, sin interacción/pintura/JSON/VPN. |
| RNF-08 | pnpm/lockfile, módulos y ESLint, rama feature/fundacion-tecnica | Host local y helpdesk_test separados; staging/producción fuera del alcance; historial GitFlow completo no auditado. |
| RNF-09 | [NETWORK-RESOURCES.md](NETWORK-RESOURCES.md) | API bajo carga: pico 319,96 MiB y 1,10 % CPU host; Postgre compartido, muestreo local, sin extrapolación a servidor institucional. |
| RNF-10 | format.ts, contratos con locale español, DateInput, E2E/A11Y/FINAL-QA | Fechas de reportes/auditoría y vigencias/feriados corregidas; categoría/CSAT/nombres en español. No revisión exhaustiva de textos ni idioma del diálogo de archivos del sistema operativo. |
| RNF-11 | DTO/mapper, logs redactados; inventario técnico en manual seguridad-limitaciones.md | Datos ficticios, notas privadas filtradas y borrador por usuario sin credenciales. Texto local sin cifrado, descarte/24 h; no dictamen legal ni datos personales reales revisados. |
| RNF-12 | Cadenas solo inserción y [RETENTION.md](RETENTION.md) | Sin purga operativa; política local y copia adicional propuesta. No 24 meses observados, archivo ejecutado/verificado ni parámetro operativo de retención. |

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
| RN-08 | tickets.service.ts/policies.ts, requester-registration-checks.ts integrado | Diez casos aprobados: altas positivas TELEFONO/PRESENCIAL, identidades/sede/evidencia, denegaciones, CSRF, service y rollback real. |
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

CU-01 incorpora borrador por usuario en localStorage, recuperación, descarte,
24 horas locales y limpieza al crear. Doce pruebas y recarga/aislamiento/descarte
por UI acreditados; pérdida real de red durante POST y cierre/reapertura de pestaña
no repetidos. Activo libre se restringe a catálogo por RN-04/ER, sin regularización
patrimonial inventada. Protocolo de cinco participantes preparado y no ejecutado.

## Controles y cierre del lote final

Las seis sesiones entregaron COMPLETO CON LIMITACIÓN y liberaron sus archivos
antes de QA. Se integraron requesterRegistrationChecks y runtimeRouteAccessChecks.
Sin migración ni tablas nuevas; conservación del ER de 45 tablas y datos demo.

| Control | Resultado final 14/10/2026 |
|---|---|
| pnpm lint | Aprobado, sin excepciones nuevas. |
| pnpm typecheck | Aprobado para contratos, API, web y herramientas. |
| pnpm test | 369 pruebas en 27 archivos, 55,69 s; PostgreSQL real. |
| pnpm build | API/web aprobados; 312,6 kB JS gzip / límite 499 kB. |

pnpm check terminó código 0. Solo se recrearon public/helpdesk_queue en
helpdesk_test del PostgreSQL existente 18.1, sin k6 simultáneo. Logs ignorados
.data/quality/acceptance/finish-check*.log. Detalles de corridas, correcciones,
CSP/SCA y transferencia final en [FINAL-QA.md](FINAL-QA.md).
El usuario pidió omitir nuevas pruebas y hacer commits, dejando revisión adicional
para mañana; los controles anteriores ya habían concluido en verde.

## Hallazgos visuales consolidados

| ID | Estado y evidencia real |
|---|---|
| V-01 | Corregido: dd/mm/aaaa en reportes/auditoría, vigencias/feriados. Reportes/auditoría a 360 px en E2E; los tres formularios administrativos revalidados en escritorio por QA final. |
| V-02 | Corregido y observado: selector visible español, foco y subida PNG reales; diálogo del sistema operativo no certificado en español. |
| V-03 | Revalidado a 360 px: custodia con fechas completas y scroll local de región 287/contenido 640 px. |
| V-04 | Revalidado a 360 px: paginación en dos filas, controles completos y Siguiente operable. |
| V-05 | Corregido/observado: vacíos contextuales de KB y avisos con siguiente paso. No cuatro estados dinámicos por toda pantalla. |
| V-06 | Corregido/observado: salto/foco al main y shell de roles; Servicio dispone de retorno operable. Main anidados retirados en tres páginas. |

E2E completó TK-000016 (nueve hitos) y TK-000017 (N2/pausa/reanudación),
cinco perfiles, administración/SLA/Servicio, estados controlados y CSAT válido.
A11y comprobó radios/flechas/Tab, errores/foco, reflow, tamaños y contraste de
muestras. QA final corrigió mensajes ingleses, fechas, landmarks, navegación y
CSP, y revalidó CSAT con TK-000018 preparado por HTTP normal; no se equipara
esa preparación a otro flujo E2E completo por UI. Capturas locales ignoradas;
los tres informes distinguen anchos, métodos, cambios y límites de herramienta.

## Restante humano y reservas exactas

- UAT de cinco participantes y aprobación de Product Owner: [protocolo listo](../manuals/aceptacion-usuarios.md), sin firmas.
- Zoom real 200/400 y lector audible; lista de navegadores institucionales y revisión exhaustiva de todos los estados/errores, contraste y objetivos.
- Pruebas adicionales de pérdida de red, cierre/reapertura de pestaña y simultaneidad de borradores: pospuestas por instrucción del usuario.
- DAST OWASP automatizado y seguimiento del aviso alto Braces sin parche publicado; mitigación local probada y registrada, sin ocultar SCA.
- Retención de 24 meses observada y procedimiento de archivo ejecutado/verificado no acreditados; política/procedimiento propuesto en RETENTION.md.
- RF-19 permanece parcial por valores SLA/matriz no negociables; activo de CU-01 exige catálogo, sin texto libre. No se pide flexibilizar AGENTS.
- Correo simulado, invitaciones CSAT en memoria y rendimiento acotado de lecturas/transferencia/host local; infraestructura operativa fuera del alcance.

Avance orientativo 99 %; entrega técnica completa con estas reservas.
No hay aceptación formal del 100 % de la especificación ni aprobación humana atribuida al agente.
