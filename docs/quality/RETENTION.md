# Retención y archivo local de tickets y evidencia

Fecha: 14/10/2026, America/Managua. RNF-12 exige al menos 24 meses en línea
de tickets/bitácoras y archivo histórico posterior. Esta política documental
define conservación y copia local; no acredita 24 meses transcurridos, un archivo
ejecutado ni restauración operacional. No se ha borrado ni movido historia.

## Estado existente

- Tickets permanecen en helpdesk. No se encontró endpoint de borrado de tickets
  ni handler de purga por edad en modules/queue. Cerrar/cancelar cambia estado;
  no elimina el registro. No existe parámetro de retención/archivo configurable
  entre las capacidades implementadas: una política escrita no es ese parámetro.
- Bitácora y auditoria_sistema son solo inserción. Migración
  202610120009_audit-chain.sql impide UPDATE/DELETE/TRUNCATE con trigger;
  202610120010_grants.sql retira esos privilegios a helpdesk_app. El migrator
  sigue siendo dueño del esquema y debe mantenerse fuera del uso ordinario.
- Cada cadena es global por tabla, con hash previo, canon PostgreSQL, pgcrypto
  y advisory lock. Extraer solo eventos antiguos produce una cadena incompleta;
  no permite validar el archivo como si arrancara de cero. No recalcular hashes
  para hacer que un fragmento parezca una cadena nueva.
- Los jobs existentes cubren SLA, cierre, correo simulado, asignación y
  verificación de cadena; ninguno aplica archivo histórico por edad. Los borrados
  de alertas pendientes/grupos/roles/horarios encontrados son reglas de capacidad,
  no purga de tickets o evidencia histórica.
- Los adjuntos están en STORAGE_DIR fuera del sitio, con UUID y SHA-256;
  metadata en ticket_adjuntos. Una exportación PDF/Excel de reportes no contiene
  toda la evidencia ni los archivos físicos y no sustituye un archivo histórico.

La integridad real consultada a las 01:34 del 14/10/2026 mostró bitácora 78 y
auditoría 21 registros, ambas válidas. Es un estado puntual de datos ficticios;
el calendario simulado de seed y timestamps de pruebas no demuestran antigüedad
real. Los hashes no convierten la computadora local en almacenamiento WORM.

## Política documental del prototipo

Conservar tickets, relaciones de atención, bitácora, auditoría y adjuntos en línea
sin vencimiento automático mientras se demuestra el prototipo. El mínimo normativo
es 24 meses calendario; la opción conservadora actual conserva más, sin purga.
La política comienza en fecha_creacion del ticket y fecha_hora de cada evento.
Archivar un ticket no debe excluir eventos recientes relacionados; cualquier
historia posterior obliga a conservar esa nueva evidencia y sus referencias.
Los plazos de cierre, SLA, sesiones y encuestas no son plazos de eliminación.

El archivo local se define como una copia adicional verificable. Los datos fuente
siguen en línea, incluidas ambas cadenas completas. No retirar registros después
de 24 meses sin diseño y autorización específicos compatibles con RN-12/ER.
No convertir la aplicación en un servicio de respaldo NAS ni crear recursos externos.
La política no altera el ER de 45 tablas ni introduce particiones o reencadenamiento.

## Procedimiento local propuesto, todavía no ejecutado

Responsable técnico: perfil con acceso autorizado de auditoría y lectura de BD;
el usuario del equipo conserva el control de los archivos. Antes de realizar una
copia, definir la fecha de corte, el alcance y directorio privado fuera de Git,
del frontend y de sincronización pública. Mantener secretos/cookies fuera del
manifiesto. El archivo contiene datos ficticios del prototipo; no exportar datos
institucionales con este procedimiento sin revisar el alcance correspondiente.

1. Verificar ambas cadenas con el endpoint autorizado o funciones
   verificar_cadena_bitacora/verificar_cadena_auditoria. Si no son válidas,
   conservar la evidencia y reportar el fallo; no reparar hashes ni borrar filas.
2. Abrir una transacción de lectura con snapshot consistente (REPEATABLE READ,
   READ ONLY) usando helpdesk_readonly. Registrar current_database y comprobar
   helpdesk antes de copiar; helpdesk_test pertenece al driver de pruebas.
3. Copiar tickets y las relaciones necesarias para interpretación histórica
   (comentarios, asignaciones, escalamiento, pausas, resoluciones, reaperturas,
   activos/catálogos y adjuntos según alcance) junto con ambas cadenas completas.
   Preservar ids, timestamps UTC, JSON, hash_previo/hash_registro y su contenido
   canónico original. Las cadenas no se ordenan por fecha como prueba de enlace:
   validar enlaces hash y totales. No incluir contraseñas, sesiones o secretos
   en una copia destinada solo a consulta histórica.
4. Si incluye adjuntos, copiar desde STORAGE_DIR los UUID referenciados en el
   snapshot y verificar SHA-256 contra metadata. No cambiar nombres almacenados,
   no usar rutas del nombre original y no eliminar archivos fuente. Si falta un
   adjunto o su hash difiere, marcar copia incompleta y conservar el detalle.
5. Generar manifiesto con versión del esquema/commit, base, fecha UTC y corte,
   conteos por tabla, hashes SHA-256 de archivos, alcance de relaciones y resultado
   de cadenas. Para futuros incrementos, producir otro archivo y manifiesto;
   no sobrescribir el lote anterior ni convertirlo en nueva génesis de la cadena.
6. Volver a leer la copia, verificar hashes/conteos y comprobar referencias;
   documentar resultado/limitaciones. Restringir acceso mediante permisos del host.
   Una copia de consulta no es automáticamente un backup restaurable completo.
7. Conservar original en helpdesk y registrar ubicación/resultado del lote en un
   acta local sin secretos. La consulta histórica mantiene autorizaciones y
   distinción de notas internas; un archivo íntegro con datos privados no se
   entrega al solicitante. No agregar un endpoint público de descarga.

El snapshot de BD no inmoviliza todo el filesystem: hay que cotejar cada adjunto
referenciado y documentar consistencia. No se establece RTO/RPO, redundancia,
protección contra pérdida del disco, cifrado operacional ni recuperación NAS.
Esas capacidades están fuera del prototipo y necesitan otro alcance.

## Evidencia y pendientes de aceptación

Inspección real: migraciones de cadenas/privilegios/relaciones, módulos y registro
de jobs, almacenamiento local y endpoint de integridad. Ningún SQL destructivo,
archivo histórico real, cambio de timestamp ni prueba de envejecimiento ejecutados.
RNF-12 conserva dos límites explícitos: no hay retención de 24 meses observada
y el procedimiento propuesto no se ha ejecutado/verificado como lote histórico.
La ausencia de purga conserva datos; no demuestra una política operativa configurable.

CU-01 texto libre de activo se conserva como discrepancia D-029: el archivo no
debe inventar id_activo ni regularizar catálogo para disfrazar esa diferencia.
Final QA debe enlazar este informe y mantener los límites en ACCEPTANCE/PROGRESS.

Estado: COMPLETO CON LIMITACIÓN
