# AGENTS.md: Sistema de mesa de ayuda EMPROVISA (SPEC-TI-2026-002)

## 0. Alcance vigente: prototipo local (confirmado por el usuario el 13/10/2026)
Esta decisión aplica a TODO el proyecto y prevalece sobre requisitos operativos
anteriores: el objetivo es ejecutar y demostrar la aplicación en la computadora
local. Node/Fastify y React corren en el host; se reutiliza PostgreSQL del usuario.
Todos los perfiles de demostración usan cuentas LOCAL con Argon2 y datos ficticios.
No implementar LDAP/AD, SMTP/IMAP reales, nginx, systemd, servidores Ubuntu, NAS,
respaldos operativos ni despliegues de producción. Correo e integraciones se simulan.
Railway es una posibilidad posterior; no desplegar ni crear recursos externos ahora.
Conservar el dominio, las 45 tablas, la arquitectura modular, sesiones, permisos,
CSRF, integridad de auditoría, accesibilidad y los cuatro controles de calidad.
En HTTP local usar cookie helpdesk_sid, HttpOnly y SameSite=Strict; Secure y el
prefijo __Host- no se exigen en el prototipo. No debilitar hash de contraseñas/tokens.
Las contraseñas ficticias de la seed pueden documentarse en README por pedido
expreso del usuario. Los secretos reales del entorno siguen fuera de Git.
## 1. Producto
Aplicación web interna de mesa de ayuda (Helpdesk/ITSM) para EMPROVISA, empresa de
seguridad privada con sedes en Managua, Rivas y León. 63 usuarios concurrentes máximo.
El prototipo se demuestra en localhost. Interfaz 100% en español, fechas dd/mm/aaaa,
zona horaria America/Managua. Centraliza el soporte de TI: ticket con prioridad, plazos
(SLA), asignación, escalamiento, bitácora inalterable, inventario de activos, base de
conocimientos, encuesta de satisfacción y reportes.

## 2. Fuentes de verdad (leer antes de escribir código)
- docs/spec/        Especificación (requerimientos RF/RNF/RN, casos de uso, backlog, reglas SLA)
- docs/er/          ER_EMPROVISA_completo.puml y .png (45 tablas, 6 dominios) y vistas por dominio
- docs/mockups/     P-01 a P-10 (referencia visual de cada pantalla)
Precedencia ante conflicto: ER para datos, spec para reglas de negocio, mockups para
apariencia. Si encontrás una contradicción, NO la resuelvas en silencio: anotala en
docs/DECISIONS.md y seguí con la opción más conservadora.

## 3. Stack (usar versiones estables vigentes, fijadas con lockfile)
Monorepo pnpm workspaces.
- Backend: Node.js LTS vigente, TypeScript estricto, Fastify, fastify-type-provider-zod,
  Zod, Kysely + kysely-codegen, migraciones SQL puras (node-pg-migrate), PostgreSQL 15,
  pg-boss (colas y cron sobre Postgres), argon2 (cuentas
  locales), nodemailer (SMTP), imapflow (IMAP), @fastify/helmet, @fastify/rate-limit,
  @fastify/multipart, @fastify/cookie, @fastify/swagger, pino, luxon (fechas y zona
  horaria), exceljs y pdfmake (exportaciones), file-type (validar adjuntos).
- Frontend: React + Vite + TypeScript estricto, React Router, TanStack Query,
  TanStack Table, React Hook Form + Zod, Tailwind CSS, shadcn/ui (Radix), Recharts,
  lucide-react.
- Pruebas: Vitest, Testing Library, MSW, Playwright, k6. Las pruebas de integración usan la
  base helpdesk_test del mismo contenedor PostgreSQL (se recrea en cada corrida).
- PROHIBIDO sin aprobación: Redux, Prisma, TypeORM, Express, Redis, GraphQL, Testcontainers,
  dockerizar api o web, cualquier segundo framework de CSS, librerías de UI adicionales.

## 3.1 Entorno del prototipo
- Desarrollo: computadora local. API y frontend sin contenedores.
- PostgreSQL: reutilizar el contenedor Postgre autorizado (18.1) y las bases
  helpdesk/helpdesk_test. No reemplazarlo ni tocar otras bases del usuario.
