import { QueryBoundary } from '../../../components/common/QueryBoundary';
import { useSurvey } from '../hooks/useSurvey';
import { SurveyForm } from '../components/SurveyForm';

export function SurveyPage() {
  const { token, query } = useSurvey();
  return <main className="min-h-screen bg-background text-foreground">
    <header className="bg-primary px-5 py-4 font-semibold text-primary-foreground">EMPROVISA · Mesa de Ayuda</header>
    <div className="mx-auto max-w-xl space-y-4 px-4 py-8">
      <h1 className="text-xl font-semibold">Encuesta de satisfacción</h1>
      <QueryBoundary query={query} isEmpty={(survey) => survey === null}>
        {(survey) => survey && <SurveyForm key={token} token={token} survey={survey} />}
      </QueryBoundary>
      {query.isSuccess && query.data === null && <p className="text-sm text-muted">Este enlace no está disponible: es inválido, venció o la encuesta ya fue respondida.</p>}
    </div><footer className="px-4 py-5 text-center text-xs text-muted">EMPROVISA · Managua, Rivas y León</footer>
  </main>;
}
