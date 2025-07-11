import { Component, HostBinding, inject, Input } from '@angular/core';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';

@Component({
  standalone: true,
  selector: 'app-share-collection-modal',
  imports: [ReactiveFormsModule],
  template: `
    <!-- Modal Title -->
    <h2 class="text-xl font-semibold mb-4 text-white">Share Collection</h2>

    <!-- Sharing UI: shows share link and copy button -->
    <div class="flex flex-col gap-3">
      <!-- Read-only input with full share URL -->
      <input
        [value]="shareLink"
        readonly
        class="w-full p-2 rounded border border-gray-600 bg-background text-white"
      />

      <!-- Copy button copies the link to clipboard -->
      <button class="px-3 py-1 bg-primary text-white rounded" (click)="copy()">
        Copy Link
      </button>
    </div>
  `,
})
export class ShareCollectionModalComponent {
  // Adds layout styling to the host element
  @HostBinding('class') class = 'grow';

  /**
   * Input from parent: the collection being shared.
   * Must include `_id` and `shareId`.
   */
  @Input({ required: true }) collection!: { _id: string; shareId: string };

  /**
   * Optional close callback that can be set from the overlay system.
   */
  close!: () => void;

  /**
   * Computes the full share link for the collection.
   * Uses current origin and the shareId to generate a valid join URL.
   */
  get shareLink(): string {
    return `${location.origin}/join/${this.collection.shareId}`;
  }

  /**
   * Copies the share link to the clipboard and notifies the user.
   * Also closes the modal, if the `close` callback is set.
   */
  copy() {
    navigator.clipboard.writeText(this.shareLink);
    alert('Link in Zwischenablage kopiert');
    this.close();
  }
}
