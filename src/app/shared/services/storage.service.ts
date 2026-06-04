import { Injectable } from '@angular/core';
import type { Appointment } from '../interfaces/appointment.interface';

const APPOINTMENTS_KEY = 'cp-appointments';

@Injectable({ providedIn: 'root' })
export class StorageService {

  getAppointments(): Appointment[] {
    try {
      const raw = localStorage.getItem(APPOINTMENTS_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  }

  saveAppointment(appointment: Appointment): void {
    const appointments = this.getAppointments();
    appointments.push(appointment);
    localStorage.setItem(APPOINTMENTS_KEY, JSON.stringify(appointments));
  }

  getNextAppointment(): Appointment | null {
    const appointments = this.getAppointments();
    if (appointments.length === 0) return null;

    const now = new Date();
    const sorted = appointments
      .map(a => ({ ...a, dateObj: new Date(`${a.date}T${a.time}`) }))
      .filter(a => a.dateObj > now)
      .sort((a, b) => a.dateObj.getTime() - b.dateObj.getTime());

    return sorted.length > 0 ? sorted[0] : null;
  }
}
