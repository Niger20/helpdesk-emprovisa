# Accesibilidad dinámica del prototipo local

14/10/2026, America/Managua, aproximadamente 01:53–01:58. Resultado:
revisión parcial completada con limitaciones; no certificación WCAG ni aceptación
total de RNF-05. Esta sesión añadió evidencia real de teclado, reflow y estilos
renderizados a ACCESSIBILITY.md. E2E-CLOSURE.md conserva su propia autoría.

## Método y versión observada

Fuentes: AGENTS.md, SPEC-TI-2026-002 v2.0 (texto OOXML, RNF-05/5.4), ER,
mockups P-03/P-10/P-12 y guía, informes de aceptación/visual/accesibilidad y
coordinaciones. Skill computer-use y guías de runtime/confirmaciones leídas.
Se esperaron finish-ui, finish-drafts y finish-e2e completos con limitación.

CUA con navegador integrado contra http://127.0.0.1:5173. La pestaña que E2E
identificó no apareció en el inventario de este chat; se abrió una pestaña propia
del navegador integrado, después de la liberación. No se usaron bibliotecas de
navegador externas, API para autenticación, inyección de sesión ni estado privado.
Interacción UI y evaluaciones DOM de solo lectura mediante las APIs documentadas.
No se cambiaron configuración del sistema, idioma, conectores ni herramientas.

Cuentas ficticias: ana.managua (SOLICITANTE) y admin.emergencia (JEFE_TI).
Ambos accesos de esta sesión funcionaron al primer intento. Viewports explícitos
360×800, 320×800 y 640×800, DPR aproximadamente 1. Los anchos de captura pueden
excluir la barra vertical. Se observó la entrega UI anterior a las reparaciones
posteriores de Final QA; esta revisión no acredita cambios futuros.

Capturas y medidas locales ignoradas por Git: .data/quality/a11y-dynamic/.
git check-ignore confirmó measurements.json. No tokens, passwords ni cookies
en los documentos o JSON de medidas. El token CSAT fue usado exclusivamente
desde la invitación UI, sin persistirlo como artefacto.

## Casos observados

| Caso / perfil | Observación real | Evidencia local |
|---|---|---|
| CSAT TK-000017 / público desde Ana | Enviar sin rating mostró error y enfocó radio 1. Espacio seleccionó 1; cuatro ArrowRight comprobaron checked/focus 2,3,4,5. Tab salió a comentario y después envío. Enter envió 5/5; recibo confirmó el registro. | csat-foco-360.png, csat-recibo-360.png |
| CSAT 360/320 | Cinco opciones etiquetadas 1 de 5 a 5 de 5; foco visual en círculo seleccionado. A 320 «Excelente» se divide, pero permanece visible. | csat-reflow-320.png |
| Shell / Ana y jefe | Enter en Saltar al contenido enfocó main#contenido-principal y llevó el contenido a la vista. Cambio de ruta terminó con foco en ese main, incluidas alta y administración lazy tras completar carga. | admin-salto-360.png y medidas |
| Alta / Ana | Enter en Registrar vacío enfocó Título; tres campos invalid=true asociados a su error. Tab recorrió Descripción, Impacto, Urgencia, Categoría, Activo, Registrar y salió del formulario. Contorno 2 px en los seis controles observados. | alta-errores-360.png |
| Cola / jefe | Región Cola de tickets enfocada, outline 2 px, clientWidth 311 y scrollWidth 850. ArrowRight produjo scrollLeft >0 (4,67 px leído durante movimiento). Tabla desplazable local, sin ocultar columnas. | cola-region-foco-360.png |
| Nueva categoría / jefe | Campo vacío requerido recibe foco. Nombre de una letra fue válido: se creó «a», luego se renombró por UI a «Prueba A11y 14/10/2026» y desactivó; UI confirmó guardado/Inactiva. No se borró registro ni historia. | categoria-error-360.png, categoria-prueba-inactiva.png |
| SLA / jefe | Nombre P1 vacío recibe foco; se repuso Crítica en el formulario sin guardar. Matriz y plazos se leen como texto y listas de definición. | sla-error-nativo-360.png, sla-360.png |
| Reportes / jefe | Enter abrió Consultar valores diarios; summary conservó outline 2 px. Texto: 12/10 ocho creados/dos resueltos, 13/10 siete/uno, 14/10 dos/dos. Categorías tienen lista textual y desglose. Los tabindex observados dentro de gráficos ocultos eran -1. | reportes-texto-foco-360.png |
| Identidad / jefe | Usuarios con nombres/estados textuales, tabla/región nombradas y navegación disponible; salto enfoca main. No edición de usuarios, roles ni grupos. | admin-salto-360.png |

El primer selector por rol button para el summary no encontró coincidencia en
Playwright, aunque AX lo mostraba como botón. Se leyó DOM actual y se operó por
texto visible; Enter abrió details. Es una diferencia entre representaciones de
la herramienta, no un fallo demostrado del control.

## Reflow y objetivos

Medición DOM de documentElement.scrollWidth, en píxeles CSS. No hubo desborde
horizontal global en estas mediciones; las tablas conservan su scroll local.

