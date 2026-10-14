# Cierre de red y recursos — 14/10/2026

Estado inicial: EN CURSO

Propiedad: ops/perf/**, utilidades de rendimiento aisladas y
docs/quality/NETWORK-RESOURCES.md. Sin commits ni controles globales.
QA final debe esperar el marcador COMPLETO antes recrear helpdesk_test.
Se medirá API aislada 3001/helpdesk_test sin recrear esquemas, y descarga
HTTP de frontend compilado a 256 Kbps. Esperando marcadores UI/borrador
para tomar el build final. Navegador no utilizado.

Carga/recursos terminados: k6 salida 0, 3.216 solicitudes, checks 100 %, p95
55,82 ms. 42 muestras durante 140,07 s, CPU/memoria API y contenedor Postgre.
Informe parcial en NETWORK-RESOURCES.md. API propia detenida, 63 sesiones
cliente y sesiones de preparación revocadas mediante limpieza existente;
sessions.json eliminado; puerto 3001 sin listener. No hay prueba global activa.
Pendiente exclusivamente build/red cuando UI y borrador liberen sus archivos.
QA aún debe esperar este marcador final antes recrear helpdesk_test.

## Entrega final

Archivos modificados/creados por esta sesión:

- ops/perf/README.md: reproducción y límites de transferencia/recursos.
- ops/perf/network-transfer.mjs: servidor HTTP efímero gzip limitado y cliente
  real, verifica contenido SHA-256 por archivo, sin navegador.
- ops/perf/sample-resources.ps1: CPU/memoria del proceso que escucha 3001 y
  docker stats del contenedor Postgre existente, intervalos reales y hardware.
- docs/quality/NETWORK-RESOURCES.md: medición fechada y límites.
- docs/coordination/finish-performance.md: esta coordinación.

No se modificó perf-runner.ts ni read-workload.js, ni PERFORMANCE.md histórico.
Esperados y leídos UI/borrador COMPLETO CON LIMITACIÓN antes compilar web.
Build focal `pnpm --filter web build` salida 0: 312,33 kB JS gzip / límite 499 kB.
Descarga `pnpm exec node ops/perf/network-transfer.mjs` salida 0, 35 hashes
correctos; inicio/login 148.129 bytes en 4,755 s; todo HTML/JS/CSS 317.482 bytes
en 10,638 s; tasa efectiva total 238,75 Kbps, máximo por archivo 255,57 Kbps.
Detalles y hash del build en NETWORK-RESOURCES.md. Los resúmenes brutos nuevos
quedan ignorados en .data/perf; ningún token, cookie o credencial versionado.

ESLint focal y sintaxis Node/PowerShell aprobados. k6 oficial 2.3.0 salida 0 y
todos los umbrales aprobados; medición CPU/mem ejecutada realmente. No se
ejecutaron pruebas globales, recreación de esquemas ni commits. Procesos propios
detenidos, servidor de red cerrado, sesiones/cookies de carga limpiadas.
QA puede usar helpdesk_test después de esta entrega; esta sesión ya no la usa.

Límites: CPU Postgre compartida; máximos muestreados, no instantáneos; sin
navegación/pintura/latencia VPN/JSON API en el ensayo de red; sin servidor real.
Final QA debe repetir build/red si altera archivos web posteriores al build
registrado. Trabajo asignado implementado y medido al 100 %; no porcentaje
global de aceptación ni firma humana. No browser, servicios reales o deploy.

Estado: COMPLETO CON LIMITACIÓN