- pnpm dev levanta Fastify y Vite; Vite hace proxy de /api al backend.
- Puerto API configurable con PORT; CORS configurable con CORS_ORIGINS en .env.
- El Compose de un solo servicio queda como alternativa para una base nueva.
- Roles separados helpdesk_migrator, helpdesk_app y helpdesk_readonly. Pools 10/3.
- UTC con timestamptz en BD; interfaz America/Managua con fechas dd/mm/aaaa.
- Adjuntos locales en STORAGE_DIR, fuera del directorio estático.
- HTTP local para demostrar; no se requieren TLS, nginx ni servicios del sistema.
- Integraciones externas simuladas: ninguna credencial o servicio institucional
  se necesita para demostrar el flujo. No enviar correos reales.
- No crear despliegues ni recursos Railway como parte de tareas locales.
## 4. Estructura del monorepo
```
helpdesk-emprovisa/
  AGENTS.md  README.md  .env.example  .env.db.example
  package.json  pnpm-workspace.yaml  tsconfig.base.json
  docker-compose.yml          (SOLO el servicio postgres)
  docs/            spec/  er/  mockups/  adr/  DECISIONS.md  PROGRESS.md  deploy.md
  ops/
    postgres/      postgresql.conf  init/ (script de inicialización)
    perf/          scripts k6
  packages/
    contracts/     enums, permisos, schemas Zod y tipos compartidos front/back
    eslint-config/ reglas compartidas (max-lines, boundaries)
  apps/
    api/
    web/
```
`packages/contracts` es la única fuente de enums (estados, prioridades, impactos,
canales), códigos de permiso, schemas de request/response y códigos de error. Front y
back importan de `@helpdesk/contracts`. Nunca duplicar un enum.

## 5. Backend: apps/api (monolito modular)
```
apps/api/
  src/
    main.ts                  arranque del proceso
    app.ts                   construye Fastify, registra plugins y módulos
    config/                  env.ts (Zod; falla al arrancar si falta algo), constants.ts
    plugins/                 db, session-auth, rbac, csrf, helmet, rate-limit, swagger,
                             error-handler, request-context, multipart
    common/                  errors/, http/ (paginación, respuestas), crypto/ (hash, tokens),
                             dates/, logger/
    infra/
      db/                    client.ts, generated-types.ts, migrations/*.sql, seeds/
          mail/                  smtp.client.ts, imap.client.ts, templates/
      storage/               local-storage.ts (adjuntos fuera de la raíz web)
      queue/                 boss.ts, registro de jobs
    modules/
      auth/                  login, logout, me, sesiones, intentos
      users/                 usuarios, sedes, departamentos, delegaciones
      rbac/                  roles, permisos, usuario_rol
      groups/                grupos_resolutores, miembros, especialidades
      catalog/               categorias, estados, transiciones, prioridades, matriz
      settings/              parametros, calendarios, horarios, feriados, plantillas
      tickets/               ver forma de módulo abajo
      assets/                activos_ti, tipos, historial de custodia (CMDB)
      knowledge/             articulos_kb, versiones, votos
      surveys/               encuestas_csat (token de un solo uso)
      notifications/         cola, plantillas, despacho SMTP
      mail-ingest/           correos_entrantes, hilos por in_reply_to
      reports/               métricas, tablero, exportación PDF y Excel
      audit/                 bitacora, auditoria_sistema, verificación de cadena
      jobs/                  tareas_programadas y handlers
  test/                      integración y e2e de API
```
Forma obligatoria de cada módulo (ejemplo tickets):
```
modules/tickets/
  index.ts              API pública del módulo; es lo único importable desde afuera
  tickets.routes.ts     rutas, schemas Zod, preHandlers de permiso (sin lógica)
  tickets.service.ts    casos de uso (createTicket, changeState...), transacciones
  tickets.repository.ts consultas Kysely (única capa que toca la BD)
  tickets.policies.ts   quién puede qué: alcance por sede, RN-05, visibilidad de notas
  tickets.mapper.ts     fila de BD a DTO (aquí se filtran campos internos)
  domain/               funciones PURAS sin BD ni HTTP, con pruebas unitarias
    priority.ts         matriz impacto x urgencia
    sla-calculator.ts   cálculo de fechas límite con calendario, feriados y pausas
    state-machine.ts    valida transiciones a partir de datos de transiciones_estado
  comments/ attachments/ assignments/ escalations/ pauses/ reopenings/ resolutions/
                        subcarpetas con la misma forma (routes, service, repository)
  __tests__/
```
Reglas de capas: routes llama a service; service llama a repository y a domain; solo
repository importa Kysely. Un módulo NO importa el repository de otro: usa el `index.ts`
(service) del otro módulo. Una operación que toca varias tablas corre en UNA transacción.

