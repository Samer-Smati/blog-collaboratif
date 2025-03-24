import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of, catchError } from 'rxjs';

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
    return this.http
      .get<any>(`${this.apiUrl}/articles/popular?limit=${limit}`)
      .pipe(
        catchError((error) => {
          console.error('Error fetching popular articles:', error);
          // Fallback data if API fails
          return of({
            popularArticles: [
              {
                _id: '1',
                title: 'Getting Started with Angular',
                viewCount: 452,
              },
              { _id: '2', title: 'React vs Angular in 2023', viewCount: 378 },
              { _id: '3', title: 'JavaScript Best Practices', viewCount: 315 },
              { _id: '4', title: 'Building APIs with Node.js', viewCount: 287 },
              { _id: '5', title: 'CSS Grid Layout Tutorial', viewCount: 241 },
            ],
          });
        })
      );
  }

  getArticlesByTag(): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/articles/by-tag`).pipe(
      catchError((error) => {
        console.error('Error fetching articles by tag:', error);
        // Fallback data if API fails
        return of({
          tagStats: [
            { tag: 'JavaScript', count: 8 },
            { tag: 'Angular', count: 6 },
            { tag: 'React', count: 5 },
            { tag: 'TypeScript', count: 4 },
            { tag: 'Node.js', count: 3 },
            { tag: 'CSS', count: 2 },
            { tag: 'HTML', count: 2 },
          ],
        });
      })
    );
  }

  getArticleGrowth(): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/articles/growth`).pipe(
      catchError((error) => {
        console.error('Error fetching article growth:', error);
        // Fallback data if API fails
        return of({
          articleGrowth: [
            { month: 'Jan', count: 3 },
            { month: 'Feb', count: 5 },
            { month: 'Mar', count: 7 },
            { month: 'Apr', count: 9 },
            { month: 'May', count: 12 },
            { month: 'Jun', count: 15 },
          ],
        });
      })
    );
  }

  getUserActivityStats(): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/users/activity`).pipe(
      catchError((error) => {
        console.error('Error fetching user activity stats:', error);
        // Fallback data if API fails
        return of({
          activeUsers: 45,
          newUsers: 12,
          usersByRole: [
            { role: 'Admin', count: 2 },
            { role: 'Editor', count: 5 },
            { role: 'Writer', count: 18 },
            { role: 'Reader', count: 125 },
          ],
        });
      })
    );
  }

  getCommentStats(): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/comments/stats`).pipe(
      catchError((error) => {
        console.error('Error fetching comment stats:', error);
        // Fallback data if API fails
        return of({
          commentStats: [
            { _id: '1', title: 'Getting Started with Angular', count: 15 },
            { _id: '2', title: 'React vs Angular in 2023', count: 12 },
            { _id: '3', title: 'JavaScript Best Practices', count: 9 },
            { _id: '4', title: 'Building APIs with Node.js', count: 7 },
            { _id: '5', title: 'CSS Grid Layout Tutorial', count: 5 },
          ],
        });
      })
    );
  }

  exportArticleStats(format: string = 'csv'): Observable<Blob> {
    return this.http
      .get(`${this.apiUrl}/articles/export?format=${format}`, {
        responseType: 'blob',
      })
      .pipe(
        catchError((error) => {
          console.error(`Error exporting article stats as ${format}:`, error);

          // Fallback export data if API fails
          let mockData: string;
          if (format === 'csv') {
            mockData =
              'Title,Author,Views,Comments,Date\n' +
              'Getting Started with Angular,John Doe,452,15,2023-05-15\n' +
              'React vs Angular in 2023,Jane Smith,378,12,2023-06-02\n' +
              'JavaScript Best Practices,Mark Johnson,315,9,2023-06-10\n' +
              'Building APIs with Node.js,Sarah Williams,287,7,2023-06-20\n' +
              'CSS Grid Layout Tutorial,Michael Brown,241,5,2023-06-25';
          } else {
            mockData = JSON.stringify(
              {
                articles: [
                  {
                    title: 'Getting Started with Angular',
                    author: 'John Doe',
                    views: 452,
                    comments: 15,
                    date: '2023-05-15',
                  },
                  {
                    title: 'React vs Angular in 2023',
                    author: 'Jane Smith',
                    views: 378,
                    comments: 12,
                    date: '2023-06-02',
                  },
                  {
                    title: 'JavaScript Best Practices',
                    author: 'Mark Johnson',
                    views: 315,
                    comments: 9,
                    date: '2023-06-10',
                  },
                  {
                    title: 'Building APIs with Node.js',
                    author: 'Sarah Williams',
                    views: 287,
                    comments: 7,
                    date: '2023-06-20',
                  },
                  {
                    title: 'CSS Grid Layout Tutorial',
                    author: 'Michael Brown',
                    views: 241,
                    comments: 5,
                    date: '2023-06-25',
                  },
                ],
              },
              null,
              2
            );
          }

          const blob = new Blob([mockData], {
            type: format === 'csv' ? 'text/csv' : 'application/json',
          });

          return of(blob);
        })
      );
  }
}
