import { mkdtemp, readdir, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { basename, dirname, join, resolve } from 'node:path';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { AttachmentsRepository } from './attachments.repository.js';
import type { SessionContext } from '../../auth/index.js';
import { createLocalStorage } from '../../../infra/storage/local-storage.js';
import { buildAttachmentsService } from './attachments.service.js';

const png = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+jRZkAAAAASUVORK5CYII=', 'base64');
const context: SessionContext = { idSesion: 'sesion', csrfToken: '', idleMinutes: 30, expiraEn: new Date(), grants: [],
  usuario: { idUsuario: 2, username: 'solicitante', nombreCompleto: 'Solicitante', sede: { idSede: 1, codigo: 'MAN', nombre: 'Managua' }, roles: [],
    permisos: ['ticket.ver', 'ticket.ver_propios', 'ticket.adjuntar'] } };
describe('Servicio de adjuntos: fallos y límites', () => {
  let directory: string;
  beforeEach(async () => { directory = await mkdtemp(join(tmpdir(), 'helpdesk-attachment-service-')); });
  afterEach(async () => {
    const target = resolve(directory);
    if (dirname(target) !== resolve(tmpdir()) || !basename(target).startsWith('helpdesk-attachment-service-')) throw new Error('Directorio temporal fuera de alcance.');
    await rm(target, { recursive: true, force: true });
  });
  const fixture = () => {
    const repository: AttachmentsRepository = {
      ticket: vi.fn<AttachmentsRepository['ticket']>().mockResolvedValue({ idTicket: 1, idSolicitante: 2, version: 1, estado: 'NUEVO' }),
      limit: vi.fn<AttachmentsRepository['limit']>().mockResolvedValue(10485760),
      list: vi.fn<AttachmentsRepository['list']>().mockResolvedValue([]),
      find: vi.fn<AttachmentsRepository['find']>().mockResolvedValue(undefined),
      insert: vi.fn<AttachmentsRepository['insert']>().mockRejectedValue(new Error('Rollback de base')),
    };
    const service = buildAttachmentsService(repository, createLocalStorage(directory), (action) => action(repository));
    return { repository, service };
  };
  it('elimina el archivo después de que falla el registro transaccional', async () => {
    const { repository, service } = fixture();
    await expect(service.upload(context, 'TK-000001', 'captura.png', png)).rejects.toThrow('Rollback de base');
    expect(repository.insert).toHaveBeenCalledOnce(); expect(repository.ticket).toHaveBeenCalledWith(context, 'TK-000001', true);
    expect(await readdir(directory)).toHaveLength(0);
  });
  it('deniega un parámetro ausente o inválido antes de almacenar archivos', async () => {
    const { repository, service } = fixture(); vi.mocked(repository.limit).mockResolvedValue(Number.NaN);
    await expect(service.upload(context, 'TK-000001', 'captura.png', png)).rejects.toThrow('no está configurado');
    expect(repository.insert).not.toHaveBeenCalled(); expect(await readdir(directory)).toHaveLength(0);
  });
  it('deniega acceso sin permiso incluso si el repositorio devolvería un caso visible', async () => {
    const { repository, service } = fixture();
    await expect(service.upload({ ...context, usuario: { ...context.usuario, permisos: ['ticket.ver'] } }, 'TK-000001', 'captura.png', png)).rejects.toThrow('No tenés permiso');
    expect(repository.ticket).not.toHaveBeenCalled(); expect(repository.insert).not.toHaveBeenCalled();
  });
});
