export function formatDate(value: string) {
  return new Intl.DateTimeFormat('es-NI', { timeZone: 'America/Managua', day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit', hour12: false }).format(new Date(value));
}
