# Mesa de ayuda EMPROVISA

Prototipo local para demostrar el soporte de TI de Managua, Rivas y León,
basado en SPEC-TI-2026-002. Node.js, Fastify, React y PostgreSQL; Docker solo
para la base existente del usuario.

El prototipo incluye login local, sesiones, CSRF y permisos de BD; tickets con
prioridad, SLA y ciclo de atención; inventario con consulta/alta, conocimientos,
avisos y correo simulados, encuestas, reportes, administración y auditoría.
Conserva las 45 tablas y datos ficticios de demostración. Después del login se
abre la cola según el alcance de la cuenta. El detalle y los límites de cada
capacidad se describen abajo; su presencia no equivale a aceptación completa.

## Manuales

- [Uso por perfiles](docs/manuals/usuario.md).
- [Operación y desarrollo local](docs/manuals/operacion-local.md).
- [Recorrido de demostración de extremo a extremo](docs/manuals/demostracion.md).
- [Seguridad, configuración y limitaciones](docs/manuals/seguridad-limitaciones.md).
- [Protocolo de aceptación por cinco usuarios](docs/manuals/aceptacion-usuarios.md), pendiente de ejecución humana.

## Ejecución local

Node.js 24.21.0 y pnpm 11.25.0, fijados en el proyecto y en el lockfile.
pnpm descarga el runtime del proyecto sin sustituir el Node global.

```powershell
pnpm install --frozen-lockfile
pnpm --filter api db:migrate
pnpm --filter api db:seed
pnpm dev
```

Frontend y login: http://127.0.0.1:5173/login. Backend: http://127.0.0.1:3000.
Disponibilidad: http://127.0.0.1:3000/health; consulta ambos roles de BD.
API de sesión: GET /api/v1/auth/csrf, POST /api/v1/auth/login,
GET /api/v1/auth/me y POST /api/v1/auth/logout.

En `/tickets`, usá **Nuevo requerimiento** para registrar un caso. La prioridad
sale de impacto/urgencia y los plazos del calendario de la sede. Hardware exige
un activo de esa sede. Los analistas pueden registrar para otro usuario con
canal teléfono/presencial. Solicitantes ven sus casos; N1, su sede; N2, sus
asignaciones/grupos; jefe y auditor, todos. Las notas internas se filtran en API.
En `/activos`, los perfiles autorizados consultan inventario y fichas; el alta
exige acta F-ACT-01 y registra custodia y auditoría. Auditor solo consulta.

Nuevo requerimiento conserva un borrador por usuario en este navegador durante
24 horas desde la última edición. Se recupera al recargar o volver, también
después de salir e iniciar sesión con la misma cuenta. Crear o **Descartar
borrador y vaciar formulario** elimina la copia. No conserva adjuntos ni
credenciales; evitá secretos en el texto. En equipos compartidos, descartalo
antes de salir: localStorage no cifra los datos. Si el navegador bloquea el
almacenamiento, el aviso explica que la copia no sobrevivirá al cerrar la página.

En esta máquina se reutiliza el contenedor **Postgre**, autorizado por el
usuario. Las conexiones de los tres roles están en `.env`, excluido de Git.
No ejecutar Compose en el puerto 5432 mientras lo ocupa ese contenedor.
Para instalar una base nueva, copiar los ejemplos, completar contraseñas
y seguir [la guía de entorno](docs/deploy.md).

## Usuario de prueba

| Campo | Valor |
| --- | --- |
| Usuario | `admin.emergencia` |
| Contraseña de demostración | `EmprovisaDemo!2026` |
| Perfil | `JEFE_TI` |
| Sede | Managua |
| Tipo de cuenta | Administrador LOCAL de emergencia |

Todos estos usuarios pueden iniciar sesión con **`EmprovisaDemo!2026`**:

| Usuario | Perfil | Sede |
| --- | --- | --- |
| `admin.emergencia` | Jefe de TI | Managua |
| `ana.managua` | Solicitante | Managua |
| `carlos.rivas` | Solicitante | Rivas |
| `lucia.leon` | Solicitante | León |
| `analista.managua` | Analista N1 | Managua |
| `analista.rivas` | Analista N1 | Rivas |
| `analista.leon` | Analista N1 | León |
| `especialista.infra` | Especialista N2 | Managua, grupo multisede |
| `auditor.demo` | Auditor | Managua, lectura global |

Son cuentas LOCAL ficticias con hashes Argon2id. La migración 012 convierte
los usuarios AD simulados de la primera entrega al modelo local solicitado.
La seed no reemplaza datos previos; repetirla no duplica registros ni cambia
la contraseña. Los correos usan `example.invalid`; los jobs activos arrancan
con la API. Las integraciones de correo ya se procesan de forma simulada.

