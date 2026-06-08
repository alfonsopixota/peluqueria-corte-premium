import { Component, inject, signal, OnInit, ChangeDetectionStrategy } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ApiService } from '../../shared/services/api.service';
import { FormatDatePipe } from '../../shared/pipes/format-date.pipe';
import type { Appointment } from '../../shared/interfaces/appointment.interface';

@Component({
  selector: 'app-my-appointments',
  standalone: true,
  imports: [RouterLink, FormatDatePipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section class="min-h-screen pt-24 md:pt-32 pb-20 md:pb-32">
      <div class="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">

        <div class="text-center mb-10">
          <span class="text-xs font-semibold uppercase tracking-[0.2em] text-premium-400">
            Mis Citas
          </span>
          <h1 class="mt-2 text-3xl md:text-4xl font-bold">Tus Reservas</h1>
        </div>

        @if (loading()) {
          <div class="text-center py-16 text-white/30">Cargando tus citas...</div>
        }

        @if (error()) {
          <div class="p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-sm text-red-400 text-center">
            {{ error() }}
          </div>
        }

        @if (!loading() && !error()) {
          @if (appointments().length === 0) {
            <div class="text-center py-16">
              <p class="text-white/30 mb-6">No tienes reservas todavía.</p>
              <a routerLink="/reservar" class="btn-premium">Reservar Cita</a>
            </div>
          } @else {
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              @for (appt of appointments(); track appt._id) {
                <div class="card-premium p-6">
                  <div class="flex items-start justify-between mb-4">
                    <div>
                      <p class="text-lg font-semibold text-white">{{ appt.date | formatDate }}</p>
                      <p class="text-sm text-premium-400">{{ appt.time }} h</p>
                    </div>
                    <span [class]="statusClass(appt.status || '')">
                      {{ statusLabel(appt.status || '') }}
                    </span>
                  </div>

                  <div class="space-y-2 text-sm">
                    <div class="flex justify-between">
                      <span class="text-white/40">Barbero</span>
                      <span class="text-white/70">{{ appt.stylist.name }}</span>
                    </div>
                    <div class="flex justify-between">
                      <span class="text-white/40">Servicios</span>
                      <span class="text-white/70 text-right">
                        @for (svc of appt.services; track svc.id; let last = $last) {
                          {{ svc.name }}{{ !last ? ', ' : '' }}
                        }
                      </span>
                    </div>
                    <div class="flex justify-between pt-2 border-t border-white/5">
                      <span class="text-white/40">Total</span>
                      <span class="text-premium-400 font-bold">{{ appt.totalPrice }}€</span>
                    </div>
                  </div>

                  @if (appt.status === 'confirmed') {
                    <button (click)="cancel(appt._id!)" class="btn-premium-outline w-full mt-4 text-xs py-2.5">
                      Cancelar Cita
                    </button>
                  }
                </div>
              }
            </div>
          }
        }
      </div>
    </section>
  `,
})
export class MyAppointmentsComponent implements OnInit {
  private api = inject(ApiService);
  appointments = signal<Appointment[]>([]);
  loading = signal(true);
  error = signal('');

  async ngOnInit(): Promise<void> {
    try {
      const list = await this.api.get<Appointment[]>('/appointments').toPromise();
      this.appointments.set(list || []);
    } catch {
      this.error.set('Error al cargar tus citas.');
    } finally {
      this.loading.set(false);
    }
  }

  async cancel(id: string): Promise<void> {
    const appt = this.appointments().find(a => a._id === id);
    if (!appt) return;

    if (appt.stripeSessionId) {
      const ok = window.confirm(
        'Esta cita fue pagada con tarjeta. Si la cancelas, ponte en contacto con nosotros para gestionar el reembolso. ¿Deseas cancelarla de todas formas?'
      );
      if (!ok) return;
    }

    try {
      await this.api.delete(`/appointments/${id}`).toPromise();
      this.appointments.update(list =>
        list.map(a => a._id === id ? { ...a, status: 'cancelled' } : a)
      );
    } catch {
      this.error.set('Error al cancelar la cita.');
    }
  }

  statusClass(status: string): string {
    switch (status) {
      case 'confirmed': return 'text-xs px-2 py-0.5 rounded-full bg-premium-400/10 text-premium-400';
      case 'cancelled': return 'text-xs px-2 py-0.5 rounded-full bg-red-400/10 text-red-400';
      case 'completed': return 'text-xs px-2 py-0.5 rounded-full bg-green-400/10 text-green-400';
      default: return 'text-xs text-white/30';
    }
  }

  statusLabel(status: string): string {
    switch (status) {
      case 'confirmed': return 'Confirmada';
      case 'cancelled': return 'Cancelada';
      case 'completed': return 'Completada';
      default: return status;
    }
  }
}
