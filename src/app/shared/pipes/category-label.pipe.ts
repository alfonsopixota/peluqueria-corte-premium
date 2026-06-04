import { Pipe, PipeTransform } from '@angular/core';

const LABELS: Record<string, string> = {
  corte: 'Corte',
  barba: 'Barba',
  color: 'Color',
  tratamiento: 'Tratamiento',
};

@Pipe({ name: 'categoryLabel', standalone: true })
export class CategoryLabelPipe implements PipeTransform {
  transform(category: string): string {
    return LABELS[category] ?? category;
  }
}
