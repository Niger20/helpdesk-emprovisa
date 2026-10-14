# Recorrido local de extremo a extremo

Revisión: 14/10/2026. Usá datos ficticios y las cuentas existentes del
[README](../../README.md). Prepará el entorno siguiendo [operación local](operacion-local.md).
Estos pasos son una guía basada en código, no un acta de ejecución en navegador.
Registrá por separado fecha, número creado, resultados y cualquier limitación.

## Caso nuevo: solicitante → N1 → solicitante → auditor

1. Entrá como `ana.managua`. En `/tickets/nuevo`, registrá un INCIDENTE de correo
   con título «Demo local: correo no sincroniza», descripción ficticia, impacto
   BAJO, urgencia MEDIA y una categoría de correo activa. No requiere activo.
   Esperado: P4 y ficha con número nuevo. Anotá el número; no asumas TK-000010.
2. En `/tickets/<numero>`, agregá una respuesta pública y, opcionalmente, un PDF
   ficticio o captura PNG real menor al límite. Esperado: evidencia en la ficha.
3. Cerrá sesión. Entrá como `analista.managua`, abrí el mismo número. Si no tiene
   responsable, usá **Tomar ticket**; si está asignado a otra cuenta, jefatura puede
   reasignarlo a un candidato elegible del grupo. Usá **Iniciar atención**.
   Esperado: EN_ATENCION y primera atención sin reiniciar plazos.
4. Enviá una nota interna ficticia y una respuesta pública diferenciables.
   Registrá una solución visible para el solicitante. Esperado: RESUELTO,
   evaluación del SLA e historial anterior conservado.
5. Volvé a `ana.managua`. Esperado: respuesta pública y solución visibles;
   nota interna ausente. Elegí **Confirmar y cerrar**, marcá la casilla y enviá.
   Esperado: CERRADO. En `/avisos`, abrí la invitación nueva de encuesta y
   respondé 1–5. Esperado: recibo; un segundo envío no vuelve a responderla.
6. Entrá como `auditor.demo`. Consultá el ticket, `/auditoria` y la verificación
   de ambas cadenas. Esperado: evidencia y lectura, sin acciones de modificación.
   Exportá un reporte de la cohorte desde `/reportes` con fechas que incluyan el caso.

La invitación de encuesta pendiente se guarda en memoria para la demo. Si reiniciás
la API antes de copiarla, deja de mostrarse; una URL ya copiada conserva su vigencia.
No compartas su fragmento ni inventes un token para los tickets sembrados.

## Rama especializada y segregación

Desde otro caso ficticio en atención, N1 puede **Escalar a nivel 2** con grupo
elegible y motivo. Entrá como `especialista.infra`, consultá su cola e iniciá
atención si corresponde. Usá **Pausar SLA** por REPUESTOS con detalle ficticio
y luego **Reanudar SLA** con motivo. Esperado: EN_ESPERA/EN_ATENCION e historial
de pausa. Registrá solución y confirmá como el solicitante correspondiente.

Para demostrar RN-05, creá un requerimiento con una cuenta técnica como
solicitante y consultá sus acciones: esa cuenta no debe resolverlo ni validarlo.
No fuerces escrituras directas en BD para preparar el escenario.

## Escenarios ya sembrados

| Ficha real | Estado original y propósito |
| --- | --- |
| `/tickets/TK-000001` | Nuevo CCTV de Rivas, crítico |
| `/tickets/TK-000002` | Correo de Managua asignado |
| `/tickets/TK-000003` | CCTV en atención, alerta de 50 % |
| `/tickets/TK-000004` | Impresora de Managua en espera de repuesto |
| `/tickets/TK-000005` | CCTV de Rivas escalado, registrado por teléfono |
| `/tickets/TK-000006` | Impresora de León resuelta |
| `/tickets/TK-000007` | Solicitud cerrada con encuesta respondida |
| `/tickets/TK-000008` | CCTV reabierto, nuevo ciclo SLA |
| `/tickets/TK-000009` | Solicitud duplicada cancelada |

Usá `carlos.rivas`, `lucia.leon` y los N1 de cada sede para comparar visibilidad.
N1 de Managua no debe acceder a un caso ajeno de Rivas; jefatura y auditor tienen
lectura global. Los estados anteriores corresponden a la seed inicial: las acciones
y jobs activos pueden cambiarlos. La seed repetida no restaura esos escenarios.
P1/P2 dependen del instante de carga y del tiempo transcurrido; P3/P4 usan el
calendario demo lunes a viernes, 08:00–17:00, sin feriados iniciales.

## Recorrido complementario

Como jefatura, consultá `/activos`, `/conocimientos`, `/reportes` y `/avisos`.
En administración, mostrá cuentas y roles, categorías, horarios/feriados y los
cuatro parámetros permitidos. En `/administracion/sla`, consultá matriz/plazos
y cumplimiento normativo; solo se edita el nombre de presentación de prioridades.
Si editás, anotá el valor previo y conservá evidencia;
los cambios de roles revocan sesiones y los calendarios afectan ciclos nuevos.
No es necesario modificar la configuración para explicar esas pantallas.

Los jobs se observan desde `/avisos`: umbral/escalamiento/asignación/despacho
cada minuto, ingesta cada dos, cierre cada 15 y verificación diaria a las 03:00
de Managua. El cierre exige 48 h de inactividad en RESUELTO; no esperes que un
caso recién resuelto se cierre en la presentación. No adelantes el reloj ni
modifiques evidencia para aparentar esa comprobación.

La ingesta ficticia está en `POST /api/v1/correo-simulado`, solo jefatura con
sesión y CSRF. Admite messageId, inReplyTo, usernameRemitente, contenido y
solicitud; una respuesta usa inReplyTo del mensaje procesado y solicitud null.
El formulario de correo no existe en web. Consultá los contratos y el README
antes de invocarla; no uses una casilla institucional ni SMTP/IMAP reales.

Al finalizar, cerrá sesiones y guardá el registro de resultados sin cookies,
tokens, correos reales ni contraseñas. Las limitaciones y pruebas pendientes
están en [seguridad y alcance](seguridad-limitaciones.md) y los informes de calidad.
