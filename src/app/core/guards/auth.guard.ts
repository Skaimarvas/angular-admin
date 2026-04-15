import { CanActivateFn, CanActivateChildFn, Router } from '@angular/router';
import { inject } from '@angular/core';
import { AuthService } from '../../shared/services/auth.service';

const validateSession = (): boolean | ReturnType<Router['createUrlTree']> => {
  const authService = inject(AuthService);
  const router = inject(Router);

  if (authService.syncSessionFromStorage()) {
    return true;
  }

  return router.createUrlTree(['/signin']);
};

export const authGuard: CanActivateFn = () => validateSession();

export const authChildGuard: CanActivateChildFn = () => validateSession();
