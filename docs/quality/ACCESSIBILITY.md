# Accesibilidad y uso móvil del prototipo

Revisión del 14/10/2026. Resultado parcial: correcciones estáticas aplicadas,
contrastes calculados y compilación verificada. No constituye certificación WCAG
ni aceptación dinámica de RNF-05. La revisión con navegador corresponde al chat
visual; esta sesión no utilizó navegador, CUA ni librerías de navegador.

## Alcance y fuentes

- AGENTS.md, apartados 7, 10 y 12: español, teclado, etiquetas, contraste 4,5:1,
  botones de al menos 40 px y ancho de 360 px.
- SPEC-TI-2026-002 v2.0 (DOCX), RNF-05 y sección 5.4, leídos por extracción OOXML.
- ER de núcleo de solicitudes, leído para conservar nombres y semántica del dominio.
- Mockups P-01, P-03, P-11 y P-12, leídos como referencia de formularios y estados.
- Revisión de fuentes TSX, tokens y CSS del frontend existente.

## Correcciones

- Foco visible común de 2 px con separación y anillo blanco para enlaces,
  botones, campos y regiones desplazables. Los radios visualmente ocultos de
  CSAT conservan su indicador visible mediante `peer-focus-visible`.
- Mínimos comunes de 40 × 40 px para botones, conservando los controles de 44 px.
- Campos con ancho máximo del contenedor y mínimo cero; texto largo puede
  dividirse, sin ocultar contenido ni desactivar el zoom.
- Cinco tablas con región nombrada, foco y desplazamiento horizontal local:
  tickets, usuarios, categorías, activos e historial de custodia. Las tablas
  conservan caption y encabezados `scope="col"`.
- Campos título, descripción, categoría y activo del nuevo ticket con etiqueta
  explícita y error asociado mediante `aria-describedby` y `aria-invalid`.
  El campo de activo ahora muestra también su error de validación.
- Paginación de identidad admite salto de línea.
- Gráficos de reportes: desactivada su capa de navegación cuando están ocultos
  mediante `aria-hidden`; se conservan los valores textuales por categoría y los
  valores diarios dentro de un `details` operable con teclado.

## Contraste calculado

Fórmula de luminancia relativa sRGB y cociente (L claro + 0,05)/(L oscuro + 0,05),
ejecutada con Node sobre los valores de `styles/tokens.css`.
Corresponde a colores opacos de texto y fondo; no mide antialiasing ni píxeles
renderizados. Los controles deshabilitados con opacidad no forman parte del cálculo.

| Texto / fondo | Relación |
|---|---:|
| foreground / card | 17,85:1 |
| foreground / background | 17,06:1 |
| muted / card | 7,58:1 |
| muted / background | 7,24:1 |
| primary / card | 15,39:1 |
| primary / background | 14,71:1 |
| primary-foreground / primary | 15,39:1 |
| danger / danger-soft | 5,91:1 |
| danger / card | 6,47:1 |
| danger / background | 6,18:1 |

Los estados de tickets, prioridades, SLA y comentarios internos se expresan con
texto en los componentes revisados. Los gráficos tienen alternativa textual.
Esto es evidencia estática, no comprobación con lector de pantalla.

## Verificación ejecutada

- ESLint focal sobre los diez TSX modificados: correcto, sin avisos.
- `pnpm --filter web typecheck`: correcto tras la última modificación.
- `pnpm --filter web exec vite build`: correcto; CSS generado 18,77 kB
  (4,32 kB gzip). Es compilación focal, no el control global `pnpm build`.
- Inspección automatizada del CSS compilado: presentes los mínimos de botones,
  foco, límites de campos y ajuste de texto. Una primera comparación literal
  falló por los espacios conservados en `calc`; se corrigió el verificador y pasó.
- No se ejecutaron `pnpm test`, `pnpm check`, pruebas de integración ni cambios
  de base. No se añadieron dependencias ni pruebas que dupliquen el CSS/JSX.

## Aceptación dinámica pendiente

En el chat visual o aceptación final, registrar navegador, ancho y evidencia:

1. A 360 px, iniciar sesión, recorrer navegación, cola, detalle y nuevo ticket;
   confirmar que solo las tablas desplazan horizontalmente dentro de su región.
2. Con Tab/Mayús+Tab, Enter, Espacio y flechas, crear y atender un ticket;
   comprobar foco visible, orden lógico, acceso a columnas y ausencia de trampas.
3. Enviar campos vacíos o inválidos; comprobar foco al primer error y anuncio
   correcto de las descripciones asociadas, además de reintento y mensajes de estado.
4. Probar CSAT con flechas y foco visible en las cinco opciones; comprobar
   reportes mediante su alternativa textual y el desplegable de valores diarios.
5. Repetir a 200 % de zoom, con títulos/comentarios largos y en las pantallas
   administrativas, verificando que controles y contenido no se superpongan.
6. Medir objetivos y contraste renderizado; recorrer carga, vacío, error y datos.

AppShell.tsx y router/routes.tsx no se modificaron por propiedad compartida.
Propuesta para su responsable: enlace «Saltar al contenido» al inicio del shell,
destino de contenido enfocable y gestión de foco/anuncio al cambiar ruta. El shell
actual usa un `main` que abarca cabecera y navegación; conviene limitar ese landmark
al contenido al implementar el enlace. Sigue pendiente, sin afirmar cumplimiento.
