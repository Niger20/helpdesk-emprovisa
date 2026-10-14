import type { FastifyRequest } from 'fastify';
import '@fastify/multipart';
import { AppError } from '../../../common/errors/app-error.js';

export async function readAttachment(request: FastifyRequest, fileSize: number) {
  if (!request.isMultipart()) throw new AppError('ENTRADA_INVALIDA', 400, 'Usá multipart/form-data para adjuntar un archivo.');
  let file: { name: string; buffer: Buffer } | undefined;
  try {
    for await (const part of request.parts({ limits: { fileSize, files: 2, fields: 0, parts: 2 } })) {
      if (part.type !== 'file' || part.fieldname !== 'archivo' || file) throw new AppError('ENTRADA_INVALIDA', 400, 'Enviá un único archivo en el campo archivo.');
      file = { name: part.filename, buffer: await part.toBuffer() };
      if (part.file.truncated) throw new AppError('LIMITE_EXCEDIDO', 413, 'El archivo supera el límite permitido.');
    }
  } catch (error) {
    if (error instanceof AppError) throw error;
    if (error instanceof Error && 'code' in error && error.code === 'FST_REQ_FILE_TOO_LARGE') throw new AppError('LIMITE_EXCEDIDO', 413, 'El archivo supera el límite permitido.');
    throw new AppError('ENTRADA_INVALIDA', 400, 'El formulario debe contener un único archivo y ningún campo adicional.');
  }
  if (!file) throw new AppError('ENTRADA_INVALIDA', 400, 'Seleccioná un archivo.');
  return file;
}
