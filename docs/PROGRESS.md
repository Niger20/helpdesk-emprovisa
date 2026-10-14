# Avance

**Alcance actual: prototipo local para todo el proyecto (D-008).**
Las entradas anteriores describen la evolución; el estado vigente de autenticación
y las exclusiones de infraestructura se resumen en la última entrada.

## 12/10/2026 — Fundación técnica

Hecho: revisión de AGENTS.md, especificación Word, ER y mockups; monorepo pnpm
con Node.js 24.21.0; API Fastify y web React/Vite/Tailwind; contratos Zod;
conexiones de aplicación y lectura con pools de 10 y 3; configuración validada;
denegación por defecto de rutas, Helmet y rate limit; /health consulta ambos
roles; vista inicial de disponibilidad con QueryBoundary y ruta diferida.

Se inicializó Git en feature/fundacion-tecnica, sin commits ni remoto.
Las bases helpdesk y helpdesk_test y los roles se crearon en el contenedor
existente autorizado por el usuario. .env y .env.db están excluidos y tienen
ACL local restringida. No se guardó la contraseña del superusuario recibida.

Validación de la fundación: pnpm lint, pnpm typecheck, pnpm test (16 pruebas)
y pnpm build aprobados. JS total: 115.63 kB gzip, límite 499 kB.

## 13/10/2026 — Esquema, seed y CORS

Hecho: once migraciones SQL con las 45 tablas del ER, claves foráneas e índices,
restricciones de activo obligatorio, segregación de resolutor, justificación
de prioridad y una única cuenta local. Bitácora y auditoría con hash canónico
en UTC, bloqueo advisory, prohibición de UPDATE/DELETE/TRUNCATE y funciones
de verificación. Los privilegios por tabla se aplican mediante migraciones.
Los tipos Kysely se generaron con kysely-codegen y se dividieron por tabla;
el cliente usa CamelCasePlugin. Los SQL se copian al build de la API.

Seed transaccional e idempotente cargada en helpdesk: tres sedes, nueve
usuarios (incluidos N1 de cada sede), tres activos, nueve tickets que cubren
todos los estados, matriz/SLA, historial, pausas, escalamiento, reapertura,
comentarios públicos/internos, artículo/version/voto, encuesta y notificación
ficticia. Jobs desactivados. Cuenta admin.emergencia con Argon2id y credenciales
de demostración en README por solicitud expresa del usuario.

CORS configurable por CORS_ORIGINS en .env; frontend 5173 y backend 3000
incluidos para desarrollo. Orígenes exactos, credenciales y preflight CSRF;
producción exige HTTPS. El control de sesión/CSRF aún no está implementado.

Verificaciones: pruebas contra helpdesk_test con esquema recreado y migraciones;
concurrencia de cadenas, permisos de BD, integridad de la seed, CORS,
denegación de rutas y límites de arquitectura. Las cadenas de helpdesk también
verifican. API, web y proxy respondieron 200 al arrancar pnpm dev. Prueba de
navegador Edge a 360 px: sin desbordamiento, datos, error y reintento correctos.
La instalación con --frozen-lockfile pasó; el build cumple el presupuesto de JS.
Validación final: pnpm check aprobado (lint, typecheck, 39 pruebas y build).
JavaScript total: 115.98 kB gzip frente al límite de 499 kB.

HU-05: esquema creado y probado. Falta validar PostgreSQL 15 además del
contenedor 18.1 autorizado. HU-06: estructura y rama feature iniciadas;
staging/producción y ramas main/develop definitivas pendientes del primer commit.

Pendiente: autenticación LDAP/local, sesión/CSRF, RBAC por BD y sede,
servicios y pantallas de tickets, motor SLA, adjuntos, jobs, correo, CMDB,
KB, encuestas, reportes, operación/backup/deploy, accesibilidad y rendimiento.
HU-01 a HU-04 y HU-06 siguen pendientes; RF-10 no se considera completo
porque aún faltan los services, endpoint/job de verificación y políticas.

Decisiones y excepciones: docs/DECISIONS.md.

## 13/10/2026 — Autenticación y sesión del prototipo local

