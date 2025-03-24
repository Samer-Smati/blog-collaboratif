import { Injectable, Inject, PLATFORM_ID } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, throwError, BehaviorSubject } from 'rxjs';
import { catchError, tap } from 'rxjs/operators';
import { RegisterUser, User, AuthResponse } from '../../models/user.model';
import { isPlatformBrowser } from '@angular/common';
import { Router } from '@angular/router';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private apiUrl = 'http://localhost:3000/api/auth';
  private userSubject = new BehaviorSubject<User | null>(null);
  public user$ = this.userSubject.asObservable();
  private tokenExpirationTimer: any;

  constructor(
    private http: HttpClient,
    @Inject(PLATFORM_ID) private platformId: Object,
    private router: Router
  ) {
    this.loadUserFromStorage();
  }

  private loadUserFromStorage() {
    // Only run this in browser environments
    if (isPlatformBrowser(this.platformId)) {
      const userJson = localStorage.getItem('user');
      const tokenExpiration = localStorage.getItem('tokenExpiration');

      if (userJson && tokenExpiration) {
        const user = JSON.parse(userJson);
        const expiresIn =
          new Date(tokenExpiration).getTime() - new Date().getTime();

        if (expiresIn > 0) {
          this.userSubject.next(user);
          this.setAutoLogout(expiresIn);
        } else {
          this.logout();
        }
      }
    }
  }

  register(user: RegisterUser): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.apiUrl}/register`, user).pipe(
      tap((response: AuthResponse) => {
        this.setAuthData(response);
      }),
      catchError((error) => {
        // Check for MongoDB duplicate key error
        if (
          error.error &&
          error.error.message &&
          error.error.message.includes('E11000 duplicate key error')
        ) {
          // Extract the duplicate field from the error message
          if (error.error.message.includes('username')) {
            return throwError(
              () =>
                new Error(
                  'Username already exists. Please choose a different username.'
                )
            );
          } else if (error.error.message.includes('email')) {
            return throwError(
              () =>
                new Error(
                  'Email address already in use. Please use a different email.'
                )
            );
          }
        }
        return throwError(() => error);
      })
    );
  }

  login(email: string, password: string): Observable<AuthResponse> {
    console.log('Making login request to:', `${this.apiUrl}/login`);
    console.log('With payload:', { email, password });

    return this.http
      .post<AuthResponse>(`${this.apiUrl}/login`, { email, password })
      .pipe(
        tap((response: AuthResponse) => {
          this.setAuthData(response);
        }),
        catchError((error) => {
          if (error.error && error.error.message) {
            return throwError(() => new Error(error.error.message));
          }
          return throwError(
            () => new Error('Login failed. Please try again later.')
          );
        })
      );
  }

  logout(): void {
    if (isPlatformBrowser(this.platformId)) {
      localStorage.removeItem('user');
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
      localStorage.removeItem('tokenExpiration');
    }
    this.userSubject.next(null);
    this.clearAuthTimer();
    this.router.navigate(['/login']);
  }

  isAuthenticated(): boolean {
    return !!this.getToken();
  }

  get currentUser(): User | null {
    return this.userSubject.value;
  }

  getUserRole(): string {
    return this.currentUser?.role || '';
  }

  getToken(): string | null {
    if (isPlatformBrowser(this.platformId)) {
      return localStorage.getItem('accessToken');
    }
    return null;
  }

  refreshToken(): Observable<string> {
    if (!isPlatformBrowser(this.platformId)) {
      return throwError(() => new Error('Not in browser environment'));
    }

    const refreshToken = localStorage.getItem('refreshToken');

    if (!refreshToken) {
      return throwError(() => new Error('No refresh token available'));
    }

    return this.http
      .post<string>(`${this.apiUrl}/refresh-token`, { refreshToken })
      .pipe(
        tap((response: string) => {
          // Update only the access token
          localStorage.setItem('accessToken', response);

          if (refreshToken) {
            localStorage.setItem('refreshToken', refreshToken);
          }

          const expiration = new Date(new Date().getTime() + 3600 * 1000); // 1 hour
          localStorage.setItem('tokenExpiration', expiration.toISOString());

          this.setAutoLogout(3600 * 1000);
        })
      );
  }

  getUserId(): string {
    return this.currentUser?._id || '';
  }

  private setAuthData(response: AuthResponse): void {
    const { user, accessToken, refreshToken } = response;

    if (user && accessToken) {
      localStorage.setItem('user', 'aaaa');
      localStorage.setItem('accessToken', accessToken);

      if (refreshToken) {
        localStorage.setItem('refreshToken', refreshToken);
      }

      const expiration = new Date(new Date().getTime() + 3600 * 1000); // 1 hour
      localStorage.setItem('tokenExpiration', expiration.toISOString());

      this.userSubject.next(user);
      this.setAutoLogout(3600 * 1000);
    }
  }

  private setAutoLogout(expirationDuration: number): void {
    this.clearAuthTimer();
    this.tokenExpirationTimer = setTimeout(() => {
      this.logout();
    }, expirationDuration);
  }

  private clearAuthTimer(): void {
    if (this.tokenExpirationTimer) {
      clearTimeout(this.tokenExpirationTimer);
      this.tokenExpirationTimer = null;
    }
  }

  /**
   * Updates user data in the local storage and BehaviorSubject
   */
  updateUserData(user: User): void {
    if (isPlatformBrowser(this.platformId)) {
      const storedUserData = localStorage.getItem('user');

      if (storedUserData) {
        const userData = JSON.parse(storedUserData);
        const updatedUserData = { ...userData, ...user };

        localStorage.setItem('user', JSON.stringify(updatedUserData));
        this.userSubject.next(updatedUserData);
      }
    }
  }
}
