import { Component, computed, inject, signal } from '@angular/core';
import { CdkMenuModule } from '@angular/cdk/menu';
import {
  FormBuilder,
  FormGroup,
  FormsModule,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { Overlay, OverlayRef } from '@angular/cdk/overlay';
import { ComponentPortal } from '@angular/cdk/portal';

import { AddToCollectionComponent } from '../add-to-collection/add-to-collection.component';
import {
  CollectionStore,
  Link,
} from '../../shared/services/collection-store.service';
import { EditLinkModalComponent } from '../../shared/modals/edit-link-modal/edit-link-modal.component';
import { RemoveLinkConfirmModalComponent } from '../../shared/modals/remove-link-from-collection/remove-link-from-collection.component';

@Component({
  selector: 'app-list',
  standalone: true,
  imports: [CdkMenuModule, FormsModule, ReactiveFormsModule],
  template: `
    @if(current()){
    <ul
      role="list"
      class="grid grid-cols-1 gap-6 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 pt-12 px-8"
    >
      <!-- + Add card -->
      @if(!showAddForm()){
      <li
        (click)="showAddForm.set(true)"
        class="cursor-pointer col-span-1 flex flex-col items-center justify-center
                 rounded-lg bg-surface text-center shadow border-background border-3
                 border-dashed hover:border-primary hover:bg-background transition"
      >
        <div class="flex flex-col items-center p-8">
          <div
            class="flex items-center justify-center size-24 rounded-full
                     bg-primary text-white text-2xl font-bold"
          >
            +
          </div>
          <h3 class="mt-6 text-sm font-medium text-white">Add Link</h3>
        </div>
      </li>
      }

      <!-- Add form -->
      @if(showAddForm()){
      <li
        class="col-span-1 flex flex-col justify-between rounded-lg bg-surface text-center
         shadow border-primary border-2 p-4"
      >
        <form
          [formGroup]="addForm"
          (ngSubmit)="addLink()"
          class="flex flex-col h-full justify-between"
        >
          <div>
            <input
              type="text"
              formControlName="name"
              placeholder="Link name"
              class="mb-2 w-full rounded-md p-2 text-white bg-background placeholder-gray-400 focus:outline-none"
            />
            <input
              type="text"
              formControlName="url"
              placeholder="Link URL"
              class="mb-4 w-full rounded-md p-2 text-white bg-background placeholder-gray-400 focus:outline-none"
            />
          </div>
          <div class="flex justify-end gap-2">
            <button
              type="button"
              class="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-600/60 cursor-pointer"
              (click)="cancelAddLink()"
            >
              Cancel
            </button>
            <button
              type="submit"
              class="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-600/60 cursor-pointer"
            >
              Save
            </button>
          </div>
        </form>
      </li>
      }

      <!-- Existing links -->
      @for(link of links(); track link._id) {
      <li
        class="group relative cursor-pointer col-span-1 flex flex-col rounded-lg
                 bg-surface text-center shadow border-background border-3 hover:border-primary"
      >
        <div class="flex flex-1 flex-col p-8">
          <img
            class="mx-auto size-24 shrink-0 rounded-full"
            [src]="link.icon || 'https://placehold.co/96x96'"
            alt="favicon"
          />
          <h3 class="mt-6 text-sm font-medium text-white truncate">
            {{ link.name }}
          </h3>
        </div>

        <!-- Menu trigger visible on hover -->
        <div
          class="absolute top-2 right-3 text-white cursor-pointer opacity-100
                    transition-opacity"
          [cdkMenuTriggerFor]="linkMenu"
          cdkOverlayOrigin
          (click)="selectedLink = link"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="16"
            height="24"
            viewBox="0 0 16 24"
            fill="currentColor"
            aria-hidden="true"
          >
            <circle cx="8" cy="4" r="2" />
            <circle cx="8" cy="12" r="2" />
            <circle cx="8" cy="20" r="2" />
          </svg>
        </div>
      </li>
      }

      <!-- Context menu -->
      <ng-template #linkMenu cdkMenuPanel>
        <div
          cdkMenu
          class="z-10 w-48 origin-top-right rounded-md bg-surface text-on-background
                 py-1 shadow-lg ring-1 focus:outline-none text-white"
          role="menu"
        >
          <a
            cdkMenuItem
            class="block px-4 py-2 text-sm hover:bg-background cursor-pointer focus:outline-none"
            (click)="openAddToCollectionModal()"
          >
            Add to another collection
          </a>
          <a
            cdkMenuItem
            class="block px-4 py-2 text-sm hover:bg-background cursor-pointer focus:outline-none"
            (click)="openEditLinkModal()"
          >
            Edit link
          </a>
          @if(isOwner()){
          <a
            cdkMenuItem
            class="block px-4 py-2 text-sm hover:bg-background cursor-pointer focus:outline-none"
            (click)="confirmRemoveLink()"
          >
            Remove from this collection
          </a>
          }
        </div>
      </ng-template>
    </ul>
    }@else {
    <div class="h-full w-full flex justify-center items-center">
      <p class="text-white text-5xl">Please select a collection</p>
    </div>
    }
  `,
})
export class ListComponent {
  /* ---------- Dependency injection ---------- */
  private readonly overlay = inject(Overlay);
  private readonly store = inject(CollectionStore);

  /* ---------- Signals ---------- */
  /** current collection links (reactive to store updates) */
  readonly links = computed(() => this.store.current()?.links ?? []);
  readonly isOwner = computed(() => this.store.current()?.isOwner || false);
  readonly current = computed(() => this.store.current());

  /** controls form visibility */
  readonly showAddForm = signal(false);

  /* ---------- View state ---------- */
  readonly addForm: FormGroup;

  constructor(private fb: FormBuilder) {
    this.addForm = this.fb.group({
      name: ['', Validators.required],
      url: ['', [Validators.required]],
    });
  }

  selectedLink: Link | null = null;

  /* ---------- Actions ---------- */

  addLink(): void {
    if (this.addForm.invalid) return;

    const name = this.addForm.value.name.trim();
    const url = this.addForm.value.url.trim();
    const current = this.store.current();
    if (!name || !url || !current) return;

    this.store.addLink(current._id, { name, url });
    this.resetForm();
  }

  cancelAddLink(): void {
    this.resetForm();
  }

  private resetForm(): void {
    this.addForm.reset();
    this.showAddForm.set(false);
  }

  openEditLinkModal(): void {
    if (!this.selectedLink) return;

    const ref = this.overlay.create({
      hasBackdrop: true,
      backdropClass: 'bg-black/60',
      positionStrategy: this.overlay
        .position()
        .global()
        .centerHorizontally()
        .centerVertically(),
      scrollStrategy: this.overlay.scrollStrategies.block(),
      panelClass: [
        'rounded-lg',
        'p-4',
        'bg-surface',
        'text-white',
        'w-[400px]',
        'shadow-lg',
      ],
    });

    const portal = new ComponentPortal(EditLinkModalComponent);
    const cmpRef = ref.attach(portal);

    // pass link data to the modal
    cmpRef.instance.link = {
      name: this.selectedLink.name,
      url: this.selectedLink.url,
    };

    // handle save / cancel events
    cmpRef.instance.saved.subscribe((data) => {
      if (data) {
        // delegate to store
        this.store.updateLink(this.selectedLink!._id, data);
      }
      ref.dispose();
    });

    ref.backdropClick().subscribe(() => ref.dispose());
  }

  openAddToCollectionModal(): void {
    if (!this.selectedLink) return;

    // 1) Erzeuge das Overlay (unverändert)
    const ref: OverlayRef = this.overlay.create({
      hasBackdrop: true,
      backdropClass: 'bg-black/60',
      positionStrategy: this.overlay
        .position()
        .global()
        .centerHorizontally()
        .centerVertically(),
      scrollStrategy: this.overlay.scrollStrategies.block(),

      /* ⚠️ statt ein String mit Leerzeichen … */
      // panelClass: 'rounded-lg p-4 bg-surface text-white w-[400px] shadow-lg',

      /* ✅ ... ein String-Array */
      panelClass: [
        'rounded-lg',
        'p-4',
        'bg-surface',
        'text-white',
        'w-[400px]',
        'shadow-lg',
      ],
    });
    const portal = new ComponentPortal(AddToCollectionComponent);
    const cmpRef = ref.attach(portal);

    // 2) Aktuelle Collection-ID aus dem Store holen
    const currentCollection = this.store.current();
    const currentId = currentCollection?._id;

    // 3) Verfügbare Collections (ohne die aktuelle)
    const all = this.store.collections();
    const available = all
      .filter((c) => c._id !== currentId)
      .map((c) => ({ id: c._id, name: c.name }));

    // 4) Bereits bestehende Links ermitteln
    const existing = all
      .filter((c) => c.links.some((l) => l._id === this.selectedLink!._id))
      .map((c) => c._id);

    // 5) Inputs ins Modal setzen
    cmpRef.instance.collections = available;
    cmpRef.instance.existingIds = existing;

    // 6) Auf neue Auswahl reagieren
    cmpRef.instance.selectedIdsChange.subscribe((ids) => {
      if (ids) {
        ids.forEach((cid) =>
          this.store.addExistingLinkToCollection(this.selectedLink!._id, cid)
        );
      }
      ref.dispose();
    });

    ref.backdropClick().subscribe(() => ref.dispose());
  }

  confirmRemoveLink(): void {
    if (!this.selectedLink) return;
    const current = this.store.current();
    if (!current) return;

    const ref: OverlayRef = this.overlay.create({
      hasBackdrop: true,
      backdropClass: 'bg-black/60',
      positionStrategy: this.overlay
        .position()
        .global()
        .centerHorizontally()
        .centerVertically(),
      scrollStrategy: this.overlay.scrollStrategies.block(),
      panelClass: [
        'rounded-lg',
        'p-4',
        'bg-surface',
        'text-white',
        'w-[400px]',
        'shadow-lg',
      ],
    });

    const cmpRef = ref.attach(
      new ComponentPortal(RemoveLinkConfirmModalComponent)
    );

    cmpRef.instance.confirm.subscribe(() => {
      this.store.removeLinkFromCollection(current._id, this.selectedLink!._id);
      ref.dispose();
    });

    cmpRef.instance.cancel.subscribe(() => ref.dispose());
  }

  private extractErrorMessage(err: any): string {
    try {
      if (typeof err === 'string') return err;
      if (err?.error?.error) return err.error.error;
      if (err?.message) return err.message;
      return 'An unexpected error occurred.';
    } catch {
      return 'An unexpected error occurred.';
    }
  }
}
