# Cierre integrado LOCAL — 14/10/2026

Fecha y zona: 14/10/2026, America/Managua. Las seis sesiones entregaron
COMPLETO CON LIMITACIÓN y liberaron código/navegador antes de integración.
Rendimiento confirmó procesos propios detenidos, sesiones revocadas y puerto
3001 libre. Sin subagentes, mensajes a chats, recursos externos ni despliegue.

## Resultado de los controles

`pnpm check` final terminó con código 0: lint y typecheck aprobados;
**369 pruebas en 27 archivos, 55,69 s**; API/web compilados y **312,6 kB gzip**
de JS frente al límite de 499 kB. Integración recreó exclusivamente public y
helpdesk_queue en helpdesk_test, con migraciones/seed y PostgreSQL 18.1 existente.
No hubo k6 simultáneo ni recreación de helpdesk u otra base del usuario.
Logs locales ignorados en .data/quality/acceptance/finish-check*.log.

Primera corrida: 364 aprobadas/cuatro fallos en fixture nuevo Braces. El patrón
de 20.001 caracteres activaba el límite previo de longitud, sin probar profundidad.
Fixture corregido a 4.000 niveles/8.001 caracteres; segunda corrida aprobó 368.
Luego se añadió el inventario completo de rutas y se aclararon mensajes/import
Vite; última corrida aprobó 369. No hubo fallos de negocio en esas corridas.

RN-08: diez casos de alta por teléfono/presencial, permiso/sede/canal/auditor,
CSRF, permiso en service y rollback tardío de ticket/bitácora/calendario.
runtime-route-access-checks construye todos los módulos registrados por main,
recorre permisos/lista blanca y comprueba denegación anónima en cada ruta privada.
No inicia servidor ni pg-boss en esa prueba y no concede permisos nuevos.
Borradores: doce casos de recuperación, identidad, corrupción, caducidad,
limpieza, almacenamiento bloqueado y reconciliación de catálogo.

## Reparaciones y evidencia dinámica

La evidencia E2E/A11y histórica está en [E2E-CLOSURE.md](E2E-CLOSURE.md) y
[A11Y-DYNAMIC.md](A11Y-DYNAMIC.md). TK-000016 y TK-000017 completaron por UI
flujo principal y rama N2; encuestas 5/5 emitidas por cierre real, reuso denegado.
Cinco perfiles, V-01–V-06, recuperación/descarte/aislamiento del borrador y
administración fueron observados con los límites detallados por sus autores.

QA final corrigió fechas nativas en roles/miembros/feriados con Controller y
DateInput; main anidados de categorías/calendarios/parámetros; shell de roles;
retorno/texto de Servicio; locale español Zod, categoría/CSAT y nombres de
categoría/prioridad. Formularios RHF/Zod afectados usan noValidate para que
los errores visibles provengan del esquema español, con asociaciones en
categorías/SLA y fechas. No se relajaron validación, permisos, SLA ni CSRF.

Revalidación real con CUA/IAB y cuentas ficticias, después de liberación:

| Caso | Resultado y límite |
|---|---|
| Roles a 360 px | Shell/navegación/logout, foco contenido-principal, un main; documento 345 px. |
| Categorías a 360 px | Un main; envío vacío enfocó Nombre y mostró error español asociado, sin crear categoría. El texto se hizo más claro después; no se repitió ese último texto por UI. |
| SLA escritorio | Nombre vacío mostró «Ingresá un nombre de prioridad» y foco/aria-describedby; Crítica repuesta en formulario, sin guardar. |
| Vigencia de rol escritorio | dd/mm/aaaa; 31/02/2026 invalid=true, mensaje español; valor original repuesto y edición cancelada, sin cambiar permisos. |
| Miembro/feriado escritorio | Desde 14/10/2026 y feriado bisiesto 29/02/2028 como texto dd/mm/aaaa, sin guardar. Un main en calendario; sin desborde global en medición 1280/1265 px. |
| Servicio a 360 px | Sistema disponible, explicación de API/conexiones y Abrir mesa de ayuda operable con Enter. |
| CSAT final a 360 px | Enviar vacío mostró «Seleccioná una calificación de 1 a 5», foco radio; ancho global 360. Espacio seleccionó 5 y Enter envió: agradecimiento y recibo 5/5 observados. |

TK-000018 se preparó por REST autenticado/CSRF: alta, asignación, atención,
resolución y cierre normales, sin SQL directo. Se identificó como fixture HTTP,
no como tercera repetición íntegra E2E por UI. La invitación se abrió desde Avisos
de Ana; token nunca guardado en documentos/archivos. Dos sesiones HTTP cerradas
en finally, jefe/Ana de navegador cerradas y viewport restablecido.

