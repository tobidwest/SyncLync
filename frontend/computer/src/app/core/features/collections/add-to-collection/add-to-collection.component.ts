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
    <h2 class="text-xl font-semibold mb-4 text-white">
      Add Link to Another Collection
    </h2>

    <input
      type="text"
      [(ngModel)]="search"
      placeholder="Search collections..."
      class="w-full mb-4 p-2 rounded border border-gray-600 bg-surface text-white placeholder-gray-400"
    />

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
        <span
          class="w-5 h-5 flex items-center justify-center border rounded-sm"
          [ngClass]="{
            'bg-primary border-primary text-white': isSelected(col.id),
            'border-gray-400': !isSelected(col.id)
          }"
        >
          <!-- always show checkmark for existing ones -->
          <span *ngIf="isSelected(col.id)">✓</span>
        </span>
        <span class="text-white">{{ col.name }}</span>
      </li>
    </ul>

    <div class="flex justify-end gap-2 mt-6">
      <button
        class="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-600/60"
        (click)="close()"
      >
        Cancel
      </button>
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
  @HostBinding('class') host =
    'flex flex-col p-4 bg-surface rounded-lg shadow-lg w-[400px]';

  /** All collections except the current one */
  @Input({ required: true }) collections: SimpleCollection[] = [];

  /** IDs of collections that already contain the link */
  @Input() existingIds: string[] = [];

  /** Emits ONLY the newly selected collection IDs, or null on cancel */
  @Output() selectedIdsChange = new EventEmitter<string[] | null>();

  search = '';
  readonly selectedIds = new Set<string>();

  // --- Helpers ---

  /** Returns true if already exists OR user has selected it */
  isSelected(id: string): boolean {
    return this.existingIds.includes(id) || this.selectedIds.has(id);
  }

  /** Returns true if this collection is already containing the link */
  isExisting(id: string): boolean {
    return this.existingIds.includes(id);
  }

  toggle(id: string): void {
    // don’t allow toggling existing ones
    if (this.isExisting(id)) return;

    this.isSelected(id)
      ? this.selectedIds.delete(id)
      : this.selectedIds.add(id);
  }

  filtered(): SimpleCollection[] {
    const q = this.search.toLowerCase();
    return this.collections.filter((c) => c.name.toLowerCase().includes(q));
  }

  close(): void {
    this.selectedIdsChange.emit(null);
  }

  submit(): void {
    // only emit the newly selected ones
    this.selectedIdsChange.emit([...this.selectedIds]);
  }
}
