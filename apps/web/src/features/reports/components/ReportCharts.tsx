import { Bar, BarChart, CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import type { Reports } from '@helpdesk/contracts';
import { reportDate } from '../lib/format';
export function ReportCharts({ report }: { report: Reports }) {
  return <section className="grid gap-4 lg:grid-cols-2" aria-label="Gráficos de volumen">
    <article className="min-w-0 rounded-lg border border-border bg-card p-4"><h2 className="mb-4 font-semibold">Tickets por categoría</h2>
      <div className="h-64" aria-hidden="true"><ResponsiveContainer width="100%" height="100%"><BarChart data={report.porCategoria} accessibilityLayer>
        <CartesianGrid strokeDasharray="3 3" /><XAxis dataKey="etiqueta" hide /><YAxis allowDecimals={false} /><Tooltip /><Bar dataKey="total" name="Tickets" fill="#13315C" />
      </BarChart></ResponsiveContainer></div>
      <ul className="mt-3 space-y-1 text-sm">{report.porCategoria.map((value) => <li key={value.etiqueta}>{value.etiqueta}: {value.total}</li>)}</ul>
    </article>
    <article className="min-w-0 rounded-lg border border-border bg-card p-4"><h2 className="mb-4 font-semibold">Volumen diario de la cohorte</h2>
      <div className="h-64" aria-hidden="true"><ResponsiveContainer width="100%" height="100%"><LineChart data={report.volumenDiario} accessibilityLayer>
        <CartesianGrid strokeDasharray="3 3" /><XAxis dataKey="fecha" tickFormatter={reportDate} /><YAxis allowDecimals={false} /><Tooltip labelFormatter={(value) => reportDate(String(value))} />
        <Line type="monotone" dataKey="creados" name="Creados" stroke="#13315C" /><Line type="monotone" dataKey="resueltos" name="Resueltos" stroke="#047857" strokeDasharray="5 4" />
      </LineChart></ResponsiveContainer></div>
      <details className="mt-3 text-sm"><summary className="min-h-10 cursor-pointer">Consultar valores diarios</summary><ul>{report.volumenDiario.map((value) => <li key={value.fecha}>{reportDate(value.fecha)}: {value.creados} creados, {value.resueltos} resueltos</li>)}</ul></details>
    </article>
  </section>;
}