Durante compilación hubo error de consulta de sesión, recuperado con Reintentar,
y un reinicio Vite produjo página interna de error de conexión. La herramienta
impidió leer esa URL data; se abrió una pestaña nueva del mismo IAB en localhost,
sin desactivar política ni usar otro controlador. Cambio de cuenta con fill falló
una vez; entrada secuencial de teclado y Tab funcionó. No se demuestra un fallo
de autenticación del producto ni se borra el intento. E2E registró casos similares.
Screenshot CSAT fullPage falló; la captura de viewport siguiente funcionó.
check del radio sr-only no cambió selección; se verificó estado y usó Espacio.

Capturas ignoradas: .data/quality/finish/. roles-shell-360, categoria-error-es-360,
servicio-360, csat-error-es-360 y csat-recibo-360 corresponden a 360 px.
Vigencias, miembro, feriado y SLA se nombran con sufijo desktop para no atribuir
ancho móvil a la pestaña nueva, cuyo viewport inicial fue 1280 px.

## Seguridad y transferencia final

Overrides fijados: Handlebars 4.7.10 y ExcelJS→UUID 11.1.1. CommonJS/v4 y
plantilla normal probados, además de exports en integración existente.
Braces 3.0.3 no tiene versión corregida publicada: parche versionado de parser
y compile/expand/stringify limita profundidad a 64 niveles AST; diez pruebas
cubren entradas profundas, AST directo y patrones/rangos/escapado normales en
lint/codegen. Es mitigación local, no parche certificado del proveedor.

SCA final `pnpm audit --json`: **0 críticos, 0 moderados, 1 alto** Braces; salida
1 conservada, sin ignorar advisory. Fuente del aviso sin parche publicado:
[GHSA-vfj7-8cjw-p6xm](https://github.com/advisories/GHSA-vfj7-8cjw-p6xm).
El informe [SECURITY-CLOSURE.md](SECURITY-CLOSURE.md) conserva la medición previa.
DAST OWASP automatizado no ejecutado; no se certifica ausencia de vulnerabilidades.

CSP ahora se sirve en HTML de Vite dev/preview, con nonce aleatorio de 32 bytes
por documento, coincidente en scripts/meta y estilos HMR. GET /login dos veces:
200/200, nonces distintos, ningún placeholder ni unsafe-inline/unsafe-eval de
scripts. API /health 200 con default/base/frame/form restringidos y sin defaults
permisivos. No hubo errores CSP en los logs de navegador inspeccionados.
Excepción explícita style-src-attr unsafe-inline para geometría React/Recharts;
script-src-attr none. HMR solo websocket del host loopback, sin orígenes externos.
Built HTML necesita el servidor local que sustituye nonce; no abrirlo como archivo
estático ni presentar preview como despliegue. Preview no revalidado dinámicamente.
Diseño basado en [CSP de Vite](https://vite.dev/guide/features.html#content-security-policy).

Red repetida tras build final: 34 archivos y hashes correctos, salida 0.
Inicio/login: **148.248 bytes gzip / 4,734 s** a 256 Kbps; total HTML/JS/CSS:
**317.863 bytes / 10,562 s**. Tasa efectiva 250,53 Kbps inicial, 240,75 Kbps total.
SHA-256 index: f47ba3995c621654b2b54220376e955233ab0c21d7b831ee7bb36e3f1bf30150.
Mide cuerpos del build (incluye placeholder CSP), sin render/JS/JSON ni VPN.
El HTML servido sustituye nonce; este ensayo no mide su variación gzip aleatoria.

No se repitió k6/CPU tras estos ajustes: escenarios/consultas de lectura permanecen,
UUID afecta exportación no medida, CSP modifica cabeceras. El informe anterior
[NETWORK-RESOURCES.md](NETWORK-RESOURCES.md) conserva alcance y momento:
63 VUs, 3.216 solicitudes, p95 55,82 ms, 0 % errores; API pico 319,96 MiB,
1,10 % CPU host. Postgre compartido; sin certificación de servidor institucional.

## Reserva y cierre solicitado

El usuario pidió omitir nuevas pruebas y hacer commits, dejando revisión adicional
para mañana. Los cuatro controles y evidencia anteriores ya habían terminado;
no se ejecutan pruebas ni recorridos adicionales después de esa instrucción.
Quedan revisión completa de estados/red y pestañas del borrador, zoom real 200/400,
lector audible, otros navegadores institucionales, DAST y seguimiento del advisory.
Retención de 24 meses y archivo ejecutado no acreditados; [RETENTION.md](RETENTION.md)
describe conservación/procedimiento propuesto. RF-19 y activo de CU-01 conservan
alcance normativo; correo simulado e invitaciones CSAT en memoria son límites locales.

Avance funcional orientativo **99 %**, valoración de capacidades y cierre de fallos,
no fórmula de cobertura ni testcount. UAT de cinco participantes y Product Owner
siguen pendientes: [protocolo preparado](../manuals/aceptacion-usuarios.md), sin firmas.

Estado: COMPLETO CON LIMITACIÓN
