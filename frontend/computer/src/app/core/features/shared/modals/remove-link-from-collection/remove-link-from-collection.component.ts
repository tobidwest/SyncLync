// src/app/collection/remove-link-confirm-modal/remove-link-confirm-modal.component.ts
import { Component, EventEmitter, Output } from '@angular/core';

@Component({
  selector: 'app-remove-link-confirm-modal',
  standalone: true,
  imports: [],
  template: `
    <h2 class="text-xl font-semibold mb-4 text-white">
      Remove Link from Collection?
    </h2>
    <p class="text-white mb-4">
      The link
      <strong>will not be deleted if it is used in another collection</strong>;
      it will only be removed from this one.
    </p>
    <div class="flex justify-end gap-2 mt-6">
      <button
        class="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-500"
        (click)="cancel.emit()"
      >
        Cancel
      </button>
      <button
        class="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-500"
        (click)="confirm.emit()"
      >
        Remove
      </button>
    </div>
  `,
})
export class RemoveLinkConfirmModalComponent {
  @Output() confirm = new EventEmitter<void>();
  @Output() cancel = new EventEmitter<void>();
}
