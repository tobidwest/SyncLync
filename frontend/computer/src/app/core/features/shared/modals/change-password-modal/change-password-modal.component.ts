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
    <h2 class="text-xl font-semibold mb-4 text-white">Change Password</h2>

    <form (ngSubmit)="submit()" class="flex flex-col gap-4">
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

      <div class="flex justify-end gap-2">
        <button
          type="button"
          (click)="close()"
          class="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-500"
        >
          Cancel
        </button>
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
  @HostBinding('class') host =
    'flex flex-col p-4 bg-surface rounded-lg w-[400px]';

  @Output() updated = new EventEmitter<void>();

  private readonly accountService = inject(AccountService);

  oldPasswordControl = new FormControl('', [Validators.required]);
  newPasswordControl = new FormControl('', [
    Validators.required,
    Validators.minLength(6),
  ]);

  close(): void {
    this.updated.emit();
  }

  submit(): void {
    if (this.oldPasswordControl.invalid || this.newPasswordControl.invalid) {
      this.oldPasswordControl.markAsTouched();
      this.newPasswordControl.markAsTouched();
      return;
    }

    this.accountService
      .updatePassword(
        this.oldPasswordControl.value!,
        this.newPasswordControl.value!
      )
      .subscribe({
        next: () => this.updated.emit(),
        error: (err) => {
          console.error('Error while updating password:', err);
          alert('Failed to update password.');
        },
      });
  }
}
