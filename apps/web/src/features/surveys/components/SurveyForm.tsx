import type { SurveyDetail } from '@helpdesk/contracts';
import { formatDate } from '../../../lib/format';
import { useSurveyForm } from '../hooks/useSurveyForm';
import { SurveyRatingField } from './SurveyRatingField';
import { SurveyReceipt } from './SurveyReceipt';

export function SurveyForm({ token, survey }: { token: string; survey: SurveyDetail }) {
  const { form, submit, pending, error, receipt } = useSurveyForm(token, survey.csrfToken);
  if (receipt) return <SurveyReceipt receipt={receipt} />;
  const { register, formState: { errors } } = form;
  return <form onSubmit={submit} className="space-y-5 rounded-lg border border-border bg-card p-5 sm:p-8" aria-label="Encuesta de satisfacción">
    <div className="space-y-1 rounded border border-border bg-background p-4">
      <p className="font-semibold">{survey.numero} · Cerrado</p><p>{survey.titulo}</p>
      {survey.atendidoPor && <p className="text-sm text-muted">Atendido por {survey.atendidoPor}</p>}
      <p className="text-sm text-muted">Cerrado {formatDate(survey.fechaCierre)}</p>
    </div>
    <p className="text-sm text-muted">Tu opinión nos ayuda a mejorar el servicio de la mesa de ayuda.</p>
    <SurveyRatingField control={form.control} error={errors.calificacion?.message} disabled={pending} />
    <label className="block space-y-2 text-sm font-semibold" htmlFor="survey-comment">Comentario (opcional)
      <textarea id="survey-comment" {...register('comentario')} maxLength={500} rows={4} disabled={pending}
        aria-invalid={!!errors.comentario} aria-describedby={errors.comentario ? 'comentario-error' : undefined}
        placeholder="Contanos qué te gustó o qué podríamos mejorar…" className="w-full rounded border border-border bg-background p-3 font-normal" />
    </label>
    {errors.comentario && <p id="comentario-error" role="alert" className="text-sm text-danger">{errors.comentario.message}</p>}
    {error && <p role="alert" className="text-sm text-danger">{error}</p>}
    <button type="submit" disabled={pending} className="min-h-11 w-full rounded bg-primary px-4 font-semibold text-primary-foreground disabled:opacity-50">
      {pending ? 'Enviando…' : 'Enviar respuesta'}
    </button><p className="text-xs text-muted">Disponible hasta {formatDate(survey.expiraEn)}. El enlace admite una sola respuesta.</p>
  </form>;
}
