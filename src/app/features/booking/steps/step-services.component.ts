import { Component, inject } from '@angular/core';
import { Router } from '@angular/router';
import { NgClass } from '@angular/common';
import { BookingService } from '../../../shared/services/booking.service';
import { SERVICES } from '../../../shared/data/services.data';
import type { Service } from '../../../shared/interfaces/service.interface';

@Component({
  selector: 'app-step-services',
  standalone: true,
  imports: [NgClass],
  template: `
    <div class="animate-slide-up">
      <h2 class="text-xl md:text-2xl font-semibold mb-2">Selecciona tus servicios</h2>
      <p class="text-sm text-white/40 mb-8">
        Elige uno o varios servicios. Puedes combinarlos para crear tu experiencia ideal.
      </p>

      <div class="space-y-3">
        @for (service of services; track service.id) {
          <div
            (click)="toggle(service)"
            [ngClass]="{
              'border-premium-400/50 bg-premium-400/5': isSelected(service),
              'border-white/5 bg-white/[0.02] hover:bg-white/[0.04]': !isSelected(service)
            }"
            class="rounded-xl border p-4 md:p-5 cursor-pointer transition-all duration-200 flex items-center gap-4"
          >
            <div
              [ngClass]="{
                'bg-premium-400 border-premium-400': isSelected(service),
                'border-white/20 bg-transparent': !isSelected(service)
              }"
              class="w-5 h-5 rounded-full border-2 shrink-0 flex items-center justify-center transition-all"
            >
              @if (isSelected(service)) {
                <svg class="w-3 h-3 text-dark-900" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M5 13l4 4L19 7" />
                </svg>
              }
            </div>

            <div class="flex-1 min-w-0">
              <div class="flex items-center gap-2">
                <span class="text-[10px] font-medium uppercase tracking-wider text-premium-400/60">
                  {{ categoryLabel(service.category) }}
                </span>
              </div>
              <p class="text-sm font-medium text-white mt-0.5">{{ service.name }}</p>
              <p class="text-xs text-white/30 mt-0.5">{{ service.description }}</p>
            </div>

            <div class="text-right shrink-0">
              <p class="text-sm font-semibold text-premium-400">{{ service.price }}€</p>
              <p class="text-[10px] text-white/30">{{ service.duration }} min</p>
            </div>
          </div>
        }
      </div>

      @if (selectedCount > 0) {
        <div class="mt-8 p-4 rounded-xl bg-white/5 border border-white/5">
          <div class="flex items-center justify-between text-sm">
            <span class="text-white/50">{{ selectedCount }} servicio(s) seleccionado(s)</span>
            <span class="text-premium-400 font-semibold">Total: {{ totalPrice }}€</span>
          </div>
          <div class="mt-1 text-xs text-white/30">
            Duración estimada: {{ totalDuration }} min
          </div>
        </div>
      }

      <div class="mt-8 flex justify-end">
        <button
          (click)="next()"
          [disabled]="selectedCount === 0"
          class="btn-premium"
        >
          Continuar →
        </button>
      </div>
    </div>
  `,
})
export class StepServicesComponent {
  private booking = inject(BookingService);
  private router = inject(Router);

  services = SERVICES;

  isSelected(service: Service): boolean {
    return this.booking.selectedServices().some((s: Service) => s.id === service.id);
  }

  get selectedCount(): number {
    return this.booking.selectedServices().length;
  }

  get totalPrice(): number {
    return this.booking.totalPrice();
  }

  get totalDuration(): number {
    return this.booking.totalDuration();
  }

  toggle(service: Service): void {
    this.booking.toggleService(service);
  }

  categoryLabel(cat: string): string {
    const map: Record<string, string> = {
      corte: 'Corte',
      barba: 'Barba',
      color: 'Color',
      tratamiento: 'Tratamiento',
    };
    return map[cat] ?? cat;
  }

  next(): void {
    this.booking.setStep(2);
    this.router.navigate(['/reservar', 'paso-2']);
  }
}