Hecho: se adaptó AGENTS.md al alcance global confirmado por el usuario.
Login Argon2 para los nueve perfiles locales, cookie HttpOnly/SameSite=Strict
para HTTP local, tokens aleatorios de 32 bytes con SHA-256 en BD, sesiones
revocables y renovación por actividad con el parámetro de 30 minutos.
Registro de intentos, bloqueo de cinco fallos durante 15 minutos, límites
por IP/usuario y desafío CSRF previo al login. CSRF autenticado derivado por
HMAC con secreto del entorno; no se amplió el ER para almacenar el token CSRF.
Login crea sesión, reinicia fallos y registra el intento en una transacción.

Permisos efectivos y alcances por sede se obtienen de roles/asignaciones
vigentes en BD, con comprobación en plugins y services. /auth/me devuelve
solo los datos de sesión previstos por contracts; logout revoca el token.
La migración 012 adapta los usuarios simulados existentes a cuentas locales,
agrega auth.sesion e índices y conserva los tickets. No se agregó LDAP.

Frontend: login P-01 adaptado al prototipo, formulario RHF/Zod, proveedor de
sesión con TanStack Query, guard de acceso, expiración en cliente y cierre
de sesión. Login dividido por ruta. Cuentas y comandos están en README.
En navegador Edge a 360 px se verificaron login, recarga con sesión, logout,
redirección de acceso anónimo, error/reintento y ausencia de desbordamiento.

Verificación final del repositorio: pnpm check pasó con 131 pruebas, lint, typecheck
y build; JS total 131.44 kB gzip. La corrida incluyó las pruebas del
dominio de tickets añadido en otra sesión; esos archivos no fueron modificados por esta etapa.
Instalación con --frozen-lockfile aprobada.

HU-01 completada para autenticación LOCAL del prototipo. Pendientes: pantallas
y endpoints de tickets, integración del motor SLA, filtros de visibilidad
por solicitante/grupo, adjuntos, jobs y correo simulados, CMDB, KB, encuestas,
reportes y administración de usuarios. No se marca todo el backend completo.
LDAP/AD, correo institucional, nginx, systemd, NAS y operación de servidores
quedan fuera del alcance; Railway es una opción posterior, sin despliegue realizado.

## 13/10/2026 — Motor SLA puro, trabajo independiente de autenticación

Hecho: módulo tickets con API pública index.ts y funciones puras para suma y
consumo del SLA continuo/laboral, fechas límite de respuesta/solución, alertas
al porcentaje configurado, pausas, cumplimiento al resolver y reapertura en
cinco días hábiles con reinicio del ciclo. Horarios divididos, fines de semana,
feriados y zona del calendario se consideran sin depender del reloj del host.
Se valida la configuración y se evita mutar los datos de entrada.

Validación: pnpm lint, pnpm typecheck y pnpm build aprobados. Comando de pruebas
acotado: pnpm test apps/api/src/modules/tickets/__tests__; 76 pruebas aprobadas
(5 archivos). Incluyen límites de horario/mes/año, precisión de segundos y
milisegundos, pausas abiertas/cerradas/duplicadas, cumplimiento y nuevo ciclo.
No se ejecutó la suite de integración global, para preservar helpdesk_test
mientras otra sesión trabaja en autenticación. No se modificaron contratos,
auth, migraciones ni seed. Todos los nuevos archivos tienen menos de 300 líneas.

Pendiente: conectar estas funciones a los services de tickets y a los jobs;
validar transiciones y permisos en esas capas; persistir resultados de cada
ciclo y enlazar la bitácora. Esta entrega no contiene rutas, UI ni escrituras
sobre tickets. Criterios de integración y ambigüedades: SLA-001 en DECISIONS.md.

## 13/10/2026 — Captura de tickets e inventario, dos sesiones

Hecho: contratos y migración 013 con permisos de visibilidad desde BD;
API de opciones, creación, cola paginada y detalle por número. Prioridad
por matriz, validación de categoría/activo/sede y registro para terceros;
SLA puro conectado al calendario y pausas. Ticket, bitácora y alerta inicial
se escriben en una transacción. Consultas aplican alcance propio/sede/grupo/global
y filtran comentarios internos antes del DTO.

