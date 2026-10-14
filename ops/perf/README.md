# Carga local con k6

Escenario RNF-01: 63 cuentas y sesiones diferentes, cinco perfiles de demostración,
un ticket ficticio por cuenta y pools app/readonly de 10/3. API en el host, puerto
3001, exclusivamente helpdesk_test. No altera helpdesk ni otras bases. El runner
requiere migraciones y seed ya instaladas por `pnpm check`; no recrea esquemas.
No ejecutar los controles de integración mientras la API de carga esté corriendo.

1. Ejecutar `pnpm check` con PostgreSQL disponible.
2. En otra terminal, `pnpm --filter api perf:serve` y esperar el mensaje de API lista.
3. Desde la raíz, ejecutar `k6 run --no-usage-report --local-ips 127.0.0.2-127.0.0.64 ops/perf/read-workload.js`.
4. Detener el runner al terminar; la próxima integración recrea helpdesk_test.

Usar k6 2.3.0. Binario local y checksum verificado fuera de Git; instalación según
[Grafana](https://grafana.com/docs/k6/latest/set-up/install-k6/). No se necesita
Grafana Cloud. Las IP de loopback corresponden a clientes virtuales distintos;
se conservan rate limits, permisos, sesiones, auditoría y seguridad del servidor.
`--local-ips` se pasa por CLI; el runner valida puerto/base de pruebas fijos.

Las sesiones se preparan mediante el service de login local, con Argon2 e intentos
registrados; esa preparación queda fuera de la medición HTTP. Cookies solo en
.data/perf/sessions.json, ignorado por Git: nunca adjuntarlo ni publicarlo. No se
incluyen cuerpos, cabeceras ni tokens en el resumen. NODE_ENV=test evita logs de
tráfico y satisface la restricción de helpdesk_test; se conservan plugins y límites.
No se inician jobs automáticos en esta API aislada.

Subida de 15 s hasta 63 VUs, mantenimiento de 90 s y bajada de 10 s; pausa de 2 s
por lectura. Rutas: cola paginada de 20, ficha del caso propio, conocimientos,
activos para técnicos/auditoría, tablero para jefatura/auditoría y sesión. Tablero
registra su consulta real en auditoría. Se comprueba estado 200 y estructura útil.
Umbral global y por ruta p95 < 2000 ms, errores HTTP < 1 % y checks > 99 %.

El resumen bruto queda en .data/perf/summary.json y el informe sanitizado en
docs/quality/PERFORMANCE.md. Es una medición del equipo y conjunto ficticio local:
no certifica producción, navegación visual, login bajo carga, exportaciones,
subidas, escrituras de tickets ni funcionamiento concurrente de jobs.
