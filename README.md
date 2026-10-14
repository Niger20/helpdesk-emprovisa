# Mesa de ayuda EMPROVISA

Prototipo local para demostrar el soporte de TI de Managua, Rivas y León,
basado en SPEC-TI-2026-002. Node.js, Fastify, React y PostgreSQL; Docker solo
para la base existente del usuario.

Ya funcionan el login local, sesión, CSRF y permisos de BD; creación, cola y
detalle de tickets con prioridad y SLA; inventario con consulta, alta e historial
de custodia. La aplicación incluye las 45 tablas y una seed de demostración.
Después del login se abre la cola según el alcance de la cuenta. Las acciones
de atención (asignar, responder, pausar, escalar, resolver y cerrar) siguen pendientes.

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
la contraseña. Los correos usan `example.invalid` y los jobs están desactivados.
El prototipo simulará las integraciones de correo cuando se implementen.

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
plano; votos y vinculación desde tickets quedan pendientes.

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

Las pruebas usan PostgreSQL real y **recrean exclusivamente el esquema public
de helpdesk_test** antes de aplicar las migraciones y la seed. Necesitan `.env`
local y el contenedor disponible. No apuntan a helpdesk ni a las otras bases.
Los tipos Kysely se generan y dividen por tabla para respetar los límites de
archivo. Las migraciones son SQL puro; su registro usa node-pg-migrate.

Fuentes: [AGENTS.md](AGENTS.md), `docs/specs/`, `docs/er/`, `docs/mockups/`.
Ver [avance](docs/PROGRESS.md) y [decisiones](docs/DECISIONS.md).
