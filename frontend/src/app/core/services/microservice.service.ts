import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';

export interface MicroserviceConfig {
  name: string;
  baseUrl: string;
}

@Injectable({
  providedIn: 'root',
})
export class MicroserviceService {
  private services: Record<string, string> = {
    user: 'http://localhost:3001/api',
    article: 'http://localhost:3002/api',
    notification: 'http://localhost:3003/api',
  };

  constructor(private http: HttpClient) {}

  // Register a service manually (useful for dynamic discovery)
  registerService(name: string, baseUrl: string): void {
    this.services[name] = baseUrl;
  }

  // Get service URL
  getServiceUrl(name: string): string {
    const serviceUrl = this.services[name];
    if (!serviceUrl) {
      throw new Error(`Microservice ${name} not found`);
    }
    return serviceUrl;
  }

  // Generic request to a specific microservice
  request<T>(
    serviceName: string,
    method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH',
    endpoint: string,
    data?: any
  ): Observable<T> {
    const serviceUrl = this.getServiceUrl(serviceName);
    const url = `${serviceUrl}${endpoint}`;

    switch (method) {
      case 'GET':
        return this.http.get<T>(url).pipe(catchError(this.handleError));
      case 'POST':
        return this.http.post<T>(url, data).pipe(catchError(this.handleError));
      case 'PUT':
        return this.http.put<T>(url, data).pipe(catchError(this.handleError));
      case 'PATCH':
        return this.http.patch<T>(url, data).pipe(catchError(this.handleError));
      case 'DELETE':
        return this.http.delete<T>(url).pipe(catchError(this.handleError));
      default:
        return throwError(
          () => new Error(`Unsupported HTTP method: ${method}`)
        );
    }
  }

  private handleError(error: any): Observable<never> {
    let errorMessage = 'An unknown error occurred';

    if (error.error instanceof ErrorEvent) {
      // Client-side error
      errorMessage = `Error: ${error.error.message}`;
    } else {
      // Server-side error
      errorMessage = `Error Code: ${error.status}\nMessage: ${error.message}`;
    }

    console.error(errorMessage);
    return throwError(() => new Error(errorMessage));
  }
}
