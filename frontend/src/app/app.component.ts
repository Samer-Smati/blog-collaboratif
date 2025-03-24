import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet } from '@angular/router';
import { NavigationComponent } from './components/shared/navigation/navigation.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, RouterOutlet, NavigationComponent],
  template: `
    <app-navigation></app-navigation>
    <div class="container">
      <router-outlet></router-outlet>
    </div>
    <footer class="footer mt-auto py-3 bg-light">
      <div class="container text-center">
        <span class="text-muted">© 2023 Blog Platform</span>
      </div>
    </footer>
  `,
  styles: [
    `
      :host {
        display: flex;
        flex-direction: column;
        min-height: 100vh;
      }

      .container {
        flex: 1;
      }

      .footer {
        margin-top: 2rem;
      }
    `,
  ],
})
export class AppComponent {
  title = 'blog-platform';
}
