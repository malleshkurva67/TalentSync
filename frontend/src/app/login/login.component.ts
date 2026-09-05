import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../auth/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './login.component.html',
  styleUrl: './login.component.scss'
})
export class LoginComponent {
  isSubmitting = false;
  errorMessage = '';
  form: ReturnType<FormBuilder['group']>;

  constructor(
    private readonly fb: FormBuilder,
    private readonly authService: AuthService,
    private readonly router: Router
  ) {
    this.form = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]],
      role: ['student', Validators.required]
    });
  }

  onSubmit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      this.errorMessage = 'Please enter a valid email and password.';
      return;
    }

    this.isSubmitting = true;
    this.errorMessage = '';

    const { email, password, role } = this.form.value;

    this.authService.login({
      email: email ?? '',
      password: password ?? '',
      role: role ?? 'student'
    }).subscribe({
      next: () => this.redirectBasedOnRole(),
      error: (error) => {
        this.isSubmitting = false;
        this.errorMessage = error?.error?.message ?? 'Login failed. Please try again.';
      }
    });
  }

  private redirectBasedOnRole(): void {
    const user = this.authService.getCurrentUser();
    const destination = user?.role === 'recruiter' ? '/recruiter-dashboard' : '/student-dashboard';
    this.router.navigateByUrl(destination);
  }
}
