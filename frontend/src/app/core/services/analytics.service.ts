import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class AnalyticsService {
  private apiUrl = 'http://localhost:3000/api/analytics';

  constructor(private http: HttpClient) {}

  getArticleStats(): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/articles/stats`);
  }

  getPopularArticles(limit: number = 5): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/articles/popular?limit=${limit}`);
  }

  getArticlesByTag(): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/articles/by-tag`);
  }

  getArticleGrowth(): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/articles/growth`);
  }

  getUserActivityStats(): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/users/activity`);
  }

  getCommentStats(): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/comments/stats`);
  }

  exportArticleStats(format: string = 'csv'): Observable<Blob> {
    return this.http.get(`${this.apiUrl}/articles/export?format=${format}`, {
      responseType: 'blob',
    });
  }
}
