import type { UseFormReturn } from 'react-hook-form';
import { estadoActivoSchema } from '@helpdesk/contracts';
import type { AssetCatalog, AssetCreate } from '@helpdesk/contracts';
import { assetStateLabels } from '../../lib/format';

interface Props { form: UseFormReturn<AssetCreate>; catalog: AssetCatalog }
export function AssetOwnershipFields({ form, catalog }: Props) {
  const className = 'mt-1 min-h-10 w-full rounded border border-input bg-card px-3';
  const errors = form.formState.errors;
  return <>
    <label className="text-sm" htmlFor="activo-tipo">Tipo de activo *<select id="activo-tipo" className={className} {...form.register('idTipoActivo', { valueAsNumber: true })} aria-invalid={Boolean(errors.idTipoActivo)} aria-describedby="error-tipo">
      <option value="0">Seleccioná un tipo</option>{catalog.tiposActivo.map((tipo) => <option key={tipo.idTipoActivo} value={tipo.idTipoActivo}>{tipo.nombre}</option>)}</select>
      <span id="error-tipo" className="text-danger">{errors.idTipoActivo?.message}</span></label>
    <label className="text-sm" htmlFor="activo-sede">Sede *<select id="activo-sede" className={className} {...form.register('idSede', { valueAsNumber: true })} aria-invalid={Boolean(errors.idSede)} aria-describedby="error-sede">
      <option value="0">Seleccioná una sede</option>{catalog.sedes.map((sede) => <option key={sede.idSede} value={sede.idSede}>{sede.nombre}</option>)}</select>
      <span id="error-sede" className="text-danger">{errors.idSede?.message}</span></label>
    <label className="text-sm" htmlFor="activo-custodio">Custodio<select id="activo-custodio" className={className} {...form.register('idCustodio', { setValueAs: (value: string) => value ? Number(value) : null })} aria-invalid={Boolean(errors.idCustodio)} aria-describedby="error-custodio">
      <option value="">Sin custodio</option>{catalog.custodios.map((custodio) => <option key={custodio.idUsuario} value={custodio.idUsuario}>{custodio.nombreCompleto}</option>)}</select>
      <span id="error-custodio" className="text-danger">{errors.idCustodio?.message}</span></label>
    <label className="text-sm" htmlFor="activo-estado">Estado *<select id="activo-estado" className={className} {...form.register('estado')}>
      {estadoActivoSchema.options.map((estado) => <option key={estado} value={estado}>{assetStateLabels[estado]}</option>)}</select></label>
  </>;
}
