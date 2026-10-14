# Revisión visual real del prototipo local

Fecha: 14/10/2026, America/Managua; observaciones aproximadamente 00:59–01:16.
Resultado: revisión ejecutada con limitaciones; no constituye aceptación global.

## Método y alcance

Se utilizó cua_repl con el navegador integrado de Codex en
http://127.0.0.1:5173. Computer Use `@oai/sky` inicializó y listó aplicaciones;
el navegador integrado abrió correctamente. El error previo «failed to write
kernel assets ... path not found» no se reprodujo. No hubo bypass ni navegador
alternativo por comandos, inyección de estado, autenticación por API o Playwright
externo. Las evaluaciones de DOM fueron solo lectura: foco, tamaños y scroll.

Escritorio: viewport explícito 1280 × 800; móvil: 360 × 800. Las capturas fullPage
pueden tener 1264/344 px de ancho al excluir la barra vertical. El login inicial
usó el tamaño predeterminado; `login-desktop-final.jpg` corresponde al escritorio
explícito. Se restableció el viewport al terminar y se cerró la sesión.

Cuentas ficticias: `admin.emergencia` (JEFE_TI) y `ana.managua` (SOLICITANTE).
No se crearon tickets, adjuntos, usuarios, encuestas o cambios de estado; solo
login/logout, consultas, filtros y verificación de cadenas. No se enviaron correos.
No se ejecutaron pnpm test/check, migraciones ni recreación de helpdesk_test.

Fuentes consultadas: AGENTS.md; DOCX SPEC-TI-2026-002, especialmente 5.2–5.5;
ER_EMPROVISA_completo.puml; mockups P-01–P-12 y CLAUDE.md. El alcance local
prevalece sobre dominio/AD/correo real de las fuentes anteriores. La comparación
con mockups fue de estructura y contenido; no se hizo una comparación píxel a píxel
ni se certificó fidelidad completa. Las vistas implementadas son más simples que
P-02/P-04: cola común por alcance, sin el portal de tarjetas del mockup.

## Casos observados y evidencia

Capturas locales en `.data/quality/visual/`, excluidas de Git (git check-ignore
confirmó la exclusión). Los nombres siguientes permiten reproducir el informe;
las imágenes no están empaquetadas en el repositorio.

| Pantalla / ruta | Rol y caso comprobado | Escritorio / móvil |
|---|---|---|
| Login `/login` | Público, campos etiquetados, formulario y marca; login válido de ambos perfiles, logout | `login-desktop-final.jpg`, `login-mobile.jpg` |
| Cola `/tickets` | Jefe: 15 tickets; números TK, etiquetas SLA En plazo/Vencido/En pausa/Detenido y fechas dd/mm/aaaa | `cola-desktop.jpg`, `cola-mobile.jpg` |
| Alta `/tickets/nuevo` | Jefe: solicitante/tipo/categoría/activo/impacto/urgencia y prioridad P4; sin guardar | `alta-desktop.jpg`, `alta-mobile.jpg` |
| Ficha `/tickets/TK-000004` | Jefe: pausa, activo, plazos, bitácora, comentario público, nota interna, acciones y adjuntos vacíos | `ficha-desktop.jpg`, `ficha-mobile.jpg` |
| Inventario `/activos` | Jefe: tres activos, filtros y estados textuales; tabla con scroll local | `inventario-desktop.jpg`, `inventario-mobile.jpg` |
| Activo `/activos/EMP-CAM-0031` | Jefe: acta, custodio, historial y tickets vinculados; registro de serie no disponible | `activo-ficha-desktop.jpg`, `activo-ficha-mobile.jpg` |
| KB `/conocimientos` | Jefe: dos artículos y filtros; solicitante: búsqueda sin coincidencias | `kb-desktop.jpg`, `kb-mobile-data.jpg`, `kb-vacio-desktop.jpg` |
| Reportes `/reportes` | Jefe: filtros, indicadores, desglose y gráficos; exportaciones solo visibles, no descargadas | `reportes-desktop-data.jpg`, `reportes-mobile-data.jpg`; gráficos estabilizados: `reportes-graficos-desktop-final.jpg`, `reportes-graficos-mobile-final.jpg` |
| Avisos `/avisos` | Jefe: siete avisos y tareas simuladas; solicitante: 18 avisos, sin enlace CSAT utilizable | `avisos-desktop.jpg`, `avisos-mobile.jpg`, `solicitante-avisos-mobile.jpg` |
| Administración `/administracion/identidad` | Jefe: diez cuentas locales y controles; sin editar | `admin-desktop.jpg`, `admin-mobile.jpg` |
| Auditoría `/auditoria` | Jefe: eventos, filtro TK-000004 y resultado de ambas cadenas íntegras: 78/16 registros en ese instante | `auditoria-desktop.jpg`, `auditoria-mobile.jpg`, repetición `auditoria-mobile-final.jpg` |
| CSAT `/encuesta` sin token | Público: explicación de enlace inválido/vencido/respondido; formulario válido pendiente | `csat-sin-token-desktop.jpg`, `csat-sin-token-mobile.jpg` |
| Cola/ficha solicitante | Ana: navegación reducida y nueve tickets; TK-000004 conserva comentario público y no muestra la nota interna observada como jefe | `solicitante-cola-mobile.jpg`, `solicitante-ficha-mobile.jpg` |

No se probaron N1, N2 y AUDITOR en esta sesión. Las observaciones de visibilidad
no sustituyen las pruebas de permisos de API. No se probaron todos los subpaneles
administrativos, la nueva pantalla Prioridades y SLA ni Servicio.

## Teclado y estados realmente comprobados

