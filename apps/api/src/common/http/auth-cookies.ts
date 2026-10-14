import type { FastifyReply } from 'fastify';
import type { SessionContext } from '../../modules/auth/index.js';

export const sessionCookie = 'helpdesk_sid';
export const loginCookie = 'helpdesk_login_csrf';
export const cookieOptions = { path: '/', httpOnly: true, sameSite: 'strict' as const, secure: false };

export function setSessionCookie(reply: FastifyReply, token: string, context: SessionContext) {
  reply.setCookie(sessionCookie, token, { ...cookieOptions, maxAge: context.idleMinutes * 60 });
}
