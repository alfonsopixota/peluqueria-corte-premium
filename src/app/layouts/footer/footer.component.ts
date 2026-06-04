import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-footer',
  standalone: true,
  imports: [RouterLink],
  template: `
    <footer class="border-t border-white/5 bg-dark-950">
      <div class="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12 md:py-16">

        <div class="grid grid-cols-1 md:grid-cols-3 gap-10 md:gap-8">

          <div>
            <span class="text-xl font-bold tracking-tight">
              <span class="text-premium-400">Corte</span>
              <span class="text-white">Premium</span>
            </span>
            <p class="mt-3 text-sm text-white/40 leading-relaxed">
              Barbería de alta gama donde la tradición se encuentra con la
              vanguardia. Cada corte es una experiencia única.
            </p>
          </div>

          <div>
            <h3 class="text-sm font-semibold text-white uppercase tracking-wider mb-4">
              Horarios
            </h3>
            <div class="space-y-2 text-sm text-white/50">
              <div class="flex justify-between">
                <span>Lunes – Viernes</span>
                <span class="text-white/70">09:00 – 20:00</span>
              </div>
              <div class="flex justify-between">
                <span>Sábado</span>
                <span class="text-white/70">09:00 – 18:00</span>
              </div>
              <div class="flex justify-between">
                <span>Domingo</span>
                <span class="text-white/30">Cerrado</span>
              </div>
            </div>
          </div>

          <div>
            <h3 class="text-sm font-semibold text-white uppercase tracking-wider mb-4">
              Contacto
            </h3>
            <div class="space-y-2 text-sm text-white/50">
              <p>Calle del Barbero, 42</p>
              <p>28001 Madrid</p>
              <a href="tel:+34910000000" class="block hover:text-premium-400 transition-colors">
                +34 91 000 00 00
              </a>
              <a href="mailto:hola@cortepremium.com" class="block hover:text-premium-400 transition-colors">
                hola&#64;cortepremium.com
              </a>
            </div>
            <div class="flex gap-4 mt-4">
              <a href="#" class="text-white/30 hover:text-premium-400 transition-colors text-sm">
                Instagram
              </a>
              <a href="#" class="text-white/30 hover:text-premium-400 transition-colors text-sm">
                Facebook
              </a>
              <a href="#" class="text-white/30 hover:text-premium-400 transition-colors text-sm">
                TikTok
              </a>
            </div>
          </div>

        </div>

        <div class="mt-10 pt-6 border-t border-white/5 flex flex-col md:flex-row items-center justify-between gap-4">
          <p class="text-xs text-white/30">
            &copy; {{ year }} Corte Premium. Todos los derechos reservados.
          </p>
          <div class="flex gap-6 text-xs text-white/30">
            <a routerLink="/" class="hover:text-white/50 transition-colors">Aviso Legal</a>
            <a routerLink="/" class="hover:text-white/50 transition-colors">Privacidad</a>
            <a routerLink="/" class="hover:text-white/50 transition-colors">Cookies</a>
          </div>
        </div>

      </div>
    </footer>
  `,
})
export class FooterComponent {
  year = new Date().getFullYear();
}
