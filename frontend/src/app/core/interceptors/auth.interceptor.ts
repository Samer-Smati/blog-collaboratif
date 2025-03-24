import { Injectable } from '@angular/core';
import {
  HttpRequest,
  HttpHandler,
  HttpEvent,
  HttpInterceptor,
} from '@angular/common/http';
import { Observable } from 'rxjs';
import { AuthService } from '../services/auth.service';

@Injectable()
export class AuthInterceptor implements HttpInterceptor {
  constructor(private authService: AuthService) {}

  intercept(
    request: HttpRequest<unknown>,
    next: HttpHandler
  ): Observable<HttpEvent<unknown>> {
    // Get the auth token from the service
    const token = this.authService.getToken();

    // Clone the request and replace the original headers with
    // cloned headers, updated with the authorization
    if (token) {
      const authRequest = request.clone({
        setHeaders: {
          Authorization: `Bearer ${token}`,
        },
      });

      // Send cloned request with header to the next handler
      return next.handle(authRequest);
    }

    // If no token, just forward the request
    return next.handle(request);
  }
}
