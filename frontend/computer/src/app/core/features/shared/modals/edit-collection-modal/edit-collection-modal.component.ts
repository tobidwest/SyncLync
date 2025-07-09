import { Component, EventEmitter, Input, Output } from '@angular/core';
import { FormsModule } from '@angular/forms';

@Component({
  standalone: true,
  imports: [FormsModule],
  selector: 'app-edit-collection-modal',
  template: `
    <div
      class="flex flex-col gap-6 p-4 text-white bg-surface w-400px rounded-lg"
    >
      <h2 class="text-xl font-bold">Edit Collection</h2>
      <input
        [(ngModel)]="editedName"
        class="px-3 py-2 rounded border border-gray-600 bg-background text-white"
        placeholder="New name"
      />

      <div class="flex justify-end gap-3">
        <button
          class="px-4 py-2 rounded bg-gray-600 hover:bg-gray-500"
          (click)="updatedName.emit(null)"
        >
          Cancel
        </button>
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
  @Input() collection!: { id: string; name: string };
  @Output() updatedName = new EventEmitter<string | null>();

  editedName = '';

  ngOnInit() {
    this.editedName = this.collection.name;
  }
}