La sesión vence tras 30 minutos de inactividad, definidos en parámetros.
Cinco fallos bloquean la cuenta por 15 minutos; además hay límites de
20 intentos por IP y 10 por usuario durante 15 minutos. El mensaje de fallo
es genérico para evitar revelar qué cuentas existen.

## Recorrido de demostración preparado

| Ticket | Escenario |
| --- | --- |
| TK-000001 | Nuevo incidente crítico de CCTV en Rivas |
| TK-000002 | Correo de Managua asignado a N1 |
| TK-000003 | Atención de CCTV con más del 50 % del SLA consumido |
| TK-000004 | Impresora en espera de repuestos, con pausa registrada |
| TK-000005 | CCTV vencido, registrado por teléfono y escalado a N2 |
| TK-000006 | Impresora de León resuelta, pendiente de confirmación |
| TK-000007 | Solicitud cerrada, con encuesta de satisfacción respondida |
| TK-000008 | Incidente cerrado y reabierto con nuevo plazo de SLA |
| TK-000009 | Solicitud duplicada cancelada |

La seed conserva la secuencia de estados en bitácora, asignaciones,
resoluciones, comentarios públicos y notas internas; incluye activos con
acta patrimonial simulada y un artículo de conocimiento vinculado a una
resolución. Las notas internas se filtran en repository/mapper para el
solicitante, incluso cuando su cuenta también tiene permisos de analista.

El calendario de **demostración** es lunes a viernes, 08:00–17:00, sin
feriados; no representa un horario institucional aprobado. Los escenarios
laborales parten del lunes de la semana de ejecución. Los casos P1/P2
activos usan el instante de carga: su estado de SLA cambia con el tiempo.
La seed no simula archivos adjuntos inexistentes ni crea sesiones autenticadas.

## CORS y entorno

`PORT` define el puerto del backend; `HOST` solo admite `127.0.0.1`.
`CORS_ORIGINS` permite configurar orígenes exactos separados por comas:

```dotenv
PORT=3000
CORS_ORIGINS=http://127.0.0.1:5173,http://localhost:5173,http://127.0.0.1:3000,http://localhost:3000
```

Para usar el backend en 3001, cambiar `PORT` y sus entradas CORS; también
actualizar el destino del proxy de Vite. Reiniciar la API tras editar `.env`.
No se admiten comodines ni rutas. CORS permite los orígenes del entorno
local, credenciales y `X-CSRF-Token`. La cookie `helpdesk_sid` es HttpOnly y
SameSite=Strict para el HTTP local. El token de sesión no se guarda en
localStorage ni en texto plano en BD; solo su SHA-256.

`CSRF_SECRET` debe contener 64 caracteres hexadecimales aleatorios en `.env`.
Ya está configurado en esta máquina. Para una instalación local nueva,
generarlo con `pnpm exec node -e "process.stdout.write(require('node:crypto').randomBytes(32).toString('hex'))"`.
El login obtiene primero un desafío CSRF de cinco minutos; las acciones
autenticadas usan el token CSRF devuelto por login o /auth/me.

## Calidad y mantenimiento

La ficha permite tomar un ticket sin responsable, iniciar atención y enviar
respuestas públicas o notas internas según permisos. Solo jefatura reasigna;
el destinatario debe tener permisos vigentes y pertenecer al grupo del caso.
Los cambios simultáneos se rechazan con 409: usar «Actualizar ficha y acciones»
antes de reintentar. Los plazos originales se conservan al iniciar atención.

El panel «Ciclo del ticket» habilita reclasificar, escalar a N2, pausar/reanudar,
registrar solución, confirmar cierre, cancelar y reabrir según permisos y estado.
El responsable no puede resolver su propio requerimiento. Confirmar cierre requiere
marcar la casilla; un técnico tampoco valida su propio caso. Rechazar una solución
o reabrir inicia otro ciclo con evidencia anterior conservada. Fuera de cinco días
hábiles, la ficha ofrece crear otro requerimiento vinculado por número.

En detalle se adjuntan JPG/PNG/PDF, máximo inicial 10 MiB por archivo (parámetro
adjunto.maximo_bytes). Se comprueba el tipo real, tamaño y hash; los archivos usan
UUID en STORAGE_DIR y se descargan por un endpoint autorizado. El auditor consulta
metadatos y bitácora sin descargar contenido. Una subida falla si el caso está
cerrado/cancelado. Primero se crea el ticket y luego se agrega evidencia en su ficha.

