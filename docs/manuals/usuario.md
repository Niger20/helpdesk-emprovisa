# Uso por perfiles

Revisión: 14/10/2026. Abrí `http://127.0.0.1:5173/login` con las cuentas
ficticias del [README](../../README.md). Al entrar se abre `/tickets`.
Los permisos vigentes de la base y el estado del caso determinan qué acciones
aparecen. Esta tabla describe los cinco perfiles de demostración originales.

| Perfil | Alcance de tickets | Trabajo habitual |
| --- | --- | --- |
| Solicitante | Sus propios casos | Crear, comentar, adjuntar, confirmar solución, cancelar un caso nuevo y solicitar reapertura |
| Analista N1 | Casos propios y cola de su sede | Registrar para terceros, tomar, atender, reclasificar, escalar y resolver; consultar activos y conocimientos |
| Especialista N2 | Casos propios, asignados o de sus grupos vigentes | Atención técnica, pausas y reanudaciones, alta de activos y edición de conocimientos |
| Jefatura de TI | Todas las sedes | Atención, reasignación, administración, reportes y auditoría |
| Auditor | Lectura global | Consultar casos, activos, conocimientos, reportes, tareas y verificar cadenas; sin modificar casos |

## Solicitante: registrar y seguir un caso

1. En `/tickets`, elegí **Nuevo requerimiento** (`/tickets/nuevo`).
2. Completá tipo, título, descripción, impacto, urgencia y categoría. Si requiere
   activo, seleccioná uno disponible de la sede. La prioridad se calcula automáticamente.
3. Elegí **Registrar requerimiento**. Conservá el número mostrado, por ejemplo
   `TK-000010`; el número concreto depende de los datos existentes.
4. Abrí la ficha desde la cola (`/tickets/<numero>`). Consultá estado, responsable,
   fechas límite y línea de tiempo. Podés enviar una respuesta pública y adjuntar
   JPG, PNG o PDF desde la ficha, después de crear el ticket.
5. En estado RESUELTO, **Confirmar y cerrar** exige marcar la confirmación.
   Si el problema continúa, **La solución no funcionó** pide motivo y vuelve a atención.
6. En CERRADO, **Reabrir ticket** está sujeto a cinco días hábiles. Fuera de la
   ventana, usá la opción de crear otro requerimiento vinculado al anterior.

Tus notas públicas y la solución son visibles para quienes tienen acceso al caso.
Las notas internas nunca llegan al solicitante, aunque también tenga un perfil técnico.
En `/avisos` consultá las entregas simuladas y enlaces de encuesta pendientes.
El enlace recibido abre `/encuesta` sin login; elegí 1–5 y un comentario opcional.
Es de un solo uso y vence a los siete días. Guardalo de forma privada.

## N1: recibir, atender y escalar

Filtrá `/tickets` por los controles de la cola y abrí el número correspondiente.
En **Atención del ticket**, **Tomar ticket** aparece si el caso y tu alcance lo
permiten; si fue asignado automáticamente, consultá el responsable antes de actuar.
**Iniciar atención** registra la primera atención y conserva los plazos originales.
Elegí respuesta pública para el usuario o nota interna para el equipo.

En **Ciclo del ticket**, usá **Reclasificar** cuando cambien categoría, impacto
o urgencia; una prioridad manual requiere justificación. Para **Escalar a nivel 2**,
seleccioná el grupo elegible y escribí el motivo. Para **Registrar solución**, describí
lo realizado en el campo visible para el solicitante; la causa es opcional.
No podés resolver ni validar un caso del que seas solicitante.

Si el usuario no puede entrar, registrá el caso a su nombre desde el formulario,
con teléfono o presencial como canal. Elegí al usuario real del caso ficticio,
no tu propia cuenta como sustituto. N1 no tiene pausa SLA en el perfil sembrado.

| Prioridad | Respuesta / solución | Calendario |
| --- | --- | --- |
| P1 | 15 / 120 minutos | Continuo |
| P2 | 30 / 240 minutos | Continuo |
| P3 | 120 / 480 minutos | Laboral |
| P4 | 240 / 1440 minutos | Laboral |

