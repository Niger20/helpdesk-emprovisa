# Cierre E2E del prototipo local

Fecha: 14/10/2026, America/Managua; recorridos aproximadamente 01:37–01:52.
Resultado: flujo principal ejecutado, revisión ampliada con limitaciones.
No constituye UAT firmado ni aceptación completa de RF/RNF.

## Método

Fuentes: AGENTS.md, SPEC-TI-2026-002 v2.0 DOCX (texto OOXML), ER del núcleo,
guía y mockups, ACCEPTANCE.md, VISUAL.md, ACCESSIBILITY.md y coordinaciones.
CUA/navegador integrado contra 127.0.0.1:5173; API local 3000 y helpdesk de
demostración. Datos exclusivamente ficticios. No correos reales ni despliegue.
No tests/check globales, migraciones o recreación de helpdesk_test en esta sesión.

Se leyeron finish-ui y finish-drafts con Estado: COMPLETO CON LIMITACIÓN antes
de probar las pantallas finales. Se usaron exclusivamente APIs de cua_repl para
interacciones, DOM de solo lectura y capturas. Sin autenticación por API,
intercepción de respuestas, escritura de localStorage desde herramientas,
modificación del reloj ni manipulación de la BD para preparar resultados.
Escritorio 1280 × 800 y móvil 360 × 800; restablecidos al terminar.

## Flujo principal realmente ejecutado

Cuenta solicitante ana.managua; responsable analista.managua, ambos LOCAL demo.
Número obtenido del alta: TK-000016; no se supuso la secuencia antes de crear.

| Hito | Resultado observado | Captura local |
|---|---|---|
| Alta | INCIDENTE, Correo no sincroniza, BAJO/MEDIA, P4, NUEVO; título y descripción ficticios | ticket-creado.jpg |
| Adjunto | PNG mínimo válido de 68 bytes; selector real y subida; confirmación y evidencia-ficticia.png en ficha | adjunto-guardado.jpg |
| Toma/asignación | N1 tomó el caso; ASIGNADO, Miguel responsable | n1-comentario-nota.jpg (historia conservada) |
| Atención | EN_ATENCION; plazos 14/10/2026 12:00 y 16/10/2026 17:00 conservados en el recorrido | n1-comentario-nota.jpg |
| Respuesta pública | Texto E2E PUBLICO en comentarios y bitácora | n1-comentario-nota.jpg |
| Nota interna | Texto E2E INTERNO visible para N1; ausente al volver como Ana (consulta DOM: cero coincidencias) | n1-comentario-nota.jpg, solicitante-resuelto-sin-nota.jpg |
| Resolución | Causa ficticia y solución pública; RESUELTO/SLA Detenido | n1-ticket-resuelto.jpg |
| Cierre | Ana marcó confirmación y envió; CERRADO e historial de cierre | ticket-cerrado.jpg |
| CSAT | Invitación nueva desde Avisos; formulario válido, cinco opciones, envío 5/5 y agradecimiento | csat-valido-mobile.jpg, csat-gracias-mobile.jpg |

Los nueve hitos del recorrido principal se ejecutaron: 9/9 = 100 % de este
recorrido, sin extrapolar a cobertura de requisitos o avance global del proyecto.
El enlace fue emitido por el cierre normal; no se fabricó/copió un token a los
documentos. Tras recargar el enlace respondido apareció «Este enlace no está
disponible: es inválido, venció o la encuesta ya fue respondida», sin formulario
(csat-reuso-rechazado.jpg). No se esperó su caducidad de siete días ni se adelantó
el reloj: rechazo de reuso acreditado; vencimiento temporal no acreditado aquí.

## Teclado y borradores

Alta principal: desde contenido enfocado se avanzó con Tab por descarte,
solicitante, tipo y título; se escribieron título/descripción con entrada de
teclado; Tab y tres ArrowDown seleccionaron Correo no sincroniza; Tab hasta
Registrar y Enter crearon el caso. Toma, atención, comentarios, resolución y
cierre se activaron con Enter; visibilidad con ArrowDown, confirmación con Space.
CSAT: envío vacío enfocó primera opción; Space/ArrowRight recorrieron 1–5,
DOM confirmó únicamente 5 marcada; Tab llevó a comentario y envío, luego Enter.
El selector de adjunto se abrió con Enter y se resolvió mediante la API documentada
de filechooser; no se certifica el diálogo nativo manejado enteramente con teclas.

