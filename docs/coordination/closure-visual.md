# Cierre de revisión visual

Fecha: 14/10/2026. Revisión real en navegador integrado de Codex, contra
http://127.0.0.1:5173. Sin subagentes, commits, controles globales ni edición de código.

## Archivos de esta sesión

- docs/quality/VISUAL.md (informe, casos, hallazgos y límites).
- docs/coordination/closure-visual.md (coordinación).
- .data/quality/visual/*.jpg (capturas locales, fuera de Git).

## Avance para consolidación

Computer Use @oai/sky inicializó y listó aplicaciones; cua_repl abrió el navegador
integrado sin repetir el fallo anterior de kernel assets. Se observaron login,
cola, alta, ficha, inventario, KB, reportes, avisos, administración y auditoría
en escritorio y 360 px. CSAT: solo estado sin token; no hay enlace válido en los
avisos existentes de Ana. Se verificaron foco con Tab, validación de título,
desplazamiento horizontal de tabla con flecha derecha y recuperación con Reintentar.

Hallazgos para Aceptación (sin tocar archivos ajenos): fechas nativas mes/día/año
en filtros de reportes/auditoría; selector de archivo nativo en inglés; custodia
móvil con palabras y fechas fragmentadas; paginación de auditoría recortada a
360 px; mensaje vacío genérico en KB y avisos. Detalle y causas en VISUAL.md.

El informe de accesibilidad está disponible y marcado completo con limitación.
La prueba final de foco/scroll de cola es posterior a ese marcador. No se
certifican cambios posteriores a las capturas ni la aceptación global del proyecto.

La evidencia incluye alternativa textual de gráfico abierta con Enter y captura
de gráfico estabilizado, vacío real de KB, errores/reintento y comparación de nota
interna jefe/solicitante. El recorrido de teclado sigue siendo parcial; no hay
certificación de zoom, lector de pantalla, CSAT válido ni los tres roles restantes.

Se repitió auditoría móvil tras ver flex-wrap en AuditEvents; el texto de página
sigue llegando/cortándose al borde derecho en la captura final. No marcar V-04
resuelto por lectura de código. Las capturas previas y finales están identificadas.
La nueva pantalla SLA no fue revisada; solo se observó su enlace durante HMR.

Validación documental: evidencia local excluida mediante git check-ignore. No
lint/typecheck/test/build en esta sesión; los cuatro controles quedan a Aceptación.
No se tocaron PROGRESS, DECISIONS, closure global ni código. Consolidar V-01–V-06
y pendientes de VISUAL.md. Usuario puede revisar capturas locales; no se
incorporan imágenes ni datos sensibles a Git.

Estado: COMPLETO CON LIMITACIÓN
