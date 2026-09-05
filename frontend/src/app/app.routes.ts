import { Routes } from '@angular/router';
import { LoginComponent } from './login/login.component';
import { SignupComponent } from './signup/signup.component';
import { StudentDashboardComponent } from './dashboard/student-dashboard.component';
import { RecruiterDashboardComponent } from './dashboard/recruiter-dashboard.component';
import { authGuard } from './guards/auth.guard';
import { roleGuard } from './guards/role.guard';

export const routes: Routes = [
  { path: '', redirectTo: '/login', pathMatch: 'full' },
  { path: 'login', component: LoginComponent },
  { path: 'signup', component: SignupComponent },
  {
    path: 'student-dashboard',
    component: StudentDashboardComponent,
    canActivate: [authGuard, roleGuard],
    data: { role: 'student' }
  },
  {
    path: 'recruiter-dashboard',
    component: RecruiterDashboardComponent,
    canActivate: [authGuard, roleGuard],
    data: { role: 'recruiter' }
  },
  { path: '**', redirectTo: '/login' }
];
