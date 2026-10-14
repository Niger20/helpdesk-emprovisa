# Seguridad, configuración y límites

Revisión: 14/10/2026. El prototipo corre por loopback y HTTP local con cuentas
LOCAL ficticias. No utiliza LDAP/AD, correo institucional, NAS, nginx, systemd,
VPN operativa ni Railway. No es una instalación de producción.

## Configuración

| Variable | Uso |
| --- | --- |
| NODE_ENV | Desarrollo local; test se reserva para pruebas |
| HOST / PORT | HOST=127.0.0.1; puerto API configurable, inicial 3000 |
| CORS_ORIGINS | Orígenes exactos, sin rutas ni comodines |
| DATABASE_URL | helpdesk_app en helpdesk |
| DATABASE_READONLY_URL | helpdesk_readonly en la misma base |
| DATABASE_MIGRATOR_URL | helpdesk_migrator para migraciones/seed |
| STORAGE_DIR | Adjuntos fuera de la raíz web; preferí ruta absoluta |
| CSRF_SECRET | 64 caracteres hexadecimales aleatorios, solo entorno local |
| LOG_LEVEL | Nivel del logger JSON |

Los ejemplos contienen marcadores. Conservá `.env`, `.env.db`, adjuntos y
resultados locales fuera de Git. No copies sus secretos en manuales ni capturas.
Jefatura configura sesión 1–30 minutos, bloqueo 15–1440 minutos después de
cinco fallos y adjuntos 1–10.485.760 bytes. El cierre de 48 h solo se consulta.
Valores iniciales: sesión 30 minutos, bloqueo 15 minutos. El calendario inicial
es ficticio, no institucional. BD guarda UTC; UI usa dd/mm/aaaa y America/Managua.

## Controles que deben conservarse

- Contraseñas Argon2id; sesión aleatoria de 32 bytes, SHA-256 en BD, revocación
  y vencimiento. Cookie helpdesk_sid HttpOnly y SameSite=Strict en HTTP local;
  token fuera de localStorage. Login registra intentos y limita por IP/usuario.
- Desafío CSRF previo al login y x-csrf-token en modificaciones autenticadas.
  Permisos y alcance de BD comprobados en rutas y services. El solicitante no
  recibe notas internas ni puede resolver o validar su propio requerimiento.
- Adjuntos JPG/PNG/PDF con tipo real, límite, UUID y SHA-256; descarga autorizada
  con Content-Disposition. Auditor consulta metadatos sin descargar contenido.
  Casos cerrados/cancelados no admiten subidas.
- Bitácora y auditoria_sistema solo inserción, hash encadenado y bloqueo
  transaccional. Verificar es lectura; nunca edites evidencia para fabricar una demo.
- Roles BD separados: migrator DDL, app DML sin alterar evidencia y readonly
  para reportes/auditoría. Logs JSON con request id y redacción de secretos.

## Simulaciones y límites

El borrador de Nuevo requerimiento guarda solo campos del formulario en
localStorage por usuario; conserva texto incompleto y selecciones, sin archivos
ni credenciales. Caduca a las 24 horas de la última edición, comprobadas al
abrir; se elimina al crear o descartar. Permanece al logout. No está cifrado:
en un equipo compartido, descartalo antes de salir. La separación entre
cuentas en UI no protege frente al acceso al perfil del navegador.

## Inventario técnico de datos y acceso