Frontend: cola con filtros, formulario con prioridad calculada y activo requerido,
detalle con plazos, comentarios y bitácora. Inventario implementado en otra sesión:
listado, filtros, ficha, alta, historial de custodia e incidentes visibles.
Alta de activo, custodia y auditoría comparten transacción. Integración central
de rutas, contratos y pruebas completada; se corrigió el parseo de PostgreSQL DATE.

Validación: pnpm check aprobó lint, typecheck, 149 pruebas y build.
JS total: 154.39 kB gzip (límite 499 kB). Integración usa únicamente helpdesk_test;
comprueba permisos/sedes/notas, SLA inicial, CSRF, duplicados y rollback de activos.
Navegador Edge a 360 px: creación y consulta de tickets, listado/ficha CMDB y
ausencia de desbordamiento; estados vacío, error y reintento verificados.

Pendiente: asignación, respuestas y adjuntos, transiciones, pausas/escalamientos,
resolución/cierre/reapertura conectados al flujo, jobs y correo simulado,
KB, CSAT, reportes y administración. Alcance sigue siendo prototipo local.
Estimación informativa de avance: alrededor del 30 %, sin aceptación completa por RF.

## 13/10/2026 — Operación inicial de tickets y conocimientos, dos sesiones

Hecho: asignación/toma, historial de asignaciones, inicio de atención y aceptación
de escalamiento ya registrado. Transiciones manuales validadas desde BD; primera
respuesta registrada una vez, conservando plazos y reloj. Respuestas públicas y
notas internas requieren permisos de escritura y se guardan junto a bitácora.
Permisos ticket.reasignar (jefatura) y ticket.comentar_interno (equipo TI) en BD,
migración 014 aplicada en helpdesk sin reemplazar datos. Usuarios solicitantes
con rol de analista tampoco acceden a notas internas de su propio ticket.
Escrituras bloquean fila, comparan versión e impiden dos tomas simultáneas.
Creación conserva grupo compatible con la sede o busca su equivalente del mismo
nivel; grupos multisede se conservan. Destinos requieren permisos y membresía vigentes.

Segunda sesión creada: Base de conocimientos EMPROVISA (01a13422-b5fd-7ed2-9b34-a668ec1fa38c).
Entrega integrada: búsqueda/listado por palabra/categoría, ficha, alta/edición,
publicación y versiones; contenido filtrado antes del DTO, texto plano, auditor
sin escrituras. Artículo, versión y auditoría comparten transacción; ediciones
simultáneas generan conflicto. Rutas lazy y navegación con permisos, estados
de QueryBoundary y formularios RHF/Zod. Decisiones de alcance: D-010/D-011.

Validación: pnpm check pasó con lint, typecheck, 170 pruebas y build. JS total
161,37 KB gzip, límite 499 KB. Incluye integración de tickets y conocimientos
contra helpdesk_test: concurrencia, permisos/sedes, notas internas, CSRF,
versiones y rollback. Navegador integrado a 360 px: toma/inicio de atención,
nota interna oculta al solicitante, listado y ficha KB; sin desbordamiento
(ancho de contenido 345 px).
Se recargó el proceso de desarrollo tras compilar contratos para actualizar
los permisos en memoria. No se crearon servidores ni recursos externos.

Pendiente: adjuntos; asignación automática por especialidad/carga; escalamiento
nuevo, pausa/reanudación, resolución/cierre/reapertura; jobs y correo simulados;
votos y enlaces KB, CSAT, reportes, administración y k6. No se marca el ciclo
completo de tickets ni RF-06/RF-09 como aceptados en su totalidad.

## 13/10/2026 — Ciclo manual de tickets y adjuntos seguros, dos sesiones

Hecho: reclasificación de categoría/activo/impacto/urgencia/prioridad con justificación;
escalamiento manual a grupo/especialista N2; pausa/reanudación con los dos motivos
permitidos; resolución con evaluación SLA y solución pública; confirmación explícita
de cierre; cancelación; rechazo de solución y reapertura con ciclo nuevo. Plazos
conservados en escalamiento y calculados desde inicio de ciclo al reclasificar/reanudar.
La primera respuesta ya atendida conserva su fecha/límite. Fuera de cinco días hábiles
se registra un ticket nuevo vinculado al anterior, visible por número en formulario/ficha.
Versiones y bloqueo por ticket protegen escrituras; resolución, pausa, asignación,
reapertura, alertas y evidencia se guardan transaccionalmente según la operación.
Decisión de segregación y rechazo de soluciones: D-012.

