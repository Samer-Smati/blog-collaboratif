import { RouterModule, Routes } from '@angular/router';
import { roleGuard } from './core/guards/role.guard';
import { authGuard } from './core/guards/auth.guard';
import { LoginComponent } from './components/login/login.component';
import { SignupComponent } from './components/signup/signup.component';
import { ArticleListComponent } from './components/article-list/article-list.component';
import { ArticleFormComponent } from './components/article-form/article-form.component';
import { ArticleDetailComponent } from './components/article-detail/article-detail.component';
import { DashboardComponent } from './components/dashboard/dashboard.component';
import { ProfileComponent } from './components/profile/profile.component';
import { UserManagementComponent } from './components/user-management/user-management.component';
import { NotFoundComponent } from './components/shared/not-found/not-found.component';
import { ChartTestComponent } from './components/chart-test/chart-test.component';

export const routes: Routes = [
  { path: '', redirectTo: '/articles', pathMatch: 'full' },
  { path: 'login', component: LoginComponent },
  { path: 'register', component: SignupComponent },
  { path: 'articles', component: ArticleListComponent },
  {
    path: 'articles/create',
    component: ArticleFormComponent,
    canActivate: [authGuard],
    // data: { roles: ['admin', 'editor', 'writer'] },
  },
  { path: 'articles/:id', component: ArticleDetailComponent },
  {
    path: 'articles/:id/edit',
    component: ArticleFormComponent,
    canActivate: [authGuard],
    // data: { roles: ['admin', 'editor', 'writer'] },
  },
  {
    path: 'dashboard',
    component: DashboardComponent,
    canActivate: [authGuard, roleGuard],
    // data: { roles: ['admin', 'editor'] },
  },
  {
    path: 'chart-test',
    component: ChartTestComponent,
  },
  {
    path: 'profile',
    component: ProfileComponent,
    canActivate: [authGuard],
  },
  {
    path: 'users',
    component: UserManagementComponent,
    canActivate: [authGuard, roleGuard],
    // data: { roles: ['admin'] },
  },
  { path: '**', component: NotFoundComponent },
];
