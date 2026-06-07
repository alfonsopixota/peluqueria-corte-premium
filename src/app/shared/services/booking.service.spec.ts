import { TestBed } from '@angular/core/testing';
import { BookingService } from './booking.service';
import { StorageService } from './storage.service';
import { ApiService } from './api.service';
import { provideHttpClient } from '@angular/common/http';
import { of } from 'rxjs';
import type { Service } from '../interfaces/service.interface';
import type { Stylist } from '../interfaces/stylist.interface';
import type { Appointment } from '../interfaces/appointment.interface';

const MOCK_SERVICE: Service = { id: 1, name: 'Corte Clásico', category: 'corte', description: '', price: 25, duration: 45, image: '' };
const MOCK_SERVICE_2: Service = { id: 2, name: 'Barba Completa', category: 'barba', description: '', price: 25, duration: 40, image: '' };
const MOCK_STYLIST: Stylist = { id: 1, name: 'Alejandro Vargas', title: 'Master Barber', bio: '', specialties: [], image: '', rating: 4.9 };
const CATALOG: Service[] = [
  { id: 1, name: 'Corte Clásico', category: 'corte', description: '', price: 25, duration: 45, image: '' },
  { id: 2, name: 'Barba Completa', category: 'barba', description: '', price: 25, duration: 40, image: '' },
  { id: 3, name: 'Coloración', category: 'color', description: '', price: 45, duration: 90, image: '' },
];

