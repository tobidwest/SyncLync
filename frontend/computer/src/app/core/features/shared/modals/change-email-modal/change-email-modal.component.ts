import {
  Component,
  EventEmitter,
  Output,
  HostBinding,
  inject,
} from '@angular/core';
import { FormControl, ReactiveFormsModule, Validators } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { AccountService } from '../../services/account.service';

@Component({
  selector: 'app-change-email-modal',
  standalone: true,
  imports: [ReactiveFormsModule, CommonModule],
  template: `
    <h2 class="text-xl font-semibold mb-4 text-white">Change Email</h2>

    <form (ngSubmit)="submit()" class="flex flex-col gap-4">
      <input
        type="email"
        placeholder="New email address"
        [formControl]="emailControl"
        class="p-2 rounded border border-gray-600 bg-surface text-white placeholder-gray-400"
      />
      <div
        *ngIf="emailControl.invalid && emailControl.touched"
        class="text-red-400 text-sm"
      >
        Please enter a valid email address.
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
          [disabled]="emailControl.invalid"
          class="px-4 py-2 bg-primary text-white rounded hover:bg-primary/80"
          (click)="submit()"
        >
          Change Email
        </button>
      </div>
    </form>
  `,
})
export class ChangeEmailModalComponent {
  @HostBinding('class') host =
    'flex flex-col p-4 bg-surface rounded-lg w-[400px]';

  @Output() updated = new EventEmitter<void>();

  private readonly accountService = inject(AccountService);

  emailControl = new FormControl('', [Validators.required, Validators.email]);

  close() {
    this.updated.emit(); // also used for cancel → closes the modal
  }

  submit() {
    console.log(this.emailControl);
    if (this.emailControl.invalid) return;

    const newEmail = this.emailControl.value!;
    this.accountService.updateEmail(newEmail).subscribe({
      next: () => this.updated.emit(),
      error: (err) => {
        console.error('Error while updating email:', err);
        alert('Failed to update email');
      },
    });
  }
}
