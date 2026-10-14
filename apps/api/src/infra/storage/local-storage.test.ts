import { mkdtemp, readdir, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { basename, dirname, join, resolve } from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { attachmentDisposition, createLocalStorage, safeOriginalName } from './local-storage.js';

describe('Almacenamiento de adjuntos', () => {
  let directory: string;
  beforeEach(async () => { directory = await mkdtemp(join(tmpdir(), 'helpdesk-storage-')); });
  afterEach(async () => {
    const target = resolve(directory);
    if (dirname(target) !== resolve(tmpdir()) || !basename(target).startsWith('helpdesk-storage-')) throw new Error('Directorio temporal fuera de alcance.');
    await rm(target, { recursive: true, force: true });
  });
  it('guarda con UUID y detecta modificación de contenido antes de descargar', async () => {
    const storage = createLocalStorage(directory); const data = Buffer.from('evidencia');
    const file = await storage.save(data);
    expect(file.nombreAlmacenado).toMatch(/^[a-f0-9-]{36}$/); expect(file.hashSha256).toMatch(/^[a-f0-9]{64}$/);
    expect(await storage.read(file.nombreAlmacenado, file.hashSha256)).toEqual(data);
    await writeFile(join(directory, file.nombreAlmacenado), Buffer.from('modificado'));
    await expect(storage.read(file.nombreAlmacenado, file.hashSha256)).rejects.toThrow('integridad');
    await storage.remove(file.nombreAlmacenado); expect(await readdir(directory)).toHaveLength(0);
  });
  it('rechaza rutas almacenadas ajenas y directorios de publicación web', async () => {
    const storage = createLocalStorage(directory);
    await expect(storage.read('../secreto', '')).rejects.toThrow('Nombre almacenado inválido');
    expect(() => createLocalStorage(join(directory, 'public'))).toThrow('raíz web');
    expect(() => createLocalStorage(join(directory, 'apps', 'web', 'archivos'))).toThrow('raíz web');
  });
  it('elimina rutas y controles del nombre y escapa Content-Disposition', () => {
    expect(safeOriginalName('C:\\capturas\\pantalla.png')).toBe('pantalla.png');
    expect(safeOriginalName('../../captura\r\n.png')).toBe('captura.png');
    const header = attachmentDisposition('captura";á\r\n.png');
    expect(header).not.toMatch(/[\r\n]/); expect(header).toContain('filename*=UTF-8'); expect(header).toContain('%22');
  });
});