## 6. Frontend: apps/web (arquitectura por features)
```
apps/web/src/
  main.tsx
  app/
    App.tsx
    providers/           QueryProvider, AuthProvider, ThemeProvider
    router/              routes.tsx (lazy por ruta), guards/ (RequireAuth, RequirePermission)
    layouts/             AppShell/ (Sidebar, Topbar, Breadcrumbs), AuthLayout, PublicLayout
  features/
    auth/                login, sesión actual
    tickets/
      api/               tickets.api.ts, tickets.keys.ts (fábrica de query keys)
      hooks/             useTickets.ts, useTicket.ts, useTicketActions.ts, ...
      schemas/           formularios locales (los de API vienen de contracts)
      lib/               funciones puras (formato de SLA, etiquetas, filtros)
      components/
        queue/           TicketTable.tsx, columns.tsx, TicketFilters.tsx, SlaBar.tsx
        detail/          TicketHeader.tsx, TicketTimeline.tsx, TimelineItem.tsx,
                         ReplyBox.tsx, TicketSidebar.tsx, ActionsPanel.tsx
        form/            TicketForm.tsx, CategoryField.tsx, ImpactField.tsx,
                         AssetSearchField.tsx, AttachmentsDropzone.tsx, PriorityPreview.tsx
      pages/             TicketQueuePage.tsx, TicketDetailPage.tsx, NewTicketPage.tsx
      index.ts           API pública del feature
    assets/  knowledge-base/  reports/  admin/  surveys/  (misma forma)
  components/
    ui/                  primitivas shadcn (button, dialog, input...)
    common/              DataTable, EmptyState, ErrorState, TableSkeleton, PageHeader,
                         StatusBadge, PriorityChip, QueryBoundary, Can
  lib/                   http.ts (cliente con CSRF), queryClient.ts, format.ts, cn.ts
  hooks/                 hooks globales (useDebounce, usePermissions)
  styles/                tokens.css (paleta), globals.css
```

## 7. Reglas anti-archivos gigantes (se verifican con ESLint; si fallan, no se entrega)
- Un componente exportado por archivo. Máximo 150 líneas por componente; límite duro de
  200 por archivo (`max-lines`). Backend: límite duro de 300 por archivo.
- Las páginas SOLO componen: layout + hooks + componentes. Sin fetch, sin cálculos, sin
  reglas de negocio.
- La lógica va en hooks (`use*.ts`) o en funciones puras de `lib/`. Los componentes
  presentan.
- Datos del servidor SOLO con TanStack Query (hooks en `features/*/hooks`). Estado local
  con useState/useReducer. No hay estado global salvo la sesión.
- Formularios: React Hook Form + schema Zod de `contracts`. Cada campo complejo es un
  componente propio.
- Tablas: definición de columnas en `columns.tsx`, aparte del componente de tabla.
- Si un archivo se acerca al límite, dividilo ANTES de seguir. No agregues excepciones al
  linter.
- Un feature no importa de otro feature, salvo por su `index.ts`. Configurado con
  eslint-plugin-boundaries. Lo compartido sube a `components/` o `lib/`.
- Estilos solo con Tailwind y tokens CSS; variantes con cva. Sin CSS por componente.
- Prohibido `any`, `@ts-ignore`, `console.log` y código comentado.

## 8. Convenciones
- Idioma: nombres de DOMINIO en español exactamente como el ER (tablas, columnas, campos
  de DTO, estados, códigos de permiso). Sufijos técnicos y carpetas en inglés
  (service, repository, hook, routes). Textos de UI en español. No traducir el dominio.
- Kysely con CamelCasePlugin: la columna `fecha_limite_solucion` es `fechaLimiteSolucion`.
- Archivos: carpetas en kebab-case; componentes PascalCase.tsx; hooks useXxx.ts;
  el resto camelCase o kebab-case consistente por carpeta.
- API: REST bajo `/api/v1`, JSON, validación Zod en entrada y salida, errores en formato
  problem+json con `code` estable definido en contracts. Paginación `?page&pageSize`
  con `{ data, meta: { page, pageSize, total } }`. Orden `?sort=-fechaCreacion`.
