import { Component, inject, ChangeDetectionStrategy } from '@angular/core';
import { RouterLink, RouterOutlet } from '@angular/router';
import { NgClass } from '@angular/common';
import { BookingService } from '../../shared/services/booking.service';

const STEP_LABELS = ['Servicios', 'Barbero', 'Fecha y Hora', 'Confirmar'];

@Component({
  selector: 'app-booking',
  standalone: true,
  imports: [RouterLink, RouterOutlet, NgClass],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section class="min-h-screen pt-24 md:pt-32 pb-20 md:pb-32">
      <div class="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">

        <div class="text-center mb-10">
          <span class="text-xs font-semibold uppercase tracking-[0.2em] text-premium-400">
            Reserva
          </span>
          <h1 class="mt-2 text-3xl md:text-4xl font-bold">
            Tu Cita
          </h1>
        </div>

        <div class="flex items-center justify-center gap-2 md:gap-4 mb-10">
          @for (label of stepLabels; track $index) {
            <div class="flex items-center gap-2 md:gap-4">
              <div class="flex flex-col items-center">
                <div
                  [ngClass]="{
                    'step-indicator-active': currentStep() === $index + 1,
                    'step-indicator-completed': currentStep() > $index + 1,
                    'step-indicator-pending': currentStep() < $index + 1
                  }"
                  class="step-indicator"
                >
                  @if (currentStep() > $index + 1) {
                    <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M5 13l4 4L19 7" />
                    </svg>
                  } @else {
                    {{ $index + 1 }}
                  }
                </div>
                <span
                  [ngClass]="{
                    'text-premium-400': currentStep() >= $index + 1,
                    'text-white/30': currentStep() < $index + 1
                  }"
                  class="text-[10px] font-medium mt-1.5 block transition-colors"
                >
                  {{ label }}
                </span>
              </div>
              @if ($index < stepLabels.length - 1) {
                <div
                  [ngClass]="{
                    'bg-premium-400/50': currentStep() > $index + 1,
                    'bg-white/10': currentStep() <= $index + 1
                  }"
                  class="w-8 md:w-12 h-[2px] transition-colors"
                ></div>
              }
            </div>
          }
        </div>

        <div class="card-premium p-6 md:p-10 animate-fade-in">
          <router-outlet />
        </div>

      </div>
    </section>
  `,
})
export class BookingComponent {
  private booking = inject(BookingService);
  stepLabels = STEP_LABELS;

  get currentStep() {
    return this.booking.currentStep;
  }
}
