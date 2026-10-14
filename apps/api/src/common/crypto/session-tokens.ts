import { createHash, createHmac, randomBytes, timingSafeEqual } from 'node:crypto';

export const newToken = () => randomBytes(32).toString('hex');
export const tokenHash = (token: string) => createHash('sha256').update(token).digest('hex');
export const csrfToken = (secret: string, token: string) => createHmac('sha256', secret).update(token).digest('hex');

export function tokensEqual(expected: string, actual: unknown) {
  return typeof actual === 'string' && /^[a-f0-9]{64}$/.test(actual)
    && timingSafeEqual(Buffer.from(expected, 'hex'), Buffer.from(actual, 'hex'));
}

export function newLoginChallenge(secret: string, now = Date.now()) {
  const payload = `${newToken()}.${now + 5 * 60_000}`;
  const cookie = `${payload}.${csrfToken(secret, payload)}`;
  return { cookie, csrfToken: csrfToken(secret, `login:${payload}`) };
}

export function validLoginChallenge(secret: string, cookie: string | undefined, header: unknown, now = Date.now()) {
  if (!cookie || cookie.length > 160) return false;
  const [nonce, expiry, signature] = cookie.split('.');
  if (!nonce || !/^[a-f0-9]{64}$/.test(nonce) || !expiry || !/^\d{13}$/.test(expiry)) return false;
  const expiration = Number(expiry);
  if (expiration <= now || expiration > now + 5 * 60_000) return false;
  const payload = `${nonce}.${expiry}`;
  return tokensEqual(csrfToken(secret, payload), signature) && tokensEqual(csrfToken(secret, `login:${payload}`), header);
}
