import { healthResponseSchema } from '@helpdesk/contracts';

export async function fetchHealth(signal: AbortSignal) {
  const response = await fetch('/health', {
    signal: AbortSignal.any([signal, AbortSignal.timeout(5000)]), credentials: 'same-origin',
  });
  if (!response.ok) throw new Error('No se pudo comprobar la disponibilidad del sistema.');
  const result: unknown = await response.json();
  return healthResponseSchema.parse(result);
}
