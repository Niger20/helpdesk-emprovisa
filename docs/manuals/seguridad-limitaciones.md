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

El cotejo visual del 14/10/2026 registra límites de localización y móvil:
campos de fecha nativos en reportes/auditoría pueden mostrarse mes/día/año,
selector de archivo nativo en inglés, custodia con texto fragmentado y paginación
de auditoría recortada a 360 px. Los vacíos de KB/avisos tienen mensaje genérico.
La pantalla CSAT se observó sin token; el flujo con enlace válido de la guía
de demo queda como procedimiento por ejecutar, no como prueba visual ya aprobada.
Consultá el informe visual y la aceptación final para correcciones posteriores.
Consultá [avance](../PROGRESS.md), [decisiones](../DECISIONS.md) e informes de
[calidad](../quality/) para resultados consolidados. Producción requiere otro alcance.
