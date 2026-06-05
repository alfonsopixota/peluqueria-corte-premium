import { Routes } from '@angular/router';
import { HomeComponent } from './features/home/home.component';
import { ServicesComponent } from './features/services/services.component';
import { TeamComponent } from './features/team/team.component';
import { LoginComponent } from './features/auth/login.component';
import { RegisterComponent } from './features/auth/register.component';
import { AdminComponent } from './features/admin/admin.component';
import { MyAppointmentsComponent } from './features/my-appointments/my-appointments.component';
import { PaymentSuccessComponent } from './features/booking/payment-success.component';
import { BookingComponent } from './features/booking/booking.component';
import { StepServicesComponent } from './features/booking/steps/step-services.component';
import { StepStylistComponent } from './features/booking/steps/step-stylist.component';
import { StepDatetimeComponent } from './features/booking/steps/step-datetime.component';
import { StepConfirmationComponent } from './features/booking/steps/step-confirmation.component';
import { bookingStepGuard } from './shared/guards/booking.guard';
import { adminGuard } from './shared/guards/admin.guard';
import { authGuard } from './shared/guards/auth.guard';

export const routes: Routes = [
  { path: '', component: HomeComponent },
  { path: 'servicios', component: ServicesComponent },
  { path: 'equipo', component: TeamComponent },
  { path: 'login', component: LoginComponent },
  { path: 'registro', component: RegisterComponent },
  { path: 'admin', component: AdminComponent, canActivate: [adminGuard] },
  { path: 'mis-citas', component: MyAppointmentsComponent, canActivate: [authGuard] },
  { path: 'reservar/exito', component: PaymentSuccessComponent },
  {
    path: 'reservar',
    component: BookingComponent,
    children: [
      { path: 'paso-1', component: StepServicesComponent },
      { path: 'paso-2', component: StepStylistComponent, canActivate: [bookingStepGuard] },
      { path: 'paso-3', component: StepDatetimeComponent, canActivate: [bookingStepGuard] },
      { path: 'paso-4', component: StepConfirmationComponent, canActivate: [bookingStepGuard] },
      { path: '', redirectTo: 'paso-1', pathMatch: 'full' },
    ],
  },
  { path: '**', redirectTo: '', pathMatch: 'full' },
];
