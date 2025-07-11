import { Component, EventEmitter, Input, Output } from '@angular/core';

@Component({
  standalone: true,
  selector: 'app-confirm-modal',
  template: `
    <!-- Modal container -->
    <div
      class="flex flex-col gap-6 p-4 w-[400px] text-white bg-surface rounded-lg"
    >
      <!-- Modal title -->
      <h2 class="text-xl font-bold">{{ title }}</h2>

      <!-- Optional description text -->
      <p class="text-base">{{ description }}</p>

      <!-- Action buttons -->
      <div class="flex justify-end gap-3">
        <!-- Cancel button: emits false -->
        <button
          class="px-4 py-2 rounded bg-gray-600 hover:bg-gray-500"
          (click)="confirmed.emit(false)"
        >
          {{ cancelText }}
        </button>

        <!-- Confirm button: emits true -->
        <button
          class="px-4 py-2 rounded bg-red-600 hover:bg-red-500"
          (click)="confirmed.emit(true)"
        >
          {{ confirmText }}
        </button>
      </div>
    </div>
  `,
})
export class ConfirmModalComponent {
  /** Main heading of the modal */
  @Input() title = 'Are you sure?';

  /** Additional descriptive text below the title */
  @Input() description = '';

  /** Text for the confirm button (e.g. "Delete", "Leave") */
  @Input() confirmText = 'Confirm';

  /** Text for the cancel button */
  @Input() cancelText = 'Cancel';

  /**
   * Emits `true` if the user confirms, `false` if they cancel.
   * Used by parent component to decide what to do.
   */
  @Output() confirmed = new EventEmitter<boolean>();
}
