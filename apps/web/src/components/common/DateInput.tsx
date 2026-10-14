import { useEffect, useId, useRef } from 'react';
import type { ComponentProps } from 'react';
import { displayDate, parseDate } from './date-input-format';

interface Props extends Omit<ComponentProps<'input'>, 'type' | 'value' | 'onChange' | 'pattern' | 'children'> {
  label: string;
  value: string;
  onChange: (value: string) => void;
  error?: string | undefined;
}

export function DateInput({ label, value, onChange, error, id, className, ref: forwardedRef, 'aria-describedby': describedBy, ...props }: Props) {
  const generatedId = useId(); const inputId = id ?? generatedId;
  const inputRef = useRef<HTMLInputElement>(null);
  const displayed = displayDate(value);
  const invalid = displayed !== '' && parseDate(displayed) === null;
  useEffect(() => { inputRef.current?.setCustomValidity(invalid ? 'Escribí una fecha válida en formato dd/mm/aaaa.' : ''); }, [invalid]);
  return <div className="space-y-1 text-sm">
    <label htmlFor={inputId} className="block font-semibold">{label}</label>
    <input {...props} ref={(node) => {
      inputRef.current = node;
      if (typeof forwardedRef === 'function') return forwardedRef(node);
      if (forwardedRef) forwardedRef.current = node;
    }} id={inputId} type="text" inputMode="text" placeholder="dd/mm/aaaa"
      maxLength={10} pattern="[0-9]{2}/[0-9]{2}/[0-9]{4}" value={displayed}
      className={className ?? 'min-h-10 w-full rounded border border-border bg-background px-3'}
      aria-invalid={invalid || Boolean(error) || props['aria-invalid']} aria-describedby={[describedBy, `${inputId}-ayuda`].filter(Boolean).join(' ')}
      onChange={(event) => {
        const entered = event.target.value; const parsed = parseDate(entered);
        onChange(parsed ?? entered);
      }} />
    <p id={`${inputId}-ayuda`} className={invalid || error ? 'text-danger' : 'text-muted'}>
      {error ?? (invalid ? 'Escribí una fecha válida en formato dd/mm/aaaa.' : 'Formato: dd/mm/aaaa.')}
    </p>
  </div>;
}
