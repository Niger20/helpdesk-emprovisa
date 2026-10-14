/* global __ENV, __VU, __ITER, open */
import http from 'k6/http';
import { check, sleep } from 'k6';

const root = __ENV.PERF_URL || 'http://127.0.0.1:3001';
if (root !== 'http://127.0.0.1:3001') throw new Error('El escenario solo apunta a la API aislada en puerto 3001.');
const sessions = JSON.parse(open(__ENV.PERF_SESSIONS || '../../.data/perf/sessions.json'));
if (sessions.length !== 63) throw new Error('Se necesitan 63 sesiones locales.');
export const options = { scenarios: { lecturas: { executor: 'ramping-vus', startVUs: 0, stages: [
  { duration: '15s', target: 63 }, { duration: '90s', target: 63 }, { duration: '10s', target: 0 }], gracefulRampDown: '5s' } },
  thresholds: { http_req_duration: ['p(95)<2000'], http_req_failed: ['rate<0.01'], checks: ['rate>0.99'],
    'http_req_duration{name:cola}': ['p(95)<2000'], 'http_req_duration{name:ficha}': ['p(95)<2000'],
    'http_req_duration{name:conocimientos}': ['p(95)<2000'], 'http_req_duration{name:activos}': ['p(95)<2000'],
    'http_req_duration{name:tablero}': ['p(95)<2000'], 'http_req_duration{name:sesion}': ['p(95)<2000'] },
  summaryTrendStats: ['avg', 'min', 'med', 'max', 'p(90)', 'p(95)'], systemTags: ['status', 'method', 'name', 'scenario'] };

export default function () {
  const session = sessions[(__VU - 1) % sessions.length];
  const cases = [ { name: 'cola', path: '/api/v1/tickets?pageSize=20', valid: (body) => Array.isArray(body.data) && body.meta.total > 0 },
    { name: 'ficha', path: `/api/v1/tickets/${session.numero}`, valid: (body) => body.ticket?.numero === session.numero },
    { name: 'conocimientos', path: '/api/v1/conocimientos', valid: (body) => Array.isArray(body.data) },
    ...(session.perfil > 0 ? [{ name: 'activos', path: '/api/v1/activos', valid: (body) => Array.isArray(body.data) }] : []),
    ...(session.perfil >= 3 ? [{ name: 'tablero', path: '/api/v1/reportes?desde=2026-01-01&hasta=2026-12-31', valid: (body) => typeof body === 'object' && !body.code }] : []),
    { name: 'sesion', path: '/api/v1/auth/me', valid: (body) => Boolean(body.usuario) } ];
  const item = cases[__ITER % cases.length];
  const response = http.get(root + item.path, { headers: { Cookie: session.cookie }, tags: { name: item.name }, timeout: '10s' });
  check(response, { 'HTTP 200 y contrato útil': (res) => { if (res.status !== 200) return false; try { return item.valid(res.json()); } catch { return false; } } });
  sleep(2);
}
export function handleSummary(data) {
  const output = __ENV.PERF_SUMMARY || '.data/perf/summary.json';
  return { [output]: JSON.stringify(data, null, 2), stdout: 'Carga completada; revisá el resumen local y los umbrales.\n' };
}
