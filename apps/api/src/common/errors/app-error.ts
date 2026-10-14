import type { ErrorCode } from '@helpdesk/contracts';

export class AppError extends Error {
  constructor(readonly code: ErrorCode, readonly statusCode: number, message: string) { super(message); }
}
