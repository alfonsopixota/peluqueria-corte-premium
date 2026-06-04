import { Injectable, inject } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import type { Appointment } from '../interfaces/appointment.interface';
import { ApiService } from './api.service';

const APPOINTMENTS_KEY = 'cp-appointments';

@Injectable({ providedIn: 'root' })
export class StorageService {
  private api = inject(ApiService);

  async getAppointments(): Promise<Appointment[]> {
    const local = this.getLocalAppointments();
    try {
      const remote = await firstValueFrom(this.api.get<Appointment[]>('/appointments'));
      const merged = this.mergeAppointments(local, remote);
      this.setLocalAppointments(merged);
      return merged;
    } catch {
      return local;
    }
  }

  async saveAppointment(appointment: Appointment): Promise<Appointment | null> {
    try {
      const created = await firstValueFrom(this.api.post<Appointment>('/appointments', appointment));
      this.addLocalAppointment(created);
      return created;
    } catch {
      const id = crypto.randomUUID?.() ?? `${Date.now()}-${Math.random()}`;
      const localAppt = { ...appointment, id, createdAt: appointment.createdAt || new Date().toISOString() };
      this.addLocalAppointment(localAppt);
      return localAppt;
    }
  }

  async getNextAppointment(): Promise<Appointment | null> {
    const appointments = await this.getAppointments();
    if (appointments.length === 0) return null;

    const now = new Date();
    const sorted = appointments
      .filter(a => a.status !== 'cancelled')
      .map(a => ({ appointment: a, dateObj: new Date(`${a.date}T${a.time}`) }))
      .filter(({ dateObj }) => dateObj > now)
      .sort((a, b) => a.dateObj.getTime() - b.dateObj.getTime());

    return sorted.length > 0 ? sorted[0].appointment : null;
  }

  async getBookedTimes(date: string, stylistId: number): Promise<string[]> {
    const appointments = await this.getAppointments();
    return appointments
      .filter(a => a.date === date && a.stylist.id === stylistId && a.status !== 'cancelled')
      .map(a => a.time);
  }

  private getLocalAppointments(): Appointment[] {
    try {
      const raw = localStorage.getItem(APPOINTMENTS_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  }

  private setLocalAppointments(appts: Appointment[]): void {
    localStorage.setItem(APPOINTMENTS_KEY, JSON.stringify(appts));
  }

  private addLocalAppointment(appt: Appointment): void {
    const list = this.getLocalAppointments();
    list.push(appt);
    this.setLocalAppointments(list);
  }

  private mergeAppointments(local: Appointment[], remote: Appointment[]): Appointment[] {
    const map = new Map<string, Appointment>();
    for (const a of [...remote, ...local]) {
      const key = a._id || a.id || '';
      if (key && !map.has(key)) {
        map.set(key, a);
      }
    }
    return Array.from(map.values());
  }
}
