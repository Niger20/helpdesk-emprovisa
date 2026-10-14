# Transferencia y recursos locales — 14/10/2026

Medición de RNF-07/RNF-09 en el prototipo local. Conserva el informe histórico
[PERFORMANCE.md](PERFORMANCE.md); no lo reemplaza. No acredita servidor
institucional, VPN ni aceptación humana. Sin hardware o servicios nuevos.

## CPU y memoria bajo carga real

API aislada 127.0.0.1:3001, helpdesk_test existente, pools 10/3, 63 cuentas y
sesiones de cinco perfiles. k6 oficial 2.3.0, mismo escenario de lecturas y
rate limits activos: 15 s de subida, 90 s con 63 VUs, 10 s de bajada, pausa
de 2 s entre lecturas. No se recrearon esquemas ni ejecutaron controles globales.

| Indicador k6 | Resultado |
|---|---:|
| Solicitudes / checks correctos | 3.216 / 100 % |
| Errores HTTP | 0 % |
| p95 / máximo HTTP | 55,82 / 152,05 ms |
| Promedio HTTP | 24,51 ms |
| Duración de carga / ritmo | 116,47 s / 27,61 solicitudes/s |
| Umbrales globales y por familia | Todos aprobados, salida k6 0 |

Host: AMD Ryzen 9 7940HS, 16 procesadores lógicos, 16.335.966.208 bytes de RAM
(15,21 GiB), Windows NT 10.0.26200. PostgreSQL 18.1-alpine en el contenedor
existente Postgre. No se registraron credenciales, cuerpos, cookies o tokens.

Se muestreó el proceso Node que escuchaba 3001, después de preparar las cuentas,
durante 140,07 s: 42 muestras, intervalos reales 2,04–3,66 s (media 3,30 s).
Comenzó aproximadamente 10 s antes de k6 e incluyó reposo posterior. CPU de API
calculada a partir de diferencias de tiempo CPU acumulado entre muestras; la
escala del host divide entre sus 16 procesadores lógicos. Promedios de tabla son
medias de muestras, no integrales ponderadas. MiB = 1.048.576 bytes.

| Recurso muestreado | Mínimo | Promedio | Pico |
|---|---:|---:|---:|
| CPU API, escala del host | 0 % | 0,59 % | 1,10 % |
| CPU API, escala de un núcleo | 0 % | 9,37 % | 17,57 % |
| Memoria residente API | 121,53 MiB | 258,57 MiB | 319,96 MiB |
| Memoria privada API | 127,90 MiB | 288,06 MiB | 352,62 MiB |
| CPU contenedor Postgre, escala Docker de un núcleo | 0,33 % | 26,98 % | 58,12 % |
| Memoria contenedor Postgre, reportada por Docker | 78,73 MiB | 113,44 MiB | 126,70 MiB |

Reposo inicial API: 121,53 MiB y 0 % de CPU en las primeras dos muestras.
Postgre inicial: 79,07–79,14 MiB. API al final del muestreo: 309,27 MiB;
el aumento de memoria durante esta corrida no demuestra una fuga ni su ausencia.
No incluye el wrapper tsx, procesos Vite/k6 ni todo el consumo de Windows/WSL.
PostgreSQL es compartido con la API de demostración en helpdesk y otras sesiones:
su consumo no puede atribuirse exclusivamente al benchmark. Docker stats tiene
su propia ventana de CPU y el comando agrega latencia al intervalo del muestreo.
Los picos son muestras, no máximos instantáneos absolutos. La especificación no
fija un umbral local de CPU/RAM; no se extrapolan estos valores al servidor real.

Resumen bruto nuevo: `.data/perf/summary-2026-10-14-resources.json`; muestras:
`.data/perf/resources.json`, ambos ignorados por Git. La API fue detenida mediante
Stop-Process sobre su PID propio porque stdin del runner estaba cerrado. Se
ejecutó la utilidad existente de limpieza: 63 sesiones cliente revocadas y todas
las sesiones de preparación Fixtures k6 pendientes revocadas en helpdesk_test;
archivo sessions.json eliminado. Puerto 3001 sin listener después de limpiar.
El código de salida del wrapper tras esa detención fue 4294967295; la carga k6
ya había terminado con código 0. No se borró historia de auditoría ni cuentas.

