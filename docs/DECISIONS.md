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
## D-014 — Automatizaciones del prototipo local

RF-07/CU-05 exigen escalar al vencer la respuesta aun desde NUEVO o REABIERTO,
pero las semillas originales no contemplaban esos saltos. Se agregan transiciones
automatica=true desde NUEVO, ASIGNADO, EN_ATENCION y REABIERTO hacia ESCALADO;
las rutas humanas siguen usando exclusivamente transiciones manuales. Se conserva
el reloj original y no se registra una primera atención ficticia. Destino: grupo
N2 activo compatible con sede y miembro vigente con ticket.atender y alcance de BD,
distinto del solicitante; desempate por carga activa, grupo y usuario. Si ya está
ESCALADO, se avisa a jefatura una vez por ciclo sin inventar un nivel superior.
Si no hay destinatario/transición, no se modifica el ticket: aviso deduplicado,
resultado PARCIAL y nuevo intento en el próximo minuto. RF-06 de asignación inicial
por especialidad/carga permanece pendiente.

UMBRAL_50 corresponde a la ventana de solución calculada por el motor existente.
Se omiten estados con reloj detenido y alertas de ciclos anteriores. Cada ejecución
bloquea su tarea y los tickets; efectos y bitácora automatica/idTarea comparten
transacción. Cierre automático usa el parámetro inicial de 48 horas desde resolución
y última actividad manual (comentarios o bitácora); el límite exacto es inclusivo.

pg-boss 12.37.1 usa esquema helpdesk_queue separado de las 45 tablas de dominio.
Migraciones SQL 017/019 instalan sus objetos y siete colas (seis del dominio y una
interna de cron), usando los planes oficiales del paquete sin BEGIN/COMMIT propios.
Runtime usa helpdesk_app, migrate=false, sin DDL ni reindexado; create_queue es un
guard que únicamente reconoce colas instaladas, sin crear objetos. Instalador y
funciones de DDL no son ejecutables por app. Tareas locales se activan en seed y
migración 016; registros heredados ajenos al prototipo se conservan y no se ejecutan.
Desactivación se verifica en cada job; cambiar cron o activar una tarea que arrancó
desactivada requiere reiniciar API. Procesos se detienen antes de cerrar pools.

## D-015 — Emisión y entrega de CSAT

RF-11/ER fijan token único y vencimiento, pero no duración. Se adopta siete días,
como la seed, configurable al emitir (1–365). Una encuesta por ticket: reapertura
y cierre posterior no reemiten ni renuevan. Se emite dentro de la transacción de
cierre manual/automático; un fallo revierte también estado y evidencia del cierre.

Token aleatorio de 32 bytes; solo SHA-256 se persiste. Enlace /encuesta#token:
el fragmento no llega al servidor, y el API público recibe x-survey-token redactado
en logs. Solo GET/POST /api/v1/encuestas/actual entran en lista blanca explícita;
POST conserva CSRF con HMAC asociado al token, verificado en plugin y service.
Respuesta condicionada a ticket cerrado, token vigente y respondida_en NULL.
Respuesta/auditoría son transaccionales, sin tokens ni comentario en auditoría.

En demostración las invitaciones se conservan únicamente en memoria tras commit.
Avisos las expone solo al solicitante autenticado, validando nuevamente propietario,
hash, estado, vencimiento y respuesta en BD. Reiniciar API pierde enlaces pendientes;
no se recupera ni reemite el secreto desde el hash. El enlace ya copiado funciona
hasta vencer/ser usado. No se almacena en notificaciones ni bitácora. No hay SMTP.

## D-016 — Cola de avisos y recepción simulada

El ER no daba correlación entre aviso y evento ni fecha para backoff: migración 016
agrega id_bitacora (FK, único con destinatario) y proximo_intento a notificaciones.
El despacho deriva CREACION/ASIGNACION/ESCALAMIENTO/RESOLUCION/CIERRE/ALERTA_SLA
desde evidencia y plantillas activas: solicitante, responsable y, en alerta/escalamiento,
jefatura identificada por ticket.reasignar vigente y alcance. Nunca copia contenido
de notas, motivos o soluciones. Transportes simulados, sin conexión externa;
máximo cinco intentos con esperas 1/2/4/8 minutos antes de estado ERROR. Jobs pg-boss
también tienen reintento/backoff ante fallos transitorios del procesamiento.

