import type { Service } from './service.interface';
import type { Stylist } from './stylist.interface';

export interface ClientForm {
  name: string;
  email: string;
  phone: string;
  notes: string;
}

export interface Appointment {
  id: string;
  services: Service[];
  stylist: Stylist;
  date: string;
  time: string;
  client: ClientForm;
  totalPrice: number;
  totalDuration: number;
  createdAt: string;
}
