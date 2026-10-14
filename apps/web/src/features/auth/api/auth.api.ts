import { csrfResponseSchema, logoutResponseSchema, sesionResponseSchema } from '@helpdesk/contracts';
import type { LoginRequest } from '@helpdesk/contracts';
import { http } from '../../../lib/http';

export const fetchSession = (signal: AbortSignal) => http('/api/v1/auth/me', sesionResponseSchema, { signal });
export async function login(data: LoginRequest) {
  const challenge = await http('/api/v1/auth/csrf', csrfResponseSchema);
  return http('/api/v1/auth/login', sesionResponseSchema, {
    method: 'POST', headers: { 'Content-Type': 'application/json', 'X-CSRF-Token': challenge.csrfToken }, body: JSON.stringify(data),
  });
}
export const logout = (csrfToken: string) => http('/api/v1/auth/logout', logoutResponseSchema, {
  method: 'POST', headers: { 'X-CSRF-Token': csrfToken },
});
