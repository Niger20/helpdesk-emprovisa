import type { z } from 'zod';
import type { surveyInvitationsSchema } from '@helpdesk/contracts';
import { Link } from 'react-router';
import { formatDate } from '../../../lib/format';

export function SurveyInvitations({ data }: { data: z.infer<typeof surveyInvitationsSchema> }) {
  return <section aria-label="Encuestas disponibles" className="space-y-3"><h2 className="text-lg font-semibold">Encuestas de satisfacción</h2>
    {data.data.map((invitation) => <article key={invitation.numero} className="rounded-lg border border-border bg-card p-4">
      <Link to={invitation.enlace} className="inline-block min-h-10 py-2 font-semibold text-primary underline">Evaluar la atención de {invitation.numero}</Link>
      <p className="text-sm text-muted">Disponible hasta {formatDate(invitation.expiraEn)}</p>
    </article>)}
  </section>;
}
