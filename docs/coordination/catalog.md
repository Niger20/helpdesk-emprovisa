# Categorías administrativas — 14/10/2026

Fuentes: RF-19/E-04 en SPEC-TI-2026-002, ER categorias y P-09.
Contratos catalog.ts, módulo catalog con domain/category-tree, feature catalog,
helper catalogChecks y seis pruebas puras de jerarquía. Integración runtime y ruta
lazy /administracion/categorias con parametro.administrar global.

Sin borrado ni tabla/columna nueva. Edición con referencia anterior y transacción
serializada; grupos activos, árboles sin ciclos, padres activos y protección del
tipo/requisito de activo cuando hay tickets. Lectura compartida de categoría en
alta portal/correo. Auditoría encadenada dentro de la misma transacción.

Ocho casos de integración, junto con conocimientos: pnpm check verde, 282 pruebas
en 21 archivos y 295,11 KB gzip. Prueba HTTP sobre helpdesk confirmó categoría
administrable, artículo, voto idempotente, vínculo y ambas cadenas íntegras.
Calendarios, feriados, parámetros y matriz/plazos quedan para otra fase. D-021.