En `/conocimientos` se consultan artículos por palabra/categoría. N2 y jefatura
pueden crear, editar y publicar con historial de versiones; auditoría solo lee.
Solicitantes ven artículos públicos publicados. Contenido se presenta como texto
plano; la ficha permite votos y vínculos por número de ticket según permisos.

Después de actualizar el código, ejecutar `pnpm --filter api db:migrate` y
reiniciar `pnpm dev`. Este comando compila los contratos antes de arrancar API
y Vite; reiniciarlo tras cambiar contracts evita contratos antiguos en memoria.

```powershell
pnpm lint
pnpm typecheck
pnpm test
pnpm build
pnpm --filter api db:codegen
```

Las pruebas usan PostgreSQL real y **recrean exclusivamente los esquemas public
y helpdesk_queue de helpdesk_test** antes de aplicar las migraciones y la seed. Necesitan `.env`
local y el contenedor disponible. No apuntan a helpdesk ni a las otras bases.
Los tipos Kysely se generan y dividen por tabla para respetar los límites de
archivo. Las migraciones son SQL puro; su registro usa node-pg-migrate.

Fuentes: [AGENTS.md](AGENTS.md), `docs/specs/`, `docs/er/`, `docs/mockups/`.
Ver [avance](docs/PROGRESS.md) y [decisiones](docs/DECISIONS.md).

### Automatizaciones, avisos y satisfacción

Al arrancar API, pg-boss programa alertas al 50 % y escalamiento por vencimiento
cada minuto; cierre por inactividad cada 15 minutos; recepción simulada cada dos
minutos; entrega de avisos cada minuto y verificación de auditoría diaria a las
03:00 de Managua. Se conservan las fechas SLA al escalar y se cierran casos
resueltos con 48 horas sin actividad manual. No hay envío real de correo.

En `/avisos`, cada cuenta consulta sus entregas simuladas y encuestas pendientes.
Jefatura y auditoría también consultan el estado de tareas. Cerrar un ticket, manual
o automáticamente, emite una encuesta de 1–5 con comentario opcional, válida siete
días y de un solo uso. El enlace abre `/encuesta` sin iniciar sesión.
La BD guarda únicamente el hash del token; enlaces pendientes viven en memoria
y dejan de mostrarse al reiniciar API. Los enlaces ya copiados conservan vigencia.
Reabrir el caso no genera otra encuesta.

Para probar recepción sin IMAP, jefatura puede usar `POST /api/v1/correo-simulado`
con su sesión y `x-csrf-token`. Cuerpo: `messageId`, `inReplyTo` (null para alta),
`usernameRemitente` (cuenta demo), `contenido` y `solicitud` (datos del formulario
de ticket, excepto solicitante/canal/origen). En respuesta usar `inReplyTo` del
mensaje procesado y `solicitud: null`. El job crea el caso o agrega comentario
público al hilo del propio solicitante; duplicados no crean nuevos registros.
La inyección se ofrece por API; no se afirma un cliente de correo completo.

### Asignación y reportes

Un ticket nuevo se asigna al integrante elegible del grupo con especialidad exacta
en la categoría y menor carga activa. Requiere cuenta/membresía/permisos vigentes,
alcance para la sede y responsable distinto del solicitante. Sin especialista,
conserva su cola; el sistema reintenta cada minuto y jefatura puede reasignar.
La demo configura impresoras de Managua para Miguel y CCTV para Sofía; otras
categorías conservan toma manual mientras no tengan especialidades registradas.
Plazos de SLA no se reinician y asignar no equivale a primera atención.

En `/reportes`, jefatura y auditoría filtran la cohorte por fechas de creación,
sede y categoría. Tablero con MTTA, MTTR, SLA, CSAT, desgloses, carga actual y
volumen diario; exportaciones PDF/Excel con los mismos filtros y permisos. Fórmulas
y denominadores visibles: MTTA usa todos los tickets, SLA todos los resueltos y
CSAT las encuestas respondidas de la cohorte. Las descargas no incluyen notas ni
comentarios internos, y el pool de reportes solo puede consultar la base.

### Administración y auditoría

Jefatura abre `/administracion/identidad` para gestionar cuentas locales, roles
con sede/vigencia, grupos, integrantes y especialidades. Crear la cuenta y asignar
un rol vigente permite iniciar sesión. Cambiar acceso revoca sesiones; modificar
el acceso propio requiere otro administrador y se protege al último administrador.
Roles/permisos del catálogo todavía no se editan desde esta pantalla.