Correo simulado se inyecta solo por jefatura (parametro.administrar global), con
CSRF, una cuenta ficticia activa y clasificación explícita para un caso nuevo.
Migración 018 agrega datos_simulados JSONB: el ER conservaba hash/metadata pero
carecía del payload necesario para la cola local. Hash verificado al consumir;
message_id único impide duplicados y rechaza reutilización con contenido distinto.
Ingesta crea ticket/alerta/evidencia y vincula mensaje en una transacción. Respuestas
usan in_reply_to de un mensaje procesado y solo el solicitante del ticket puede
agregar comentario público; hilos ajenos/desconocidos/finales y datos inválidos
se rechazan. No se implementan IMAP, SMTP, parsing institucional ni adjuntos de correo.

## D-017 — Asignación inicial automática (RF-06)

La spec define categoría/especialidad/sede/carga sin fijar desempate ni fallback.
Se exige especialidad exacta registrada con nivel_dominio positivo, usuario y grupo
activos, membresía/permiso ticket.atender vigentes y alcance de BD para la sede.
No se asigna automáticamente al solicitante. El grupo ya se resuelve conforme D-010.
Menor cantidad de casos activos (incluye EN_ESPERA) primero; ante empate, mayor
dominio y menor id_usuario. Se omiten RESUELTO/CERRADO/CANCELADO de carga. Una
delegación explícita válida habilita otra sede; no se infiere autorización por rol.

Sin candidato o grupo, conserva NUEVO en su cola; no inventa especialidades ni
asigna otro grupo. Seed conserva las especialidades declaradas: impresoras para
Managua y CCTV para Infraestructura. Categorías sin especialistas configurados
siguen disponibles para toma/reasignación manual. Reintento cada minuto con nueva
tarea ticket-auto-assignment; lotes de hasta 100 tickets con candidato elegible,
para que casos imposibles no bloqueen otros. Se respetan desactivación y responsable
ya elegido; no se reasigna al repetir ni se reinicia SLA/primera respuesta.

Migración 020 agrega NUEVO -> ASIGNADO automática y cola pg-boss instalada por
migrator. Portal/correo usan la misma operación dentro de la transacción de alta;
asignación/version/bitácora con id_tarea forman parte de ella. Selector serializado
con advisory lock antes de escribir bitácora, relectura bloqueada del ticket y carga
actualizada tras cada asignación; se comprobó reparto concurrente en pool de tres
conexiones. Manual de jefatura conserva sus reglas de asignación vigentes.

## D-018 — Métricas y exportaciones del prototipo

Filtros desde/hasta inclusivos como fechas civiles de Managua; cohorte por creación
del ticket, con sede/categoría opcionales. Pool readonly y snapshot repeatable read;
permisos reporte.ver/reporte.exportar verificados por service/ruta, intersectando
alcances de sede para exportar. No se agregan tablas/vistas. Solo agregados necesarios;
notas, descripción, comentarios CSAT, correos, adjuntos y tokens no salen en reportes.

MTTA mantiene la fórmula literal de la spec: suma hasta primera respuesta / todos
los tickets de la cohorte; sin respuesta aportan cero. Se muestran total y respondidos
para interpretar el denominador. MTTR: resolución vigente menos creación y minutos
de pausa acumulados, entre resueltos; mide el caso, no minutos laborales del motor SLA.
Reabiertos sin resolución vigente no entran en cumplimiento. SLA: marcas cumplidas
al resolver / todos los resueltos; sin marca no se considera cumplido, con contador
de evaluados. CSAT: respuestas de encuestas vinculadas a la cohorte, promedio 1–5 y
porcentaje sobre cinco. No se reconstruyen resoluciones históricas por ciclo.

Carga del período usa asignación actual; no se presenta como evaluación histórica
del resolutor. Se agrupa por identidad de usuario; homónimos se distinguen con
username. Volumen diario es de la misma cohorte, no de todos los cierres del día.
Estas fórmulas y límites aparecen en pantalla y exportaciones. Nombres de filtros
y fechas dd/mm/aaaa de Managua; XLSX neutraliza fórmulas en textos de BD y mantiene
números como valores numéricos. PDF usa fuentes locales y tablas con cabecera.

## D-019 — Consulta de evidencia y verificación de integridad

La pantalla de auditoría muestra metadatos, actor, fecha, IP, tarea y hashes, con
filtros y paginación. No entrega contenido bruto, valores anteriores/nuevos,
identificadores de sesión ni secretos. Las notas internas del propio solicitante
se excluyen antes de contar y paginar. La bitácora respeta alcance por sede;
auditoría del sistema y verificación requieren permisos globales. Los nombres
del actor son los actuales; no se afirma reconstrucción histórica completa.

La consulta usa el pool readonly. La verificación GET evalúa ambas cadenas y sus
conteos en un snapshot, sin escribir evidencia ni modificar registros; su resultado
describe ese instante. Consultas y exportaciones de reportes sí registran evidencia
con filtros y alcance autorizado mediante el pool app, sin incluir datos del reporte.
Si falla ese registro, no se entrega el resultado. La IP procede del request real,
sin confiar en cabeceras de proxy; se incorpora a nuevas operaciones humanas.
No se reescribe evidencia histórica para completar direcciones antiguas.

