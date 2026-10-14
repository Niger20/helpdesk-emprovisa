# Verificación dinámica de accesibilidad — 14/10/2026

Propiedad exclusiva: docs/quality/A11Y-DYNAMIC.md, este documento y capturas
locales en .data/quality/a11y-dynamic/. Sin código, commits, controles globales,
SQL/migraciones/recreación de BD ni mensajes a otros chats. Efectos UI propios
documentados abajo; no se editaron fuentes de aplicación.

Fuentes leídas: AGENTS.md, ACCESSIBILITY.md, VISUAL.md, ACCEPTANCE.md,
coordinaciones de cierre, texto OOXML de la especificación (RNF-05/5.4), ER,
mockups P-03/P-10 y componentes de shell, formularios, CSAT y reportes.
Skill computer-use y guías de runtime/confirmaciones leídas.

Plan: 360 px, teclado/foco/orden/errores/skiplink, zoom 200/400 %, categorías,
SLA, administración, alternativa textual de reportes y ratings CSAT. Medir
objetivos y contraste de estilos renderizados mediante APIs de navegador
permitidas. Lector de pantalla solo si la herramienta permite observación real;
semántica DOM no se presentará como prueba de anuncio audible.

Navegador tomado tras finish-e2e COMPLETO CON LIMITACIÓN y UI/drafts completos,
14/10/2026 ~01:53–01:58.
La pestaña E2E no existe en inventario de esta sesión: se abrió una pestaña
propia integrada en el mismo localhost. Login ana.managua correcto. CSAT real
TK-000017: flechas 1→5, salida Tab comentario/envío, foco 2 px, círculos 40×40,
labels ~51×80 a 360 px, respuesta 5/5 y recibo verificados. Token no persistido.

Hallazgo temprano para QA: alta sin categoría muestra «Too small: expected
number to be >0». Título/Descripción en español y foco al Título correctos;
los tres errores están asociados con aria-describedby/aria-invalid.
Revisar idCategoria del schema compartido con mensaje español, sin duplicarlo.
CSAT sin calificación reproduce el error inglés ya registrado por E2E.

Capacidades IAB: visibility/viewport; ninguna de zoom/lector. Control++ no
cambió innerWidth=360, DPR≈1, visualViewport.scale=1. Reflow 640/320 se prueba
separadamente, sin acreditar zoom 200/400 %. No lector audible ni WCAG total.

Archivos creados/cambiados: docs/quality/A11Y-DYNAMIC.md y este documento;
.data/quality/a11y-dynamic/*.png y measurements.json locales ignorados por Git
(check-ignore confirmado). Informe final contiene casos/roles/viewport/estado,
medidas y límites; no imágenes sensibles ni tokens en documentos/JSON.

Evidencia final: salto al main y foco tras rutas lazy; Tab en alta; radios CSAT;
región de cola con flecha; summary de reportes con Enter y texto diario completo;
reflow 320/360/640 en vistas enumeradas. Botones medidos ≥40×40; texto DOM opaco
muestreado contraste mínimo 6,47:1 en alta y 7,24:1 en administración/reportes.
Son estilos efectivos y dimensiones CSS, no prueba exhaustiva por píxeles.

Hallazgos adicionales QA: categorías/SLA required muestran «Please fill out
this field.»; usar validación española asociada a campo. Categorías tiene dos
main anidados (integración de UI ya pendiente). Detalles A-01–A-04 en informe.

Efectos reales: encuesta TK-000017 respondida 5/5; categoría «a» creada porque
una letra fue válida, luego renombrada «Prueba A11y 14/10/2026» y desactivada
por UI (guardado e Inactiva verificados). No eliminarla ni atribuirla a datos
ajenos. SLA vacío fue repuesto Crítica solo en formulario, sin guardar.

NAVEGADOR LIBERADO para Final QA: ambas sesiones cerradas, viewport reset,
pestaña propia 1 del IAB 2 en /login y markHandoff aplicado. Inventario está
aislado por chat, por lo que Final QA puede necesitar una pestaña propia.
No procesos propios, tests/check globales ni commits. No se tocaron README,
PROGRESS, DECISIONS, ACCEPTANCE ni fuentes ajenas. Final QA integra/corrige,
revalida y consolida porcentaje global; esta sesión no fabrica un porcentaje
de aceptación sobre casos parciales. Evidencia documental entregada 100 %;
zoom real y revisión humana con lector quedan como limitaciones explícitas.

Estado: COMPLETO CON LIMITACIÓN