Nueva sesión 01a13882-0c8e-7592-af12-39e3f76e25bf entregó adjuntos: JPG/PNG/PDF
validados por tipo real, máximo inicial configurable 10 MiB, UUID, SHA-256, rutas
autorizadas y comprobación de integridad al descargar. Filtra archivos de notas
internas incluso ante solicitante con perfil técnico. Auditor solo consulta metadatos;
no descarga contenido, como indica la spec. Subidas aditivas serializadas e incremento
de versión, con limpieza de archivo al fallar transacción. Evidencia se adjunta desde
detalle tras crear el ticket. No se promete atomicidad entre BD y filesystem (D-013).

Docker disponible; se inició únicamente el contenedor existente Postgre, que estaba
detenido. Migración 015 corrigió hash_sha256 omitido en tabla inicial y agregó parámetro
de tamaño; aplicada en helpdesk sin sustituir datos ni tocar otras bases. Tipos
regenerados con kysely-codegen. La aplicación se levanta localmente con pnpm dev.

Validación: cuatro controles de pnpm check en verde, con 190 pruebas y build bajo
499 KB gzip (165,56 KB gzip en la entrega final). Incluye ciclo completo manual, concurrencia, CSRF, sedes, segregación,
reapertura fuera de plazo, datos inválidos, MIME real, límites, descarga autorizada,
archivos internos y rollback. Revisión visual móvil pendiente: cua no pudo iniciar
por un error de su entorno, aun tras reiniciar la sesión del navegador. No se afirma
verificación visual de las nuevas pantallas.

Pendiente: jobs/alertas/escalamiento y cierre automáticos; asignación automática por
especialidad/carga; correo simulado; CSAT; reportes/exportaciones; administración;
votos/vínculos KB; pantalla/endpoint de auditoría; pruebas visuales/accesibilidad/k6.

## 13/10/2026 — Automatizaciones locales y CSAT, dos sesiones

Hecho: pg-boss local sobre PostgreSQL, seis tareas con cron, reintentos/backoff y
resultado visible; esquema de infraestructura separado de las 45 tablas de dominio.
Runtime con rol app sin DDL. Alerta de solución al 50 %, escalamiento por falta de
primera atención conservando plazos, selección de especialista N2 elegible y cierre
tras 48 horas sin actividad manual. Operaciones idempotentes con bloqueo/transacción
y bitácora automatica/idTarea. Verificación diaria de las dos cadenas de evidencia.
Sin destino N2, conserva ticket, informa una vez y reintenta (resultado PARCIAL).

Avisos derivados de eventos, deduplicados por bitácora/destinatario, hasta cinco
intentos con backoff, entrega simulada y pantalla /avisos por cuenta; jefatura y
auditor consultan tareas. Inyección de correo ficticio autorizada a jefatura por
API: alta con clasificación explícita y respuestas públicas al propio hilo mediante
in_reply_to. Hash verificado, message_id único, registros rechazados sin ticket
parcial. Ninguna conexión IMAP/SMTP ni correo real. Decisiones D-014/D-016.

Chat CSAT 01a138a5-70c1-7430-b86a-f7c4879243a0 entregó contratos/API/pantalla pública,
integrados en esta sesión. Cierre manual y automático emiten encuesta en la misma
transacción; token 32 bytes, solo hash en BD, siete días, un uso, puntuación 1–5 y
comentario opcional. CSRF específico, rutas públicas de lista blanca, token en
encabezado redactado; respuesta y auditoría transaccionales. Invitaciones en memoria
tras commit, solo al solicitante, filtradas nuevamente por estado/vigencia/respuesta.
Se pierden enlaces pendientes al reiniciar API; no se reemiten desde el hash (D-015).

Validación: pnpm check pasó los cuatro controles, 219 pruebas en 17 archivos y
171,07 KB gzip (límite 499 KB). Incluye cola pg-boss real con rol app, idempotencia,
pausas/ciclos, conservación de reloj, ausencia de especialista, límites de cierre,
actividad posterior, rollback si falla CSAT, cierre manual -> invitación -> respuesta
pública, privacidad, concurrencia CSAT, backoff/recuperación, recepción/hilos y CSRF.
Migraciones 016–019 aplicadas en helpdesk conservando datos; tests recrean solo
public/helpdesk_queue de helpdesk_test. Se verificó salud local y Vite disponible.