## D-020 — Administración local de identidad y continuidad

Esta fase de RF-18 administra usuarios LOCAL, vínculos de roles con sede/vigencia,
grupos, membresías y especialidades. El catálogo de roles y permisos sigue
inmutable; su edición y la administración de calendarios/parámetros quedan pendientes.
No se implementan directorios ni servicios externos. Contraseñas con Argon2id,
revocación de sesiones al cambiar acceso y evidencia sanitizada en la misma transacción.

El administrador debe poseer los permisos y alcances que intenta conceder o controlar,
incluso al activar o restablecer cuentas con asignaciones futuras. No puede modificar
su propio acceso: requiere otro administrador. Las operaciones conservan al menos
un administrador LOCAL activo, desbloqueado, en sede activa, con ambos permisos
administrativos globales de vigencia indefinida. Se serializan cambios para evitar
perder esa continuidad ante operaciones concurrentes. Trasladar una cuenta requiere
retirar primero membresías vigentes en grupos limitados a otra sede.

La especialidad conserva nivel_dominio como entero positivo de smallint: el ER no
define una escala 1–5. Grupos usan nivel 1/2 para N1/N2. Migración 021 reconcilia
JEFE_TI en la base local anterior con la seed vigente: agrega ticket.ver_propios y
ticket.ver_sede cuando faltan, dejando evidencia encadenada. Esto permite delegar
N1 sin debilitar la comprobación de permisos. El rollback conserva permisos válidos
y evidencia inmutable; no introduce autorización por nombre de rol en los services.

## D-021 — Categorías compartidas con historial conservado

RF-19 se entrega por capacidades: esta fase administra categorías, jerarquía,
orden, tipo aplicable, requisito de activo y grupo por defecto. Calendarios,
feriados, parámetros, matriz y plazos quedan pendientes. La administración requiere
parametro.administrar con alcance global porque las categorías no pertenecen a una
sede. AMBOS ya se admite en el alta de tickets; no se duplica el enum de tipos.

No hay borrado: la desactivación impide nuevas altas y conserva consultas históricas.
Se rechazan ciclos y padres inexistentes; categorías activas requieren antecesoras
activas y no se desactiva un padre con hijos activos. El grupo elegido debe estar
activo; cambiarlo afecta la asignación de casos nuevos, sin reasignar existentes.
Si ya hay tickets, tipo y requisito de activo son inmutables: se crea otra categoría
para nuevas reglas. Evita reinterpretar los casos y fallar sus actualizaciones por
el trigger de activo obligatorio. Nombres repetidos no se prohíben: el ER no exige
unicidad y se distinguen mediante superior/grupo.

La edición compara una referencia anterior de los campos con la fila vigente,
porque el ER no tiene versión en categorías. Cambios administrativos se serializan,
bloquean la jerarquía y registran evidencia en la misma transacción; altas de tickets
leen la categoría con bloqueo compartido para evitar cambios de reglas concurrentes.
El control no detecta una edición que haya restaurado exactamente los mismos valores;
no se afirma un contador de versiones inexistente. Se conservan las 45 tablas.

## D-022 — Utilidad de conocimientos y vínculos privados

El ER define votos booleanos únicos por artículo/usuario y comentario opcional de
300 caracteres. PUT conserva un solo voto actualizable; repetición exacta no escribe
ni audita. Se muestran totales agregados y el comentario solo a su autor.
kb.ver permite leer; votar requiere además ticket.crear, capacidad operativa ausente
del auditor. Falta permiso específico de voto en la fuente, por lo que se usa esa
capacidad existente sin autorizar por nombre de rol. La UI refleja la misma regla.

Vincular/desvincular exige kb.ver, ticket.atender y alcance de sede/grupo vigente,
reutilizando políticas reales por la API pública del módulo tickets. Solo se vinculan
artículos publicados; se pueden retirar vínculos de artículos archivados visibles.
CERRADO/CANCELADO no admiten cambios; RESUELTO permite documentar la solución.
El campo uso es texto de 1–10 caracteres conforme ER, sin catálogo inventado;
«consulta» es una sugerencia editable. La lista solo devuelve números, uso y fecha
de tickets autorizados; no revela títulos, usuarios, notas ni identificadores internos.

El vínculo no almacena versión de artículo ni altera versión de ticket. Ticket y
artículo se bloquean en transacción; la PK y el bloqueo por artículo serializan votos.
Vincular/desvincular registra bitácora del caso y auditoría del sistema; votar registra
auditoría del sistema. La evidencia solo contiene identificadores, sin comentarios,
contenido ni uso. Fallar evidencia revierte el cambio. Filtrado de vínculos consulta
cada ticket; se documenta posible optimización para un volumen mayor al prototipo.

