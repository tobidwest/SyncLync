import { Component, EventEmitter, Output } from '@angular/core';

@Component({
  selector: 'app-remove-link-confirm-modal',
  standalone: true,
  imports: [],
  template: `
    <!-- Modal title -->
    <h2 class="text-xl font-semibold mb-4 text-white">
      Remove Link from Collection?
    </h2>

    <!-- Informative message to clarify behavior -->
    <p class="text-white mb-4">
      The link
      <strong>will not be deleted if it is used in another collection</strong>;
      it will only be removed from this one.
    </p>

    <!-- Action buttons -->
    <div class="flex justify-end gap-2 mt-6">
      <!-- Cancel button: emits cancellation event -->
      <button
        class="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-500"
        (click)="cancel.emit()"
      >
        Cancel
      </button>

      <!-- Confirm button: emits confirmation event -->
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
  /**
   * Emitted when the user confirms the removal.
   */
  @Output() confirm = new EventEmitter<void>();

  /**
   * Emitted when the user cancels the action.
   */
  @Output() cancel = new EventEmitter<void>();
}