Revisión visual pendiente: cua vuelve a fallar antes de conectar por ruta inexistente
de archivos de su entorno; tampoco pudo iniciar después de que el usuario abrió
la pestaña /login. No se afirma revisión visual de Avisos/CSAT.

Pendiente: asignación inicial por categoría/especialidad/carga (RF-06), reportes y
exportaciones, administración, votos/vínculos KB, pantalla/endpoint de auditoría,
revisión visual/accesibilidad y k6. Correo simulado actual se inyecta por API y no
incluye adjuntos ni clasificación automática; CSAT no recupera enlaces tras reinicio.

## 13/10/2026 — Asignación automática y reportes, dos sesiones

Hecho RF-06: asignación inicial en portal/correo por categoría, especialidad exacta,
grupo/sede/permisos vigentes y carga activa; desempate por dominio/identificador.
No se asigna al propio solicitante. Falta de especialista conserva cola; tarea nueva
ticket-auto-assignment reintenta cada minuto sin duplicar ni reemplazar responsable.
SLA y primera respuesta conservados; evidencia/version/asignación en transacción de
alta. Migración 020 instalada sobre helpdesk y seed de transición/tarea actualizada.
Ahora siete tareas de dominio. Ficha muestra responsable o pendiente en cola. D-017.

Chat de reportes 01a138be-dee2-7d83-a5dc-96bf9f98053c entregó tablero, contratos,
API y exportaciones PDF/XLSX; integrada navegación/ruta lazy /reportes. Consulta
readonly con snapshot, permisos y alcance por sede en tablero/catálogos/exportaciones.
Filtros de fechas Managua, sede/categoría; métricas MTTA/MTTR/SLA/CSAT, desgloses,
volumen diario y carga actual. Cuatro estados de datos y errores/reintento al exportar.
Denominadores y límites explícitos; no se afirma evaluación histórica por técnico.
XLSX protege fórmulas; PDF con fuentes locales; fechas y nombres legibles en filtros.
Homónimos no mezclan carga. Decisión D-018. Dependencias previstas fijadas con lockfile.

Validación final: cuatro controles de pnpm check en verde, 241 pruebas en 19 archivos;
build de 280,47 KB gzip, bajo presupuesto de 499 KB. Cubre concurrencia real de altas en pool de
tres conexiones, idempotencia, permisos/sedes/membresías vencidas, remitente técnico,
alta por correo, desactivación y rollback. Reportes cubren vacío/fechas/alcances,
anónimo/solicitante denegados, exports binarios, fórmulas, números y homónimos.
Demostración HTTP local: TK-000015 asignado automáticamente a Miguel Pérez (demo);
tablero y dos descargas disponibles con la cuenta de jefatura. PDF exportado real
de dos páginas renderizado e inspeccionado: legible, sin recortes ni superposiciones.

Revisión visual de pantallas sigue pendiente: cua falla al iniciar por archivos
de su entorno, también en esta entrega. La inspección del PDF no sustituye revisión
de navegador, accesibilidad móvil ni rendimiento. Datos y secretos locales fuera de Git.

Pendiente: administración de usuarios/roles/grupos/catálogos/calendarios/parámetros;
votos y vínculos KB; pantalla/endpoint de auditoría; revisión visual/accesibilidad/k6.
Correo simulado se inyecta por API; recuperación de invitaciones CSAT tras reinicio
no forma parte del alcance actual. No se despliega ni se usa infraestructura externa.

## 14/10/2026 — Administración local y auditoría, dos sesiones

Administración entregada por chat 01a138d3-5516-7800-8996-efe2eb673d1e e integrada:
usuarios LOCAL, alta/edición/activación/desbloqueo/restablecimiento, vínculos de roles
por sede y vigencia, grupos, miembros y especialidades. Pantalla lazy y formularios
con contratos compartidos, cuatro estados de datos y permisos derivados de BD.
Argon2id, CSRF, revocación de sesiones, límites de delegación, autoexclusión y
continuidad del último administrador. Cambios auditados en transacción. D-020.

