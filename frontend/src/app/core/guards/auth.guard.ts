import { inject } from '@angular/core';
import {
  CanActivateFn,
  Router,
  ActivatedRouteSnapshot,
  RouterStateSnapshot,
} from '@angular/router';
import { AuthService } from '../services/auth.service';

export const authGuard: CanActivateFn = (
  route: ActivatedRouteSnapshot,
  state: RouterStateSnapshot
) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  if (authService.isAuthenticated()) {
    // Check for role requirements if they exist
    const requiredRoles = route.data['roles'] as Array<string>;
    if (requiredRoles && requiredRoles.length > 0) {
      const userRole = authService.getUserRole();

      if (!userRole || !requiredRoles.includes(userRole)) {
        // If user doesn't have the required role, redirect to home
        router.navigate(['/articles']);
        return false;
      }
    }

    return true;
  } else {
    // User is not authenticated, redirect to login
    router.navigate(['/login'], { queryParams: { returnUrl: state.url } });
    return false;
  }
};
