# Decisiones y contradicciones

**Alcance vigente: D-008.** Las decisiones anteriores conservan el historial
de la primera entrega y se interpretan según el prototipo local confirmado.

## D-001 — Stack Node.js y despliegue (12/10/2026)

La especificación Word, secciones 3.1, 3.2 y 6.2, propone PHP/Laravel,
Blade y contenedores de aplicación y web. El usuario confirmó expresamente
que se sustituyó por Node.js, Fastify y React. Se aplica AGENTS.md:
API y frontend en el host; Docker exclusivamente para PostgreSQL.

## D-002 — Ubicación y modelo de datos

La especificación está en docs/specs/, no docs/spec/. Se conserva el original.
La sección 4.3 y el Anexo A del Word describen 17 tablas; el ER completo
define 45. Se usa el ER para tablas, columnas, nulabilidad y relaciones,
conforme a la precedencia indicada por AGENTS.md.

## D-003 — PostgreSQL de desarrollo existente

El usuario autorizó reutilizar el contenedor Postgre, que usa postgres:18.1-alpine
y aloja otras bases. Se crean solo helpdesk, helpdesk_test y sus tres roles.
No se modifica ni reemplaza el contenedor compartido. Su puerto existente
está publicado en todas las interfaces; no cumple el despliegue de AGENTS.md.
El Compose del proyecto fija postgres:15.19 y loopback. La validación contra
PostgreSQL 15 y los entornos independientes de staging/producción queda pendiente.

## D-004 — Sesión y aspecto del login

P-01 ofrece recordar el equipo durante 30 días. Se mantiene la expiración
por inactividad de 30 minutos requerida por AGENTS.md; no se implementará
la persistencia de 30 días sin una definición adicional de seguridad.

## D-005 — Seed solicitada por el usuario

Se incorporan datos ficticios de las tres sedes, todos los estados del ticket
y una cuenta LOCAL de administrador de emergencia con contraseña de prueba
documentada en README a pedido del usuario. Los otros usuarios son de origen AD.
La seed se limita a bases locales de desarrollo/pruebas; no crea identidades
en el directorio institucional, sesiones autenticadas ni correos reales.
Se niega ejecutarla en producción y en una base con datos previos.

## D-006 — Catálogos y fixtures de demostración (13/10/2026)

Los códigos de permiso se definen en contracts a partir de las acciones de
la especificación y los ejemplos de AGENTS.md; no había un catálogo de códigos
completo en los anexos. El mapa inicial por rol es una seed de permisos en BD,
no autorización codificada por rol en el servidor. El alcance y las políticas
de cada acción deben comprobarse en los futuros services.
Los valores de impacto/urgencia/canales se normalizan a mayúsculas en datos;
sus etiquetas de UI seguirán en español. Los estados canónicos usan IDs 1–9
según el orden de contracts; 7=CERRADO y 9=CANCELADO para el índice parcial.
Estos IDs no deben reciclarse al administrar el catálogo.
Calendario laboral 08:00–17:00 sin feriados y horas nocturnas de cron son
exclusivamente fixtures; falta confirmar los parámetros institucionales.
El script de seed deja los jobs desactivados y carga escenarios por inserts
transaccionales, sin afirmar que los casos de uso o el motor SLA ya estén implementados.

## D-007 — Compatibilidad de herramientas

Node.js 24.21.0 es la versión LTS vigente verificada en nodejs.org.
TypeScript se fija en 6.0.3 porque typescript-eslint 8.71.2 declara soporte
menor a 6.1.0, aunque el registro publique TypeScript 7.0.2. No se fuerza una
combinación sin soporte. pnpm 11 usa devEngines.runtime y allowBuilds;
se fijan runtime, paquetes y lockfile. Fuentes de versiones:
https://nodejs.org/en/about/previous-releases,
https://www.postgresql.org/support/versioning/ y metadatos del registro npm.

## D-008 — Todo el proyecto es un prototipo local (13/10/2026)

El usuario indicó: «hace todo local» y «lo del prototipo local aplicalo a todo».
Se adaptó AGENTS.md para que este alcance prevalezca en las siguientes tareas.
Se omiten LDAP/AD reales, SMTP/IMAP reales, servidores Ubuntu, nginx, systemd,
NAS, respaldo operativo y despliegues de producción. Railway queda como
opción posterior. Se mantienen la arquitectura, datos, reglas de negocio y
pruebas útiles para demostrar los flujos con integraciones simuladas.
Las nueve cuentas de la seed pasan a LOCAL, con la contraseña ficticia
documentada por pedido del usuario. La migración solo convierte los GUID
simulados identificables de la seed y conserva los tickets existentes.

HTTP local usa helpdesk_sid, HttpOnly y SameSite=Strict. Se omite Secure y
el prefijo __Host- para este prototipo, conforme al nuevo alcance del usuario.
Se conservan tokens aleatorios de 32 bytes, hash SHA-256 en BD y revocación.
CSRF usa HMAC del token de sesión con CSRF_SECRET, evitando ampliar el ER;
el login exige un desafío previo firmado en cookie de cinco minutos.

