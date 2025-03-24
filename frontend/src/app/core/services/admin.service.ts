import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class AdminService {
  private apiUrl = 'http://localhost:3000/api/admin';

  constructor(private http: HttpClient) {}

  /**
   * Creates an admin user with predefined credentials
   * This endpoint should only be accessible by system administrators
   */
  createAdminUser(): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/create-admin`, {});
  }
}
