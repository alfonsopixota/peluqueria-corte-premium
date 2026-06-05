import { Component, inject, signal, OnInit, ChangeDetectionStrategy } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { ApiService } from '../../shared/services/api.service';
import { BookingService } from '../../shared/services/booking.service';
import type { Appointment } from '../../shared/interfaces/appointment.interface';

@Component({
  selector: 'app-payment-success',
  standalone: true,
  imports: [RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section class="min-h-screen pt-24 md:pt-32 pb-20 md:pb-32 flex items-center justify-center">
      <div class="mx-auto max-w-md w-full px-4 text-center">

        @if (loading()) {
          <div class="text-white/50">Verificando pago...</div>
        }

        @if (error()) {
          <div class="card-premium p-8">
            <div class="w-16 h-16 rounded-full bg-red-400/10 flex items-center justify-center mx-auto mb-4">
              <svg class="w-8 h-8 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </div>
            <h2 class="text-xl font-bold text-white mb-2">Error de pago</h2>
            <p class="text-sm text-white/50 mb-6">{{ error() }}</p>
            <a routerLink="/reservar" class="btn-premium">Intentar de nuevo</a>
          </div>
        }

        @if (appointment(); as appt) {
          <div class="card-premium p-8 animate-scale-in">
            <div class="w-16 h-16 rounded-full bg-green-400/10 flex items-center justify-center mx-auto mb-4">
              <svg class="w-8 h-8 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h2 class="text-xl font-bold text-white mb-2">¡Pago confirmado!</h2>
            <p class="text-sm text-white/50 mb-6">Tu cita ha sido reservada y pagada.</p>

            <div class="text-left space-y-2 text-sm mb-6">
              <div class="flex justify-between"><span class="text-white/40">Fecha</span><span class="text-white/70">{{ appt.date }}</span></div>
              <div class="flex justify-between"><span class="text-white/40">Hora</span><span class="text-premium-400">{{ appt.time }} h</span></div>
              <div class="flex justify-between"><span class="text-white/40">Barbero</span><span class="text-white/70">{{ appt.stylist.name }}</span></div>
              <div class="flex justify-between pt-2 border-t border-white/5"><span class="text-white/40">Total</span><span class="text-premium-400 font-bold">{{ appt.totalPrice }}€</span></div>
            </div>

            <div class="flex flex-col gap-3">
              <a routerLink="/mis-citas" class="btn-premium">Ver Mis Citas</a>
              <a routerLink="/" class="btn-premium-outline">Volver al inicio</a>
            </div>
          </div>
        }
      </div>
    </section>
  `,
})
export class PaymentSuccessComponent implements OnInit {
  private api = inject(ApiService);
  private booking = inject(BookingService);
  private router = inject(Router);
  loading = signal(true);
  error = signal('');
  appointment = signal<Appointment | null>(null);

  async ngOnInit(): Promise<void> {
    const params = new URLSearchParams(window.location.search);
    const sessionId = params.get('session_id');

    if (!sessionId) {
      this.error.set('No se encontró la sesión de pago.');
      this.loading.set(false);
      return;
    }

    try {
      const appt = await this.api.get<Appointment>(`/payment/checkout-success?session_id=${sessionId}`).toPromise();
      this.appointment.set(appt ?? null);
      this.booking.reset();
    } catch (e: any) {
      this.error.set(e.error?.error || 'Error al verificar el pago.');
    } finally {
      this.loading.set(false);
    }
  }
}
