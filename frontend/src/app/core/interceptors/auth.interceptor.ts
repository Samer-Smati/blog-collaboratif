import { Injectable } from '@angular/core';
import {
  HttpRequest,
  HttpHandler,
  HttpEvent,
  HttpInterceptor,
  HttpErrorResponse,
} from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, switchMap } from 'rxjs/operators';
import { AuthService } from '../services/auth.service';

@Injectable()
export class AuthInterceptor implements HttpInterceptor {
  constructor(private authService: AuthService) {}

  intercept(
    request: HttpRequest<unknown>,
    next: HttpHandler
  ): Observable<HttpEvent<unknown>> {
    // Skip setting credentials for refresh token requests to avoid circular dependencies
    if (request.url.includes('/refresh-token')) {
      return next.handle(request);
    }

    const token = this.authService.getToken();

    if (token) {
      request = request.clone({
        headers: request.headers.set('Authorization', `Bearer ${token}`),
        withCredentials: true,
      });
    }

    return next.handle(request).pipe(
      catchError((error: HttpErrorResponse) => {
        // If we get a 401 Unauthorized error and it's not a login request,
        // try to refresh the token
        if (error.status === 401 && !request.url.includes('/login')) {
          return this.handleUnauthorizedError(request, next);
        }

        return throwError(() => error);
      })
    );
  }

  private handleUnauthorizedError(
    request: HttpRequest<unknown>,
    next: HttpHandler
  ): Observable<HttpEvent<unknown>> {
    return this.authService.refreshToken().pipe(
      switchMap((newToken) => {
        // Clone the request with the new token
        const newRequest = request.clone({
          headers: request.headers.set('Authorization', `Bearer ${newToken}`),
        });
        return next.handle(newRequest);
      }),
      catchError((error) => {
        // If refresh token fails, logout the user
        this.authService.logout();
        return throwError(() => error);
      })
    );
  }
}
