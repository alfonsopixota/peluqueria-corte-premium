import { Component, HostListener, inject, signal, ChangeDetectionStrategy } from '@angular/core';
import { RouterLink, RouterLinkActive, Router } from '@angular/router';
import { NgClass } from '@angular/common';
import { AuthService } from '../../shared/services/auth.service';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [RouterLink, RouterLinkActive, NgClass],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <nav
      [ngClass]="{
        'glass-strong': isScrolled(),
        'bg-transparent': !isScrolled()
      }"
      class="fixed top-0 left-0 right-0 z-50 transition-all duration-300"
    >
      <div class="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div class="flex h-16 md:h-20 items-center justify-between">

          <a routerLink="/" class="flex items-center gap-2">
            <span class="text-xl md:text-2xl font-bold tracking-tight">
              <span class="text-premium-400">Corte</span>
              <span class="text-white">Premium</span>
            </span>
          </a>

          <div class="hidden md:flex items-center gap-6">
            <a
              routerLink="/"
              routerLinkActive="text-premium-400"
              [routerLinkActiveOptions]="{ exact: true }"
              class="text-sm font-medium text-white/70 hover:text-white transition-colors"
            >
              Inicio
            </a>
            <a
              routerLink="/servicios"
              routerLinkActive="text-premium-400"
              class="text-sm font-medium text-white/70 hover:text-white transition-colors"
            >
              Servicios
            </a>
            <a
              routerLink="/equipo"
              routerLinkActive="text-premium-400"
              class="text-sm font-medium text-white/70 hover:text-white transition-colors"
            >
              Equipo
            </a>
            <a routerLink="/reservar" class="btn-premium text-sm">
              Reservar Cita
            </a>
            @if (isLoggedIn()) {
              <a routerLink="/mis-citas" class="text-sm font-medium text-white/70 hover:text-white transition-colors">
                Mis Citas
              </a>
              @if (isAdmin()) {
                <a routerLink="/admin" class="text-sm font-medium text-premium-400 hover:text-premium-300 transition-colors">
                  Admin
                </a>
              }
              <div class="flex items-center gap-3">
                <span class="text-xs text-white/40">{{ user()?.name }}</span>
                <button (click)="logout()" class="text-xs text-white/30 hover:text-white transition-colors">
                  Salir
                </button>
              </div>
            } @else {
              <a routerLink="/login" class="text-sm font-medium text-white/50 hover:text-white transition-colors">
                Entrar
              </a>
            }
          </div>

          <button
            (click)="toggleMenu()"
            class="md:hidden relative w-8 h-8 flex items-center justify-center"
            aria-label="Menú"
          >
            <div class="flex flex-col gap-1.5">
              <span
                [ngClass]="{ 'rotate-45 translate-y-[7px]': isMenuOpen() }"
                class="block w-6 h-[2px] bg-white transition-all duration-300"
              ></span>
              <span
                [ngClass]="{ 'opacity-0': isMenuOpen() }"
                class="block w-6 h-[2px] bg-white transition-all duration-300"
              ></span>
              <span
                [ngClass]="{ '-rotate-45 -translate-y-[7px]': isMenuOpen() }"
                class="block w-6 h-[2px] bg-white transition-all duration-300"
              ></span>
            </div>
          </button>

        </div>
      </div>

      @if (isMenuOpen()) {
        <div class="md:hidden glass border-t border-white/5 animate-fade-in">
          <div class="px-4 py-4 space-y-3">
            <a
              routerLink="/"
              (click)="closeMenu()"
              class="block py-2 text-white/70 hover:text-white text-sm font-medium"
            >
              Inicio
            </a>
            <a
              routerLink="/servicios"
              (click)="closeMenu()"
              class="block py-2 text-white/70 hover:text-white text-sm font-medium"
            >
              Servicios
            </a>
            <a
              routerLink="/equipo"
              (click)="closeMenu()"
              class="block py-2 text-white/70 hover:text-white text-sm font-medium"
            >
              Equipo
            </a>
            <a
              routerLink="/reservar"
              (click)="closeMenu()"
              class="btn-premium w-full text-center mt-2"
            >
              Reservar Cita
            </a>
            @if (isLoggedIn()) {
              <a routerLink="/mis-citas" (click)="closeMenu()" class="block py-2 text-white/70 hover:text-white text-sm font-medium">
                Mis Citas
              </a>
              @if (isAdmin()) {
                <a routerLink="/admin" (click)="closeMenu()" class="block py-2 text-premium-400 hover:text-premium-300 text-sm font-medium">
                  Panel Admin
                </a>
              }
              <button (click)="logout(); closeMenu()" class="block w-full text-left py-2 text-white/50 hover:text-white text-sm font-medium">
                Cerrar sesión
              </button>
            } @else {
              <a routerLink="/login" (click)="closeMenu()" class="block py-2 text-white/50 hover:text-white text-sm font-medium">
                Iniciar sesión
              </a>
            }
          </div>
        </div>
      }
    </nav>
  `,
})
export class NavbarComponent {
  private auth = inject(AuthService);
  private router = inject(Router);
  isScrolled = signal(false);
  isMenuOpen = signal(false);

  isLoggedIn = this.auth.isLoggedIn;
  isAdmin = this.auth.isAdmin;
  user = this.auth.user;

  @HostListener('window:scroll')
  onScroll(): void {
    this.isScrolled.set(window.scrollY > 20);
  }

  toggleMenu(): void {
    this.isMenuOpen.update(v => !v);
  }

  closeMenu(): void {
    this.isMenuOpen.set(false);
  }

  logout(): void {
    this.auth.logout();
    this.router.navigate(['/']);
  }
}
