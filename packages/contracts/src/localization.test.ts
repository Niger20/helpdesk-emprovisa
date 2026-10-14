import { describe, expect, it } from 'vitest';
import { surveyResponseSchema, ticketCreateSchema, loginRequestSchema } from './index.js';

describe('mensajes compartidos en español', () => {
  it.each([undefined, null, '5', 0, 6, 1.5, Number.NaN])('rechaza calificación %s con una instrucción española', (calificacion) => {
    const result = surveyResponseSchema.safeParse({ calificacion });
    expect(result.success).toBe(false);
    if (!result.success) expect(result.error.issues[0]?.message).toBe('Seleccioná una calificación de 1 a 5.');
  });

  it.each([1, 2, 3, 4, 5])('conserva calificación válida %s', (calificacion) => {
    expect(surveyResponseSchema.parse({ calificacion })).toEqual({ calificacion });
  });

  it('identifica la categoría vacía sin traducir enums ni relajar validación', () => {
    const result = ticketCreateSchema.safeParse({ titulo: 'Caso local de prueba', descripcion: 'Datos ficticios',
      tipo: 'INCIDENTE', idCategoria: 0, impacto: 'BAJO', urgencia: 'MEDIA', idActivo: null,
      idSolicitante: 1, canalIngreso: 'PORTAL' });
    expect(result.success).toBe(false);
    if (!result.success) expect(result.error.issues).toMatchObject([{ path: ['idCategoria'], message: 'Seleccioná una categoría.' }]);
  });

  it('localiza errores predeterminados de tipo y conserva mensajes específicos', () => {
    const result = loginRequestSchema.safeParse({ username: 123, password: '' });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0]?.message).toContain('inválida');
      for (const issue of result.error.issues) expect(issue.message).not.toMatch(/Invalid input|Too small|Too big|expected/);
    }
  });
});
