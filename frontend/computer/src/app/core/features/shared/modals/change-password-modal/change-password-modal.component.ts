import {
  Component,
  EventEmitter,
  Output,
  HostBinding,
  inject,
} from '@angular/core';
import { FormControl, ReactiveFormsModule, Validators } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { AccountService } from '../../../shared/services/account.service';

@Component({
  selector: 'app-change-password-modal',
  standalone: true,
  imports: [ReactiveFormsModule, CommonModule],
  template: `
    <!-- Modal title -->
    <h2 class="text-xl font-semibold mb-4 text-white">Change Password</h2>

    <!-- Form for password change -->
    <form (ngSubmit)="submit()" class="flex flex-col gap-4">
      <!-- Old password input -->
      <input
        type="password"
        placeholder="Old Password"
        [formControl]="oldPasswordControl"
        class="p-2 rounded border border-gray-600 bg-surface text-white placeholder-gray-400"
      />
      <div
        *ngIf="oldPasswordControl.invalid && oldPasswordControl.touched"
        class="text-red-400 text-sm"
      >
        Please enter your old password.
      </div>

      <!-- New password input -->
      <input
        type="password"
        placeholder="New Password"
        [formControl]="newPasswordControl"
        class="p-2 rounded border border-gray-600 bg-surface text-white placeholder-gray-400"
      />
      <div
        *ngIf="newPasswordControl.invalid && newPasswordControl.touched"
        class="text-red-400 text-sm"
      >
        Password must be at least 6 characters long.
      </div>

      <!-- Action buttons -->
      <div class="flex justify-end gap-2">
        <!-- Cancel button (closes modal) -->
        <button
          type="button"
          (click)="close()"
          class="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-500"
        >
          Cancel
        </button>

        <!-- Submit button (disabled if form is invalid) -->
        <button
          type="button"
          [disabled]="oldPasswordControl.invalid || newPasswordControl.invalid"
          (click)="submit()"
          class="px-4 py-2 bg-primary text-white rounded hover:bg-primary/80"
        >
          Change Password
        </button>
      </div>
    </form>
  `,
})
export class ChangePasswordModalComponent {
  /** Apply consistent styling to the modal container */
  @HostBinding('class') host =
    'flex flex-col p-4 bg-surface rounded-lg w-[400px]';

  /** Emits once the modal should be closed (on cancel or success) */
  @Output() updated = new EventEmitter<void>();

  /** Injected service for handling password changes */
  private readonly accountService = inject(AccountService);

  /** Form control for current password input (required) */
  oldPasswordControl = new FormControl('', [Validators.required]);

  /** Form control for new password input (min. 6 characters) */
  newPasswordControl = new FormControl('', [
    Validators.required,
    Validators.minLength(6),
  ]);

  /** Closes the modal without saving */
  close(): void {
    this.updated.emit();
  }

  /** Submits the form and triggers password change */
  submit(): void {
    if (this.oldPasswordControl.invalid || this.newPasswordControl.invalid) {
      // mark controls as touched to trigger validation messages
      this.oldPasswordControl.markAsTouched();
      this.newPasswordControl.markAsTouched();
      return;
    }

    // Call API to update password with old and new values
    this.accountService
      .updatePassword(
        this.oldPasswordControl.value!,
        this.newPasswordControl.value!
      )
      .subscribe({
        next: () => this.updated.emit(), // close modal on success
        error: (err) => {
          console.error('Error while updating password:', err);
          alert('Failed to update password.');
        },
      });
  }
}
