import { Component, inject } from '@angular/core';
import { Router } from '@angular/router';
import { NgClass } from '@angular/common';
import { BookingService } from '../../../shared/services/booking.service';
import { STYLISTS } from '../../../shared/data/stylists.data';
import type { Stylist } from '../../../shared/interfaces/stylist.interface';

@Component({
  selector: 'app-step-stylist',
  standalone: true,
  imports: [NgClass],
  template: `
    <div class="animate-slide-up">
      <h2 class="text-xl md:text-2xl font-semibold mb-2">Elige tu barbero</h2>
      <p class="text-sm text-white/40 mb-8">
        Todos nuestros maestros están altamente cualificados. Elige el que más se
        adapte a lo que buscas.
      </p>

      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
        @for (stylist of stylists; track stylist.id) {
          <div
            (click)="select(stylist)"
            [ngClass]="{
              'border-premium-400/50 bg-premium-400/5': selectedStylist?.id === stylist.id,
              'border-white/5 bg-white/[0.02] hover:bg-white/[0.04]': selectedStylist?.id !== stylist.id
            }"
            class="rounded-xl border p-5 cursor-pointer transition-all duration-200"
          >
            <div class="flex items-center gap-4">
              <div class="w-14 h-14 rounded-full bg-premium-400/10 flex items-center justify-center shrink-0">
                <span class="text-lg font-bold text-premium-400">
                  {{ stylist.name.charAt(0) }}{{ (stylist.name.split(' ')[1] || '').charAt(0) }}
                </span>
              </div>
              <div class="min-w-0">
                <p class="text-sm font-semibold text-white">{{ stylist.name }}</p>
                <p class="text-xs text-premium-400/70">{{ stylist.title }}</p>
              </div>
            </div>
            <p class="text-xs text-white/40 mt-3 leading-relaxed">{{ stylist.bio }}</p>
            <div class="mt-3 flex flex-wrap gap-1.5">
              @for (spec of stylist.specialties; track spec) {
                <span class="px-2 py-0.5 rounded-full text-[10px] font-medium bg-white/5 text-white/50">
                  {{ spec }}
                </span>
              }
            </div>
          </div>
        }
      </div>

      <div class="mt-8 flex justify-between">
        <button (click)="back()" class="btn-premium-outline">
          ← Atrás
        </button>
        <button
          (click)="next()"
          [disabled]="!selectedStylist"
          class="btn-premium"
        >
          Continuar →
        </button>
      </div>
    </div>
  `,
})
export class StepStylistComponent {
  private booking = inject(BookingService);
  private router = inject(Router);

  stylists = STYLISTS;

  get selectedStylist(): Stylist | null {
    return this.booking.selectedStylist();
  }

  select(stylist: Stylist): void {
    this.booking.setStylist(stylist);
  }

  back(): void {
    this.booking.setStep(1);
    this.router.navigate(['/reservar', 'paso-1']);
  }

  next(): void {
    if (this.selectedStylist) {
      this.booking.setStep(3);
      this.router.navigate(['/reservar', 'paso-3']);
    }
  }
}
