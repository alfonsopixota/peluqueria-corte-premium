import { Component, ChangeDetectionStrategy } from '@angular/core';
import { RouterLink } from '@angular/router';
import { SERVICES } from '../../shared/data/services.data';
import { CategoryLabelPipe } from '../../shared/pipes/category-label.pipe';
import type { Service, ServiceCategory } from '../../shared/interfaces/service.interface';

@Component({
  selector: 'app-services',
  standalone: true,
  imports: [RouterLink, CategoryLabelPipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section class="min-h-screen pt-24 md:pt-32 pb-20 md:pb-32">
      <div class="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">

        <div class="text-center max-w-2xl mx-auto">
          <span class="text-xs font-semibold uppercase tracking-[0.2em] text-premium-400">
            Servicios
          </span>
          <h1 class="mt-4 text-3xl md:text-5xl font-bold">
            Premium Care
          </h1>
          <p class="mt-4 text-white/50">
            Desde un corte clásico hasta tratamientos capilares avanzados.
            Cada servicio está diseñado para ofrecerte lo mejor.
          </p>
        </div>

        <div class="mt-12 flex flex-wrap justify-center gap-2">
          @for (cat of categories; track cat.key) {
            <button
              (click)="activeCategory = cat.key"
              [class]="activeCategory === cat.key
                ? 'px-5 py-2 rounded-full text-xs font-medium bg-premium-400 text-dark-900 transition-all'
                : 'px-5 py-2 rounded-full text-xs font-medium bg-white/5 text-white/50 hover:bg-white/10 transition-all'"
            >
              {{ cat.label }}
            </button>
          }
        </div>

        <div class="mt-10 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
          @for (service of filteredServices; track service.id) {
            <div class="card-premium p-6 md:p-8 flex flex-col group">
              <div class="flex items-start justify-between mb-4">
                <span class="text-xs font-medium uppercase tracking-wider text-premium-400/70">
                  {{ service.category | categoryLabel }}
                </span>
                <span class="text-lg font-bold text-premium-400">
                  {{ service.price }}€
                </span>
              </div>

              <h3 class="text-lg font-semibold text-white group-hover:text-premium-400 transition-colors">
                {{ service.name }}
              </h3>
              <p class="mt-2 text-sm text-white/40 leading-relaxed flex-1">
                {{ service.description }}
              </p>

              <div class="mt-4 pt-4 border-t border-white/5 flex items-center justify-between">
                <span class="text-xs text-white/30">
                  <svg class="inline w-3.5 h-3.5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  {{ service.duration }} min
                </span>
                <a routerLink="/reservar" class="text-xs font-medium text-premium-400 hover:text-premium-300 transition-colors">
                  Reservar →
                </a>
              </div>
            </div>
          }
        </div>

        @if (filteredServices.length === 0) {
          <div class="text-center py-16">
            <p class="text-white/30">No hay servicios en esta categoría.</p>
          </div>
        }

      </div>
    </section>
  `,
})
export class ServicesComponent {
  activeCategory: ServiceCategory | 'todas' = 'todas';

  categories: { key: ServiceCategory | 'todas'; label: string }[] = [
    { key: 'todas', label: 'Todas' },
    { key: 'corte', label: 'Corte' },
    { key: 'barba', label: 'Barba' },
    { key: 'color', label: 'Color' },
    { key: 'tratamiento', label: 'Tratamientos' },
  ];

  get filteredServices(): Service[] {
    return this.activeCategory === 'todas'
      ? SERVICES
      : SERVICES.filter(s => s.category === this.activeCategory);
  }
}