describe('BookingService', () => {
  let service: BookingService;
  let storageSpy: jasmine.SpyObj<StorageService>;
  let apiSpy: jasmine.SpyObj<ApiService>;

  beforeEach(() => {
    storageSpy = jasmine.createSpyObj('StorageService', ['getAppointments', 'saveAppointment', 'getNextAppointment', 'getBookedTimes']);
    storageSpy.getAppointments.and.resolveTo([]);
    storageSpy.saveAppointment.and.callFake(async (a: Appointment) => ({ ...a, _id: 'mock-id' }));
    storageSpy.getBookedTimes.and.resolveTo([]);

    apiSpy = jasmine.createSpyObj('ApiService', ['get', 'post', 'patch', 'delete']);

    TestBed.configureTestingModule({
      providers: [
        BookingService,
        { provide: StorageService, useValue: storageSpy },
        { provide: ApiService, useValue: apiSpy },
        provideHttpClient(),
      ],
    });

    service = TestBed.inject(BookingService);
  });

  it('should start at step 1 with empty state', () => {
    expect(service.currentStep()).toBe(1);
    expect(service.selectedServices()).toEqual([]);
    expect(service.selectedStylist()).toBeNull();
    expect(service.selectedDate()).toBeNull();
    expect(service.selectedTimeSlot()).toBeNull();
    expect(service.catalogServices()).toEqual([]);
  });

  describe('catalog vs selection isolation', () => {
    it('loadServices should NOT affect selectedServices or hasServices', async () => {
      apiSpy.get.and.returnValue(of(CATALOG));

      const result = await service.loadServices();

      expect(result.length).toBe(3);
      expect(service.catalogServices().length).toBe(3);
      expect(service.selectedServices()).toEqual([]);
      expect(service.hasServices()).toBeFalse();
    });

    it('toggleService should NOT affect catalogServices', async () => {
      apiSpy.get.and.returnValue(of(CATALOG));
      await service.loadServices();

      service.toggleService(MOCK_SERVICE);

      expect(service.catalogServices().length).toBe(3);
      expect(service.selectedServices().length).toBe(1);
    });

    it('isSelected returns true only for toggled services', () => {
      expect(service.isSelected(MOCK_SERVICE)).toBeFalse();
      service.toggleService(MOCK_SERVICE);
      expect(service.isSelected(MOCK_SERVICE)).toBeTrue();
      expect(service.isSelected(MOCK_SERVICE_2)).toBeFalse();
    });
  });

  describe('step management', () => {
    it('should update step', () => {
      service.setStep(3);
      expect(service.currentStep()).toBe(3);
    });
  });

  describe('service selection', () => {
    it('should add a service', () => {
      service.toggleService(MOCK_SERVICE);
      expect(service.selectedServices().length).toBe(1);
      expect(service.selectedServices()[0].id).toBe(1);
    });

    it('should remove a service on second toggle', () => {
      service.toggleService(MOCK_SERVICE);
      service.toggleService(MOCK_SERVICE);
      expect(service.selectedServices()).toEqual([]);
    });

    it('should allow multiple services', () => {
      service.toggleService(MOCK_SERVICE);
      service.toggleService(MOCK_SERVICE_2);
      expect(service.selectedServices().length).toBe(2);
    });

    it('hasServices should reflect selection', () => {
      expect(service.hasServices()).toBeFalse();
      service.toggleService(MOCK_SERVICE);
      expect(service.hasServices()).toBeTrue();
    });
  });

  describe('totalPrice and totalDuration', () => {
    it('should compute totalPrice correctly', () => {
      service.toggleService(MOCK_SERVICE);
      service.toggleService(MOCK_SERVICE_2);
      expect(service.totalPrice()).toBe(50);
    });

    it('should compute totalDuration correctly', () => {
      service.toggleService(MOCK_SERVICE);
      service.toggleService(MOCK_SERVICE_2);
      expect(service.totalDuration()).toBe(85);
    });
  });

  describe('stylist selection', () => {
    it('should set and reflect stylist', () => {
      expect(service.hasStylist()).toBeFalse();
      service.setStylist(MOCK_STYLIST);
      expect(service.hasStylist()).toBeTrue();
      expect(service.selectedStylist()?.name).toBe('Alejandro Vargas');
    });
  });

  describe('date and time', () => {
    it('setDate and setTimeSlot should make hasDate true', () => {
      service.setDate('2026-07-15');
      expect(service.hasDate()).toBeFalse();
      service.setTimeSlot('10:00');
      expect(service.selectedDate()).toBe('2026-07-15');
      expect(service.selectedTimeSlot()).toBe('10:00');
      expect(service.hasDate()).toBeTrue();
    });

    it('setTimeSlot with null should make hasDate false', () => {
      service.setDate('2026-07-15');
      service.setTimeSlot('10:00');
      expect(service.hasDate()).toBeTrue();
      service.setTimeSlot(null);
      expect(service.hasDate()).toBeFalse();
    });
  });

  describe('client form', () => {
    it('updateClientForm should merge partial data', () => {
      service.updateClientForm({ name: 'Juan', email: 'juan@test.com' });
      expect(service.clientFormData().name).toBe('Juan');
      expect(service.clientFormData().email).toBe('juan@test.com');
    });

    it('isValidClientForm should check name length', () => {
      service.updateClientForm({ name: 'Ju' });
      expect(service.isValidClientForm()).toBeFalse();
      service.updateClientForm({ name: 'Juan' });
      expect(service.isValidClientForm()).toBeTrue();
    });
  });

  describe('confirmBooking', () => {
    it('should return null if no services selected', async () => {
      service.setStylist(MOCK_STYLIST);
      service.setDate('2026-07-15');
      service.setTimeSlot('10:00');
      service.updateClientForm({ name: 'Juan' });
      const result = await service.confirmBooking();
      expect(result).toBeNull();
    });

    it('should return null if no stylist selected', async () => {
      service.toggleService(MOCK_SERVICE);
      service.setDate('2026-07-15');
      service.setTimeSlot('10:00');
      service.updateClientForm({ name: 'Juan' });
      const result = await service.confirmBooking();
      expect(result).toBeNull();
    });

    it('should return null if no name provided', async () => {
      service.toggleService(MOCK_SERVICE);
      service.setStylist(MOCK_STYLIST);
      service.setDate('2026-07-15');
      service.setTimeSlot('10:00');
      const result = await service.confirmBooking();
      expect(result).toBeNull();
    });

    it('should create appointment and persist when valid', async () => {
      service.toggleService(MOCK_SERVICE);
      service.setStylist(MOCK_STYLIST);
      service.setDate('2026-07-15');
      service.setTimeSlot('10:00');
      service.updateClientForm({ name: 'Juan', email: 'juan@test.com', phone: '612345678' });

      const result = await service.confirmBooking();
      expect(result).not.toBeNull();
      expect(result!.services.length).toBe(1);
      expect(result!.stylist.name).toBe('Alejandro Vargas');
      expect(result!.date).toBe('2026-07-15');
      expect(result!.time).toBe('10:00');
      expect(result!.client.name).toBe('Juan');
      expect(result!.totalPrice).toBe(25);
      expect(storageSpy.saveAppointment).toHaveBeenCalled();
    });
  });

  describe('reset', () => {
    it('should clear selection but preserve catalog', async () => {
      apiSpy.get.and.returnValue(of(CATALOG));
      await service.loadServices();

      service.toggleService(MOCK_SERVICE);
      service.setStylist(MOCK_STYLIST);
      service.setDate('2026-07-15');
      service.setTimeSlot('10:00');
      service.updateClientForm({ name: 'Juan' });
      service.reset();

      expect(service.currentStep()).toBe(1);
      expect(service.selectedServices()).toEqual([]);
      expect(service.selectedStylist()).toBeNull();
      expect(service.selectedDate()).toBeNull();
      expect(service.selectedTimeSlot()).toBeNull();
      expect(service.clientFormData()).toEqual({ name: '', email: '', phone: '', notes: '' });
      expect(service.catalogServices().length).toBe(3);
    });
  });
});
