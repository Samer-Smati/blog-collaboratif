import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, from } from 'rxjs';
import { catchError, map, switchMap } from 'rxjs/operators';
import { SwPush } from '@angular/service-worker';

@Injectable({
  providedIn: 'root',
})
export class PushNotificationService {
  private apiUrl = 'http://localhost:3000/api/subscriptions';
  private readonly VAPID_PUBLIC_KEY = 'YOUR_VAPID_PUBLIC_KEY';

  constructor(private http: HttpClient, private swPush: SwPush) {}

  // Request permission and subscribe to push notifications
  subscribeToPushNotifications(): Observable<any> {
    return from(
      this.swPush.requestSubscription({
        serverPublicKey: this.VAPID_PUBLIC_KEY,
      })
    ).pipe(
      switchMap((subscription) => {
        return this.http.post(this.apiUrl, { subscription });
      }),
      catchError((error) => {
        console.error('Could not subscribe to notifications', error);
        throw error;
      })
    );
  }

  // Unsubscribe from push notifications
  unsubscribeFromPushNotifications(): Observable<any> {
    return from(this.swPush.subscription).pipe(
      switchMap((subscription) => {
        if (subscription) {
          return from(subscription.unsubscribe()).pipe(
            switchMap(() => {
              return this.http.delete(
                `${this.apiUrl}/${encodeURIComponent(subscription.endpoint)}`
              );
            })
          );
        }
        return from(Promise.resolve(true));
      })
    );
  }

  // Check if push notifications are supported
  isPushNotificationsSupported(): boolean {
    return this.swPush.isEnabled;
  }

  // Check if user is subscribed to push notifications
  isSubscribed(): Observable<boolean> {
    return from(this.swPush.subscription).pipe(
      map((subscription) => !!subscription)
    );
  }

  // Listen for push notification messages
  listenForMessages(): Observable<any> {
    return this.swPush.notificationClicks;
  }
}
