export const reportNumber = (value: number | null, suffix = '') => value === null ? 'Sin datos' : `${value.toLocaleString('es-NI', { maximumFractionDigits: 1 })}${suffix}`;
export const reportDate = (value: string) => value.split('-').reverse().join('/');
export function initialReportDates() {
  const parts = new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Managua', year: 'numeric', month: '2-digit', day: '2-digit' }).formatToParts(new Date());
  const part = (type: string) => parts.find((value) => value.type === type)?.value ?? '';
  return { desde: `${part('year')}-${part('month')}-01`, hasta: `${part('year')}-${part('month')}-${part('day')}` };
}
