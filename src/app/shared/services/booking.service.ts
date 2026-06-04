import { Injectable, computed, signal, inject } from '@angular/core';
import type { Service } from '../interfaces/service.interface';
import type { Stylist } from '../interfaces/stylist.interface';
import type { ClientForm } from '../interfaces/appointment.interface';
import type { Appointment } from '../interfaces/appointment.interface';
import { StorageService } from './storage.service';

const EMPTY_FORM: ClientForm = { name: '', email: '', phone: '', notes: '' };

@Injectable({ providedIn: 'root' })
export class BookingService {
  private storage = inject(StorageService);

  private step = signal(1);
  private services = signal<Service[]>([]);
  private stylist = signal<Stylist | null>(null);
  private date = signal<string | null>(null);
  private timeSlot = signal<string | null>(null);
  private clientForm = signal<ClientForm>({ ...EMPTY_FORM });

  readonly currentStep = this.step.asReadonly();
  readonly selectedServices = this.services.asReadonly();
  readonly selectedStylist = this.stylist.asReadonly();
  readonly selectedDate = this.date.asReadonly();
  readonly selectedTimeSlot = this.timeSlot.asReadonly();
  readonly clientFormData = this.clientForm.asReadonly();

  readonly totalPrice = computed(() =>
    this.services().reduce((sum: number, s: Service) => sum + s.price, 0)
  );

  readonly totalDuration = computed(() =>
    this.services().reduce((sum: number, s: Service) => sum + s.duration, 0)
  );

  readonly hasServices = computed(() => this.services().length > 0);
  readonly hasStylist = computed(() => this.stylist() !== null);
  readonly hasDate = computed(() => this.date() !== null && !!this.timeSlot());
  readonly isValidClientForm = computed(() => this.clientForm().name.length >= 3);

  setStep(n: number): void {
    this.step.set(n);
  }

  toggleService(service: Service): void {
    this.services.update((current: Service[]) => {
      const exists = current.some((s: Service) => s.id === service.id);
      return exists
        ? current.filter((s: Service) => s.id !== service.id)
        : [...current, service];
    });
  }

  setStylist(stylist: Stylist): void {
    this.stylist.set(stylist);
  }

  setDate(date: string): void {
    this.date.set(date);
  }

  setTimeSlot(time: string | null): void {
    this.timeSlot.set(time);
  }

  updateClientForm(form: Partial<ClientForm>): void {
    this.clientForm.update((current: ClientForm) => ({ ...current, ...form }));
  }

  confirmBooking(): Appointment | null {
    const services = this.services();
    const stylist = this.stylist();
    const date = this.date();
    const timeSlot = this.timeSlot();
    const client = this.clientForm();

    if (!services.length || !stylist || !date || !timeSlot || !client.name) {
      return null;
    }

    const appointment: Appointment = {
      id: crypto.randomUUID?.() ?? `${Date.now()}-${Math.random()}`,
      services,
      stylist,
      date,
      time: timeSlot,
      client: { ...client },
      totalPrice: this.totalPrice(),
      totalDuration: this.totalDuration(),
      createdAt: new Date().toISOString(),
    };

    this.storage.saveAppointment(appointment);
    return appointment;
  }

  reset(): void {
    this.step.set(1);
    this.services.set([]);
    this.stylist.set(null);
    this.date.set(null);
    this.timeSlot.set(null);
    this.clientForm.set({ ...EMPTY_FORM });
  }

}
