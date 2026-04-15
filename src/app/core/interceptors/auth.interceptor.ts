import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { AuthService } from '../../shared/services/auth.service';
import { catchError } from 'rxjs/operators';
import { throwError } from 'rxjs';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const authService = inject(AuthService);
  authService.syncSessionFromStorage();
  const token = authService.getToken();

  const requestToSend = token
    ? req.clone({
        setHeaders: { Authorization: `Bearer ${token}` },
      })
    : req;

  return next(requestToSend).pipe(
    catchError((error) => {
      if (error?.status === 401) {
        authService.handleSessionExpired();
      }

      return throwError(() => error);
    })
  );
};