| Vista | 360 px | 320 px | 640 px |
|---|---:|---:|---:|
| Cola Ana | 345 | No medido | No medido |
| Alta Ana | 360 | 305 | 625 |
| Categorías | 345 | 305 | No medido |
| SLA | 345 | 305 | No medido |
| Reportes | 345 | 305 | 625 |
| Identidad | 345 | No medido | No medido |
| CSAT | 345 | 305 | No medido |

Capturas alta-reflow-320/640.png, categoria-reflow-320.png,
sla-reflow-320.png y reportes-reflow-320/640.png conservan el contenido observado.
La inspección de reportes a 320 mostró valores y desplegable legibles, sin
superposición en el fragmento inspeccionado. No se afirma una inspección visual
exhaustiva de todos los píxeles de cada captura larga.

Todos los botones DOM medidos de cola (3), alta (3), categorías (12), SLA (5),
reportes (4) e identidad (16) tenían ancho/alto ≥40 px. Algunos están deshabilitados
y se registran como tales; el mínimo común observado fue 40×40. CSAT: círculos
40×40, labels clicables ~51,06×80 a 360, envío alto 44 px. Esto no mide todos los
enlaces, iconos, checkboxes ni objetivos del sistema.

## Contraste de estilos renderizados

getComputedStyle sobre texto p/label/legend/headings/button/a/summary/li/dt/dd/span
con caja visible y opacidad propia 1; fondo opaco más cercano por ancestros,
con blanco como fondo raíz. Cálculo sRGB (Lmayor+0,05)/(Lmenor+0,05).
Son estilos efectivos del DOM renderizado, no lectura de tokens ni muestreo de
píxeles antialias. Se omiten SVG, valores de inputs y placeholders; el muestreo
no resuelve gradientes, superposiciones o opacidad heredada compleja. No había
esas condiciones en los ejemplos de texto citados.

| Muestra | Relación |
|---|---:|
| Texto blanco / primary renderizado (shell y rating 5) | 15,39:1 |
| Foreground / card (navegación) | 17,85:1 |
| Foreground / background | 17,06:1 |
| Muted / card | 7,58:1 |
| Muted / background | 7,24:1 |
| Error de alta danger / card | 6,47:1 |

Mínimos de muestras DOM: cola 7,58; alta 6,47; categorías/SLA/reportes/identidad
7,24. Cumplen 4,5:1 en las combinaciones muestreadas. El primer muestreador CSAT
filtró todos los nodos por childElementCount y devolvió lista vacía: no se usa
como prueba de contraste. Se corrigió ese filtro para las vistas posteriores;
CSAT conserva la medida directa del círculo seleccionado (blanco/primary).

## Hallazgos para Final QA

| ID | Evidencia y corrección a revisar |
|---|---|
| A-01 | Alta vacía muestra «Too small: expected number to be >0» en Categoría. packages/contracts: definir mensaje español en idCategoria del schema compartido; revalidar alta sin categoría. Título/Descripción sí están en español y asociados. |
| A-02 | CSAT sin rating muestra «Invalid input: expected number, received undefined»; coincide con E2E. Corregir mensaje español del schema compartido. Foco al primer radio y role=alert presentes; anuncio audible no probado. |
| A-03 | Categorías y SLA vacíos muestran tooltip nativo «Please fill out this field.» en este navegador. CategoryForm.tsx/SlaPriorityForm.tsx dependen de required; implementar validación y mensajes españoles accesibles, conservando foco y reglas Zod. No cambiar idioma del OS para ocultarlo. |
| A-04 | DOM de categorías tiene dos main anidados. Coincide con integración pendiente de finish-ui; corregir wrapper de página y repetir conteo. Categorías 2; cola/alta/SLA/reportes/identidad 1 en esta revisión. |

SLA aria-describedby apunta a sla-P1-help; el tooltip nativo recibe foco pero
no demuestra anuncio del error Zod asociado. Categorías no asocia errores de
campo específicos en la implementación revisada; la validación requerida nativa
no permite certificar esa asociación. Son límites concretos para la corrección.

## Límites y cierre

IAB anuncia únicamente visibility/viewport como capacidades de navegador. No hay
API de zoom o lector de pantalla; apps nativas deshabilitadas/inventario vacío.
Se intentó Control++ en CSAT y se observaron los mismos innerWidth=360,
devicePixelRatio≈1 y visualViewport.scale=1; Control+0 cerró el intento. No se
acredita zoom 200/400 %. Los viewports 640/320 comprueban reflow separado, sin
presentarlos como zoom equivalente. No se instaló ni activó un lector mediante OS.

No hay prueba audible de errores, status, foco de ruta o semántica de tablas;
requiere revisión humana con lector real y zoom. No se certifican WCAG total,
todos los estados de cada pantalla, todo recorrido con Mayús+Tab, los perfiles
N1/N2/AUDITOR en esta sesión ni el flujo completo de atención (véase E2E).
Se observaron carga/datos y errores de formularios; no todos los vacíos/errores
de consulta. No se ejecutaron pnpm test/check ni commits o recreación de BD.

Efectos UI reales: respuesta 5/5 a CSAT TK-000017; categoría propia ficticia
creada, renombrada y dejada Inactiva. No hubo edición de SLA persistida, usuarios,
permisos ni tickets. Logout de ambas cuentas realizado. Viewport restablecido,
pestaña en /login y markHandoff aplicado. Navegador liberado para Final QA;
las pestañas se aíslan por chat, por lo que puede necesitar una propia.

Estado: COMPLETO CON LIMITACIÓN
