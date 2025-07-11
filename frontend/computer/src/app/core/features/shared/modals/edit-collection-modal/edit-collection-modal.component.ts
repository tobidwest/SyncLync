import { Component, EventEmitter, Input, Output } from '@angular/core';
import { FormsModule } from '@angular/forms';

@Component({
  standalone: true,
  imports: [FormsModule],
  selector: 'app-edit-collection-modal',
  template: `
    <!-- Modal container -->
    <div
      class="flex flex-col gap-6 p-4 text-white bg-surface w-400px rounded-lg"
    >
      <!-- Title -->
      <h2 class="text-xl font-bold">Edit Collection</h2>

      <!-- Input field for the new collection name -->
      <input
        [(ngModel)]="editedName"
        class="px-3 py-2 rounded border border-gray-600 bg-background text-white"
        placeholder="New name"
      />

      <!-- Action buttons -->
      <div class="flex justify-end gap-3">
        <!-- Cancel button: emits null to indicate no change -->
        <button
          class="px-4 py-2 rounded bg-gray-600 hover:bg-gray-500"
          (click)="updatedName.emit(null)"
        >
          Cancel
        </button>

        <!-- Confirm button: emits the new name if valid -->
        <button
          class="px-4 py-2 rounded bg-primary hover:bg-primary/80 text-white"
          [disabled]="!editedName.trim()"
          (click)="updatedName.emit(editedName.trim())"
        >
          Update Name
        </button>
      </div>
    </div>
  `,
})
export class EditCollectionModalComponent {
  /** Input object with collection id and current name */
  @Input() collection!: { id: string; name: string };

  /**
   * Emits the new trimmed name if updated,
   * or `null` if cancelled
   */
  @Output() updatedName = new EventEmitter<string | null>();

  /** Two-way bound input field value */
  editedName = '';

  ngOnInit() {
    // Initialize the input field with the current name
    this.editedName = this.collection.name;
  }
}
