import { randomUUID, createHash } from 'node:crypto';
import { mkdir, writeFile, unlink, readFile, realpath } from 'node:fs/promises';
import { resolve, join, basename } from 'node:path';
import { AppError } from '../../common/errors/app-error.js';

export function safeOriginalName(input: string) {
  return basename(input.replaceAll('\\', '/')).replace(/[\u0000-\u001f\u007f]/g, '').trim().slice(0, 200) || 'archivo';
}
export function attachmentDisposition(name: string) {
  const safe = safeOriginalName(name);
  const ascii = safe.replace(/[^a-zA-Z0-9._ -]/g, '_');
  return `attachment; filename="${ascii}"; filename*=UTF-8''${encodeURIComponent(safe).replace(/[!'()*]/g, (character) => `%${character.charCodeAt(0).toString(16).toUpperCase()}`)}`;
}
export function createLocalStorage(directory: string) {
  const root = resolve(directory);
  const checkRoot = (path: string) => {
    if (/(^|[\\/])(public|dist)([\\/]|$)|[\\/]apps[\\/]web([\\/]|$)/i.test(path)) {
      throw new AppError('ERROR_INTERNO', 500, 'El almacenamiento debe quedar fuera de la raíz web.');
    }
  };
  checkRoot(root);
  const pathFor = async (name: string) => {
    if (!/^[a-f0-9]{8}-[a-f0-9]{4}-4[a-f0-9]{3}-[89ab][a-f0-9]{3}-[a-f0-9]{12}$/i.test(name)) {
      throw new AppError('ERROR_INTERNO', 500, 'Nombre almacenado inválido.');
    }
    await mkdir(root, { recursive: true });
    const canonical = await realpath(root); checkRoot(canonical);
    return join(canonical, name);
  };
  return {
    save: async (buffer: Buffer) => {
      const nombreAlmacenado = randomUUID();
      const path = await pathFor(nombreAlmacenado);
      try { await writeFile(path, buffer, { flag: 'wx', mode: 0o600 }); }
      catch (error) {
        if (!(error instanceof Error && 'code' in error && error.code === 'EEXIST')) {
          await unlink(path).catch((cleanupError: unknown) => {
            if (!(cleanupError instanceof Error && 'code' in cleanupError && cleanupError.code === 'ENOENT')) throw cleanupError;
          });
        }
        throw error;
      }
      return { nombreAlmacenado, hashSha256: createHash('sha256').update(buffer).digest('hex') };
    },
    remove: async (name: string) => { await unlink(await pathFor(name)); },
    read: async (name: string, hash: string) => {
      const path = await pathFor(name);
      if (await realpath(path) !== path) throw new AppError('ERROR_INTERNO', 500, 'Archivo almacenado inválido.');
      const buffer = await readFile(path);
      if (createHash('sha256').update(buffer).digest('hex') !== hash) throw new AppError('ERROR_INTERNO', 500, 'La integridad del adjunto no es válida.');
      return buffer;
    },
  };
}
export type LocalStorage = ReturnType<typeof createLocalStorage>;
