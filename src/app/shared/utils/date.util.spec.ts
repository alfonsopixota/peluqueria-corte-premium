import { parseLocalDate, formatLocalDate } from './date.util';

describe('date.util', () => {
  describe('parseLocalDate', () => {
    it('devuelve null para entradas vacías o inválidas', () => {
      expect(parseLocalDate(null)).toBeNull();
      expect(parseLocalDate(undefined)).toBeNull();
      expect(parseLocalDate('')).toBeNull();
      expect(parseLocalDate('2026/06/12')).toBeNull();
      expect(parseLocalDate('hoy')).toBeNull();
    });

    it('parsea en hora LOCAL (no UTC) — sin desplazamiento de día', () => {
      const d = parseLocalDate('2026-06-12')!;
      // El bug clásico de new Date('2026-06-12') daría el día 11 en husos
      // con offset negativo. Aquí debe ser siempre el 12 local.
      expect(d.getFullYear()).toBe(2026);
      expect(d.getMonth()).toBe(5); // junio = 5
      expect(d.getDate()).toBe(12);
      expect(d.getHours()).toBe(0);
    });

    it('round-trip con formatLocalDate', () => {
      const str = '2026-12-31';
      expect(formatLocalDate(parseLocalDate(str)!)).toBe(str);
    });
  });

  describe('formatLocalDate', () => {
    it('formatea con ceros a la izquierda', () => {
      expect(formatLocalDate(new Date(2026, 0, 5))).toBe('2026-01-05');
      expect(formatLocalDate(new Date(2026, 11, 25))).toBe('2026-12-25');
    });
  });
});
