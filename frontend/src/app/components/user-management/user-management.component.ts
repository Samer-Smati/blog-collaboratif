import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { UserService } from '../../core/services/user.service';
import { User } from '../../models/user.model';

@Component({
  selector: 'app-user-management',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './user-management.component.html',
  styleUrls: ['./user-management.component.scss'],
})
export class UserManagementComponent implements OnInit {
  users: User[] = [];
  isLoading = true;
  error = '';
  roles = ['admin', 'editor', 'writer', 'reader'];
  selectedUser: User | null = null;
  selectedRole = '';

  constructor(private userService: UserService) {}

  ngOnInit(): void {
    this.loadUsers();
  }

  loadUsers(): void {
    this.isLoading = true;
    this.userService.getAllUsers().subscribe({
      next: (response) => {
        // Make sure users is always an array
        if (response && response.items && Array.isArray(response.items)) {
          this.users = response.items;
        } else if (response && Array.isArray(response)) {
          this.users = response;
        } else if (response && typeof response === 'object') {
          // If response is an object but not an array, convert it to an array
          this.users = Object.values(response);
        } else {
          this.users = [];
          this.error = 'Invalid users data format received';
        }
        this.isLoading = false;
      },
      error: (err) => {
        this.error = 'Failed to load users';
        this.isLoading = false;
        console.error(err);
      },
    });
  }

  openRoleModal(user: User): void {
    this.selectedUser = user;
    this.selectedRole = user.role;
  }

  closeModal(): void {
    this.selectedUser = null;
    this.selectedRole = '';
  }

  updateUserRole(): void {
    if (!this.selectedUser || !this.selectedRole) return;

    this.userService
      .updateUserRole(this.selectedUser._id, this.selectedRole)
      .subscribe({
        next: () => {
          // Update the user in the local array
          this.users = this.users.map((user) => {
            if (user._id === this.selectedUser?._id) {
              return {
                ...user,
                role: this.selectedRole as
                  | 'admin'
                  | 'editor'
                  | 'writer'
                  | 'reader',
              };
            }
            return user;
          });

          this.closeModal();
        },
        error: (err) => {
          console.error('Failed to update user role:', err);
          alert('Failed to update user role. Please try again later.');
        },
      });
  }
}
