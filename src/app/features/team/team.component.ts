import { Component, inject, signal, OnInit, ChangeDetectionStrategy } from '@angular/core';
import { RouterLink } from '@angular/router';
import { BookingService } from '../../shared/services/booking.service';
import type { Stylist } from '../../shared/interfaces/stylist.interface';

@Component({
  selector: 'app-team',
  standalone: true,
  imports: [RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section class="min-h-screen pt-24 md:pt-32 pb-20 md:pb-32">
      <div class="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">

        <div class="text-center max-w-2xl mx-auto">
          <span class="text-xs font-semibold uppercase tracking-[0.2em] text-premium-400">
            Nuestro Equipo
          </span>
          <h1 class="mt-4 text-3xl md:text-5xl font-bold">
            Maestros Barbero
          </h1>
          <p class="mt-4 text-white/50">
            Conoce a los artistas que transformarán tu estilo. Cada uno con su
            especialidad y pasión por el arte de la barbería.
          </p>
        </div>

        <div class="mt-12 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          @for (stylist of stylists(); track stylist.id; let i = $index) {
            <div
              class="card-premium p-6 text-center group"
              [style.animation-delay]="i * 100 + 'ms'"
            >
              <div class="w-24 h-24 rounded-full mx-auto bg-premium-400/10 flex items-center justify-center mb-5
                          group-hover:bg-premium-400/20 transition-colors duration-300">
                <span class="text-2xl font-bold text-premium-400">
                  {{ stylist.name.charAt(0) }}{{ (stylist.name.split(' ')[1] || '').charAt(0) }}
                </span>
              </div>

              <h3 class="text-lg font-semibold text-white group-hover:text-premium-400 transition-colors">
                {{ stylist.name }}
              </h3>
              <p class="text-xs font-medium text-premium-400/70 mt-1">
                {{ stylist.title }}
              </p>
              <p class="text-sm text-white/40 mt-3 leading-relaxed">
                {{ stylist.bio }}
              </p>

              <div class="mt-4 flex flex-wrap justify-center gap-1.5">
                @for (spec of stylist.specialties; track spec) {
                  <span class="px-2.5 py-1 rounded-full text-[10px] font-medium bg-white/5 text-white/50">
                    {{ spec }}
                  </span>
                }
              </div>

              <div class="mt-4 flex items-center justify-center gap-1">
                <span class="text-premium-400 text-sm font-semibold">{{ stylist.rating }}</span>
                <span class="text-premium-400/50 text-xs">{{ getStars(stylist.rating) }}</span>
              </div>

              <a routerLink="/reservar" class="btn-premium-outline w-full mt-5 text-xs py-2.5">
                Reservar con {{ stylist.name.split(' ')[0] }}
              </a>
            </div>
          }
        </div>

      </div>
    </section>
  `,
})
export class TeamComponent implements OnInit {
  private booking = inject(BookingService);
  stylists = signal<Stylist[]>([]);

  async ngOnInit(): Promise<void> {
    const list = await this.booking.loadStylists();
    this.stylists.set(list);
  }

  getStars(rating: number): string {
    const full = Math.round(rating);
    return '★'.repeat(full) + '☆'.repeat(5 - full);
  }
}
