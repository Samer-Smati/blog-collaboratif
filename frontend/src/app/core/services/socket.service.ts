import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { io, Socket } from 'socket.io-client';
import { AuthService } from './auth.service';

@Injectable({
  providedIn: 'root',
})
export class SocketService {
  private socket: Socket;
  private readonly url = 'http://localhost:3000'; // Your Socket.io server endpoint

  constructor(private authService: AuthService) {
    this.socket = io(this.url, {
      autoConnect: false,
      withCredentials: true,
    });
  }

  // Connect to socket server with auth token
  connect(): void {
    if (!this.socket.connected) {
      const token = this.authService.getToken();
      if (token) {
        this.socket.io.opts.extraHeaders = {
          Authorization: `Bearer ${token}`,
        };
        this.socket.connect();
        console.log('Socket connected');
      }
    }
  }

  // Disconnect from socket server
  disconnect(): void {
    if (this.socket.connected) {
      this.socket.disconnect();
      console.log('Socket disconnected');
    }
  }

  // Join a specific article room to receive comment updates
  joinArticleRoom(articleId: string): void {
    this.socket.emit('join-article', { articleId });
  }

  // Leave an article room
  leaveArticleRoom(articleId: string): void {
    this.socket.emit('leave-article', { articleId });
  }

  // Listen for new comments
  onNewComment(): Observable<any> {
    return new Observable((observer) => {
      this.socket.on('new-comment', (data: any) => {
        observer.next(data);
      });

      return () => {
        this.socket.off('new-comment');
      };
    });
  }

  // Listen for comment updates
  onCommentUpdated(): Observable<any> {
    return new Observable((observer) => {
      this.socket.on('comment-updated', (data: any) => {
        observer.next(data);
      });

      return () => {
        this.socket.off('comment-updated');
      };
    });
  }

  // Listen for comment deletions
  onCommentDeleted(): Observable<any> {
    return new Observable((observer) => {
      this.socket.on('comment-deleted', (data: any) => {
        observer.next(data);
      });

      return () => {
        this.socket.off('comment-deleted');
      };
    });
  }

  // Listen for notifications
  onNotification(): Observable<any> {
    return new Observable((observer) => {
      this.socket.on('notification', (data: any) => {
        observer.next(data);
      });

      return () => {
        this.socket.off('notification');
      };
    });
  }
}
