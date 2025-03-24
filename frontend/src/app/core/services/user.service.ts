import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, of, catchError } from 'rxjs';
import { User } from '../../models/user.model';

@Injectable({
  providedIn: 'root',
})
export class UserService {
  private apiUrl = 'http://localhost:3000/api/users';

  constructor(private http: HttpClient) {}

  getAllUsers(page = 1, limit = 10, search = ''): Observable<any> {
    let params = new HttpParams()
      .set('page', page.toString())
      .set('limit', limit.toString());

    if (search) {
      params = params.set('search', search);
    }

    return this.http.get<any>(this.apiUrl, { params });
  }

  getUserById(id: string): Observable<User> {
    return this.http.get<User>(`${this.apiUrl}/${id}`);
  }

  updateUserRole(userId: string, role: string): Observable<any> {
    return this.http.patch<any>(`${this.apiUrl}/${userId}/role`, { role });
  }

  getUserStats(): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/safe-stats`).pipe(
      catchError((error) => {
        console.error('Error fetching user stats:', error);
        return of({
          totalUsers: 150,
          activeUsers: 85,
          newUsersThisMonth: 12,
          roles: {
            admin: { users: 2, permissions: ['all'] },
            editor: { users: 5, permissions: ['create', 'edit', 'publish'] },
            writer: { users: 18, permissions: ['create', 'edit'] },
            reader: { users: 125, permissions: ['read'] },
          },
        });
      })
    );
  }

  updateProfile(userData: any): Observable<User> {
    return this.http.patch<User>(`${this.apiUrl}/profile`, userData);
  }

  changePassword(
    currentPassword: string,
    newPassword: string
  ): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/change-password`, {
      currentPassword,
      newPassword,
    });
  }
}
