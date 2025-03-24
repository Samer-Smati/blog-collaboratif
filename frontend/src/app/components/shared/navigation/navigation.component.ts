import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { NotificationDropdownComponent } from '../../notification/notification-dropdown.component';

@Component({
  selector: 'app-navigation',
  standalone: true,
  imports: [CommonModule, RouterModule, NotificationDropdownComponent],
  templateUrl: './navigation.component.html',
  styleUrls: [],
})
export class NavigationComponent implements OnInit {
  isAuthenticated = false;
  userRole = '';
  username = '';
  isNavCollapsed = true;

  constructor(public authService: AuthService) {}

  ngOnInit(): void {
    this.authService.user$.subscribe((user) => {
      this.isAuthenticated = !!user;
      this.userRole = user?.role || '';
      this.username = user?.username || '';
    });
  }

  logout(): void {
    this.authService.logout();
  }

  toggleNav(): void {
    this.isNavCollapsed = !this.isNavCollapsed;
  }
}