- En alta, Tab desde Título movió el foco a Descripción, con contorno visible;
  apareció «El título debe tener al menos 10 caracteres» al perder foco vacío.
  No se completó el alta mediante teclado ni se guardó.
- En cola móvil de Ana, Tab desde Prioridad enfocó la región «Cola de tickets».
  ArrowRight cambió scrollLeft de 0 a 40. El contorno y la barra horizontal fueron
  visibles (`cola-mobile-teclado.jpg`). DOM: región 311 px, scrollWidth 850 px;
  innerWidth 360, scrollWidth de documento 345 en ese instante.
- Inventario móvil: región 327 px y scrollWidth 654; documento 360 px. Las
  columnas adicionales requieren desplazamiento local; no desbordan toda la página.
- En reportes, Tab desde Aplicar filtros enfocó Exportar PDF con contorno visible.
  Enter sobre «Consultar valores diarios» abrió la alternativa textual: 12/10/2026,
  ocho creados/dos resueltos; 13/10/2026, siete creados/un resuelto. El gráfico diario
  y barras se observaron tras estabilizar el cambio de viewport.
- Carga: captura real de esqueleto durante navegación KB (`kb-carga-mobile.jpg`).
  Datos: las pantallas descritas. Vacío: búsqueda sin coincidencias en KB después
  de recuperar API. Error: fallo real de consulta KB y carga de sesión
  (`kb-error-mobile.jpg`, `sesion-error-desktop.jpg`). Reintentar recuperó sesión
  y tablero. API health respondió DISPONIBLE durante el diagnóstico; no se
  determinó la causa del fallo transitorio y no se atribuye a una regla de negocio.

No se afirma que los cuatro estados fueron ejercitados en cada pantalla. Los
archivos `kb-error-mobile-segunda.jpg` y el esqueleto documentan estados reales,
no son evidencia del estado vacío/con datos. Algunas capturas de gráficos tomadas
inmediatamente tras resize muestran animación incompleta o panel vacío; las
capturas `reportes-graficos-*-final.jpg` son la referencia del gráfico estabilizado.

## Hallazgos para corrección o decisión de Aceptación

| ID | Importancia | Evidencia observada / causa y archivo a revisar |
|---|---|---|
| V-01 | Importante | Reportes y auditoría muestran `10/14/2026`/`09/14/2026` en campos nativos, pese al formato español del resto. `ReportFilters.tsx` y `AuditFilters.tsx` usan input type=date: el formato visible depende del navegador. Revisar una presentación que garantice dd/mm/aaaa, sin alterar el valor ISO enviado. |
| V-02 | Importante | Ficha muestra «Choose File / No file chosen». `tickets/components/attachments/TicketAttachments.tsx` deja visible el input file nativo en inglés de este navegador. Revisar control etiquetado en español manteniendo acceso con teclado. |
| V-03 | Importante | Historial de custodia a 360 divide «Custodio», «Desde», fechas y nombres en fragmentos; tabla cabe pero se lee mal. `assets/components/detail/AssetCustodyHistory.tsx`: tabla w-full sin ancho mínimo dentro de overflow-x-auto, combinada con overflow-wrap:anywhere global. Preferir ancho legible y scroll local. |
| V-04 | Importante | En `auditoria-mobile.jpg` y repetición `auditoria-mobile-final.jpg`, «Página 1 · 5 registros» llega al borde derecho y aparece cortado. `audit/components/AuditEvents.tsx`: paginación flex con wrap; revisar distribución/ancho del texto y las barras del viewport. No certificar resuelto solo por añadir flex-wrap. |
| V-05 | Menor | KB sin resultados y área vacía de Avisos muestran «No hay información disponible» sin explicar búsqueda/encuestas ni siguiente paso. `components/common/QueryBoundary.tsx` y consumidores knowledge-base/notifications: ofrecer contexto de vacío conforme sección 5.3 y P-11. |
| V-06 | Menor | Navegación y tarjeta de sesión del jefe ocupan casi la primera vista móvil (contenido después de ~650 px). `app/layouts/AppShell/AppShell.tsx` y SessionPanel: revisar acceso más rápido al contenido; coincide con propuesta de salto de accesibilidad. |

Los hallazgos no se corrigieron aquí por la propiedad exclusiva documental asignada.
Los archivos indicados son referencias de causa probable basadas en observación
y lectura focal, no un cambio propuesto ya validado. V-01/V-02 reflejan el navegador
de prueba; no se cambió idioma/configuración del sistema para ocultar el problema.

## Relación con cambios paralelos y límites de aceptación

`docs/coordination/closure-accessibility.md` se leyó al estar disponible y nuevamente
después de su marcador COMPLETO CON LIMITACIÓN. Foco/scroll de cola, alternativa de
gráficos y repetición móvil de auditoría son posteriores a ese marcador. Capturas
anteriores corresponden al checkout compartido mientras había ediciones/HMR.
El informe no certifica cambios posteriores; hay que repetir la revisión tras
integrar correcciones V-01–V-06. Se observó la aparición del enlace Prioridades y SLA
durante la revisión, pero no se certifica esa nueva pantalla.

Pendientes: CSAT con token válido, selección de calificación/envío/agradecimiento;
flujo completo crear/atender por teclado; zoom 200/400 %, lector de pantalla,
contraste medido dinámicamente, errores por campo de todos los formularios,
perfiles N1/N2/AUDITOR, subpaneles administrativos y todos los estados de cada vista.
La medición estática de contraste y semántica pertenece a ACCESSIBILITY.md.
No se fabricó un token CSAT ni se cerró un ticket para producirlo: los avisos de Ana
no ofrecieron enlace válido en el estado actual de la demostración.

Estado: COMPLETO CON LIMITACIÓN
