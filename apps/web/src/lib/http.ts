import { problemSchema } from '@helpdesk/contracts';
import type { z } from 'zod';

export class HttpError extends Error {
  constructor(readonly status: number, message: string) { super(message); }
}

export async function http<T>(path: string, schema: z.ZodType<T>, options: RequestInit = {}) {
  const response = await fetch(path, { ...options, credentials: 'same-origin' });
  const body: unknown = await response.json();
  if (!response.ok) {
    const problem = problemSchema.safeParse(body);
    throw new HttpError(response.status, problem.success ? problem.data.detail : 'No se pudo completar la solicitud.');
  }
  return schema.parse(body);
}
