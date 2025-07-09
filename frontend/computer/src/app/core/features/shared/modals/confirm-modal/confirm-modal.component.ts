import { Component, EventEmitter, Input, Output } from '@angular/core';

@Component({
  standalone: true,
  selector: 'app-confirm-modal',
  template: `
    <div
      class="flex flex-col gap-6 p-4 w-[400px] text-white bg-surface rounded-lg"
    >
      <h2 class="text-xl font-bold">{{ title }}</h2>
      <p class="text-base">{{ description }}</p>

      <div class="flex justify-end gap-3">
        <button
          class="px-4 py-2 rounded bg-gray-600 hover:bg-gray-500"
          (click)="confirmed.emit(false)"
        >
          {{ cancelText }}
        </button>
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
  @Input() title = 'Are you sure?';
  @Input() description = '';
  @Input() confirmText = 'Confirm';
  @Input() cancelText = 'Cancel';

  @Output() confirmed = new EventEmitter<boolean>();
}