Esta sesión: /auditoria y endpoints de consulta/verificación readonly. Metadatos
filtrados por fechas Managua, clase, acción, entidad o ticket; privacidad y alcance
por sede antes de paginar. Verificación global de ambas cadenas con conteos en
snapshot. Reportes registran consulta/exportación con filtros y alcance; nuevas
operaciones humanas guardan IP real sin reescribir historia. D-019.

Migración 021 aplicada a helpdesk: reconcilia dos permisos de jefatura de la base
anterior con la seed, con evidencia. Prueba HTTP local: cuenta ficticia
soporte.demo.extra creada, rol N1 asignado, ingreso correcto y ambas cadenas íntegras.
No se modifican otras bases ni se crean recursos externos.

Validación final: cuatro controles de pnpm check, 262 pruebas en 20 archivos;
build de 290,2 KB gzip. Pruebas cubren permisos/sedes, privacidad, hashes, reportes
auditados, IP sin suplantación, cuentas/roles/grupos, revocación y rollback del
último administrador. La prueba visual de pantallas sigue pendiente: cua falla
al inicializar por una ruta inexistente de su entorno; no se afirma revisión visual.

Estimación funcional orientativa: aproximadamente 85 %, sin equivaler a aceptación
formal de todos los RF/RNF. Pendientes: edición del catálogo de roles/permisos;
catálogos, calendarios, feriados y parámetros; votos/vínculos KB; revisión visual,
accesibilidad y k6; manuales y evidencia de aceptación completa. Continúan los límites
documentados de correo simulado e invitaciones CSAT tras reinicio.

## 14/10/2026 — Categorías y utilidad de conocimientos, dos sesiones

Hecho aquí: administración de categorías con listado/búsqueda/estado/paginación,
alta/edición, jerarquía, grupo por defecto, tipo y activo requerido. Ruta lazy
/administracion/categorias; contratos compartidos, RHF/Zod, TanStack Table y cuatro
estados de datos. Alcance global, CSRF, ciclos rechazados, referencia anterior para
conflictos, semántica protegida si hay tickets y evidencia transaccional. Desactivar
conserva historial; nuevos tickets usan la configuración y bloqueos compatibles.
Sin migración ni tablas nuevas. Decisión D-021.

Chat 01a13902-9146-7331-9184-a64ec599cd20 entregó votos booleanos actualizables,
totales y comentario privado, vínculos de artículos publicados a tickets, retirada
y listas filtradas por permisos/sede/grupo. Integrado en la ficha de conocimientos.
Idempotencia, CSRF, auditor solo lectura, bloqueos, evidencia encadenada y rollback;
sin versiones ficticias del vínculo ni catálogo de uso inventado. Decisión D-022.

Validación: pnpm check pasó lint/typecheck/test/build; 282 pruebas en 21 archivos,
build de 295,11 KB gzip bajo presupuesto de 499 KB. Lint repetido sobre los últimos
ajustes de presentación. Pruebas de categorías incluyen jerarquía, concurrencia,
activo/tipo en el alta y rollback de evidencia; conocimientos cubren votos repetidos
y concurrentes, comentarios privados, sede/grupo vigente y reversión transaccional.
El aislamiento de intentos de login de los casos nuevos respeta los límites reales.

Prueba HTTP sobre helpdesk: categoría «Demostración de soporte local», artículo
«Guía de soporte local», voto repetido sin duplicar y vínculo a TK-000015.
Ambas cadenas verificadas íntegras. Datos ficticios; secretos y herramientas locales
fuera de Git. El navegador no se afirma revisado: continúa pendiente por el fallo
de inicialización documentado de cua.

Avance funcional estimado: aproximadamente 90 %, sin equivaler a aceptación formal.
Pendientes: catálogo de roles/permisos; calendarios/feriados/parámetros y configuración
de matriz/plazos con protección de SLA existentes; revisión visual y accesibilidad;
k6, manuales y evidencia completa de aceptación. Se mantienen límites del correo
simulado y recuperación de invitaciones CSAT tras reinicio.

## 14/10/2026 — Calendarios protegidos y parámetros locales