Cuenta adicional ficticia usada en la prueba local: `soporte.demo.extra`, analista
N1 de Managua. Las cuentas demo son exclusivamente locales; esta cuenta se creó
en la base de demostración, no mediante la seed.

En `/auditoria`, jefatura y auditoría consultan evidencia por fechas y filtros.
Se muestran metadatos y hashes; las notas internas y secretos no se exponen.
La bitácora respeta sede, mientras eventos del sistema y verificación de ambas
cadenas requieren alcance global. Verificar no modifica registros y describe
la integridad en ese instante. Consultar/exportar reportes deja evidencia con
filtros y alcance autorizado; nuevas operaciones humanas registran su IP real.

### Categorías y utilidad de conocimientos

En `/administracion/categorias`, jefatura busca, crea y edita categorías compartidas:
superior, grupo responsable por defecto, tipo, orden y requisito de activo. Desactivar
impide nuevos tickets y conserva el historial. Con tickets existentes, para cambiar
tipo o requisito de activo se crea otra categoría. Ante edición simultánea, recargá
la lista antes de reintentar.

La ficha de conocimientos permite registrar o actualizar un voto «Útil/No útil»;
el comentario opcional solo es visible para su autor. Los analistas vinculan artículos
publicados mediante el número del ticket y un uso breve. Cada cuenta consulta solo
los vínculos de tickets autorizados. Auditoría conserva lectura sin votos ni cambios;
los tickets cerrados o cancelados no admiten vinculación ni retirada de vínculos.
La repetición de una operación idéntica no duplica datos ni evidencia.

### Calendarios, feriados y parámetros

Jefatura administra `/administracion/calendarios`: horarios de lunes a viernes,
intervalos partidos, feriados y calendario de cada sede. Zona America/Managua;
no se admiten horas superpuestas ni fechas duplicadas. Cada ciclo de ticket guarda
su calendario en la bitácora: editar o asignar conserva los SLA de ciclos anteriores.
Reabrir o rechazar una solución inicia un ciclo con la configuración vigente.
La ventana de reapertura conserva el calendario del ciclo cerrado. P1/P2 siguen
en horario continuo. La migración 022 protege los ciclos locales anteriores.

En `/administracion/parametros`, inactividad de sesión admite 1–30 minutos,
bloqueo tras cinco fallos 15–1440 minutos y adjuntos hasta 10 MB. El cierre de
resueltos conserva 48 horas y solo se consulta. Origen y fecha de modificación
visibles; ante un conflicto, recargá antes de guardar. No se muestran secretos
ni parámetros arbitrarios. Calendarios/feriados y parámetros ya están disponibles;
`/administracion/sla` permite consultar matriz/plazos y cumplimiento normativo,
y editar únicamente nombres de presentación de prioridades. Los minutos, modo
de calendario, matriz y alerta del 50 % se conservan por las reglas vigentes.
La pantalla señala diferencias; no repara automáticamente ni modifica ciclos.

### Roles personalizados y rendimiento

Jefatura abre `/administracion/roles` para consultar permisos y crear/editar roles
personalizados. Los cinco roles del sistema son de consulta. Solo se conceden permisos
que el administrador posee con alcance global; cambios de rol revocan las sesiones
afectadas y protegen el último administrador. Un rol propio, incluso futuro, requiere
otro administrador. Los roles se asignan desde Administración de identidad.

La prueba local de 63 usuarios usa una API aislada y helpdesk_test. Seguí
[el procedimiento de carga](ops/perf/README.md); no ejecutar integración al mismo
tiempo. El informe indica rutas medidas, umbrales y límites; no certifica producción
ni sustituye revisión visual, accesibilidad o pruebas de escrituras bajo carga.
Resultado documentado: [informe de rendimiento local](docs/quality/PERFORMANCE.md).

### Cierre local — 14/10/2026

`pnpm check` final aprobado: **369 pruebas**, build **312,6 kB JS gzip / 499 kB**.
Flujos principal/N2, adjunto, borrador y CSAT válidos comprobados; fechas,
validación española, navegación y CSP corregidas. Avance orientativo **99 %**.
[Informe final y reservas](docs/quality/FINAL-QA.md),
[aceptación técnica](docs/quality/ACCEPTANCE.md) y
[protocolo humano](docs/manuals/aceptacion-usuarios.md).
SCA conserva un alto Braces con mitigación local probada; DAST/zoom real/lector
y UAT/PO pendientes. RF-19, catálogo, retención y simulaciones mantienen sus límites.
El usuario dejó revisión adicional para mañana; los controles ya estaban verdes.
