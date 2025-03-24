import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, BehaviorSubject } from 'rxjs';
import { tap, map } from 'rxjs/operators';

export interface Notification {
  _id: string;
  recipient: string;
  type: 'comment' | 'reply' | 'mention' | 'like' | 'system';
  message: string;
  relatedItemId?: string;
  read: boolean;
  createdAt: string;
}

@Injectable({
  providedIn: 'root',
})
export class NotificationService {
  private apiUrl = 'http://localhost:3000/api/notifications';
  private unreadCount = new BehaviorSubject<number>(0);

  unreadCount$ = this.unreadCount.asObservable();

  constructor(private http: HttpClient) {
    this.getUnreadCount().subscribe();
  }

  getNotifications(limit: number = 10): Observable<Notification[]> {
    return this.http.get<Notification[]>(`${this.apiUrl}?limit=${limit}`);
  }

  getUnreadCount(): Observable<number> {
    return this.http.get<{ count: number }>(`${this.apiUrl}/unread-count`).pipe(
      map((response) => response.count),
      tap((count) => {
        this.unreadCount.next(count);
      })
    );
  }

  markAsRead(notificationId: string): Observable<Notification> {
    return this.http
      .patch<Notification>(`${this.apiUrl}/${notificationId}/read`, {})
      .pipe(
        tap(() => {
          const currentCount = this.unreadCount.getValue();
          if (currentCount > 0) {
            this.unreadCount.next(currentCount - 1);
          }
        })
      );
  }

  markAllAsRead(): Observable<any> {
    return this.http.patch<any>(`${this.apiUrl}/read-all`, {}).pipe(
      tap(() => {
        this.unreadCount.next(0);
      })
    );
  }

  deleteNotification(notificationId: string): Observable<any> {
    return this.http.delete<any>(`${this.apiUrl}/${notificationId}`);
  }
}
