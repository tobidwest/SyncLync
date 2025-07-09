// src/app/shared/modals/share-collection-modal/share-collection-modal.component.ts
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
  @HostBinding('class') class = 'grow';
  @Input({ required: true }) collection!: { _id: string; shareId: string };
  /** wird vom Overlay-Aufrufer gesetzt */
  private readonly fb = inject(FormBuilder);
  close!: () => void;

  readonly form = this.fb.group({
    email: ['', [Validators.required, Validators.email]],
  });

  get shareLink(): string {
    return `${location.origin}/join/${this.collection.shareId}`;
  }

  copy() {
    navigator.clipboard.writeText(this.shareLink);
    alert('Link in Zwischenablage kopiert');
    this.close();
  }
}
