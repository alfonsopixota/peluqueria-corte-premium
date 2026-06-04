import { Component, inject, signal, OnInit, ChangeDetectionStrategy } from '@angular/core';
import { RouterLink } from '@angular/router';
import { StorageService } from '../../shared/services/storage.service';
import { FormatDatePipe } from '../../shared/pipes/format-date.pipe';
import type { Appointment } from '../../shared/interfaces/appointment.interface';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [RouterLink, FormatDatePipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section class="relative min-h-screen flex items-center justify-center overflow-hidden">
      <div class="absolute inset-0 bg-gradient-to-b from-dark-900 via-dark-900 to-dark-850"></div>
      <div class="absolute top-1/4 left-1/4 w-96 h-96 bg-premium-400/5 rounded-full blur-[120px]"></div>
      <div class="absolute bottom-1/4 right-1/4 w-64 h-64 bg-premium-400/3 rounded-full blur-[100px]"></div>

      <div class="relative z-10 mx-auto max-w-4xl px-4 text-center pt-24 pb-16 md:pt-32 md:pb-24">
        <div class="animate-fade-in">
          <span class="inline-block px-4 py-1.5 rounded-full text-xs font-medium tracking-wider uppercase bg-premium-400/10 text-premium-400 border border-premium-400/20 mb-6">
            Barbería de Alta Gama
          </span>
        </div>

        <h1 class="text-4xl sm:text-5xl md:text-7xl font-bold tracking-tight text-balance animate-slide-up">
          Donde el<br>
          <span class="text-premium-400">Estilo</span> Encuentra<br>
          su Maestro
        </h1>

        <p class="mt-6 text-base md:text-lg text-white/50 max-w-xl mx-auto animate-slide-up">
          Experiencia premium en barbería masculina. Cortes de autor, barba
          tradicional y tratamientos capilares en el corazón de Madrid.
        </p>

        <div class="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4 animate-slide-up">
          <a routerLink="/reservar" class="btn-premium px-8 py-4 text-base">
            Reserva tu Cita
          </a>
          <a routerLink="/servicios" class="btn-premium-outline px-8 py-4 text-base">
            Ver Servicios
          </a>
        </div>
      </div>
    </section>

    @if (nextAppointment(); as appt) {
      <section class="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 -mt-16 relative z-20 pb-16 animate-slide-up">
        <div class="card-premium p-6 md:p-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div>
            <p class="text-xs font-medium uppercase tracking-wider text-premium-400 mb-1">
              Tu próxima cita
            </p>
            <p class="text-white font-semibold">
              {{ appt.date | formatDate:false }} a las {{ appt.time }}
            </p>
            <p class="text-sm text-white/50 mt-1">
              con {{ appt.stylist.name }}
              @for (svc of appt.services; track svc.id; let last = $last) {
                {{ svc.name }}{{ !last ? ', ' : '' }}
              }
            </p>
          </div>
          <a routerLink="/reservar" class="btn-premium-outline shrink-0">
            Nueva Reserva
          </a>
        </div>
      </section>
    }

    <section class="py-20 md:py-32">
      <div class="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div class="grid grid-cols-1 md:grid-cols-2 gap-12 md:gap-20 items-center">
          <div>
            <span class="text-xs font-semibold uppercase tracking-[0.2em] text-premium-400">
              Nuestra Filosofía
            </span>
            <h2 class="mt-4 text-3xl md:text-4xl font-bold text-balance">
              Más que un corte,<br>
              <span class="text-premium-400">una experiencia</span>
            </h2>
            <p class="mt-6 text-white/50 leading-relaxed">
              En Corte Premium combinamos técnicas tradicionales de barbería con
              las tendencias más vanguardistas. Cada servicio comienza con una
              consulta personalizada para entender tu estilo, tu rutina y lo que
              quieres expresar.
            </p>
            <p class="mt-4 text-white/50 leading-relaxed">
              Nuestros maestros barberos utilizan productos premium y navetilla
              artesanal para ofrecerte un acabado impecable. Porque para nosotros,
              cada cliente es una obra de arte en proceso.
            </p>
            <div class="mt-8 flex gap-8">
              <div>
                <p class="text-2xl font-bold text-premium-400">15+</p>
                <p class="text-xs text-white/40 mt-1">Años de experiencia</p>
              </div>
              <div>
                <p class="text-2xl font-bold text-premium-400">10K+</p>
                <p class="text-xs text-white/40 mt-1">Clientes satisfechos</p>
              </div>
              <div>
                <p class="text-2xl font-bold text-premium-400">4.9</p>
                <p class="text-xs text-white/40 mt-1">Valoración media</p>
              </div>
            </div>
          </div>
          <div class="relative aspect-[4/5] rounded-2xl overflow-hidden">
            <img
              src="assets/barberia.jpg"
              alt="Interior de la barbería Corte Premium"
              class="absolute inset-0 w-full h-full object-cover"
            />
            <div class="absolute inset-0 bg-gradient-to-t from-dark-900/60 via-transparent to-transparent"></div>
          </div>
        </div>
      </div>
    </section>

    <section class="py-20 md:py-32 bg-dark-950/50">
      <div class="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 text-center">
        <span class="text-xs font-semibold uppercase tracking-[0.2em] text-premium-400">
          Listo para el cambio
        </span>
        <h2 class="mt-4 text-3xl md:text-4xl font-bold">
          Transforma tu look hoy
        </h2>
        <p class="mt-4 text-white/50 max-w-md mx-auto">
          Reserva tu cita en segundos. Elige tu servicio, barbero y horario
          preferido.
        </p>
        <a routerLink="/reservar" class="btn-premium mt-8 px-10 py-4 text-base">
          Reservar Ahora
        </a>
      </div>
    </section>
  `,
})
export class HomeComponent implements OnInit {
  private storage = inject(StorageService);
  nextAppt = signal<Appointment | null>(null);

  nextAppointment = this.nextAppt.asReadonly();

  async ngOnInit(): Promise<void> {
    const appt = await this.storage.getNextAppointment();
    this.nextAppt.set(appt);
  }
}