Las fuentes no indican duración del bloqueo tras cinco fallos: se adopta
15 minutos como parámetro inicial del prototipo, no como norma institucional.
Se limita login a 20 intentos/IP y 10/usuario en una ventana de 15 minutos.
El servidor devuelve un mensaje genérico para las credenciales rechazadas.
auth.sesion se concede en la BD a todos los perfiles para consultar y revocar
su sesión; no autoriza modificaciones del dominio a un auditor.

## SLA-001 — Criterios del motor puro (13/10/2026)

La especificación 1.7 (RN-03, RN-09, RN-10), 4.4 y 4.6 y el ER son las
fuentes de esta implementación. Se reciben plazos, porcentaje de alerta,
horarios, zona horaria y feriados como datos; el motor no lee la BD ni usa
la seed como configuración institucional. Las fechas son instantes Date;
los feriados usan aaaa-mm-dd y los días de horario usan ISO (lunes=1).
No se incorporan nuevos enums fuera de contracts ni horarios predeterminados.

La fuente dice cinco días hábiles de reapertura, pero no define la hora de
corte. Se adopta el criterio conservador de la misma hora local del quinto
día hábil siguiente al cierre, con límite inclusivo. No cuenta el día del
cierre; se omiten fines de semana, feriados y días sin horario configurado.
La reapertura inicia un ciclo nuevo, restablece las marcas de respuesta,
resolución, cierre y cumplimiento y reinicia minutosPausa. Conserva el historial
fuera del motor y no modifica fechaCreacion. El caller debe comprobar CERRADO,
permisos y segregación; fuera de plazo debe crear otro ticket referenciado.

Una pausa abierta no tiene fin conocido: el cálculo devuelve null para
vencimientos o alertas todavía no alcanzados. Esto es un resultado de dominio,
no un DTO ni una actualización de las columnas NOT NULL del ER. Los futuros
services deberán conservar los límites registrados en la BD mientras el reloj
está en pausa y recalcularlos al reanudar. Un vencimiento alcanzado antes de la
pausa no se extiende retroactivamente.

Para LABORAL se descuentan solo las intersecciones de las pausas con las
ventanas hábiles. Restar minutos naturales (campo acumulado) al tiempo laboral
contaría noches/fines de semana dos veces; el motor usa inicio/fin de pausas.
Los intervalos de pausa duplicados o superpuestos se fusionan para evitar
el doble descuento. Los horarios superpuestos se rechazan como configuración
inválida. Las funciones no redondean minutos transcurridos a enteros; los
instantes y la suma trabajan con precisión de milisegundos.

El cumplimiento se evalúa en fechaResolucion, no en fechaCierre; se acepta
resolver exactamente en el límite y se rechaza excederlo. Sin primera respuesta
no se declara cumplimiento de respuesta. Los services deben pasar el inicio
correcto de cada ciclo y el instante final apropiado; el motor no altera estados
ni sustituye transiciones_estado, jobs, políticas o bitácora.

## D-009 — Tickets y CMDB del prototipo

Los alcances de consulta se representan con permisos ticket.ver_propios,
ticket.ver_sede, ticket.ver_grupo y ticket.ver_todos, junto con
ticket.registrar_tercero y ticket.ver_notas_internas. Se sirven desde BD:
no se decide por nombre de rol. La creación es portal para la cuenta propia
y teléfono/presencial para terceros autorizados (RN-08). Comentarios internos
se filtran en repository; la bitácora pública no expone valores ni IDs internos.
La alerta inicial usa el código UMBRAL_50 del plazo de solución; despacho
y escalamiento automático quedan pendientes de los jobs.

P-06 muestra proveedor, valor, ubicación y sistema operativo ausentes del ER.
Se conservan los campos del ER; estados ACTIVO/MANTENIMIENTO/BAJA como la seed.
Las fuentes de especificación están realmente en docs/specs, no docs/spec.
Los valores PostgreSQL DATE se leen como yyyy-mm-dd para corresponder a los
tipos generados y evitar desplazamientos horarios en custodia y feriados;
timestamptz sigue representando instantes convertidos a America/Managua en UI.

## D-010 — Operación inicial y concurrencia de tickets

El permiso existente ticket.asignar permite tomar un ticket visible sin responsable;
la reasignación a terceros requiere ticket.reasignar, concedido a jefatura en BD.
La escritura de notas internas requiere ticket.comentar_interno; el permiso de lectura
no concede escritura al auditor. Un solicitante con permisos de analista tampoco lee
ni escribe notas internas de su propio caso. Comentarios públicos sí están permitidos.

