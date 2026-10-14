import { Controller } from 'react-hook-form';
import type { Control } from 'react-hook-form';
import type { SurveyResponse } from '@helpdesk/contracts';

interface Props { control: Control<SurveyResponse>; error?: string | undefined; disabled: boolean }
const labels = ['Muy malo', 'Malo', 'Regular', 'Bueno', 'Excelente'];
export function SurveyRatingField({ control, error, disabled }: Props) {
  return <fieldset disabled={disabled} aria-describedby={error ? 'calificacion-error' : undefined}>
    <legend className="mb-4 text-lg font-semibold">¿Cómo calificás la atención recibida?</legend>
    <Controller name="calificacion" control={control} render={({ field }) => <div className="grid grid-cols-5 gap-1 sm:gap-3">{labels.map((label, index) => <label key={label} className="cursor-pointer text-center text-xs">
      <input type="radio" name={field.name} value={index + 1} checked={field.value === index + 1} ref={index === 0 ? field.ref : undefined}
        onBlur={field.onBlur} onChange={() => field.onChange(index + 1)} className="peer sr-only" />
      <span className="mx-auto mb-2 flex min-h-10 w-10 items-center justify-center rounded-full border border-border text-lg peer-checked:border-primary peer-checked:bg-primary peer-checked:text-primary-foreground peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-primary">
        {index + 1}<span className="sr-only"> de 5:</span>
      </span><span>{label}</span>
    </label>)}</div>} />
    {error && <p id="calificacion-error" role="alert" className="mt-2 text-sm text-danger">{error}</p>}
  </fieldset>;
}