## D-023 — Calendario protegido por ciclo SLA

RF-19 habilita calendarios, intervalos partidos, feriados y asignación a sedes desde
la interfaz. El ER admite días 1–7, mientras RN-09 excluye fines de semana: la
configuración administrativa acepta lunes a viernes, zona America/Managua y al menos
un intervalo. Se rechazan solapamientos, horas invertidas y feriados duplicados.
No hay borrado de calendarios; horarios/feriados se reemplazan en una transacción.
Permiso parametro.administrar global porque un calendario puede regir varias sedes.

Cambiar el calendario vigente no debe reinterpretar SLA existentes. Sin agregar una
tabla ni columna al ER, cada ciclo guarda sus horarios, feriados y zona en una entrada
SLA_CALENDARIO_FIJADO de la bitácora encadenada. Altas portal/correo la escriben en
la misma transacción; consumo, pausas, reclasificación y resolución usan esa entrada.
La ventana de cinco días hábiles usa el calendario del ciclo cerrado. Reabrir o
rechazar una solución inicia ciclo nuevo con el calendario vigente de la sede.
P1/P2 conservan modo continuo, P3/P4 laboral y los plazos de prioridad existentes.

Migración 022 añade evidencia para ciclos actuales anteriores a esta capacidad,
capturando la configuración observada al migrar; no reconstruye configuraciones
históricas desconocidas ni reescribe filas/plazos. La seed captura sus escenarios.
Si un ticket importado carece de fotografía de ciclo, la lectura conserva fallback
compatible pero no se permite editar/asignar su calendario hasta protegerlo.
El cambio administrativo se serializa, compara referencia anterior y bloquea calendario
o sede; el alta toma bloqueo compartido antes de leer intervalos. No se añaden versiones
ficticias ni se ocultan conflictos. Se mantiene el modelo de 45 tablas.

## D-024 — Parámetros operativos con límites conservados

La administración solo expone cuatro claves realmente consumidas: inactividad de
sesión (1–30 min), bloqueo de cuenta (15–1440 min), tamaño de adjunto (1–10485760
bytes) y cierre por inactividad (48 h, solo consulta conforme RN-06). No se exponen
claves arbitrarias, marcador de seed, secretos ni entorno. Se mantienen cinco fallos
consecutivos, Argon2, hashes y validación del tipo real de adjuntos.

El ER no define intervalos configurables; se fijan límites conservadores según los
controles vigentes y el máximo local sembrado de 10 MB. Sesión/bloqueo tienen fallback
real y pueden persistirse por upsert. Adjuntos/cierre ausentes o corruptos dan error
explícito, sin inventar predeterminados en consumidores que no los tienen.
La UI muestra origen configurado/predeterminado, unidad y fecha Managua.

El cambio exige parametro.administrar global, CSRF y valorAnterior coincidente;
advisory lock protege también filas ausentes. Se guardan valor y evidencia sanitizada
en una transacción, con relectura validada antes de responder. Límites inválidos dan
400 y conflictos 409. La sesión usa el valor al ingresar y recargar actividad;
el bloqueo al alcanzar cinco fallos y adjuntos al cargar. No se modifica el vencimiento
ya fijado de un bloqueo. La repetición de valores compara campos, sin prometer
detectar una secuencia que vuelva exactamente al valor anterior.

## D-026 — Roles personalizados con catálogo de permisos existente

RF-18 incorpora creación/edición de roles personalizados; los cinco roles del sistema
y todo es_sistema permanecen inmutables, especialmente auditoría solo lectura. No hay
borrado ni códigos de permiso nuevos. El ER permite codigo/nombre/descripcion y
es_sistema, sin activo/versión/grupo_rol: no se agregan campos ni tablas. Los códigos
de sistema se reservan mediante el enum único; roles personalizados requieren
auth.sesion porque el inicio de sesión lo exige. Auth ya admite códigos string.

El editor exige rol.administrar global y permisos globales propios para lo que
concede. Revalida sesión y grants desde BD dentro de la transacción, con el mismo
advisory lock 2026018,1 de identidad. Compara referencia anterior de todos los campos
y permisos; duplicación y cambios concurrentes dan 409. Rechaza modificar un rol
propio incluso con vínculo futuro, revisa coherencia de sedes y revoca sesiones de
usuarios afectados con vínculos no vencidos. Continuidad del último administrador,
permisos, revocaciones y auditoría van en una transacción. El catálogo enumera solo
permisos conocidos en contracts y BD. La retirada de acceso usa vínculos existentes.
