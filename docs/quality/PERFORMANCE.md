# Rendimiento local — 14/10/2026

Resultado: todos los umbrales del escenario de lecturas pasaron. k6 2.3.0,
63 VUs máximos y 63 cuentas/sesiones distintas, cinco perfiles, sobre API local
127.0.0.1:3001 y helpdesk_test. Pools app/readonly 10/3. La base contiene seed,
casos de integración y 63 tickets ficticios añadidos para la carga.

| Indicador | Resultado | Umbral |
|---|---:|---:|
| Solicitudes y checks | 3.225 | Checks > 99 % |
| Checks correctos | 100 % | > 99 % |
| Errores HTTP | 0 % | < 1 % |
| p95 global | 47,69 ms | < 2.000 ms |
| Máximo global | 120,97 ms | Informativo |
| Promedio global | 20,55 ms | Informativo |
| Ritmo observado | 27,77 solicitudes/s | Informativo |
| Duración total | 116,14 s | Incluye rampas |

| Familia de lectura | p95 |
|---|---:|
| Cola de tickets, página de 20 | 56,79 ms |
| Ficha de ticket propio | 30,20 ms |
| Conocimientos | 20,94 ms |
| Activos | 18,14 ms |
| Tablero | 29,85 ms |
| Sesión | 14,99 ms |

Escenario: 15 s de subida, 90 s a 63 VUs, 10 s de bajada y pausa de 2 s entre
lecturas. Estado HTTP 200 y estructura de respuesta comprobados. Las rutas se
eligen según permiso del perfil; el tablero escribe evidencia real de consulta.
IP de loopback distinta por VU, rate limits activos y sin cabeceras de IP simuladas.
La preparación autentica mediante el service local y no se mide como login HTTP.

Los cuatro controles de calidad previos pasaron con 308 pruebas en 22 archivos y
build de 305,93 KB gzip. No se ejecutó integración durante la carga final. La API
aislada se detuvo; 63 sesiones de clientes y la sesión de preparación se revocaron,
y el archivo de cookies se eliminó. Resumen bruto local en .data/perf/summary.json,
ignorado por Git; este informe conserva solo agregados, sin credenciales ni cuerpos.

Alcance: evidencia de RNF-01 para este escenario de lecturas y este equipo local.
No demuestra capacidad de producción ni mide login bajo carga, exportaciones,
subidas, escrituras de tickets, pg-boss concurrente, accesibilidad o navegación.
El volumen futuro puede cambiar los resultados. Reproducción en
[ops/perf/README.md](../../ops/perf/README.md). D-025.
