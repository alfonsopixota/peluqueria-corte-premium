import { Pipe, PipeTransform } from '@angular/core';

const DAYS = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
const MONTHS = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];

@Pipe({ name: 'formatDate', standalone: true })
export class FormatDatePipe implements PipeTransform {
  transform(date: string | null, showYear = true): string {
    if (!date) return '';
    const d = new Date(date);
    const dayName = DAYS[d.getDay()];
    const monthName = MONTHS[d.getMonth()];
    return showYear
      ? `${dayName}, ${d.getDate()} de ${monthName} de ${d.getFullYear()}`
      : `${dayName} ${d.getDate()} de ${monthName}`;
  }
}