Hecho aquí: calendarios/horarios partidos/feriados, alta/edición y asignación a sedes;
ruta lazy /administracion/calendarios, RHF/Zod, cuatro estados de datos y control
global de permiso. Validación de solapamientos/fines de semana, referencias anteriores,
concurrencia y escritura con evidencia en transacción. No hay borrado de calendarios.

SLA preservado por fotografía de calendario en la bitácora de cada ciclo. Migración
022 aplicada a helpdesk, sin reescribir historia ni plazos. Seed y altas portal/correo
capturan configuración; pausas, resolución, reclasificación, consumo y ventana de
reapertura usan el ciclo protegido. Un ciclo nuevo adopta el calendario vigente.
Índice parcial para recuperar fotografías; siguen las 45 tablas y pools existentes.
Edición/asignación bloqueada si hay tickets importados sin fotografía. D-023.

Chat 01a1390f-79b8-7d22-99c7-3a696fb4afab entregó parámetros API/UI y pruebas;
integradas ruta /administracion/parametros y cuatro claves permitidas. Inactividad
1–30 min, bloqueo 15–1440 min, adjuntos hasta 10 MB; cierre 48 h solo consulta.
CSRF, alcance global, fallback real explícito, conflictos de upsert y auditoría
transaccional. No se exponen claves arbitrarias ni secretos. D-024.

Validación: pnpm check con lint/typecheck/test/build en verde, 301 pruebas en 22
archivos y build de 302,51 KB gzip. Incluye consumidor de sesión/adjuntos/bloqueo,
límites, concurrencia sobre valor ausente, rollback, intervalos/feriados y protección
de ciclos al cambiar configuración, pausar/reanudar/resolver/cerrar/reabrir.
Las pruebas anteriores de alta también verifican la nueva evidencia de calendario.

Prueba HTTP local: cuatro parámetros consultables, cierre no editable y calendario
«Calendario local de demostración» con 10 intervalos y un feriado asignado a Managua.
El plazo de TK-000015 se conservó; ambas cadenas verificadas íntegras. Datos ficticios,
sin otras bases ni recursos externos. Revisión visual continúa pendiente por fallo
de inicialización de cua; no se afirma revisión de las pantallas nuevas.

Avance funcional estimado: aproximadamente 94 %, no aceptación formal RF/RNF.
Pendientes: administración del catálogo de roles/permisos y de matriz/plazos bajo
las reglas vigentes; revisión visual/accesibilidad, k6, manuales y evidencia completa
de aceptación. Se conservan los límites de correo simulado y enlaces CSAT en memoria.

## 14/10/2026 — Catálogo de roles personalizados

Chat 01a13920-f8cd-7632-9a8b-fd9da6400016 entregó catálogo de permisos y roles
personalizados; integrada ruta lazy /administracion/roles, runtime y pruebas.
Roles de sistema inmutables, sin borrado ni permisos inventados. Concurrencia,
delegación global, revalidación de sesión/BD, autoedición futura bloqueada, revocación
de sesiones y continuidad del último administrador en la misma transacción. D-026.

Validación integrada: lint/typecheck/test/build en verde, 308 pruebas en 22 archivos
y 305,93 KB gzip. Casos cubren login custom, sede, elevación, contextos obsoletos,
ediciones/códigos concurrentes y rollback del último administrador. HTTP local:
LECTURA_LOCAL creado/editado, cinco roles de sistema protegidos y cadenas íntegras.
Se estabilizó el caso de adjuntos de parámetros seleccionando un ticket activo;
ya no depende del orden de filas ni intenta subir archivos a un caso cerrado.

Pendientes: medición final de rendimiento local, configuración de matriz/plazos,
revisión visual/accesibilidad y documentación/evidencia de aceptación completa.

## 14/10/2026 — Carga local de 63 usuarios

Hecho aquí: runner y escenario k6 bajo ops/perf, API aislada 3001/helpdesk_test,
63 cuentas/sesiones y un caso ficticio por cuenta. Pools 10/3, rate limits y permisos
sin cambios. Prueba de lecturas con 90 s de mantenimiento a 63 VUs, seis familias
de ruta, checks de estado/contenido y umbrales globales y por ruta. D-025.

