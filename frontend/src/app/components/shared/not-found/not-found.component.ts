import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-not-found',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <div class="container text-center py-5">
      <h1 class="display-1">404</h1>
      <h2 class="mb-4">Page Not Found</h2>
      <p class="lead mb-4">
        The page you are looking for doesn't exist or has been moved.
      </p>
      <a routerLink="/" class="btn btn-primary">Go to Homepage</a>
    </div>
  `,
  styles: [
    `
      .container {
        margin-top: 5rem;
      }
      .display-1 {
        font-size: 6rem;
        font-weight: 700;
        color: #495057;
      }
      h2 {
        color: #343a40;
      }
      .lead {
        color: #6c757d;
      }
    `,
  ],
})
export class NotFoundComponent {}
