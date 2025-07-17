import { Component, HostBinding, inject, Input } from '@angular/core';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';

@Component({
  standalone: true,
  selector: 'app-share-collection-modal',
  imports: [ReactiveFormsModule],
  template: `
    <h2 class="text-xl font-semibold mb-4 text-white">Share Collection</h2>

    <div class="flex flex-col gap-3">
      <input
        [value]="shareLink"
        readonly
        class="w-full p-2 rounded border border-gray-600 bg-background text-white"
      />
      <button class="px-3 py-1 bg-primary text-white rounded" (click)="copy()">
        Copy Link
      </button>
    </div>
  `,
})
export class ShareCollectionModalComponent {
  // Apply a CSS class to make the modal expand and fill available space
  @HostBinding('class') class = 'grow';

  // The collection to be shared – passed in by the parent component or modal opener
  @Input({ required: true }) collection!: { _id: string; shareId: string };

  // FormBuilder injected manually using Angular's inject() function
  private readonly fb = inject(FormBuilder);

  // This function will be provided by the modal system to close the overlay
  close!: () => void;

  // Simple form setup with one email field, using required and email validators
  readonly form = this.fb.group({
    email: ['', [Validators.required, Validators.email]],
  });

  // Compute the public share link based on the current origin and the collection's share ID
  get shareLink(): string {
    return `${location.origin}/join/${this.collection.shareId}`;
  }

  // Copy the generated share link to the clipboard and notify the user
  copy() {
    navigator.clipboard.writeText(this.shareLink);
    alert('Link in Zwischenablage kopiert'); // Consider translating this if the app is multilingual
    this.close(); // Close the modal after the action
  }
}
