import { Component, inject, OnInit, OnDestroy, signal, ChangeDetectionStrategy } from '@angular/core';
import { Router } from '@angular/router';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { NgClass } from '@angular/common';
import { firstValueFrom, Subscription } from 'rxjs';
import { BookingService } from '../../../shared/services/booking.service';
import { ApiService } from '../../../shared/services/api.service';
import { FormatDatePipe } from '../../../shared/pipes/format-date.pipe';

@Component({
  selector: 'app-step-confirmation',
  standalone: true,
  imports: [ReactiveFormsModule, NgClass, FormatDatePipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './step-confirmation.component.html',
})
export class StepConfirmationComponent implements OnInit, OnDestroy {
  private fb = inject(FormBuilder);
  private booking = inject(BookingService);
  private api = inject(ApiService);
  private router = inject(Router);

  form: FormGroup;
  confirmed = false;
  errorMsg = signal('');
  paymentLoading = signal(false);
  private formSub: Subscription | null = null;

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
    this.formSub = this.form.valueChanges.subscribe((v: Record<string, unknown>) => {
      this.booking.updateClientForm(v);
    });
  }

  ngOnDestroy(): void {
    this.formSub?.unsubscribe();
  }

  async onSubmit(): Promise<void> {
    if (!this.form.valid) {
      Object.keys(this.form.controls).forEach(key => {
        this.form.get(key)?.markAsTouched();
      });
      return;
    }

    try {
      const result = await this.booking.confirmBooking();
      if (result) {
        this.confirmed = true;
        this.errorMsg.set('');
      } else {
        this.errorMsg.set('No se pudo confirmar la cita. Revisa los datos e inténtalo de nuevo.');
      }
    } catch (e: unknown) {
      this.errorMsg.set(
        (e as { error?: { error?: string } })?.error?.error ||
        'No se pudo confirmar la cita. Inténtalo de nuevo.'
      );
    }
  }

  async payWithStripe(): Promise<void> {
    if (this.form.invalid) {
      Object.keys(this.form.controls).forEach(key => this.form.get(key)?.markAsTouched());
      return;
    }

    this.paymentLoading.set(true);
    this.errorMsg.set('');

    const body = {
      services: this.booking.selectedServices(),
      stylist: this.booking.selectedStylist(),
      date: this.booking.selectedDate(),
      time: this.booking.selectedTimeSlot(),
      client: this.booking.clientFormData(),
      totalPrice: this.booking.totalPrice(),
      totalDuration: this.booking.totalDuration(),
    };

    try {
      const result = await firstValueFrom(this.api.post<{ url: string }>('/payment/create-checkout-session', body));
      if (result?.url) {
        window.location.href = result.url;
      } else {
        this.errorMsg.set('Error al crear la sesión de pago.');
      }
    } catch (e: unknown) {
      this.errorMsg.set((e as { error?: { error?: string } })?.error?.error || 'Error al procesar el pago.');
    } finally {
      this.paymentLoading.set(false);
    }
  }

  back(): void {
    this.router.navigate(['/reservar', 'paso-3']).then(ok => {
      if (ok) this.booking.setStep(3);
    });
  }

  goHome(): void {
    this.booking.reset();
    this.router.navigate(['/']);
  }
}