Algunas acciones enfocaron controles mediante locators semánticos antes de
press/pressSequentially. No hubo clic de puntero en el flujo principal, pero
esto no sustituye una prueba humana continua de orden de Tab ni lector audible.
En la rama N2 se utilizaron fill/selectOption además de press: no se presenta
como segunda repetición íntegra de teclado.

| Borrador | Resultado | Evidencia |
|---|---|---|
| Recarga | Título y descripción incompletos recuperados; aviso Borrador recuperado | borrador-recuperado.jpg |
| Aislamiento | Logout Ana/login N1: formulario vacío y solicitante Miguel | borrador-aislamiento-n1.jpg |
| Descarte | Volver a Ana, activar Descartar y recargar: campos vacíos | borrador-descartado-recarga.jpg |
| Limpieza por éxito | Después de TK-000016, abrir nuevo a 360 px: título y descripción vacíos | alta-mobile-borrador-limpio.jpg |

No se probó cierre/reapertura de pestaña ni pérdida real de red durante POST,
almacenamiento bloqueado, edición concurrente o caducidad local de 24 horas.
Las pruebas focales descritas en DRAFTS.md pertenecen a la sesión de borradores.

## Rama N2 y auditor

TK-000017 se creó por UI con Ana; N1 tomó/atendió/escaló a Infraestructura multisede
sin responsable individual. N2 especialista.infra lo vio en su cola, lo tomó,
inició atención, pausó por REPUESTOS con detalle ficticio (EN_ESPERA/En pausa),
reanudó con motivo, registró solución y Ana confirmó el cierre. Evidencia:
rama-n2-creada-mobile.jpg, rama-n2-escalada-mobile.jpg, n2-pausa-mobile.jpg,
n2-resuelto-mobile.jpg, rama-n2-cerrada-mobile.jpg. No se enviaron correos reales.

Se conserva la encuesta pendiente de TK-000017 en Avisos de ana.managua para
accesibilidad (csat-pendiente-a11y.jpg). No reiniciar API antes de obtener la
invitación desde la interfaz: su disponibilidad en Avisos reside en memoria.

auditor.demo consultó TK-000016 con respuesta pública, solución y nota interna;
no había formulario de comentario, subida, toma ni acciones de ciclo. Evidencia
auditor-ficha-mobile.jpg. En auditoría activó Verificar ambas cadenas:
14/10/2026 01:45, Tickets Íntegra/107 registros, Sistema Íntegra/22 registros.
No se ejecutó una escritura denegada ni comparación completa de sedes por UI;
las pruebas de autorización de servidor pertenecen a QA técnico.

## Repetición V-01–V-06 y pantallas adicionales

| Caso | Resultado real y límite | Evidencia |
|---|---|---|
| V-01 | Reportes/auditoría muestran dd/mm/aaaa. 31/02/2026 muestra error español; se restauró fecha válida. Fechas nativas aún en vigencias/feriados, pendientes de integración | reportes-fechas-mobile.jpg, reportes-fecha-invalida-mobile.jpg, auditoria-vacia-mobile.jpg |
| V-02 | Botón Seleccionar archivo de evidencia y estado Ningún archivo seleccionado en español; chooser/subida reales funcionaron | adjunto-guardado.jpg |
| V-03 | Custodia a 360 px: fecha completa y texto legible; región 287 px, contenido 640 px y scrollLeft 40 tras ArrowRight; desplazamiento local | custodia-mobile.jpg |
| V-04 | Página 2 · 107 registros y Anterior/Siguiente completos en dos filas a 360 px; Siguiente avanzó realmente | auditoria-paginacion-viewport-mobile.jpg |
| V-05 | KB vacío aconseja otras palabras/quitar filtros; Avisos vacío describe avisos/encuestas y ofrece acciones | kb-vacio-contextual-mobile.jpg, avisos-vacio-contextual-mobile.jpg |
| V-06 | En rutas con shell, navegación enfocó contenido-principal; Saltar al contenido con Enter lo enfoca. Roles/Servicio carecen de navegación del shell | admin-roles-sin-shell-mobile.jpg, servicio-mobile.jpg |

Administración observada en escritorio/360 px: usuarios y subpanel Ana (roles,
alcance/vigencia, especialidades), grupos y subpanel Infraestructura (miembros),
categorías, calendario local/horarios/feriado, parámetros, roles/permisos y SLA.
No se guardaron cambios de usuarios, roles, calendario o configuración.
SLA mostró nueve combinaciones y cuatro prioridades, plazos normativos y 50 %.
Servicio mostró Sistema disponible, sesión y «La mesa de ayuda está en preparación».
Capturas admin-*.jpg, sla-desktop.jpg, sla-mobile.jpg, servicio-*.jpg.

