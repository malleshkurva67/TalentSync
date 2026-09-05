import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../auth/auth.service';

export const roleGuard: CanActivateFn = (route) => {
  const authService = inject(AuthService);
  const router = inject(Router);
  const expectedRole = route.data['role'] as string;
  const user = authService.getCurrentUser();

  if (authService.isAuthenticated() && user && user.role === expectedRole) {
    return true;
  }

  router.navigateByUrl('/login');
  return false;
};
