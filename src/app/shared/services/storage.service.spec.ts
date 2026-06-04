import { TestBed } from '@angular/core/testing';
import { StorageService } from './storage.service';
import { ApiService } from './api.service';
import { provideHttpClient } from '@angular/common/http';
import type { Appointment } from '../interfaces/appointment.interface';

const MOCK_APPOINTMENT: Appointment = {
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
  let apiSpy: jasmine.SpyObj<ApiService>;
  const KEY = 'cp-appointments';

  beforeEach(() => {
    localStorage.clear();
    apiSpy = jasmine.createSpyObj('ApiService', ['get', 'post']);
    apiSpy.get.and.returnValue({ toPromise: () => Promise.reject('offline') } as any);
    apiSpy.post.and.returnValue({ toPromise: () => Promise.reject('offline') } as any);

    TestBed.configureTestingModule({
      providers: [
        StorageService,
        { provide: ApiService, useValue: apiSpy },
        provideHttpClient(),
      ],
    });

    service = TestBed.inject(StorageService);
  });

  afterEach(() => {
    localStorage.clear();
  });

  it('should return empty array when localStorage is empty', async () => {
    const result = await service.getAppointments();
    expect(result).toEqual([]);
  });

  it('should return empty array when localStorage has invalid JSON', async () => {
    localStorage.setItem(KEY, 'not-json');
    const result = await service.getAppointments();
    expect(result).toEqual([]);
  });

  it('should save and retrieve appointments (local fallback)', async () => {
    const saved = await service.saveAppointment(MOCK_APPOINTMENT);
    expect(saved).not.toBeNull();
    const all = await service.getAppointments();
    expect(all.length).toBe(1);
    expect(all[0].client.name).toBe('Test');
  });

  it('should persist multiple appointments', async () => {
    const second = { ...MOCK_APPOINTMENT, time: '11:00', createdAt: new Date().toISOString() };
    await service.saveAppointment(MOCK_APPOINTMENT);
    await service.saveAppointment(second);
    const all = await service.getAppointments();
    expect(all.length).toBe(2);
  });

  it('getNextAppointment should return null when no appointments', async () => {
    const result = await service.getNextAppointment();
    expect(result).toBeNull();
  });

  it('getNextAppointment should return null when all appointments are in the past', async () => {
    const pastDate = new Date();
    pastDate.setDate(pastDate.getDate() - 10);
    const past = {
      ...MOCK_APPOINTMENT,
      date: pastDate.toISOString().split('T')[0],
      time: '10:00',
      createdAt: new Date().toISOString(),
    };
    await service.saveAppointment(past);
    const next = await service.getNextAppointment();
    expect(next).toBeNull();
  });

  it('getNextAppointment should return the nearest future appointment', async () => {
    const later = {
      ...MOCK_APPOINTMENT,
      date: '2030-12-25',
      time: '12:00',
      createdAt: new Date().toISOString(),
    };
    const sooner = {
      ...MOCK_APPOINTMENT,
      date: '2030-06-15',
      time: '10:00',
      createdAt: new Date().toISOString(),
    };
    await service.saveAppointment(later);
    await service.saveAppointment(sooner);
    const next = await service.getNextAppointment();
    expect(next).not.toBeNull();
  });
});