El modo laboral cuenta horarios configurados, excluye fines de semana y feriados.
El SLA corre en NUEVO, ASIGNADO, EN_ATENCION, ESCALADO y REABIERTO; se detiene
en EN_ESPERA, RESUELTO, CERRADO y CANCELADO. La alerta es al 50 %; un escalamiento
por falta de atención conserva el reloj. Rechazo/reapertura inicia otro ciclo.

## N2: atención especializada y documentación

Abrí un caso asignado o escalado a tu grupo. Iniciá atención, respondé y registrá
solución según las acciones disponibles. **Pausar SLA** solo admite REPUESTOS o
PROVEEDOR_EXTERNO y exige detalle escrito; **Reanudar SLA** requiere motivo.
La evidencia de la pausa permanece en el historial.

En `/activos`, buscá por código, serie o descripción y filtrá por sede, tipo y
estado. Abrí el código patrimonial para consultar ficha, custodia e incidentes
visibles. El alta exige acta F-ACT-01; no hay formulario de edición de activos.

En `/conocimientos`, buscá por palabra o categoría y abrí un artículo. N2 y
jefatura pueden crear, editar y publicar, conservando versiones. La ficha
permite **Útil/No útil**; el comentario del voto solo lo ve su autor. Los técnicos
pueden vincular un artículo publicado a un ticket autorizado usando su número;
un caso cerrado o cancelado no permite cambiar vínculos. El contenido es texto plano.

## Jefatura: supervisión y administración

La ficha ofrece **Guardar asignación** con responsable elegible y motivo; la
reasignación conserva el SLA. En `/reportes`, filtrá por fechas de creación,
sede y categoría; consultá las fórmulas de MTTA, MTTR, SLA y CSAT antes de
interpretar resultados. Exportá PDF o Excel con esos mismos filtros.

| Ruta | Operación disponible |
| --- | --- |
| `/administracion/identidad` | Cuentas locales, roles por sede/vigencia, grupos, integrantes y especialidades |
| `/administracion/roles` | Crear/editar roles personalizados y consultar permisos; los cinco roles de sistema son inmutables |
| `/administracion/categorias` | Crear, editar y desactivar categorías conservando historial |
| `/administracion/calendarios` | Horarios, intervalos, feriados y calendario por sede |
| `/administracion/parametros` | Inactividad de sesión, duración del bloqueo y máximo de adjuntos; cierre de 48 h solo consulta |
| `/administracion/sla` | Consultar matriz, plazos y cumplimiento normativo; editar solo nombres de prioridades |

Crear una cuenta requiere asignarle un rol vigente para permitir login. Los cambios
de acceso revocan sesiones; otra jefatura debe gestionar tu propio acceso y el
sistema protege al último administrador. Solo podés conceder permisos que poseés
con alcance global. Cambiar calendarios conserva la fotografía de ciclos anteriores;
un ciclo nuevo usa la configuración vigente. En **Prioridades y acuerdos de servicio**,
la matriz, los minutos, el modo de calendario y el umbral de 50 % son de consulta
por las reglas vigentes; **Guardar nombre** cambia únicamente el nombre de
presentación. Ante conflicto, usá **Recargar configuración**. La pantalla señala
diferencias normativas; no las corrige automáticamente ni cambia ciclos de tickets.

## Auditor: consultar evidencia

Usá `/auditoria` para filtrar bitácora y eventos del sistema y verificar ambas
cadenas. La verificación informa integridad en ese instante; no corrige registros.
La vista de auditoría muestra metadatos y hashes, sin contenido de notas internas
ni secretos. La ficha de tickets puede mostrar notas internas al auditor según
su permiso de lectura. En adjuntos puede consultar metadatos, pero no descargar
contenido. `/reportes` permite consulta y exportación; `/avisos` muestra estado de tareas.

## Incidentes de uso

Ante un conflicto de edición (409), usá **Actualizar ficha y acciones** o recargá
el listado administrativo antes de revisar y reenviar. Si expiró la sesión,
iniciá sesión de nuevo. Un botón ausente puede responder a permiso, sede, estado
o segregación de funciones: no pruebes otra cuenta para eludir el control.
Las pantallas de datos presentan carga, vacío o error con reintento; un resultado
vacío no demuestra que otro perfil carezca de tickets.