Asignación conserva el grupo actual: cambiar nivel/grupo queda para escalamiento.
Destinatarios deben tener ticket.atender vigente y pertenecer al grupo activo;
sin grupo se usa la sede del ticket. La categoría puede tener un grupo de otra sede:
al crear se busca el grupo activo de igual nivel en la sede del solicitante; se conserva
un grupo multisede o ya compatible. Sin equivalente se rechaza la configuración.

Cada escritura compara version bajo FOR UPDATE, incrementa la versión y escribe la
bitácora en la misma transacción. Conflictos devuelven 409. Inicio de atención valida
transiciones_estado, exige responsable y registra fechaPrimeraRespuesta una sola vez,
coherente con Asignado sin primera respuesta de la especificación. No reinicia plazos.
Una nota o mensaje del solicitante no cuenta como primera atención. EN_ESPERA se
reanuda mediante la futura operación de SLA; iniciar atención no evita ese control.
No se comentan tickets CERRADO/CANCELADO; RESUELTO conserva diálogo para confirmación.

## D-011 — Conocimientos del prototipo

RF-09/P-07 requieren búsqueda por palabra/categoría y ficha. El ER no enumera
estados ni visibilidad; se usa BORRADOR/PUBLICADO/ARCHIVADO y PUBLICO/INTERNO,
conservando los valores PUBLICADO/PUBLICO de la seed. kb.editar habilita edición
y publicación; quien publica se registra como revisor. No se inventa un flujo de
aprobación separado; queda pendiente validarlo si se amplía la operación.
La especificación menciona publicación por analistas; AGENTS y los permisos
existentes reservan kb.editar a N2 y jefatura. Se conserva ese alcance más
restrictivo, sin ampliar los permisos de N1.

Solicitantes ven artículos públicos publicados. Soporte ve internos publicados;
editores y auditoría pueden consultar borradores/archivados y versiones anteriores.
No se exponen versiones de borradores al solicitante. Como artículos no tienen
sede en el ER, la edición requiere grant kb.editar global. Artículo, versión y
auditoría se guardan juntos, comprobando versionActual bajo bloqueo de fila.
Contenido se presenta como texto plano. GET no incrementa vistas para preservar
lectura del auditor; votos y vínculos con tickets siguen pendientes.

## D-012 — Ciclo manual y confirmación

Las transiciones se leen de transiciones_estado y toda escritura bloquea el ticket,
compara version y escribe evidencia en la misma transacción. Escalamiento manual
conserva plazos y primera respuesta; solo cambia asignación/grupo a un N2 activo.
Pausa solo REPUESTOS/PROVEEDOR_EXTERNO, con detalle; reanudar usa el motor de SLA
y no extiende retroactivamente un plazo vencido antes de pausar. Una respuesta ya
atendida conserva su límite histórico. minutosPausa es un acumulado entero de minutos
activos descontados; el cálculo exacto usa las fechas de pausa sin redondearlas.

Existe ambigüedad entre RN-05 (solicitante no valida su caso) y RN-06/CU-07 (el
solicitante confirma cierre). Se permite confirmación explícita al solicitante común,
y se deniega a un técnico con ticket.resolver que reportó su propio caso. Resolución
siempre exige responsable distinto del solicitante. El cierre automático a 48 h sigue
pendiente de jobs; no se simula como acción manual de jefatura.

RESUELTO -> EN_ATENCION mediante rechazo se trata como reapertura de solución:
inicia un ciclo nuevo y se registra en ticket_reaperturas. Así se conserva la única
resolución por ciclo del ER, la evidencia anterior y la espera de confirmación no se
cobra como atención activa. CERRADO -> REABIERTO conserva la ventana de cinco días
hábiles de SLA-001. Fuera de esa ventana se crea otro caso con id_ticket_origen.
Reclasificación conserva responsable/grupo actuales; los cambios de grupo se hacen
mediante escalamiento/asignación. La prioridad puede derivarse de matriz o elegirse
manualmente, siempre con justificación; plazos se recalculan desde el inicio del ciclo.

## D-013 — Archivos del prototipo

El ER incluye hash_sha256 pero la migración original lo omitía. Migración 015 agrega
columna NOT NULL y validación SHA-256; no fabrica hashes para archivos preexistentes.
La base local no tenía registros de adjuntos al aplicarla. Límite adjunto.maximo_bytes
inicial de 10 MiB y tipos reales JPG/PNG/PDF, como P-03/P-05. Nombres UUID y archivos
fuera de web/static; descarga autorizada con disposición attachment y comprobación
de hash. La especificación restringe al auditor a bitácora/metadatos sin contenido.

La subida es aditiva, bloquea ticket e incrementa version; metadatos y bitácora en
una transacción, con limpieza del archivo si falla. Un corte de proceso puede dejar
un archivo huérfano; no existe atomicidad distribuida entre PostgreSQL y filesystem.
Se sube evidencia desde el detalle, después de crear el ticket, evitando prometer
un guardado único para ticket/archivo. No se aceptan idComentario ni otros campos
multipart; archivos existentes ligados a notas internas se filtran por alcance.