| Datos del prototipo | Finalidad técnica | Acceso y límite |
|---|---|---|
| Username, nombre, correo ficticio, sede/departamento, cargo/extensión | Identidad, contacto y asignación | Sesión propia y catálogos autorizados; administración de identidad con permiso. No cargar empleados reales para esta demo. |
| Hash Argon2 de contraseña, hashes de sesión/token, expiración/revocación | Autenticación y controles de un solo uso | Uso interno del servidor; no DTO de UI. Cookies/tokens no deben copiarse a informes. |
| Intentos de login, IP y fecha; bitácora y auditoría con usuario/sesión | Control de acceso y trazabilidad | Consulta autorizada, alcance por sede o global; cadenas solo inserción. No eliminar historia para preparar una presentación. |
| Título, descripción, comentarios y adjuntos ficticios | Resolver el requerimiento | Dueño/sede/grupo/global según permiso; notas internas filtradas en servidor. Auditor ve metadatos sin descargar adjuntos. |
| Activos, acta y custodia ficticias | Relacionar soporte con inventario | Catálogo y ficha por alcance; no representa inventario patrimonial institucional aprobado. |
| Calificación y comentario CSAT, votos de conocimientos | Evaluar atención y utilidad | Agregados autorizados; comentario de voto solo para su autor. Enlaces CSAT hash en BD y copia de invitación en memoria. |
| Borrador local | Recuperar trabajo al fallar o recargar | Misma cuenta en UI, texto sin cifrado en perfil del navegador; descarte y 24 h locales. |

Es un inventario técnico del esquema y los DTO, sin datos personales reales
revisados ni dictamen jurídico. Las vistas de catálogos/autorización limitan
acceso funcional; los administradores del host y el dueño del esquema poseen
otras facultades. La política de tickets/evidencia y sus reservas de 24 meses
está en [RETENTION.md](../quality/RETENTION.md); no confundir esa conservación
con expiración de sesiones, encuestas o borradores.

## Integraciones simuladas

Avisos y correo se procesan de forma simulada. `/avisos` consulta entregas;
jefatura inyecta entrada ficticia por API. No hay cliente IMAP ni pantalla de
correo. Los jobs dependen de la API en ejecución y de tareas activas.

Invitaciones CSAT pendientes viven en memoria: reiniciar API deja de mostrarlas.
La BD solo conserva el hash del token. Un enlace ya copiado sigue válido hasta
vencimiento o respuesta. Existe una encuesta por ticket; reabrir/cerrar no reemite.

Inventario implementa consulta, alta y custodia de alta; no hay edición de activos
o transferencia de custodia desde UI. No se inventan proveedor, valor, ubicación
o sistema operativo ausentes del ER. Los mockups no son rutas funcionales.
No hay búsqueda global, respaldo/restauración operativa ni archivo histórico
implementado por estos manuales.

RF-19 tiene cobertura parcial: `/administracion/sla` consulta valores reales y
permite renombrar prioridades; matriz, minutos, modo y umbral no son editables
por las reglas no negociables de AGENTS. El mockup P-09 no autoriza cambiar
esa norma ni agregar trabajo en sábado al calendario local.

El [informe de rendimiento](../quality/PERFORMANCE.md) mide lecturas locales con
63 usuarios; no certifica login, exportaciones, adjuntos o escrituras bajo carga.
La [revisión de accesibilidad](../quality/ACCESSIBILITY.md) incluye correcciones
estáticas de foco, errores, contraste y tablas enfocables con desplazamiento
local; a 360 px las tablas conservan columnas. La alternativa textual de gráficos
está disponible en reportes. Navegador, teclado y móvil requieren evidencia propia.
Este trabajo documental
no ejecuta esas pruebas ni los cuatro controles globales de Aceptación final.

El lote final corrigió fechas, adjuntos visibles, vacíos y navegación, y repitió
V-01–V-06 con los límites de [FINAL-QA.md](../quality/FINAL-QA.md). CSAT válido
y los flujos principal/N2 fueron ejecutados; zoom real, lector audible, revisión
exhaustiva y UAT humana permanecen pendientes. SCA final conserva un aviso alto
Braces con mitigación local probada; no se ejecutó DAST OWASP. CSP del HTML
usará nonce por documento; estilo inline de atributos tiene una excepción
acotada para React/Recharts. No abrir el build como archivo estático: su nonce
se sustituye mediante Vite dev/preview local, sin despliegue de producción.
Consultá [avance](../PROGRESS.md), [decisiones](../DECISIONS.md) e informes de
[calidad](../quality/) para resultados consolidados. Producción requiere otro alcance.
