import { Component, inject, signal, computed } from '@angular/core';
import { Router } from '@angular/router';
import { NgClass, DatePipe } from '@angular/common';
import { BookingService } from '../../../shared/services/booking.service';
import type { TimeSlot } from '../../../shared/interfaces/timeslot.interface';

@Component({
  selector: 'app-step-datetime',
  standalone: true,
  imports: [NgClass, DatePipe],
  template: `
    <div class="animate-slide-up">
      <h2 class="text-xl md:text-2xl font-semibold mb-2">Elige fecha y hora</h2>
      <p class="text-sm text-white/40 mb-8">
        Selecciona un día disponible y elige tu horario preferido.
      </p>

      <div class="flex items-center justify-between mb-6">
        <button (click)="prevMonth()" class="p-2 rounded-lg hover:bg-white/5 transition-colors">
          <svg class="w-5 h-5 text-white/50" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <span class="text-sm font-semibold">
          {{ currentMonth() | date:'MMMM yyyy' }}
        </span>
        <button (click)="nextMonth()" class="p-2 rounded-lg hover:bg-white/5 transition-colors">
          <svg class="w-5 h-5 text-white/50" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </div>

      <div class="grid grid-cols-7 gap-1 mb-2">
        @for (day of dayHeaders; track day) {
          <div class="text-center text-[10px] font-medium text-white/30 uppercase tracking-wider py-2">
            {{ day }}
          </div>
        }
      </div>

      <div class="grid grid-cols-7 gap-1">
        @for (day of calendarDays(); track day.date) {
          <button
            (click)="selectDate(day.date)"
            [disabled]="!day.available"
            [ngClass]="{
              'bg-premium-400 text-dark-900 font-semibold': day.selected,
              'bg-white/5 text-white hover:bg-white/10': day.available && !day.selected,
              'text-white/10 cursor-not-allowed': !day.available,
              'invisible': day.empty
            }"
            class="aspect-square rounded-lg text-xs flex items-center justify-center transition-all duration-200"
          >
            {{ !day.empty ? day.day : '' }}
          </button>
        }
      </div>

      @if (selectedDateStr()) {
        <div class="mt-8 animate-slide-up">
          <p class="text-sm font-medium text-white/70 mb-4">
            Horarios disponibles para <span class="text-premium-400">{{ formatSpanishDate(selectedDateStr()) }}</span>
          </p>

          @if (availableSlots().length === 0) {
            <p class="text-sm text-white/30 py-4 text-center">
              No hay horarios disponibles para esta fecha.
            </p>
          }

          <div class="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-2">
            @for (slot of availableSlots(); track slot.time) {
              <button
                (click)="selectTime(slot.time)"
                [disabled]="!slot.available"
                [ngClass]="{
              'bg-premium-400 text-dark-900 font-semibold border-premium-400': selectedTime() === slot.time,
              'bg-white/5 text-white/70 hover:bg-white/10 border-white/10': slot.available && selectedTime() !== slot.time,
                  'bg-white/[0.02] text-white/20 cursor-not-allowed border-white/[0.02]': !slot.available
                }"
                class="py-2.5 rounded-lg text-xs font-medium border transition-all duration-200"
              >
                {{ slot.time }}
              </button>
            }
          </div>
        </div>
      }

      <div class="mt-8 flex justify-between">
        <button (click)="back()" class="btn-premium-outline">
          ← Atrás
        </button>
        <button
          (click)="next()"
          [disabled]="!selectedDateStr() || !selectedTime()"
          class="btn-premium"
        >
          Continuar →
        </button>
      </div>
    </div>
  `,
})
export class StepDatetimeComponent {
  private booking = inject(BookingService);
  private router = inject(Router);

  dayHeaders = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];

  currentMonth = signal(new Date());
  selectedDateStr = signal<string | null>(this.booking.selectedDate());
  selectedTime = signal<string | null>(this.booking.selectedTimeSlot());

  calendarDays = computed(() => {
    const year = this.currentMonth().getFullYear();
    const month = this.currentMonth().getMonth();
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const firstDay = new Date(year, month, 1).getDay(); // 0=Sun
    const startOffset = firstDay === 0 ? 6 : firstDay - 1; // Monday=0

    const days: Array<{
      day: number;
      date: string;
      available: boolean;
      selected: boolean;
      empty: boolean;
    }> = [];

    for (let i = 0; i < startOffset; i++) {
      days.push({ day: 0, date: '', available: false, selected: false, empty: true });
    }

    for (let d = 1; d <= daysInMonth; d++) {
      const dateObj = new Date(year, month, d);
      const dateStr = this.formatDate(dateObj);
      const dayOfWeek = dateObj.getDay();
      const isPast = dateObj < today;
      const isSunday = dayOfWeek === 0;
      const available = !isPast && !isSunday;

      days.push({
        day: d,
        date: dateStr,
        available,
        selected: this.selectedDateStr() === dateStr,
        empty: false,
      });
    }

    return days;
  });

  availableSlots = computed(() => {
    return this.generateTimeSlots();
  });

  prevMonth(): void {
    const d = new Date(this.currentMonth());
    d.setMonth(d.getMonth() - 1);
    this.currentMonth.set(d);
  }

  nextMonth(): void {
    const d = new Date(this.currentMonth());
    d.setMonth(d.getMonth() + 1);
    this.currentMonth.set(d);
  }

  selectDate(date: string): void {
    this.selectedDateStr.set(date);
    this.selectedTime.set(null);
    this.booking.setDate(date);
    this.booking.setTimeSlot('');
  }

  selectTime(time: string): void {
    this.selectedTime.set(time);
    this.booking.setTimeSlot(time);
  }

  private generateTimeSlots(): TimeSlot[] {
    const slots: TimeSlot[] = [];
    const dateStr = this.selectedDateStr();
    if (!dateStr) return slots;

    const isSaturday = new Date(dateStr).getDay() === 6;
    const endHour = isSaturday ? 18 : 20;

    for (let h = 9; h < endHour; h++) {
      for (let m = 0; m < 60; m += 30) {
        const time = `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
        const now = new Date();
        const slotDate = new Date(`${dateStr}T${time}:00`);
        const available = slotDate > now;
        slots.push({ time, available });
      }
    }

    return slots;
  }

  private formatDate(d: Date): string {
    const y = d.getFullYear();
    const m = (d.getMonth() + 1).toString().padStart(2, '0');
    const day = d.getDate().toString().padStart(2, '0');
    return `${y}-${m}-${day}`;
  }

  formatSpanishDate(date: string | null): string {
    if (!date) return '';
    const d = new Date(date);
    const days = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
    const months = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];
    return `${days[d.getDay()]} ${d.getDate()} de ${months[d.getMonth()]}`;
  }

  back(): void {
    this.booking.setStep(2);
    this.router.navigate(['/reservar', 'paso-2']);
  }

  next(): void {
    if (this.selectedDateStr() && this.selectedTime()) {
      this.booking.setStep(4);
      this.router.navigate(['/reservar', 'paso-4']);
    }
  }
}
