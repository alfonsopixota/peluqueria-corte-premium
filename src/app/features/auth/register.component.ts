import { Component, inject, signal, ChangeDetectionStrategy } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { NgClass } from '@angular/common';
import { ApiService } from '../../shared/services/api.service';
import { AuthService } from '../../shared/services/auth.service';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [RouterLink, FormsModule, NgClass],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section class="min-h-screen pt-24 md:pt-32 pb-20 md:pb-32 flex items-center justify-center">
      <div class="mx-auto max-w-md w-full px-4">
        <div class="text-center mb-10">
          <span class="text-xs font-semibold uppercase tracking-[0.2em] text-premium-400">
            Bienvenido
          </span>
          <h1 class="mt-2 text-3xl md:text-4xl font-bold">Crear Cuenta</h1>
        </div>

        <form (ngSubmit)="onSubmit()" class="card-premium p-6 md:p-8 space-y-5">
          <div>
            <label class="block text-xs font-medium text-white/50 mb-2">Nombre</label>
            <input
              [(ngModel)]="name"
              name="name"
              type="text"
              required
              placeholder="Tu nombre"
              class="input-premium"
            />
          </div>

          <div>
            <label class="block text-xs font-medium text-white/50 mb-2">Email</label>
            <input
              [(ngModel)]="email"
              name="email"
              type="email"
              required
              placeholder="tu@email.com"
              class="input-premium"
            />
          </div>

          <div>
            <label class="block text-xs font-medium text-white/50 mb-2">Contraseña</label>
            <input
              [(ngModel)]="password"
              name="password"
              type="password"
              required
              placeholder="Mínimo 6 caracteres"
              class="input-premium"
            />
          </div>

          @if (error()) {
            <div class="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-sm text-red-400 text-center">
              {{ error() }}
            </div>
          }

          <button type="submit" [disabled]="loading()" class="btn-premium w-full py-3">
            {{ loading() ? 'Creando cuenta...' : 'Crear Cuenta' }}
          </button>

          <p class="text-center text-xs text-white/30">
            ¿Ya tienes cuenta?
            <a routerLink="/login" class="text-premium-400 hover:text-premium-300">Inicia sesión</a>
          </p>
        </form>
      </div>
    </section>
  `,
})
export class RegisterComponent {
  private api = inject(ApiService);
  private auth = inject(AuthService);
  private router = inject(Router);

  name = '';
  email = '';
  password = '';
  error = signal('');
  loading = signal(false);

  onSubmit(): void {
    if (!this.name || !this.email || !this.password) {
      this.error.set('Completa todos los campos.');
      return;
    }
    if (this.password.length < 6) {
      this.error.set('La contraseña debe tener al menos 6 caracteres.');
      return;
    }
    this.loading.set(true);
    this.error.set('');

    this.api.post<{ token: string; user: { id: string; email: string; name: string; role: string } }>('/auth/register', {
      name: this.name,
      email: this.email,
      password: this.password,
    }).subscribe({
      next: (res) => {
        this.auth.login(res.token, res.user);
        this.router.navigate(['/']);
      },
      error: (err) => {
        this.error.set(err.error?.error || 'Error al registrarse.');
        this.loading.set(false);
      },
    });
  }
}
