import { Component, inject, signal, OnInit, ChangeDetectionStrategy } from '@angular/core';
import { DatePipe } from '@angular/common';
import { ApiService } from '../../shared/services/api.service';
import type { Appointment } from '../../shared/interfaces/appointment.interface';

@Component({
  selector: 'app-admin',
  standalone: true,
  imports: [DatePipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section class="min-h-screen pt-24 md:pt-32 pb-20 md:pb-32">
      <div class="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">

        <div class="text-center mb-10">
          <span class="text-xs font-semibold uppercase tracking-[0.2em] text-premium-400">
            Administración
          </span>
          <h1 class="mt-2 text-3xl md:text-4xl font-bold">Gestión de Citas</h1>
        </div>

        @if (loading()) {
          <div class="text-center py-16 text-white/30">Cargando citas...</div>
        }

        @if (error()) {
          <div class="p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-sm text-red-400 text-center">
            {{ error() }}
          </div>
        }

        @if (!loading() && !error()) {
          @if (appointments().length === 0) {
            <div class="text-center py-16 text-white/30">No hay citas registradas.</div>
          } @else {
            <div class="overflow-x-auto">
              <table class="w-full text-sm">
                <thead>
                  <tr class="border-b border-white/5 text-left text-xs uppercase tracking-wider text-white/30">
                    <th class="pb-3 pr-4">Cliente</th>
                    <th class="pb-3 pr-4">Email</th>
                    <th class="pb-3 pr-4">Teléfono</th>
                    <th class="pb-3 pr-4">Fecha</th>
                    <th class="pb-3 pr-4">Hora</th>
                    <th class="pb-3 pr-4">Barbero</th>
                    <th class="pb-3 pr-4">Servicios</th>
                    <th class="pb-3 pr-4">Total</th>
                    <th class="pb-3 pr-4">Estado</th>
                    <th class="pb-3">Acción</th>
                  </tr>
                </thead>
                <tbody>
                  @for (appt of appointments(); track appt._id) {
                    <tr class="border-b border-white/[0.02] hover:bg-white/[0.02] transition-colors">
                      <td class="py-3 pr-4 text-white font-medium">{{ appt.client.name }}</td>
                      <td class="py-3 pr-4 text-white/50">{{ appt.client.email }}</td>
                      <td class="py-3 pr-4 text-white/50">{{ appt.client.phone }}</td>
                      <td class="py-3 pr-4 text-white/70">{{ appt.date }}</td>
                      <td class="py-3 pr-4 text-premium-400">{{ appt.time }}</td>
                      <td class="py-3 pr-4 text-white/70">{{ appt.stylist.name }}</td>
                      <td class="py-3 pr-4 text-white/50">
                        @for (svc of appt.services; track svc.id; let last = $last) {
                          {{ svc.name }}{{ !last ? ', ' : '' }}
                        }
                      </td>
                      <td class="py-3 pr-4 text-premium-400 font-semibold">{{ appt.totalPrice }}€</td>
                      <td class="py-3 pr-4">
                        <span [class]="statusClass(appt.status || '')">
                          {{ statusLabel(appt.status || '') }}
                        </span>
                      </td>
                      <td class="py-3">
                        @if (appt.status === 'confirmed') {
                          <button (click)="cancel(appt._id!)" class="text-xs text-red-400 hover:text-red-300 transition-colors">
                            Cancelar
                          </button>
                        }
                      </td>
                    </tr>
                  }
                </tbody>
              </table>
            </div>
          }
        }
      </div>
    </section>
  `,
})
export class AdminComponent implements OnInit {
  private api = inject(ApiService);
  appointments = signal<Appointment[]>([]);
  loading = signal(true);
  error = signal('');

  async ngOnInit(): Promise<void> {
    try {
      const list = await this.api.get<Appointment[]>('/appointments').toPromise();
      this.appointments.set(list || []);
    } catch {
      this.error.set('Error al cargar las citas.');
    } finally {
      this.loading.set(false);
    }
  }

  async cancel(id: string): Promise<void> {
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
