import type { AssetCatalog } from '@helpdesk/contracts';
import { useAssetForm } from '../../hooks/useAssetForm';
import { AssetTextField } from './AssetTextField';
import { AssetOwnershipFields } from './AssetOwnershipFields';

interface Props { catalog: AssetCatalog; onCancel: () => void }
export function AssetForm({ catalog, onCancel }: Props) {
  const { form, submit, pending, error } = useAssetForm();
  return <section aria-labelledby="alta-activo" className="rounded-lg border border-border bg-card p-5">
    <h2 id="alta-activo" className="mb-1 text-xl font-semibold">Registrar activo</h2>
    <p className="mb-5 text-sm text-muted">Usá los datos del acta patrimonial F-ACT-01. Los campos con * son obligatorios.</p>
    <form onSubmit={(event) => { void submit(event); }} noValidate>
      <fieldset disabled={pending} className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <legend className="sr-only">Datos del activo y custodia</legend>
        <AssetTextField form={form} name="codigoPatrimonial" label="Código patrimonial" maxLength={20} required />
        <AssetTextField form={form} name="actaNumero" label="Acta F-ACT-01" maxLength={30} required />
        <AssetOwnershipFields form={form} catalog={catalog} />
        <AssetTextField form={form} name="marca" label="Marca" maxLength={50} />
        <AssetTextField form={form} name="modelo" label="Modelo" maxLength={80} />
        <AssetTextField form={form} name="numeroSerie" label="Número de serie" maxLength={60} />
        <AssetTextField form={form} name="fechaAdquisicion" label="Fecha de adquisición" date />
        <AssetTextField form={form} name="garantiaHasta" label="Garantía hasta" date />
        <label className="text-sm sm:col-span-2 lg:col-span-3" htmlFor="activo-descripcion">Descripción *
          <textarea id="activo-descripcion" className="mt-1 min-h-24 w-full rounded border border-input p-3" maxLength={4000} {...form.register('descripcion')}
            aria-invalid={Boolean(form.formState.errors.descripcion)} aria-describedby="error-descripcion" />
          <span id="error-descripcion" className="text-danger">{form.formState.errors.descripcion?.message}</span>
        </label>
      </fieldset>
      {error && <p role="alert" className="mt-4 rounded bg-danger-soft p-3 text-sm text-danger">{error}</p>}
      <div className="mt-5 flex flex-wrap gap-3"><button disabled={pending} type="submit" className="min-h-10 rounded bg-primary px-5 text-primary-foreground disabled:opacity-50">{pending ? 'Guardando…' : 'Registrar activo'}</button>
        <button disabled={pending} type="button" onClick={onCancel} className="min-h-10 rounded border border-input px-4">Cancelar</button></div>
    </form>
  </section>;
}