Carga final: 3.225 solicitudes, 100 % de checks, 0 % de errores HTTP, p95 global
47,69 ms y cola p95 56,79 ms; todas las familias bajo 2 s. Duración 116,14 s con
rampas; promedio de 27,77 solicitudes/s. Informe sanitizado en
docs/quality/PERFORMANCE.md. No se afirma rendimiento de login/exports/adjuntos/
escrituras, jobs concurrentes ni navegación. Sesiones revocadas y cookies eliminadas.
No se tocó helpdesk ni se recrearon esquemas durante la carga.

Los controles previos de ambas fases pasaron: 308 pruebas, lint/typecheck/build,
305,93 KB gzip. La revisión visual sigue pendiente por el fallo de cua documentado;
ninguna medición HTTP sustituye esa verificación ni accesibilidad.

Avance funcional estimado: aproximadamente 96 %, sin aceptación formal de todos
los RF/RNF. Pendientes: administración de matriz/plazos bajo reglas vigentes,
revisión visual/accesibilidad, manuales y evidencia de aceptación completa.
Se conservan los límites de correo simulado y recuperación de enlaces CSAT en memoria.

## 14/10/2026 — Cierre técnico coordinado y aceptación con reservas

Las cuatro sesiones de SLA, visual, accesibilidad y manuales terminaron con
marcador COMPLETO CON LIMITACIÓN antes de QA final. SLA: `/administracion/sla`
consulta cuatro prioridades y nueve combinaciones reales, compara norma y permite
editar nombres con permiso GLOBAL, CSRF, revisión optimista, bloqueos y auditoría
transaccional. No cambia plazos, matriz, calendarios ni tickets; sin migración.
RF-19 queda parcialmente cubierto por sus valores no negociables. D-027.

Accesibilidad: foco, botones 40 × 40, errores asociados, tablas enfocables y
alternativas textuales de gráficos; contraste calculado mínimo 5,91:1. D-028.
Revisión visual real en navegador integrado, escritorio 1280 × 800 y móvil
360 × 800, jefe y solicitante. Login, datos, estados KB, recuperación con Reintentar,
foco/scroll de cola y alternativa de gráficos observados; no es UAT completo.
VISUAL.md registra seis hallazgos. Aceptación reparó custodia/paginación móvil
V-03/V-04 después de los marcadores; falta repetir su observación. V-01/V-02
fechas/selector nativos y V-05/V-06 vacíos/acceso al contenido siguen abiertos.

Manuales: uso por perfiles, operación local, demo y seguridad, README/deploy
actualizados; 37 enlaces locales y seis rutas administrativas cotejados por su
sesión. ACCEPTANCE.md mapea 20 RF, 12 RNF y 12 RN a código/pruebas/límites.
D-029 distingue evidencia técnica, diferencias CU-01 y aceptación humana.

Validación final: `pnpm check` pasó lint, typecheck, test y build; 316 pruebas en
22 archivos (51,33 s), incluidos ocho casos SLA registrados en el driver.
Build 308,39 KB gzip de todos los JS compilados bajo 499 KB. PostgreSQL 18.1
existente, recreación solo de public/helpdesk_queue en helpdesk_test. Sin carga k6
simultánea ni nueva medición de rendimiento; informe anterior conserva su alcance.

HTTP local helpdesk: lectura, edición/restauración de P1, norma/matriz y ambos
plazos de TK-000015 conservados; dos cadenas íntegras. El primer script omitió
cuerpo JSON en logout y recibió 400; petición corregida terminó bien y se revocó
la sesión propia restante por su evidencia. Ambas sesiones de prueba cerradas,
sin alterar historia ni exponer cookies. Sin despliegue ni servicios externos.

Avance funcional orientativo: 97 %, no aceptación formal completa. Pendientes:
corregir/revalidar hallazgos visuales y repetir V-03/V-04; CSAT con token válido;
crear/atender por teclado; zoom/lector/contraste dinámico; perfiles N1/N2/AUDITOR,
subpaneles/SLA/Servicio y estados por pantalla. RF-19 parcial; borrador persistente
y activo texto libre de CU-01 no acreditados; prueba positiva RN-08 pendiente.
RNF con límites incluyen archivo/retención observada, escaneo OWASP, 256 Kbps y
CPU/memoria. Correo simulado e invitaciones CSAT en memoria se mantienen.
