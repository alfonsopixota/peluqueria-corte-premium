import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { BookingService } from '../services/booking.service';

export const bookingStepGuard: CanActivateFn = (route) => {
  const booking = inject(BookingService);
  const router = inject(Router);
  const path = route.routeConfig?.path ?? '';

  const guards: Record<string, () => boolean> = {
    'paso-2': () => booking.hasServices(),
    'paso-3': () => booking.hasServices() && booking.hasStylist(),
    'paso-4': () => booking.hasServices() && booking.hasStylist() && booking.hasDate(),
  };

  const check = guards[path];
  if (check && !check()) {
    return router.parseUrl('/reservar/paso-1');
  }

  return true;
};
