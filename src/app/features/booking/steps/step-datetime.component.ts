import { Component, inject, signal, computed, OnInit, ChangeDetectionStrategy } from '@angular/core';
import { Router } from '@angular/router';
import { NgClass, DatePipe } from '@angular/common';
import { firstValueFrom } from 'rxjs';
import { BookingService } from '../../../shared/services/booking.service';
import { ApiService } from '../../../shared/services/api.service';
import { BUSINESS_HOURS } from '../../../shared/config/business-hours';
import type { TimeSlot } from '../../../shared/interfaces/timeslot.interface';

@Component({
  selector: 'app-step-datetime',
  standalone: true,
  imports: [NgClass, DatePipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './step-datetime.component.html',
})
export class StepDatetimeComponent implements OnInit {
  private booking = inject(BookingService);
  private api = inject(ApiService);
  private router = inject(Router);

  dayHeaders = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];

  currentMonth = signal(new Date());
  selectedDateStr = signal<string | null>(this.booking.selectedDate());
  selectedTime = signal<string | null>(this.booking.selectedTimeSlot());
  bookedTimes = signal<Set<string>>(new Set());

  ngOnInit(): void {
    const savedDate = this.selectedDateStr();
    if (savedDate) {
      this.loadBookedTimes(savedDate);
    }
  }

  calendarDays = computed(() => {
    const year = this.currentMonth().getFullYear();
    const month = this.currentMonth().getMonth();
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const firstDay = new Date(year, month, 1).getDay();
    const startOffset = firstDay === 0 ? 6 : firstDay - 1;

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
      const isClosed = (BUSINESS_HOURS.closedDays as readonly number[]).includes(dayOfWeek);
      const available = !isPast && !isClosed;

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
    this.booking.setTimeSlot(null);
    this.loadBookedTimes(date);
  }

  selectTime(time: string): void {
    this.selectedTime.set(time);
    this.booking.setTimeSlot(time);
  }

  private async loadBookedTimes(date: string): Promise<void> {
    const stylist = this.booking.selectedStylist();
    if (!stylist) return;
    try {
      const times = await firstValueFrom(
        this.api.get<string[]>(`/appointments/availability?date=${date}&stylistId=${stylist.id}`)
      );
      this.bookedTimes.set(new Set(times));
    } catch {
      this.bookedTimes.set(new Set());
    }
  }

  private generateTimeSlots(): TimeSlot[] {
    const slots: TimeSlot[] = [];
    const dateStr = this.selectedDateStr();
    const stylist = this.booking.selectedStylist();
    if (!dateStr || !stylist) return slots;

    const isSaturday = new Date(dateStr).getDay() === 6;
    const endHour = isSaturday ? BUSINESS_HOURS.closeHourSaturday : BUSINESS_HOURS.closeHour;
    const booked = this.bookedTimes();
    const now = new Date();

    for (let h = BUSINESS_HOURS.openHour; h < endHour; h++) {
      for (let m = 0; m < 60; m += BUSINESS_HOURS.slotMinutes) {
        const time = `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
        const slotDate = new Date(`${dateStr}T${time}:00`);
        const available = slotDate > now && !booked.has(time);
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
    this.router.navigate(['/reservar', 'paso-2']).then(ok => {
      if (ok) this.booking.setStep(2);
    });
  }

  next(): void {
    if (this.selectedDateStr() && this.selectedTime()) {
      this.router.navigate(['/reservar', 'paso-4']).then(ok => {
        if (ok) this.booking.setStep(4);
      });
    }
  }
}
