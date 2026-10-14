import type { UseFormReturn } from 'react-hook-form';
import type { AssetCreate } from '@helpdesk/contracts';

type Field = 'codigoPatrimonial' | 'marca' | 'modelo' | 'numeroSerie' | 'actaNumero' | 'fechaAdquisicion' | 'garantiaHasta';
interface Props { form: UseFormReturn<AssetCreate>; name: Field; label: string; maxLength?: number; required?: boolean; date?: boolean }
export function AssetTextField({ form, name, label, maxLength, required = false, date = false }: Props) {
  const error = form.formState.errors[name]?.message;
  return <label className="text-sm" htmlFor={`activo-${name}`}>{label}{required ? ' *' : ''}
    <input id={`activo-${name}`} type={date ? 'date' : 'text'} maxLength={maxLength} required={required}
      className="mt-1 min-h-10 w-full rounded border border-input bg-card px-3" aria-invalid={Boolean(error)} aria-describedby={error ? `error-${name}` : undefined}
      {...form.register(name, { setValueAs: (value: string) => value === '' && !required ? null : value })} />
    {error && <span className="mt-1 block text-danger" id={`error-${name}`}>{error}</span>}
  </label>;
}
