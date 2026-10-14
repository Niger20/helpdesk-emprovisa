import type { Permiso, UsuarioSesion } from '@helpdesk/contracts';

export interface SessionContext {
  idSesion: string;
  usuario: UsuarioSesion;
  grants: { codigo: Permiso; idSedeAlcance: number | null }[];
  csrfToken: string;
  expiraEn: Date;
  idleMinutes: number;
}
export interface LoginMetadata { direccionIp: string; userAgent: string | undefined }
