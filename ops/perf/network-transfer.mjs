import { createServer, get } from 'node:http';
import { readFile, readdir, mkdir, writeFile } from 'node:fs/promises';
import { resolve, join } from 'node:path';
import { gzipSync, gunzipSync } from 'node:zlib';
import { createHash } from 'node:crypto';
import { performance } from 'node:perf_hooks';

const dist = resolve('apps/web/dist');
const output = resolve('.data/perf/network-transfer.json');
const bytesPerSecond = 256_000 / 8;
const digest = (buffer) => createHash('sha256').update(buffer).digest('hex');
const html = await readFile(join(dist, 'index.html'), 'utf8');
const initial = new Set(['index.html', ...Array.from(html.matchAll(/(?:src|href)="\/(assets\/[^"?]+)"/g), (match) => match[1])]);
const allAssets = (await readdir(join(dist, 'assets'))).filter((file) => /\.(js|css)$/.test(file)).map((file) => `assets/${file}`);
const loginChunk = allAssets.find((file) => /\/LoginPage-[^/]+\.js$/.test(file));
if (!loginChunk) throw new Error('No se identificó el chunk de login; revisar el build antes medir página inicial');
initial.add(loginChunk);
const visit = async (file) => {
  if (!file.endsWith('.js')) return;
  const content = await readFile(join(dist, file), 'utf8');
  for (const match of content.matchAll(/(?:from|import)\s*["']\.\/([^"']+\.js)["']/g)) {
    const dependency = `assets/${match[1]}`;
    if (!initial.has(dependency)) { initial.add(dependency); await visit(dependency); }
  }
};
for (const file of [...initial]) await visit(file);
const files = [...initial, ...allAssets.filter((file) => !initial.has(file))];
const payloads = new Map(await Promise.all(files.map(async (file) => {
  const source = await readFile(join(dist, file));
  return [`/${file}`, { source, compressed: gzipSync(source), sha256: digest(source) }];
})));
const server = createServer((request, response) => {
  const payload = payloads.get(request.url);
  if (!payload) { response.writeHead(404); response.end(); return; }
  response.writeHead(200, { 'Content-Encoding': 'gzip', 'Content-Length': payload.compressed.length, 'Cache-Control': 'no-store' });
  const start = performance.now();
  let sent = 0;
  const timer = setInterval(() => {
    const allowed = Math.min(payload.compressed.length, Math.floor((performance.now() - start) * bytesPerSecond / 1000));
    if (allowed > sent) { response.write(payload.compressed.subarray(sent, allowed)); sent = allowed; }
    if (sent === payload.compressed.length) { clearInterval(timer); response.end(); }
  }, 25);
  response.on('close', () => clearInterval(timer));
});
await new Promise((done) => server.listen(0, '127.0.0.1', done));
const address = server.address();
const rows = [];
try {
  for (const file of files) {
    const started = performance.now();
    const received = await new Promise((done, reject) => {
      const request = get(`http://127.0.0.1:${address.port}/${file}`, { headers: { 'Accept-Encoding': 'gzip' } }, (response) => {
        const chunks = [];
        response.on('data', (chunk) => chunks.push(chunk));
        response.on('end', () => response.statusCode === 200 ? done(Buffer.concat(chunks)) : reject(new Error('HTTP inesperado')));
        response.on('error', reject);
      });
      request.on('error', reject);
      request.setTimeout(30_000, () => request.destroy(new Error('Timeout de transferencia')));
    });
    const elapsedMs = performance.now() - started;
    const expected = payloads.get(`/${file}`);
    if (digest(gunzipSync(received)) !== expected.sha256) throw new Error('Contenido recibido distinto al build');
    rows.push({ file, phase: initial.has(file) ? 'initial' : 'lazy', sourceBytes: expected.source.length,
      gzipBytes: received.length, elapsedMs, effectiveKbps: received.length * 8 / elapsedMs, sha256: expected.sha256 });
  }
} finally { await new Promise((done) => server.close(done)); }
const aggregate = (phase) => {
  const selection = phase ? rows.filter((row) => row.phase === phase) : rows;
  const bytes = selection.reduce((sum, row) => sum + row.gzipBytes, 0);
  const elapsedMs = selection.reduce((sum, row) => sum + row.elapsedMs, 0);
  return { files: selection.length, gzipBytes: bytes, elapsedMs, effectiveKbps: bytes * 8 / elapsedMs };
};
const result = { measuredAt: new Date().toISOString(), targetKbps: 256, scope: 'HTTP gzip secuencial; sin navegador ni ejecución JS',
  node: process.version, indexSha256: digest(Buffer.from(html)), initial: aggregate('initial'), lazy: aggregate('lazy'), total: aggregate(), rows };
await mkdir(resolve('.data/perf'), { recursive: true });
await writeFile(output, JSON.stringify(result, null, 2));
process.stdout.write(`${JSON.stringify({ initial: result.initial, lazy: result.lazy, total: result.total })}\n`);
