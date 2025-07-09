import { CdkMenuModule } from '@angular/cdk/menu';
import {
  Component,
  ComponentRef,
  ElementRef,
  Host,
  inject,
  ViewChild,
} from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import { FormControl, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { Overlay, OverlayConfig } from '@angular/cdk/overlay';
import { ComponentPortal, ComponentType } from '@angular/cdk/portal';
import { NgIf, NgFor } from '@angular/common';

import { ShareCollectionModalComponent } from '../../../shared/modals/share-collection-modal/share-collection-modal.component';
import { EditCollectionModalComponent } from '../../../shared/modals/edit-collection-modal/edit-collection-modal.component';
import { ConfirmModalComponent } from '../../../shared/modals/confirm-modal/confirm-modal.component';
import {
  CollectionStore,
  Collection,
} from '../../../shared/services/collection-store.service';
import { AuthService } from '../../../shared/services/auth.service';
import { LayoutComponent } from '../layout/layout.component';
import {
  AccountService,
  SortingOption,
} from '../../../shared/services/account.service';
import { ChangeEmailModalComponent } from '../../../shared/modals/change-email-modal/change-email-modal.component';
import { ChangePasswordModalComponent } from '../../../shared/modals/change-password-modal/change-password-modal.component';

@Component({
  selector: 'app-side-navigation',
  standalone: true,
  imports: [
    RouterModule,
    CdkMenuModule,
    ReactiveFormsModule,
    FormsModule,
    NgIf,
    NgFor,
  ],
  template: `
    <div class="flex flex-col w-full h-full">
      <!-- Logo -->
      <div class="flex shrink-0 items-center pt-4">
        <img class="h-18 w-auto m-auto" src="logo.png" alt="Your Company" />
      </div>

      <!-- Scrollable content area -->
      <div class="flex-1 overflow-y-auto px-6 mt-4">
        <nav class="flex flex-col">
          <ul role="list" class="flex flex-col gap-y-7">
            <li>
              <ul role="list" class="-mx-2 space-y-2">
                <!-- Add Collection -->
                <ng-container *ngIf="!showAddInput; else addForm">
                  <a
                    class="text-white group flex gap-3 rounded-md p-2 text-xl font-semibold cursor-pointer border-2 border-primary/80 bg-primary/80"
                    (click)="showAddInput = true"
                  >
                    + Add Collection
                  </a>
                </ng-container>
                <ng-template #addForm>
                  <div
                    class="flex items-center p-2 text-xl font-semibold text-white border-2 border-primary/80 rounded-md"
                  >
                    <input
                      [(ngModel)]="newCollectionName"
                      #inputRef
                      type="text"
                      class="flex-1 bg-transparent text-white placeholder-gray-400 focus:outline-none"
                      placeholder="New collection name"
                      (keydown.enter)="addCollection()"
                      (keydown.escape)="cancelAddCollection()"
                    />
                    <svg
                      class="w-4 h-4 cursor-pointer text-green-400"
                      (click)="addCollection()"
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 20 20"
                      fill="currentColor"
                      aria-hidden="true"
                    >
                      <path
                        fill-rule="evenodd"
                        d="M16.704 5.29a1 1 0 010 1.42l-8 8a1 1 0 01-1.408 0l-4-4a1 1 0 011.408-1.42L8 12.584l7.296-7.294a1 1 0 011.408 0z"
                        clip-rule="evenodd"
                      />
                    </svg>
                    <svg
                      class="w-4 h-4 cursor-pointer text-red-400 pl-2"
                      (click)="cancelAddCollection()"
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 20 20"
                      fill="currentColor"
                      aria-hidden="true"
                    >
                      <path
                        fill-rule="evenodd"
                        d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                        clip-rule="evenodd"
                      />
                    </svg>
                  </div>
                </ng-template>

                <!-- Collection links with context menu -->
                <ng-container *ngFor="let col of store.collections()">
                  <div
                    class="text-white hover:bg-surface hover:border-l-4 hover:border-primary
               group flex justify-between gap-x-3 rounded-md p-2 text-xl font-semibold
               cursor-pointer"
                    [routerLink]="['/collection', col._id]"
                    routerLinkActive="bg-surface border-l-4 border-primary"
                  >
                    {{ col.name }}
                    <svg
                      *ngIf="isActive(col._id)"
                      [cdkMenuTriggerFor]="collectionMenu"
                      cdkOverlayOrigin
                      class="w-4 h-6 cursor-pointer text-white"
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 16 24"
                      fill="currentColor"
                      aria-hidden="true"
                    >
                      <circle cx="8" cy="4" r="2" />
                      <circle cx="8" cy="12" r="2" />
                      <circle cx="8" cy="20" r="2" />
                    </svg>
                  </div>

                  <ng-template #collectionMenu cdkMenuPanel>
                    <div
                      cdkMenu
                      class="z-10 w-48 origin-top-right rounded-md bg-surface text-on-background py-1 shadow-lg focus:outline-none text-white ring-1"
                      role="menu"
                      aria-orientation="vertical"
                    >
                      @if(col.isOwner) {
                      <a
                        cdkMenuItem
                        class="block px-4 py-2 text-sm hover:bg-background cursor-pointer focus:outline-none"
                        role="menuitem"
                        (click)="openShareModal(col)"
                      >
                        Share Collection
                      </a>
                      <a
                        cdkMenuItem
                        class="block px-4 py-2 text-sm hover:bg-background cursor-pointer focus:outline-none"
                        role="menuitem"
                        (click)="openEditModal(col)"
                      >
                        Rename Collection
                      </a>
                      <a
                        cdkMenuItem
                        class="block px-4 py-2 text-sm hover:bg-background cursor-pointer focus:outline-none"
                        role="menuitem"
                        (click)="confirmDelete(col)"
                      >
                        Delete Collection
                      </a>
                      } @else {
                      <a
                        cdkMenuItem
                        class="block px-4 py-2 text-sm hover:bg-background cursor-pointer focus:outline-none"
                        role="menuitem"
                        (click)="confirmLeave(col)"
                      >
                        Leave Collection
                      </a>
                      }
                    </div>
                  </ng-template>
                </ng-container>
              </ul>
            </li>
          </ul>
        </nav>
      </div>

      <div class="p-4 text-white">
        <label class="block mb-1 text-sm font-medium">Sorting</label>
        <select
          class="w-full p-2 rounded bg-surface border border-gray-600 text-white"
          [formControl]="sortingControl"
        >
          <option *ngFor="let option of sortingOptions" [value]="option">
            {{ option }}
          </option>
        </select>
      </div>

      <!-- Profile area -->
      <div
        class="flex items-center gap-3 p-4 border-t border-surface text-white"
        [cdkMenuTriggerFor]="Usermenu"
        cdkOverlayOrigin
      >
        <span class="text-base font-medium">{{ username }}</span>
      </div>

      <!-- User menu -->
      <ng-template #Usermenu cdkMenuPanel>
        <div
          cdkMenu
          class="z-10 w-48 origin-top-right rounded-md bg-surface text-on-background py-1 shadow-lg focus:outline-none text-white ring-1"
          role="menu"
          aria-orientation="vertical"
        >
          <a
            cdkMenuItem
            class="block px-4 py-2 text-sm hover:bg-background cursor-pointer focus:outline-none"
            role="menuitem"
            (click)="openChangeEmailModal()"
          >
            Change Email
          </a>
          <a
            cdkMenuItem
            class="block px-4 py-2 text-sm hover:bg-background cursor-pointer focus:outline-none"
            role="menuitem"
            (click)="openChangePasswordModal()"
          >
            Change Password
          </a>
          <a
            cdkMenuItem
            class="block px-4 py-2 text-sm hover:bg-background text-red-400 cursor-pointer focus:outline-none"
            role="menuitem"
            (click)="onLogout()"
          >
            Logout
          </a>
        </div>
      </ng-template>
    </div>
  `,
})
export class SideNavigationComponent {
  private readonly router = inject(Router);
  private readonly overlay = inject(Overlay);
  readonly store = inject(CollectionStore);

  sortingControl = new FormControl<SortingOption>('created', {
    nonNullable: true,
  });

  readonly sortingOptions: SortingOption[] = [
    'created',
    'alphabetically',
    'counter',
  ];

  constructor(
    private storeAuth: AuthService,
    private accountService: AccountService,
    @Host() private parent: LayoutComponent // inject Layout instance
  ) {
    this.accountService.getSortingPreference().subscribe({
      next: (res) => {
        this.sortingControl.setValue(res.sorting);
        this.username = res.username; // 👈 assign here
      },
      error: (err) =>
        console.error('Error while retrieving sorting preference', err),
    });

    // Immediately persist on change
    this.sortingControl.valueChanges.subscribe((value) => {
      this.accountService.updateSortingPreference(value).subscribe({
        next: () => console.log('Sorting updated:', value),
        error: (err) =>
          console.error('Error while setting sorting preference', err),
      });
    });
  }

  @ViewChild('inputRef') inputRef?: ElementRef<HTMLInputElement>;

  showAddInput = false;
  newCollectionName = '';
  username = '';
  activeCollection: CollectionLink | null = null;

  onLogout() {
    this.storeAuth.logout().subscribe({
      next: () => {
        this.parent.userLoggedOut(); // parent callback
        this.router.navigate(['/']);
      },
      error: (err) => console.error('Logout failed', err),
    });
  }

  ngAfterViewChecked(): void {
    if (this.showAddInput && this.inputRef) {
      this.inputRef.nativeElement.focus();
    }
  }

  isActive(id: string): boolean {
    return this.router.isActive(`/collection/${id}`, {
      paths: 'subset',
      queryParams: 'ignored',
      matrixParams: 'ignored',
      fragment: 'ignored',
    });
  }

  addCollection(): void {
    const name = this.newCollectionName.trim();
    if (!name) return;

    this.store.addCollection(name); // 🚀 delegate to store
    this.resetAddForm();
  }

  private resetAddForm(): void {
    this.newCollectionName = '';
    this.showAddInput = false;
  }

  cancelAddCollection(): void {
    this.newCollectionName = '';
    this.showAddInput = false;
  }

  openShareModal(col: Collection) {
    const ref = this.openModal(ShareCollectionModalComponent);
    ref.instance.collection = { _id: col._id, shareId: col.shareId };
  }

  openEditModal(col: Collection) {
    const ref = this.openModal(EditCollectionModalComponent);
    ref.instance.collection = { id: col._id, name: col.name };

    ref.instance.updatedName.subscribe((name: string) => {
      this.store.updateCollectionName(col._id, name);
      ref.destroy();
    });
  }

  confirmDelete(col: Collection) {
    const ref = this.openModal(ConfirmModalComponent);
    ref.instance.title = 'Delete Collection?';
    ref.instance.description = `Do you really want to delete “${col.name}”?`;

    ref.instance.confirmed.subscribe((ok: boolean) => {
      if (ok) {
        this.store.deleteCollection(col._id);
      }
      ref.destroy();
    });
  }

  confirmLeave(col: Collection) {
    const ref = this.openModal(ConfirmModalComponent);
    ref.instance.title = 'Leave Collection?';
    ref.instance.description = `Do you really want to leave “${col.name}”?`;
    ref.instance.confirmed.subscribe((ok: boolean) => {
      this.store.leaveCollection(col._id);
      this.store.loadAll();
      ref.destroy();
    });
  }

  openChangeEmailModal() {
    const ref = this.openModal(ChangeEmailModalComponent);
    ref.instance.updated.subscribe(() => ref.destroy());
  }

  openChangePasswordModal() {
    const ref = this.openModal(ChangePasswordModalComponent);
    ref.instance.updated.subscribe(() => ref.destroy());
  }

  openModal<T>(
    component: ComponentType<T>,
    config?: OverlayConfig
  ): ComponentRef<T> {
    const overlayRef = this.overlay.create({
      hasBackdrop: true,
      backdropClass: 'bg-black/60',
      positionStrategy: this.overlay
        .position()
        .global()
        .centerHorizontally()
        .centerVertically(),
      panelClass: [
        'rounded-lg',
        'p-4',
        'bg-surface',
        'text-white',
        'shadow-lg',
      ],
      scrollStrategy: this.overlay.scrollStrategies.block(),
      ...config,
    });

    const portal = new ComponentPortal(component);
    const ref = overlayRef.attach(portal);

    overlayRef.backdropClick().subscribe(() => overlayRef.dispose());

    return ref;
  }
}

interface CollectionLink {
  name: string;
  id: string;
}
