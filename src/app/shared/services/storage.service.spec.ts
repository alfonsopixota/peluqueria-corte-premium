import { StorageService } from './storage.service';
import type { Appointment } from '../interfaces/appointment.interface';

const MOCK_APPOINTMENT: Appointment = {
  id: '1',
  services: [{ id: 1, name: 'Corte Clásico', category: 'corte', description: '', price: 25, duration: 45, image: '' }],
  stylist: { id: 1, name: 'Alejandro Vargas', title: 'Master Barber', bio: '', specialties: [], image: '', rating: 4.9 },
  date: '2026-07-15',
  time: '10:00',
  client: { name: 'Test', email: 'test@test.com', phone: '612345678', notes: '' },
  totalPrice: 25,
  totalDuration: 45,
  createdAt: new Date().toISOString(),
};

describe('StorageService', () => {
  let service: StorageService;
  const KEY = 'cp-appointments';

  beforeEach(() => {
    localStorage.clear();
    service = new StorageService();
  });

  afterEach(() => {
    localStorage.clear();
  });

  it('should return empty array when localStorage is empty', () => {
    expect(service.getAppointments()).toEqual([]);
  });

  it('should return empty array when localStorage has invalid JSON', () => {
    localStorage.setItem(KEY, 'not-json');
    expect(service.getAppointments()).toEqual([]);
  });

  it('should save and retrieve appointments', () => {
    service.saveAppointment(MOCK_APPOINTMENT);
    const all = service.getAppointments();
    expect(all.length).toBe(1);
    expect(all[0].id).toBe('1');
    expect(all[0].client.name).toBe('Test');
  });

  it('should persist multiple appointments', () => {
    const second = { ...MOCK_APPOINTMENT, id: '2', time: '11:00' };
    service.saveAppointment(MOCK_APPOINTMENT);
    service.saveAppointment(second);
    expect(service.getAppointments().length).toBe(2);
  });

  it('getNextAppointment should return null when no appointments', () => {
    expect(service.getNextAppointment()).toBeNull();
  });

  it('getNextAppointment should return null when all appointments are in the past', () => {
    const pastDate = new Date();
    pastDate.setDate(pastDate.getDate() - 10);
    const past = {
      ...MOCK_APPOINTMENT,
      date: pastDate.toISOString().split('T')[0],
      time: '10:00',
    };
    service.saveAppointment(past);
    expect(service.getNextAppointment()).toBeNull();
  });

  it('getNextAppointment should return the nearest future appointment', () => {
    const later = {
      ...MOCK_APPOINTMENT,
      id: '2',
      date: '2030-12-25',
      time: '12:00',
    };
    const sooner = {
      ...MOCK_APPOINTMENT,
      id: '1',
      date: '2030-06-15',
      time: '10:00',
    };
    service.saveAppointment(later);
    service.saveAppointment(sooner);
    const next = service.getNextAppointment();
    expect(next).not.toBeNull();
    expect(next!.id).toBe('1');
  });
});
