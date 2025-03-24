import { inject } from '@angular/core';
import {
  CanActivateFn,
  Router,
  ActivatedRouteSnapshot,
  RouterStateSnapshot,
} from '@angular/router';
import { AuthService } from '../services/auth.service';

export const roleGuard: CanActivateFn = (
  route: ActivatedRouteSnapshot,
  state: RouterStateSnapshot
) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  if (!authService.isAuthenticated()) {
    console.log('Not authenticated');
    router.navigate(['/login']);
    return false;
  }

  const allowedRoles = route.data['roles'] as Array<string>;
  const userRole = authService.getUserRole();

  if (!allowedRoles || allowedRoles.length === 0) {
    return true;
  }

  if (!userRole || !allowedRoles.includes(userRole)) {
    router.navigate(['/articles']);
    return false;
  }

  return true;
};
