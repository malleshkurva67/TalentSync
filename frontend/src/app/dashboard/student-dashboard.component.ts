import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../auth/auth.service';

@Component({
  selector: 'app-student-dashboard',
  standalone: true,
  imports: [CommonModule],
  template: `
    <section class="dashboard-shell">
      <div class="dashboard-card">
        <div class="heading-row">
          <div>
            <p class="eyebrow">Student dashboard</p>
            <h1>Welcome back</h1>
          </div>
          <button (click)="logout()">Logout</button>
        </div>
        <p>Your profile and job opportunities will appear here in the next stage.</p>
      </div>
    </section>
  `,
  styles: [
    '.dashboard-shell { min-height: 100vh; display: grid; place-items: center; background: #f3f6ff; padding: 24px; }',
    '.dashboard-card { width: min(100%, 720px); background: white; border-radius: 20px; box-shadow: 0 18px 40px rgba(15, 23, 42, 0.08); padding: 28px; }',
    '.heading-row { display: flex; justify-content: space-between; align-items: center; gap: 20px; }',
    '.eyebrow { margin: 0 0 8px; text-transform: uppercase; letter-spacing: 0.12em; color: #4f46e5; font-size: 11px; font-weight: 700; }',
    'h1 { margin: 0; color: #111827; }',
    'button { background: #111827; color: white; border: 0; border-radius: 10px; padding: 10px 16px; cursor: pointer; }',
    'p { color: #4b5563; margin-top: 18px; }'
  ]
})
export class StudentDashboardComponent {
  constructor(private authService: AuthService, private router: Router) {}

  logout(): void {
    this.authService.logout();
    this.router.navigateByUrl('/login');
  }
}
