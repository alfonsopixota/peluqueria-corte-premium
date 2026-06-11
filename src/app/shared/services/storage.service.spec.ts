import { TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
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
    // Por defecto el backend de lectura está offline: getAppointments cae a la
    // copia local (comportamiento válido para lectura).
    apiSpy.get.and.returnValue(throwError(() => 'offline') as unknown as ReturnType<typeof apiSpy.get>);
    // La escritura sí exige servidor: el POST devuelve la cita creada con un _id único.
    let seq = 0;
    apiSpy.post.and.callFake(((_path: string, body: unknown) =>
      of({ ...(body as Appointment), _id: `srv-${++seq}` })) as unknown as typeof apiSpy.post);

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

  it('should save via the server and retrieve it locally', async () => {
    const saved = await service.saveAppointment(MOCK_APPOINTMENT);
    expect(saved).not.toBeNull();
    expect(saved?._id).toBe('srv-1');
    const all = await service.getAppointments();
    expect(all.length).toBe(1);
    expect(all[0].client.name).toBe('Test');
  });

  it('should reject (not fake success) when the server is unreachable', async () => {
    apiSpy.post.and.returnValue(throwError(() => 'offline') as unknown as ReturnType<typeof apiSpy.post>);
    await expectAsync(service.saveAppointment(MOCK_APPOINTMENT)).toBeRejected();
    expect(await service.getAppointments()).toEqual([]);
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
