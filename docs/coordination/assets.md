# CMDB: integración de la sesión de activos

Propiedad limitada a assets API/web, contracts/assets.ts y assets-checks.ts. No se modifican archivos compartidos.

## Integración necesaria
- En contracts/index.ts (ya integrado por el padre): schemas `estadoActivoSchema`, `assetQuerySchema`, `assetParamsSchema`, `assetCreateSchema`, `assetSchema`, `assetListSchema`, `assetDetailSchema`, `assetCatalogSchema`; tipos `EstadoActivo`, `AssetQuery`, `AssetCreate`, `Asset`, `AssetList`, `AssetDetail`, `AssetCatalog` desde `./assets.js`.
- En app.ts registrar `registerAssetsRoutes(app, assets)` con servicio opcional `AssetsService`; en main.ts construir `createAssetsService(database)`.
- Rutas web lazy: `/activos` usa `loadAssetListPage()` → `AssetListPage`; `/activos/:codigoPatrimonial` usa `loadAssetDetailPage()` → `AssetDetailPage`. La alta vive en el listado. Navegación solo con `activo.ver`.
- En database.integration.test.ts llamar `assetsChecks(database, env)`; esta sesión NO ejecuta integración ni recrea helpdesk_test.
- El padre debe actualizar PROGRESS y DECISIONS. Contradicción: fuentes reales en docs/specs (DOCX), no docs/spec. P-06 muestra proveedor, valor, ubicación y SO ausentes del ER; se conservan los campos del ER. Estados del mockup se presentan como etiquetas de ACTIVO/MANTENIMIENTO/BAJA, coherentes con seed y selección de activos en tickets.
- Ficha incluye últimos 5 incidentes visibles. Consulta en assets-incidents.repository restringida mediante permisos `ticket.ver_*` incorporados por el padre (propios/sede/grupo/todos), asignación y membresía de grupo vigente. Sin importar repositorios de tickets ni exponer notas; mantiene las mismas reglas actuales de tickets.policies y tickets.repository. Si cambian estos permisos/reglas, revisar ambos módulos.

## Implementación
Listado paginado con búsqueda literal (código, serie, descripción, marca, modelo, custodio), filtros por sede/tipo/estado y orden por código. Ficha con fechas y custodia. Alta con acta, custodio opcional, garantía y validación de referencias. Activo, custodia y auditoría se insertan en una transacción. Alcance de sede derivado de grants BD y verificado en el service, además del permiso de ruta; auditor sin permiso de alta. Hashes auditados por trigger existente.

## Verificación
- Ejecutados: build/typecheck de contracts; typecheck de API y web; ESLint acotado a todos los archivos asignados; Vitest de assets.policies.test.ts (4 pruebas, todas pasan).
- Ejecutados también builds de API y web; Vite y size-limit pasan (154,39 KB gzip en el build observado, con rutas de tickets/activos ya integradas por el padre).
- Preparados 9 casos reutilizables en assetsChecks: sesión/solicitante, sede, auditor solo lectura, N2 y grupos, búsqueda literal, alta/cadena/duplicados, CSRF/validación/referencias, permiso del service y rollback ante fallo de auditoría.
- NO ejecutada integración; NO recreada helpdesk_test; NO ejecutado pnpm test global. El padre debe conectar assetsChecks y ejecutar los cuatro controles de calidad globales.