## Transferencia a 256 Kbps

Medición realizada a las 01:37:35 America/Managua, después de los marcadores
COMPLETO CON LIMITACIÓN de UI y borrador, y del build focal web aprobado.
Node 24.21.0, Vite 8.3.4; size-limit aprobó 312,33 kB JS gzip frente a 499 kB.
Esto es build focal, no los cuatro controles globales reservados a Final QA.

| Transferencia real de cuerpos gzip | Archivos | Bytes | Tiempo | Tasa efectiva |
|---|---:|---:|---:|---:|
| Inicio y login con dependencias | 6 | 148.129 | 4,755 s | 249,22 Kbps |
| Archivos restantes lazy, una copia de cada uno | 29 | 169.353 | 5,883 s | 230,28 Kbps |
| HTML + todos los JS/CSS del build | 35 | 317.482 | 10,638 s | 238,75 Kbps |

La página inicial y hasta el inventario completo medido están por debajo de
500.000 bytes gzip. No hay umbral normativo de segundos para descarga a 256 Kbps;
no se compara este tiempo de descarga con p95 de respuestas API de RNF-01.
La diferencia frente a size-limit procede del inventario/compresión distintos:
esta medición usa gzip real de Node por archivo e incluye HTML y CSS.

| Archivo inicial | Bytes gzip | Recepción |
|---|---:|---:|
| index.html | 328 | 41,10 ms |
| index-DapzDQpa.js | 84.180 | 2.659,02 ms |
| http-cy8ApOa7.js | 42.936 | 1.344,00 ms |
| index-C2fmSMLU.css | 4.332 | 154,70 ms |
| LoginPage-CAJ5iqj4.js | 1.323 | 61,39 ms |
| zod-DCMUnLNp.js | 15.030 | 494,70 ms |

Utilidad `ops/perf/network-transfer.mjs`: servidor HTTP local efímero con respuestas gzip,
presupuesto de cuerpo 32.000 bytes/s (256.000 bits/s), escrituras cada 25 ms y
cliente que mide recepción real. Comprueba SHA-256 del contenido descomprimido
contra cada archivo original. No usa un sleep como sustituto de una descarga.
35 comprobaciones SHA-256 correctas, salida 0. Tasa por archivo 35,45–255,57
Kbps: los archivos pequeños pagan una ventana mínima de envío; ninguna tasa
observada excedió 256 Kbps. Descargas secuenciales con el mismo presupuesto.
El servidor se cerró al terminar. Resumen por archivo y hashes locales:
`.data/perf/network-transfer.json`, ignorado por Git.
SHA-256 de index.html de este build:
`4fedea54209d784688d4a5db990187b6f57d9286cd06ee6c7f0ac1182c160da9`.

La fase inicial incluye HTML, CSS, scripts del bootstrap y chunk LoginPage con
dependencias estáticas. La fase lazy descarga todos los archivos restantes una
vez, como inventario conservador del build; no equivale al costo de cada ruta.
No mide navegación, ejecución JS, pintura, interacción, latencia de una VPN,
transferencias de JSON de la API ni caché de navegador. Cabeceras HTTP quedan
fuera del limitador. El servidor solo escucha loopback y se cierra en finally.

Validación de utilidades: ESLint focal de network-transfer.mjs, sintaxis Node y
parser PowerShell correctos; ambas utilidades además fueron ejecutadas realmente.
No se ejecutaron pnpm test/check ni commits. Final QA debe cotejar estos hashes
y repetir build/red si introduce cambios web posteriores. Las pruebas de UI,
accesibilidad y aceptación humana pertenecen a sus sesiones; estos resultados
no las sustituyen. RNF-09 conserva la reserva de infraestructura institucional.

Reproducción: [ops/perf/README.md](../../ops/perf/README.md).
