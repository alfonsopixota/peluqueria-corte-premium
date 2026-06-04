import { Component, inject, OnInit, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';
import { DatePipe } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { NgClass } from '@angular/common';
import { BookingService } from '../../../shared/services/booking.service';

@Component({
  selector: 'app-step-confirmation',
  standalone: true,
  imports: [ReactiveFormsModule, DatePipe, NgClass],
  template: `
    <div class="animate-slide-up">
      <h2 class="text-xl md:text-2xl font-semibold mb-2">Confirma tu reserva</h2>
      <p class="text-sm text-white/40 mb-8">
        Revisa los datos de tu cita y completa tus datos personales.
      </p>

      <div class="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <div class="card-premium p-5 !border-white/5 !bg-white/[0.02]">
          <p class="text-xs font-medium uppercase tracking-wider text-premium-400 mb-3">Servicios</p>
          <div class="space-y-2">
            @for (svc of selectedServices; track svc.id) {
              <div class="flex justify-between text-sm">
                <span class="text-white/70">{{ svc.name }}</span>
                <span class="text-white font-medium">{{ svc.price }}€</span>
              </div>
            }
          </div>
          <div class="mt-3 pt-3 border-t border-white/5 flex justify-between text-sm">
            <span class="text-white/50">Total</span>
            <span class="text-premium-400 font-bold">{{ totalPrice }}€</span>
          </div>
          <div class="mt-1 text-xs text-white/30">
            Duración total: {{ totalDuration }} min
          </div>
        </div>

        <div class="space-y-4">
          <div class="card-premium p-5 !border-white/5 !bg-white/[0.02]">
            <p class="text-xs font-medium uppercase tracking-wider text-premium-400 mb-2">Barbero</p>
            <p class="text-sm text-white font-medium">{{ selectedStylist?.name }}</p>
            <p class="text-xs text-white/40">{{ selectedStylist?.title }}</p>
          </div>
          <div class="card-premium p-5 !border-white/5 !bg-white/[0.02]">
            <p class="text-xs font-medium uppercase tracking-wider text-premium-400 mb-2">Fecha y Hora</p>
            <p class="text-sm text-white font-medium">{{ formatDate(selectedDate) }}</p>
            <p class="text-xs text-premium-400">{{ selectedTime }} h</p>
          </div>
        </div>
      </div>

      <form [formGroup]="form" (ngSubmit)="onSubmit()" class="space-y-5">
        <div>
          <label class="block text-xs font-medium text-white/50 mb-2">Nombre completo</label>
          <input
            formControlName="name"
            type="text"
            placeholder="Ej: Juan Pérez"
            class="input-premium"
            [ngClass]="{'border-red-500/50': form.get('name')?.invalid && form.get('name')?.touched}"
          />
          @if (form.get('name')?.invalid && form.get('name')?.touched) {
            <p class="text-xs text-red-400/80 mt-1">El nombre es obligatorio (mín. 3 caracteres)</p>
          }
        </div>

        <div>
          <label class="block text-xs font-medium text-white/50 mb-2">Correo electrónico</label>
          <input
            formControlName="email"
            type="email"
            placeholder="ejemplo@correo.com"
            class="input-premium"
            [ngClass]="{'border-red-500/50': form.get('email')?.invalid && form.get('email')?.touched}"
          />
          @if (form.get('email')?.invalid && form.get('email')?.touched) {
            <p class="text-xs text-red-400/80 mt-1">Introduce un email válido</p>
          }
        </div>

        <div>
          <label class="block text-xs font-medium text-white/50 mb-2">Teléfono</label>
          <input
            formControlName="phone"
            type="tel"
            placeholder="+34 612 345 678"
            class="input-premium"
            [ngClass]="{'border-red-500/50': form.get('phone')?.invalid && form.get('phone')?.touched}"
          />
          @if (form.get('phone')?.invalid && form.get('phone')?.touched) {
            <p class="text-xs text-red-400/80 mt-1">Introduce un teléfono válido (9-15 dígitos)</p>
          }
        </div>

        <div>
          <label class="block text-xs font-medium text-white/50 mb-2">Notas adicionales (opcional)</label>
          <textarea
            formControlName="notes"
            rows="2"
            placeholder="Alguna preferencia o comentario..."
            class="input-premium resize-none"
          ></textarea>
        </div>

        <div class="flex justify-between pt-4">
          <button type="button" (click)="back()" class="btn-premium-outline">
            ← Atrás
          </button>
          <button
            type="submit"
            [disabled]="form.invalid"
            class="btn-premium"
          >
            Confirmar Reserva
          </button>
        </div>
      </form>

      @if (confirmed) {
        <div class="mt-6 p-5 rounded-xl bg-premium-400/10 border border-premium-400/20 text-center animate-scale-in">
          <svg class="w-10 h-10 text-premium-400 mx-auto mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <p class="text-premium-400 font-semibold">¡Cita confirmada!</p>
          <p class="text-sm text-white/50 mt-1">Te hemos enviado un resumen a tu correo.</p>
          <button (click)="goHome()" class="btn-premium-outline mt-4 text-xs">
            Volver al inicio
          </button>
        </div>
      }
    </div>
  `,
})
export class StepConfirmationComponent implements OnInit, OnDestroy {
  private fb = inject(FormBuilder);
  private booking = inject(BookingService);
  private router = inject(Router);

  form: FormGroup;
  confirmed = false;
  private formSub: any;

  get selectedServices() {
    return this.booking.selectedServices();
  }

  get selectedStylist() {
    return this.booking.selectedStylist();
  }

  get selectedDate() {
    return this.booking.selectedDate();
  }

  get selectedTime() {
    return this.booking.selectedTimeSlot();
  }

  get totalPrice() {
    return this.booking.totalPrice();
  }

  get totalDuration() {
    return this.booking.totalDuration();
  }

  constructor() {
    const clientData = this.booking.clientFormData();
    this.form = this.fb.group({
      name: [clientData.name, [Validators.required, Validators.minLength(3)]],
      email: [clientData.email, [Validators.required, Validators.email]],
      phone: [clientData.phone, [Validators.required, Validators.pattern(/^\+?[\d\s\-()]{9,15}$/)]],
      notes: [clientData.notes],
    });
  }

  ngOnInit(): void {
    this.formSub = this.form.valueChanges.subscribe((v: Record<string, any>) => {
      this.booking.updateClientForm(v);
    });
  }

  ngOnDestroy(): void {
    if (this.formSub) this.formSub.unsubscribe();
  }

  onSubmit(): void {
    if (this.form.valid) {
      const result = this.booking.confirmBooking();
      if (result) {
        this.confirmed = true;
      }
    } else {
      Object.keys(this.form.controls).forEach(key => {
        this.form.get(key)?.markAsTouched();
      });
    }
  }

  formatDate(date: string | null): string {
    if (!date) return '';
    const d = new Date(date);
    const days = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
    const months = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];
    return `${days[d.getDay()]}, ${d.getDate()} de ${months[d.getMonth()]} de ${d.getFullYear()}`;
  }

  back(): void {
    this.booking.setStep(3);
    this.router.navigate(['/reservar', 'paso-3']);
  }

  goHome(): void {
    this.booking.reset();
    this.router.navigate(['/']);
  }
}
