/**
 * Utilidades de fecha para el dominio de reservas.
 *
 * DECISIÓN DE ZONA HORARIA
 * ------------------------
 * Las citas se modelan en la **hora local de la peluquería**. La fecha se guarda
 * como `YYYY-MM-DD` y la hora como `HH:mm` (strings), sin offset ni `Z`. No se
 * convierte a UTC en ningún punto: una cita "12 jun a las 10:00" significa las
 * 10:00 del reloj de la tienda, independientemente del navegador del cliente.
 *
 * El peligro es `new Date('2026-06-12')`: el estándar interpreta una cadena
 * *solo-fecha* como **UTC medianoche**, así que en husos con offset negativo
 * (p.ej. América) `getDate()` devuelve el día anterior. Por eso SIEMPRE se parsea
 * con `parseLocalDate`, que construye la fecha en hora local.
 */

/**
 * Convierte `YYYY-MM-DD` en un Date a medianoche **local** (no UTC).
 * Devuelve null si el formato no es válido.
 */
export function parseLocalDate(dateStr: string | null | undefined): Date | null {
  if (!dateStr) return null;
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(dateStr);
  if (!m) return null;
  const [, y, mo, d] = m;
  return new Date(Number(y), Number(mo) - 1, Number(d));
}

/**
 * Formatea un Date local como `YYYY-MM-DD` (inverso de parseLocalDate).
 */
export function formatLocalDate(d: Date): string {
  const y = d.getFullYear();
  const mo = (d.getMonth() + 1).toString().padStart(2, '0');
  const day = d.getDate().toString().padStart(2, '0');
  return `${y}-${mo}-${day}`;
}
