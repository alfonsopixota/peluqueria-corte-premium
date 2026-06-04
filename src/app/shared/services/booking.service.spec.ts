import { TestBed } from '@angular/core/testing';
import { BookingService } from './booking.service';
import { StorageService } from './storage.service';
import type { Service } from '../interfaces/service.interface';
import type { Stylist } from '../interfaces/stylist.interface';

const MOCK_SERVICE: Service = { id: 1, name: 'Corte Clásico', category: 'corte', description: '', price: 25, duration: 45, image: '' };
const MOCK_SERVICE_2: Service = { id: 2, name: 'Barba Completa', category: 'barba', description: '', price: 25, duration: 40, image: '' };
const MOCK_STYLIST: Stylist = { id: 1, name: 'Alejandro Vargas', title: 'Master Barber', bio: '', specialties: [], image: '', rating: 4.9 };

describe('BookingService', () => {
  let service: BookingService;
  let storageSpy: jasmine.SpyObj<StorageService>;

  beforeEach(() => {
    storageSpy = jasmine.createSpyObj('StorageService', ['getAppointments', 'saveAppointment']);
    storageSpy.getAppointments.and.returnValue([]);

    TestBed.configureTestingModule({
      providers: [
        BookingService,
        { provide: StorageService, useValue: storageSpy },
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
    it('should return null if no services selected', () => {
      service.setStylist(MOCK_STYLIST);
      service.setDate('2026-07-15');
      service.setTimeSlot('10:00');
      service.updateClientForm({ name: 'Juan' });
      expect(service.confirmBooking()).toBeNull();
    });

    it('should return null if no stylist selected', () => {
      service.toggleService(MOCK_SERVICE);
      service.setDate('2026-07-15');
      service.setTimeSlot('10:00');
      service.updateClientForm({ name: 'Juan' });
      expect(service.confirmBooking()).toBeNull();
    });

    it('should return null if no name provided', () => {
      service.toggleService(MOCK_SERVICE);
      service.setStylist(MOCK_STYLIST);
      service.setDate('2026-07-15');
      service.setTimeSlot('10:00');
      expect(service.confirmBooking()).toBeNull();
    });

    it('should create appointment and persist when valid', () => {
      service.toggleService(MOCK_SERVICE);
      service.setStylist(MOCK_STYLIST);
      service.setDate('2026-07-15');
      service.setTimeSlot('10:00');
      service.updateClientForm({ name: 'Juan', email: 'juan@test.com', phone: '612345678' });

      const result = service.confirmBooking();
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
    it('should clear all state', () => {
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
    });
  });
});
