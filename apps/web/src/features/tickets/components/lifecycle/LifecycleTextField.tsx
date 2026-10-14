import type { UseFormReturn, FieldPath } from 'react-hook-form';
import type { TicketLifecycleCommand } from '@helpdesk/contracts';

interface Props { form: UseFormReturn<TicketLifecycleCommand>; name: FieldPath<TicketLifecycleCommand>; label: string; maxLength: number; nullable?: boolean; multiline?: boolean }
export function LifecycleTextField({ form, name, label, maxLength, nullable = false, multiline = false }: Props) {
  const error = form.getFieldState(name, form.formState).error?.message;
  const props = { id: `ciclo-${name}`, className: 'mt-1 min-h-10 w-full rounded border border-input bg-card p-3', maxLength,
    'aria-invalid': Boolean(error), 'aria-describedby': `ciclo-error-${name}`,
    ...form.register(name, { setValueAs: (value: string) => nullable && value === '' ? null : value }) };
  return <label htmlFor={`ciclo-${name}`} className="block text-sm">{label}{multiline ? <textarea {...props} rows={4} /> : <input {...props} />}
    <span className="block text-danger" id={`ciclo-error-${name}`}>{error}</span></label>;
}
