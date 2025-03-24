import { Injectable, Inject, PLATFORM_ID } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, throwError } from 'rxjs';
import { tap, catchError } from 'rxjs/operators';
import { Router } from '@angular/router';
import { isPlatformBrowser } from '@angular/common';
import { CookieService } from 'ngx-cookie-service';
import { AuthResponse, RegisterUser, User } from '../../models/user.model';

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
    private router: Router,
    private cookieService: CookieService
  ) {
    this.loadUserFromStorage();
  }

  private loadUserFromStorage() {
    if (isPlatformBrowser(this.platformId)) {
      const userJson = this.cookieService.get('user');
      const tokenExpiration = this.cookieService.get('tokenExpiration');

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

  getToken(): string | null {
    if (isPlatformBrowser(this.platformId)) {
      if (this.cookieService.get('user')) {
        const token = JSON.parse(this.cookieService.get('user')).accessToken;
        return token || null;
      }
    }
    return null;
  }

  private setAuthData(response: AuthResponse): void {
    if (isPlatformBrowser(this.platformId)) {
      // Store user data
      response.user.accessToken = response.accessToken;
      this.cookieService.set('user', JSON.stringify(response.user), {
        path: '/',
        expires: new Date(new Date().getTime() + 3600 * 1000), // 1 hour
      });

      // Store access token
      this.cookieService.set('accessToken', response.accessToken, {
        path: '/',
        expires: new Date(new Date().getTime() + 3600 * 1000), // 1 hour
      });

      // Store refresh token if available
      if (response.refreshToken) {
        this.cookieService.set('refreshToken', response.refreshToken, {
          path: '/',
          expires: new Date(new Date().getTime() + 7 * 24 * 3600 * 1000), // 7 days
        });
      }

      // Update user subject
      this.userSubject.next(response.user);

      // Set auto logout
      this.setAutoLogout(3600 * 1000); // 1 hour
    }
  }

  logout(): void {
    // For httpOnly cookies, we need to call the backend to clear them

    // Clear any non-httpOnly cookies we might have set
    if (isPlatformBrowser(this.platformId)) {
      this.cookieService.delete('user', '/');
      this.cookieService.delete('tokenExpiration', '/');
    }
    this.userSubject.next(null);

    this.router.navigate(['/login']);
  }

  isAuthenticated(): boolean {
    const token = this.getToken();

    const user = this.userSubject.value;
    return !!token && !!user;
  }

  get currentUser(): User | null {
    return this.userSubject.value;
  }

  getUserRole(): string {
    const user = this.userSubject.value;
    return user?.role || '';
  }

  refreshToken(): Observable<string> {
    if (!isPlatformBrowser(this.platformId)) {
      return throwError(() => new Error('Not in browser environment'));
    }

    // With httpOnly cookies, we don't need to manually send the refresh token
    // The browser will automatically include it in the request
    return this.http
      .post<any>(`${this.apiUrl}/refresh-token`, {}, { withCredentials: true })
      .pipe(
        tap((response) => {
          // The backend will set the new httpOnly cookies
          // We just need to update the auto logout timer
          this.setAutoLogout(15 * 60 * 1000); // 15 minutes (matching backend token expiry)
        }),
        catchError((error) => {
          return throwError(() => error);
        })
      );
  }

  getUserId(): string {
    return this.currentUser?._id || '';
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
      const storedUserData = this.cookieService.get('user');

      if (storedUserData) {
        const userData = JSON.parse(storedUserData);
        const updatedUserData = { ...userData, ...user };

        const expirationDate = new Date();
        expirationDate.setHours(expirationDate.getHours() + 1); // 1 hour expiration

        this.cookieService.set(
          'user',
          JSON.stringify(updatedUserData),
          expirationDate,
          '/'
        );
        this.userSubject.next(updatedUserData);
      }
    }
  }

  /**
   * Authenticates a user with email and password
   * @param email User's email
   * @param password User's password
   * @returns Observable of AuthResponse
   */
  login(email: string, password: string): Observable<AuthResponse> {
    return this.http
      .post<AuthResponse>(
        `${this.apiUrl}/login`,
        { email, password },
        { withCredentials: true }
      )
      .pipe(
        tap((response) => {
          this.setAuthData(response);

          // // Navigate to the returnUrl or home page after successful login
          const returnUrl =
            new URLSearchParams(window.location.search).get('returnUrl') || '/';
          this.router.navigateByUrl(returnUrl);
        }),
        catchError((error) => {
          console.error('Login error:', error);
          return throwError(() => error);
        })
      );
  }

  /**
   * Registers a new user
   * @param userData User registration data
   * @returns Observable of AuthResponse
   */
  register(userData: RegisterUser): Observable<AuthResponse> {
    return this.http
      .post<AuthResponse>(`${this.apiUrl}/register`, userData, {
        withCredentials: true,
      })
      .pipe(
        tap((response) => {
          // The backend sets httpOnly cookies, we only need to store user data
          this.userSubject.next(response.user);
          this.setAutoLogout(3600 * 1000); // 1 hour
        }),
        catchError((error) => {
          return throwError(() => error);
        })
      );
  }
}
