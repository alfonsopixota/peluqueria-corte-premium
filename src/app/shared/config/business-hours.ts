/**
 * Configuración central del horario de la barbería.
 * Cualquier cambio de horario, duración de franja o días de cierre se hace aquí.
 */
export const BUSINESS_HOURS = {
  /** Hora de apertura (formato 24h). */
  openHour: 9,
  /** Hora de cierre entre semana. */
  closeHour: 20,
  /** Hora de cierre los sábados. */
  closeHourSaturday: 18,
  /** Duración de cada franja en minutos. */
  slotMinutes: 30,
  /** Días de la semana cerrados (0 = domingo … 6 = sábado). */
  closedDays: [0],
} as const;
