import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../auth/auth.service';

@Component({
  selector: 'app-signup',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './signup.component.html',
  styleUrl: './signup.component.scss'
})
export class SignupComponent {
  isSubmitting = false;
  errorMessage = '';
  successMessage = '';
  form: ReturnType<FormBuilder['group']>;

  constructor(
    private readonly fb: FormBuilder,
    private readonly authService: AuthService,
    private readonly router: Router
  ) {
    this.form = this.fb.group({
      role: ['student', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]],
      fullName: [''],
      companyName: [''],
      phone: [''],
      university: [''],
      degree: [''],
      graduationYear: [''],
      skills: [''],
      bio: [''],
      contactPerson: [''],
      companyWebsite: [''],
      position: ['']
    });
  }

  get selectedRole(): string {
    return this.form.get('role')?.value ?? 'student';
  }

  onSubmit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      this.errorMessage = 'Please complete the required fields before continuing.';
      return;
    }

    this.isSubmitting = true;
    this.errorMessage = '';
    this.successMessage = '';

    const payload = {
      ...this.form.value,
      email: (this.form.value.email ?? '').trim().toLowerCase(),
      fullName: this.form.value.fullName?.trim(),
      companyName: this.form.value.companyName?.trim(),
      phone: this.form.value.phone?.trim(),
      university: this.form.value.university?.trim(),
      degree: this.form.value.degree?.trim(),
      graduationYear: this.form.value.graduationYear ? Number(this.form.value.graduationYear) : null,
      skills: this.form.value.skills?.trim(),
      bio: this.form.value.bio?.trim(),
      contactPerson: this.form.value.contactPerson?.trim(),
      companyWebsite: this.form.value.companyWebsite?.trim(),
      position: this.form.value.position?.trim()
    };

    this.authService.register(payload).subscribe({
      next: () => {
        this.isSubmitting = false;
        this.successMessage = 'Account created successfully! Redirecting to dashboard...';
        const user = this.authService.getCurrentUser();
        const route = user?.role === 'recruiter' ? '/recruiter-dashboard' : '/student-dashboard';
        setTimeout(() => this.router.navigateByUrl(route), 800);
      },
      error: (error) => {
        this.isSubmitting = false;
        this.errorMessage = error?.error?.message ?? 'Registration failed. Please try again.';
      }
    });
  }
}
