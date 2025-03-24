import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Comment, Reply } from '../../models/comment.model';

@Injectable({
  providedIn: 'root',
})
export class CommentService {
  private apiUrl = 'http://localhost:3000/api/comments';

  constructor(private http: HttpClient) {}

  getComments(articleId: string): Observable<Comment[]> {
    return this.http.get<Comment[]>(`${this.apiUrl}/article/${articleId}`);
  }

  createComment(articleId: string, content: string): Observable<Comment> {
    return this.http.post<Comment>(this.apiUrl, { articleId, content });
  }

  updateComment(commentId: string, content: string): Observable<Comment> {
    return this.http.put<Comment>(`${this.apiUrl}/${commentId}`, { content });
  }

  deleteComment(commentId: string): Observable<any> {
    return this.http.delete<any>(`${this.apiUrl}/${commentId}`);
  }

  addReply(commentId: string, content: string): Observable<Reply> {
    return this.http.post<Reply>(`${this.apiUrl}/${commentId}/replies`, {
      content,
    });
  }

  updateReply(
    commentId: string,
    replyId: string,
    content: string
  ): Observable<Reply> {
    return this.http.put<Reply>(
      `${this.apiUrl}/${commentId}/replies/${replyId}`,
      { content }
    );
  }

  deleteReply(commentId: string, replyId: string): Observable<any> {
    return this.http.delete<any>(
      `${this.apiUrl}/${commentId}/replies/${replyId}`
    );
  }
}
