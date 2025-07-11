import { NgClass, NgFor, NgIf } from '@angular/common';
import {
  Component,
  EventEmitter,
  HostBinding,
  Input,
  Output,
} from '@angular/core';
import { FormsModule } from '@angular/forms';

export interface SimpleCollection {
  id: string;
  name: string;
}

@Component({
  selector: 'app-add-to-collection',
  standalone: true,
  imports: [FormsModule, NgFor, NgClass, NgIf],
  template: `
    <!-- Modal heading -->
    <h2 class="text-xl font-semibold mb-4 text-white">
      Add Link to Another Collection
    </h2>

    <!-- Search input field for filtering collections -->
    <input
      type="text"
      [(ngModel)]="search"
      placeholder="Search collections..."
      class="w-full mb-4 p-2 rounded border border-gray-600 bg-surface text-white placeholder-gray-400"
    />

    <!-- Scrollable list of filtered collections -->
    <ul
      class="min-h-[240px] max-h-[240px] overflow-y-auto space-y-2 border border-gray-700 rounded p-2"
    >
      <li
        *ngFor="let col of filtered()"
        (click)="toggle(col.id)"
        [class.opacity-50]="isExisting(col.id)"
        [class.pointer-events-none]="isExisting(col.id)"
        class="flex items-center gap-2 p-2 rounded cursor-pointer hover:bg-background transition"
      >
        <!-- Custom checkbox with styling depending on selection state -->
        <span
          class="w-5 h-5 flex items-center justify-center border rounded-sm"
          [ngClass]="{
            'bg-primary border-primary text-white': isSelected(col.id),
            'border-gray-400': !isSelected(col.id)
          }"
        >
          <!-- Checkmark only appears if the item is selected or already exists -->
          <span *ngIf="isSelected(col.id)">✓</span>
        </span>

        <!-- Display collection name -->
        <span class="text-white">{{ col.name }}</span>
      </li>
    </ul>

    <!-- Action buttons: cancel or confirm selection -->
    <div class="flex justify-end gap-2 mt-6">
      <button
        class="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-600/60"
        (click)="close()"
      >
        Cancel
      </button>
      <!-- Disable button unless user selected something -->
      <button
        class="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-600/60"
        [disabled]="selectedIds.size === 0"
        (click)="submit()"
      >
        Save
      </button>
    </div>
  `,
})
export class AddToCollectionComponent {
  // Apply consistent styling to the modal container
  @HostBinding('class') host =
    'flex flex-col p-4 bg-surface rounded-lg shadow-lg w-[400px]';

  /** List of available collections (excluding the current one) */
  @Input({ required: true }) collections: SimpleCollection[] = [];

  /** Collection IDs that already contain the link (preselected & non-editable) */
  @Input() existingIds: string[] = [];

  /**
   * Emits an array of newly selected collection IDs on submit,
   * or null when the modal is cancelled.
   */
  @Output() selectedIdsChange = new EventEmitter<string[] | null>();

  /** Current search string for filtering collections */
  search = '';

  /** Holds collection IDs selected by the user (not yet saved) */
  readonly selectedIds = new Set<string>();

  // --- Selection Logic ---

  /**
   * Returns true if the item is either already associated with the link
   * or has been selected by the user in this modal.
   */
  isSelected(id: string): boolean {
    return this.existingIds.includes(id) || this.selectedIds.has(id);
  }

  /**
   * Returns true if the collection already contains the link.
   * Used to prevent interaction.
   */
  isExisting(id: string): boolean {
    return this.existingIds.includes(id);
  }

  /**
   * Toggles selection state of a collection.
   * Does nothing if the collection is already linked (non-interactive).
   */
  toggle(id: string): void {
    if (this.isExisting(id)) return;

    this.isSelected(id)
      ? this.selectedIds.delete(id)
      : this.selectedIds.add(id);
  }

  /**
   * Filters collections by name based on current search input.
   * Case-insensitive.
   */
  filtered(): SimpleCollection[] {
    const q = this.search.toLowerCase();
    return this.collections.filter((c) => c.name.toLowerCase().includes(q));
  }

  /**
   * Cancels the modal and signals that no changes should be applied.
   */
  close(): void {
    this.selectedIdsChange.emit(null);
  }

  /**
   * Emits only the newly selected collection IDs to the parent.
   */
  submit(): void {
    this.selectedIdsChange.emit([...this.selectedIds]);
  }
}
