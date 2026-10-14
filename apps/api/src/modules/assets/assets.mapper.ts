import { assetSchema } from '@helpdesk/contracts';
import type { AssetRow } from './assets.repository.js';

export function mapAsset(row: AssetRow) {
  return assetSchema.parse({
    idActivo: row.idActivo, codigoPatrimonial: row.codigoPatrimonial, descripcion: row.descripcion,
    marca: row.marca, modelo: row.modelo, numeroSerie: row.numeroSerie, estado: row.estado,
    actaNumero: row.actaNumero, fechaAdquisicion: row.fechaAdquisicion, garantiaHasta: row.garantiaHasta,
    sede: { idSede: row.idSede, nombre: row.sedeNombre },
    tipoActivo: { idTipoActivo: row.idTipoActivo, nombre: row.tipoNombre, familia: row.familia },
    custodio: row.idCustodio && row.custodioNombre && row.custodioSede ? {
      idUsuario: row.idCustodio, nombreCompleto: row.custodioNombre, idSede: row.custodioSede,
    } : null,
  });
}
