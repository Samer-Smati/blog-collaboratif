import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { AuthService } from '../../core/services/auth.service';
import { UserService } from '../../core/services/user.service';
import { User } from '../../models/user.model';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './profile.component.html',
  styleUrls: ['./profile.component.scss'],
})
export class ProfileComponent implements OnInit {
  user: User | null = null;
  profileForm: FormGroup;
  passwordForm: FormGroup;
  isLoading = false;
  isSaving = false;
  isChangingPassword = false;
  error = '';
  success = '';
  passwordError = '';
  passwordSuccess = '';

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private userService: UserService
  ) {
    this.profileForm = this.fb.group({
      username: ['', [Validators.required, Validators.minLength(3)]],
      email: ['', [Validators.required, Validators.email]],
    });

    this.passwordForm = this.fb.group(
      {
        currentPassword: ['', [Validators.required]],
        newPassword: ['', [Validators.required, Validators.minLength(6)]],
        confirmPassword: ['', [Validators.required]],
      },
      {
        validators: this.passwordMatchValidator,
      }
    );
  }

  ngOnInit(): void {
    this.loadUserProfile();
  }

  loadUserProfile(): void {
    this.isLoading = true;
    const userId = this.authService.getUserId();

    if (userId) {
      this.userService.getUserById(userId).subscribe({
        next: (user: any) => {
          let userData: User = user?.user;
          this.user = userData;
          this.profileForm.patchValue({
            username: userData.username,
            email: userData.email,
            bio: userData.bio,
            location: userData.location,
            role: userData.role,
            createdAt: userData.createdAt,
            updatedAt: userData.updatedAt,
            articleCount: userData.articles?.length || 0,
            commentCount: userData.comments?.length || 0,
            followers: userData.followers || 0,
          });
          this.isLoading = false;
        },
        error: (err) => {
          this.error = 'Failed to load user profile';
          this.isLoading = false;
          console.error(err);
        },
      });
    } else {
      this.error = 'User not authenticated';
      this.isLoading = false;
    }
  }

  passwordMatchValidator(group: FormGroup): { [key: string]: any } | null {
    const newPassword = group.get('newPassword')?.value;
    const confirmPassword = group.get('confirmPassword')?.value;

    return newPassword === confirmPassword ? null : { passwordMismatch: true };
  }

  onSubmitProfile(): void {
    if (this.profileForm.invalid) {
      return;
    }

    this.isSaving = true;
    this.error = '';
    this.success = '';

    const userData = {
      username: this.profileForm.value.username,
      email: this.profileForm.value.email,
    };

    this.userService.updateProfile(userData).subscribe({
      next: (user) => {
        this.user = user;
        this.success = 'Profile updated successfully';
        this.isSaving = false;

        // Update the user in local storage
        this.authService.updateUserData(user);
      },
      error: (err) => {
        this.error = err.error?.message || 'Failed to update profile';
        this.isSaving = false;
        console.error(err);
      },
    });
  }

  onSubmitPassword(): void {
    if (this.passwordForm.invalid) {
      return;
    }

    this.isChangingPassword = true;
    this.passwordError = '';
    this.passwordSuccess = '';

    this.userService
      .changePassword(
        this.passwordForm.value.currentPassword,
        this.passwordForm.value.newPassword
      )
      .subscribe({
        next: () => {
          this.passwordSuccess = 'Password changed successfully';
          this.isChangingPassword = false;
          this.passwordForm.reset();
        },
        error: (err) => {
          this.passwordError =
            err.error?.message || 'Failed to change password';
          this.isChangingPassword = false;
          console.error(err);
        },
      });
  }
}
