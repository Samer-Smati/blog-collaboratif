import { Component, OnInit, HostListener, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import {
  NotificationService,
  Notification,
} from '../../core/services/notification.service';

@Component({
  selector: 'app-notification-dropdown',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './notification-dropdown.component.html',
  styleUrls: ['./notification-dropdown.component.scss'],
})
export class NotificationDropdownComponent implements OnInit {
  notifications: Notification[] = [];
  unreadCount = 0;
  isOpen = false;
  isLoading = false;

  @HostListener('document:click', ['$event'])
  clickOutside(event: Event) {
    if (!this.elementRef.nativeElement.contains(event.target)) {
      this.isOpen = false;
    }
  }

  constructor(
    private notificationService: NotificationService,
    private elementRef: ElementRef
  ) {}

  ngOnInit(): void {
    this.loadUnreadCount();
  }

  loadUnreadCount(): void {
    this.notificationService.unreadCount$.subscribe((count) => {
      this.unreadCount = count;
    });
  }

  toggleDropdown(event: Event): void {
    event.stopPropagation();
    this.isOpen = !this.isOpen;

    if (this.isOpen) {
      this.loadNotifications();
    }
  }

  loadNotifications(): void {
    this.isLoading = true;
    this.notificationService.getNotifications().subscribe({
      next: (data) => {
        this.notifications = data.items;
        this.isLoading = false;
      },
      error: (err) => {
        console.error('Error loading notifications', err);
        this.isLoading = false;
      },
    });
  }

  markAsRead(event: Event, notification: Notification): void {
    event.stopPropagation();
    if (!notification.read) {
      this.notificationService.markAsRead(notification._id).subscribe({
        next: (updatedNotification) => {
          const index = this.notifications.findIndex(
            (n) => n._id === notification._id
          );
          if (index !== -1) {
            this.notifications[index] = updatedNotification;
          }
        },
        error: (err) => {
          console.error('Error marking notification as read', err);
        },
      });
    }
  }

  markAllAsRead(event: Event): void {
    event.stopPropagation();
    this.notificationService.markAllAsRead().subscribe({
      next: () => {
        this.notifications = this.notifications.map((notification) => {
          return { ...notification, read: true };
        });
      },
      error: (err) => {
        console.error('Error marking all notifications as read', err);
      },
    });
  }

  deleteNotification(event: Event, notificationId: string): void {
    event.stopPropagation();
    event.preventDefault();

    this.notificationService.deleteNotification(notificationId).subscribe({
      next: () => {
        this.notifications = this.notifications.filter(
          (n) => n._id !== notificationId
        );
      },
      error: (err) => {
        console.error('Error deleting notification', err);
      },
    });
  }

  getNotificationLink(notification: Notification): string {
    switch (notification.type) {
      case 'comment':
      case 'reply':
        return `/articles/${notification.relatedItemId}`;
      case 'mention':
        return `/articles/${notification.relatedItemId}`;
      case 'like':
        return `/profile`;
      default:
        return '/';
    }
  }

  getNotificationIcon(type: string): string {
    switch (type) {
      case 'comment':
        return 'bi-chat-left-text';
      case 'reply':
        return 'bi-reply';
      case 'mention':
        return 'bi-at';
      case 'like':
        return 'bi-heart';
      case 'system':
        return 'bi-bell';
      default:
        return 'bi-bell';
    }
  }
}
