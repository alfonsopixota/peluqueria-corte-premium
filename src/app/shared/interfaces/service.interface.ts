export type ServiceCategory = 'corte' | 'barba' | 'color' | 'tratamiento';

export interface Service {
  id: number;
  name: string;
  category: ServiceCategory;
  description: string;
  price: number;
  duration: number;
  image: string;
}