- El ticket se expone con `numero` (TK-000123), nunca con el id interno en la UI.
- Commits convencionales (feat, fix, refactor, test, docs, chore), GitFlow (EST-TI-003):
  ramas feature/*, develop, release/*, main. Un cambio coherente por commit.

## 9. Reglas de dominio (no negociables)
Tipos: INCIDENTE | SOLICITUD.
Roles: SOLICITANTE, ANALISTA_N1, ESPECIALISTA_N2, JEFE_TI, AUDITOR (solo lectura).
Permisos con formato `modulo.accion` (ticket.crear, ticket.escalar, sla.pausar...) definidos
en contracts. Se sirven por rol desde la BD (rol_permiso), no se codifican en if por rol.
Visibilidad: SOLICITANTE ve solo sus tickets. N1 ve la cola de su sede. N2 ve lo asignado
o escalado a sus grupos. JEFE_TI y AUDITOR ven todo (AUDITOR sin escritura). Las notas
internas NUNCA llegan al SOLICITANTE: se filtran en repository/mapper, no en la UI.

Estados y transiciones (la fuente es la tabla transiciones_estado; estas son las semillas):
NUEVO -> ASIGNADO | CANCELADO
ASIGNADO -> EN_ATENCION | ESCALADO
EN_ATENCION -> EN_ESPERA | ESCALADO | RESUELTO
EN_ESPERA -> EN_ATENCION
ESCALADO -> EN_ATENCION | RESUELTO
RESUELTO -> CERRADO | EN_ATENCION
CERRADO -> REABIERTO (hasta 5 días hábiles; después, ticket nuevo con id_ticket_origen)
REABIERTO -> EN_ATENCION
Reloj de SLA: corre en NUEVO, ASIGNADO, EN_ATENCION, ESCALADO, REABIERTO. Detenido en
EN_ESPERA, RESUELTO, CERRADO, CANCELADO. Reabrir inicia un nuevo ciclo de SLA.

Prioridad = matriz_prioridad(impacto, urgencia). El analista puede cambiarla solo con
justificacion_prioridad (RN-11).
Alto/Alta=P1, Alto/Media=P2, Alto/Baja=P3, Medio/Alta=P2, Medio/Media=P3, Medio/Baja=P3,
Bajo/Alta=P3, Bajo/Media=P4, Bajo/Baja=P4.

Plazos (minutos respuesta / solución, modo de calendario):
P1 15 / 120 CONTINUO | P2 30 / 240 CONTINUO | P3 120 / 480 LABORAL | P4 240 / 1440 LABORAL.
Cálculo: fecha de creación + plazo; en modo LABORAL solo cuentan horas de
horarios_laborales y se saltan fines de semana y feriados; las pausas se descuentan.
Alerta al 50% del plazo (UMBRAL_50). Al vencer la respuesta sin atención: escalamiento
automático conservando el reloj original. El cumplimiento se evalúa al RESOLVER.
Pausa de SLA: solo motivos REPUESTOS o PROVEEDOR_EXTERNO, con motivo escrito (RN-03).
Cierre: confirma el solicitante o se cierra solo a las 48 h de inactividad en RESUELTO (RN-06).
RN-04: categorías con requiere_activo exigen id_activo (hardware, F-ACT-01).
RN-05: quien es solicitante de un ticket no puede resolverlo ni validarlo.
RN-08: si el usuario no puede entrar al sistema, el analista registra el caso a su nombre
con canal_ingreso que lo indique (id_registrado_por distinto de id_solicitante).
RN-12: bitacora y auditoria_sistema son solo-inserción. Hash encadenado:
hash_registro = SHA-256(hash_previo + contenido canónico).

## 10. Seguridad (checklist obligatorio)
- Sesión: token aleatorio de 32 bytes, solo su SHA-256 en tabla sesiones. Cookie
  `helpdesk_sid`, HttpOnly, SameSite=Strict para HTTP local. Expira por inactividad (30 min,
  parámetro). Revocable. CSRF con token por sesión en header `x-csrf-token` para toda
  petición que modifica datos.
- Login: cuentas locales Argon2 para todos los perfiles de demostración. Registrar TODO intento en
  intentos_login. 5 fallos consecutivos bloquean la cuenta (bloqueado_hasta). Rate limit
  en /auth/login por IP y por usuario.
- Autorización con denegación por defecto: ninguna ruta sin permiso explícito. Existe una
  prueba que recorre todas las rutas registradas y falla si alguna no declara permiso ni
  está en la lista blanca pública. Verificar también en el service, no solo en la ruta.
- Toda entrada pasa por Zod. Consultas solo con Kysely parametrizado. Sin SQL concatenado.
- Adjuntos: validar tipo real con file-type contra lista blanca, tamaño máximo por
  parámetro, nombre almacenado UUID, hash SHA-256, guardados en STORAGE_DIR fuera de la
  raíz web, servidos por endpoint autorizado con Content-Disposition. Nunca por ruta estática.
- Helmet con CSP estricta, rate limit global y CORS limitado a los orígenes del entorno local.
- Red: desarrollo por loopback con puertos configurables; no requiere nginx ni TLS local.
- Roles de BD distintos, creados por ops/postgres/init: `helpdesk_migrator` (DDL),
  `helpdesk_app` (DML; SIN UPDATE ni DELETE sobre bitacora y auditoria_sistema, aplicado por
  las migraciones) y `helpdesk_readonly` (reportes y auditor).
- La bitácora se escribe con trigger BEFORE INSERT que calcula hash_previo y
  hash_registro (pgcrypto) bajo `pg_advisory_xact_lock`, para garantizar la cadena con
  concurrencia. Existe un job y un endpoint de verificación de integridad de la cadena.
- Logs pino en JSON con request id; redactar contraseñas, tokens, cookies y correos.
- Secretos reales solo en variables de entorno validadas y archivos locales excluidos de Git.
  Nada de credenciales en el repo.
- Datos personales de empleados limitados a lo necesario (Ley 787).

## 11. Jobs (pg-boss) y tareas programadas
Registrados en tareas_programadas y con su cron: sla-threshold (cada minuto), sla-breach-
escalation (cada minuto), auto-close-resolved (cada 15 min), mail-ingest (cada 2 min),
notification-dispatch (simulada, cada minuto, con reintentos y backoff),
audit-chain-verify (diario). Las acciones automáticas se registran en bitacora con
automatica=true e id_tarea. Handlers idempotentes. Ingesta y despacho de correo son simulados; no hay sincronización AD ni respaldo al NAS en el prototipo.

## 12. Calidad y definición de hecho
Una tarea termina solo si pasan: `pnpm lint`, `pnpm typecheck`, `pnpm test` y
`pnpm build`. Las pruebas de integración requieren el contenedor local Postgre en ejecución.
- domain/ con pruebas unitarias exhaustivas (SLA: fines de semana, feriados, límites de
  horario, pausas, cambio de ciclo por reapertura).
- Integración contra la base helpdesk_test (esquema recreado y migraciones aplicadas al
  iniciar la corrida) para cada service con reglas.
- Pruebas de ruta con fastify.inject: caso permitido y caso denegado por rol y por sede.
- Frontend: toda pantalla con datos implementa los 4 estados (carga con esqueleto, vacío,
  error con reintento, con datos) mediante `QueryBoundary`.
- Accesibilidad: contraste 4.5:1, estados nunca solo por color (siempre etiqueta de
  texto), botones de al menos 40 px, operable con teclado, usable desde 360 px.
- Presupuesto de peso (RNF-07): JS inicial de la app menor a 500 KB comprimido; división
  por rutas con React.lazy y chequeo con size-limit en el build.
- Rendimiento (RNF-01): p95 menor a 2 s con 63 usuarios virtuales (script k6 en ops/perf).
- Índices mínimos: tickets(id_estado,id_sede), tickets(id_asignado,id_estado), parcial en
  tickets(fecha_limite_solucion) para estados no finales, sla_alertas(estado,programada_para)
  parcial en PENDIENTE, bitacora(id_ticket,fecha_hora), notificaciones(estado) parcial.

## 13. Cómo trabajar
- Una tarea pequeña por vez, en vertical (BD, API, front de esa capacidad) y con pruebas.
- Antes de codificar una tarea: listá los archivos que vas a crear y verificá que respetan
  las estructuras de las secciones 5 y 6.
- Al terminar cada tarea: actualizá docs/PROGRESS.md (hecho, pendiente, decisiones).
- No inventes requisitos. Si falta información, preguntá o registrala en DECISIONS.md.
- No avances de fase mientras lint, typecheck y tests no estén en verde.