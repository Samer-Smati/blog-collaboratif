import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, of, catchError } from 'rxjs';
import { Article, ArticleResponse } from '../../models/article.model';

@Injectable({
  providedIn: 'root',
})
export class ArticleService {
  private apiUrl = 'http://localhost:3000/api/articles';

  constructor(private http: HttpClient) {}

  getArticles(
    page: number = 1,
    limit: number = 10,
    sortBy: string = 'createdAt',
    sortDir: string = 'desc'
  ): Observable<ArticleResponse> {
    let params = new HttpParams()
      .set('page', page.toString())
      .set('limit', limit.toString())
      .set('sortBy', sortBy)
      .set('sortDir', sortDir);

    return this.http.get<ArticleResponse>(this.apiUrl, { params });
  }

  getArticleById(id: string): Observable<Article> {
    return this.http.get<Article>(`${this.apiUrl}/${id}`);
  }

  changeStatus(id: string, status: string): Observable<Article> {
    return this.http.get<Article>(`${this.apiUrl}/changeStatus/${id}`);
  }

  createArticle(articleData: Partial<Article>): Observable<Article> {
    return this.http.post<Article>(this.apiUrl, articleData);
  }

  updateArticle(
    id: string,
    articleData: Partial<Article>
  ): Observable<Article> {
    return this.http.put<Article>(`${this.apiUrl}/${id}`, articleData);
  }

  deleteArticle(id: string): Observable<any> {
    return this.http.delete<any>(`${this.apiUrl}/${id}`);
  }

  createComment(articleId: string, content: string): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/${articleId}/comment`, {
      content,
    });
  }

  createReply(
    articleId: string,
    parentId: string,
    content: string
  ): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/${articleId}/reply`, {
      parentId,
      content,
    });
  }

  getAllTags(): Observable<string[]> {
    // Use a different endpoint to avoid the ObjectId error
    return this.http.get<string[]>(`${this.apiUrl}/all-tags`);
  }

  searchArticles(
    term: string = '',
    tags: string[] = []
  ): Observable<ArticleResponse> {
    let params = new HttpParams();

    if (term) {
      params = params.set('search', term);
    }

    if (tags.length > 0) {
      tags.forEach((tag) => {
        params = params.append('tags', tag);
      });
    }

    return this.http.get<ArticleResponse>(`${this.apiUrl}/search`, { params });
  }

  getArticlesByTag(
    tag: string,
    page: number = 1,
    limit: number = 10
  ): Observable<ArticleResponse> {
    let params = new HttpParams()
      .set('page', page.toString())
      .set('limit', limit.toString());

    return this.http.get<ArticleResponse>(`${this.apiUrl}/tag/${tag}`, {
      params,
    });
  }
}
