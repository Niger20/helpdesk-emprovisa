import { describe, expect, it } from 'vitest';
import { csrfToken, newLoginChallenge, newToken, tokenHash, validLoginChallenge } from '../src/common/crypto/session-tokens.js';

const secret = 'a'.repeat(64);
describe('Tokens de sesión y desafío CSRF', () => {
  it('crea 32 bytes aleatorios y hashes independientes del token', () => {
    const token = newToken();
    expect(token).toMatch(/^[a-f0-9]{64}$/);
    expect(newToken()).not.toBe(token);
    expect(tokenHash(token)).not.toBe(token);
    expect(csrfToken(secret, token)).not.toBe(tokenHash(token));
  });
  it('rechaza desafíos manipulados, expirados o con otro header', () => {
    const now = Date.now();
    const challenge = newLoginChallenge(secret, now);
    expect(validLoginChallenge(secret, challenge.cookie, challenge.csrfToken, now)).toBe(true);
    expect(validLoginChallenge(secret, `${challenge.cookie}f`, challenge.csrfToken, now)).toBe(false);
    expect(validLoginChallenge(secret, challenge.cookie, 'b'.repeat(64), now)).toBe(false);
    expect(validLoginChallenge(secret, challenge.cookie, challenge.csrfToken, now + 300_000)).toBe(false);
    expect(validLoginChallenge(secret, undefined, challenge.csrfToken, now)).toBe(false);
  });
});