## Estados: cobertura observada, sin extrapolación

| Vista | Con datos | Vacío real/controlado | Carga/error observado |
|---|---|---|---|
| Login | Login/logout de cinco perfiles | Campos iniciales vacíos | Ingresando/Cerrando y dos errores genéricos de acceso |
| Cola | N1/solicitante/auditor/jefe | Buscar E2E-sin-coincidencia-14102026 | Carga inicial; error de consulta no provocado |
| Alta | Catálogo y altas reales | Nuevo limpio tras éxito | Carga por recarga; error de conexión al POST no provocado |
| Ficha | TK-000016/17 y ramas | Comentarios/adjuntos vacíos antes de agregarlos | Conflicto de versión al escalar; Actualizar y reenviar funcionó |
| Inventario/ficha | Tres activos y EMP-CAM-0031 | Buscar sin coincidencias en listado | Carga/error no retenidos como evidencia final |
| KB | Dos artículos y detalle existente | Búsqueda sin coincidencias | Artículo controlado 999999: carga, error y Reintentar; sigue fallando por inexistente; volver a artículo válido funciona |
| Reportes | Cohorte octubre/17 tickets | Rango 01–31/01/2027: vacío | Cargando al aplicar rango; error de fecha de entrada; fallo HTTP no provocado |
| Avisos | Invitaciones/avisos de Ana, tareas | Auditor sin avisos/encuestas | Fallo HTTP no provocado |
| Auditoría | 107 eventos/paginación/cadenas | Ticket TK-999999 sin registros | Fallo HTTP no provocado |
| Identidad/categorías | Listados/subpaneles | Buscar sin coincidencias | Carga de subconsultas vista; error de red no provocado |
| Calendarios/parámetros/roles/SLA | Datos existentes/norma | No se vaciaron catálogos operativos para producir vacío | Fallo HTTP no provocado |
| Servicio | Sistema disponible | No aplica listado vacío | No se detuvo API/BD para inducir error |
| CSAT | Formulario, envío y recibo | Enlace respondido sin formulario | Carga por recarga; validación sin rating con mensaje inglés |

No hay evidencia de los cuatro estados dinámicos por cada pantalla. Los casos
controlados usaron filtros e identificador inexistente ficticio; no se borraron
datos ni alteró la infraestructura compartida. La revisión pendiente debe usar
un mecanismo autorizado para fallos de red y latencia, sin confundir error de
validación, ausencia de datos y error de transporte.

## Hallazgos para integración

1. CSAT vacío muestra `Invalid input: expected number, received undefined`.
   Sustituir mensaje de calificación obligatoria por español y revalidar.
2. /administracion/roles no presenta navegación ni cierre de sesión; se volvió
   mediante historial del navegador. Integrar shell/retorno coherente.
3. /disponibilidad conserva texto de preparación y no ofrece retorno a tickets;
   revisar texto y navegación contextual del prototipo implementado.
4. Fechas nativas en RolePanel/MemberPanel/HolidaysEditor y main anidados de
   categorías/calendarios/parámetros coinciden con pendientes de finish-ui.
5. Dos logins inmediatos tras cambiar cuenta fallaron con mensaje genérico;
   reingresar idénticas credenciales funcionó. Al esperar heading Iniciar sesión
   antes de rellenar, los cambios posteriores funcionaron al primer intento.
   Puede relacionarse con sincronización de la automatización; causa no probada,
   no se declara vulnerabilidad ni fallo definitivo de autenticación.

Una acción rápida tras atender recibió «El ticket cambió. Actualizá la ficha
antes de continuar»; actualizar el ciclo y reenviar escaló correctamente.
Este caso demuestra manejo del conflicto; no hubo envío duplicado ni pérdida
de historia. Un fill de descripción móvil terminó parcialmente por timeout;
se observó y completó antes de guardar. No se reintentó un alta ya enviada.

## Entrega y reservas

51 capturas JPG locales y un PNG ficticio en .data/quality/e2e, excluidos de Git;
los nombres permiten revisar evidencia sin incluir archivos ni tokens en el repo.
No hay aprobación humana firmada, prueba de caducidad transcurrida, cobertura
total de fallos de red, zoom/lector/contraste dinámico ni aceptación del 100 %
del sistema. Accesibilidad continúa en su sesión; QA final integra correcciones,
documentación global, cuatro controles y commits.
Sesión cerrada, viewport restablecido, tab 1 del navegador integrado en /login,
marcada para handoff. Navegador liberado; sin procesos propios en ejecución.

Estado: COMPLETO CON LIMITACIÓN
