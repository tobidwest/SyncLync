import { CdkMenuModule } from '@angular/cdk/menu';
import {
  Component,
  ComponentRef,
  ElementRef,
  EventEmitter,
  Host,
  inject,
  Output,
  ViewChild,
} from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import { FormControl, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { Overlay, OverlayConfig } from '@angular/cdk/overlay';
import { ComponentPortal, ComponentType } from '@angular/cdk/portal';
import { NgIf, NgFor } from '@angular/common';
import { NgSelectModule } from '@ng-select/ng-select';

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
    NgSelectModule,
  ],
  template: `
    <div class="flex flex-col w-full h-full bg-[#0E1923]">
      <!-- App Logo -->
      <div class="flex shrink-0 items-center pt-4">
        <img class="w-auto m-auto h-[50px]" src="logo.png" alt="Your Company" />
      </div>

      <!-- Main navigation area (scrollable if needed) -->
      <div class="flex-1 overflow-y-auto px-6 mt-4">
        <nav class="flex flex-col">
          <ul class="flex flex-col gap-y-7">
            <li>
              <ul class="-mx-2 space-y-2">
                <!-- Button to add a new collection -->
                <ng-container *ngIf="!showAddInput; else addForm">
                  <a
                    class="text-white flex gap-3 rounded-md p-2 text-xl font-semibold cursor-pointer border-2 border-primary/80 bg-primary/80"
                    (click)="showAddInput = true"
                  >
                    + Add Collection
                  </a>
                </ng-container>

                <!-- Inline input for new collection -->
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
                    <!-- Confirm add -->
                    <svg
                      class="w-6 h-6 cursor-pointer text-green-400"
                      (click)="addCollection()"
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 20 20"
                      fill="currentColor"
                    >
                      <path
                        fill-rule="evenodd"
                        d="M16.704 5.29a1 1 0 010 1.42l-8 8a1 1 0 01-1.408 0l-4-4a1 1 0 011.408-1.42L8 12.584l7.296-7.294a1 1 0 011.408 0z"
                        clip-rule="evenodd"
                      />
                    </svg>
                    <!-- Cancel -->
                    <svg
                      class="w-8 h-8 cursor-pointer text-red-400 pl-2"
                      (click)="cancelAddCollection()"
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 20 20"
                      fill="currentColor"
                    >
                      <path
                        fill-rule="evenodd"
                        d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                        clip-rule="evenodd"
                      />
                    </svg>
                  </div>
                </ng-template>

                <!-- Collection links -->
                <ng-container *ngFor="let col of store.collections()">
                  <div
                    class="text-white hover:bg-surface hover:border-l-4 hover:border-primary flex justify-between gap-x-3 rounded-md p-2 text-xl font-semibold cursor-pointer"
                    [routerLink]="['/collection', col._id]"
                    routerLinkActive="bg-surface border-l-4 border-primary"
                    (click)="closeSidebar.emit()"
                  >
                    {{ col.name }}
                    <!-- Context menu trigger (visible if current) -->
                    <svg
                      *ngIf="isActive(col._id)"
                      [cdkMenuTriggerFor]="collectionMenu"
                      cdkOverlayOrigin
                      class="w-4 h-6 cursor-pointer text-white"
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 16 24"
                      fill="currentColor"
                      (click)="$event.stopPropagation()"
                    >
                      <circle cx="8" cy="4" r="2" />
                      <circle cx="8" cy="12" r="2" />
                      <circle cx="8" cy="20" r="2" />
                    </svg>
                  </div>

                  <!-- Collection context menu -->
                  <ng-template #collectionMenu cdkMenuPanel>
                    <div
                      cdkMenu
                      class="z-10 w-48 origin-top-right rounded-md bg-surface text-on-background py-1 shadow-lg text-white ring-1"
                      role="menu"
                    >
                      @if(col.isOwner) {
                      <a
                        cdkMenuItem
                        class="block px-4 py-2 text-sm hover:bg-background cursor-pointer"
                        (click)="openShareModal(col)"
                      >
                        Share Collection
                      </a>
                      <a
                        cdkMenuItem
                        class="block px-4 py-2 text-sm hover:bg-background cursor-pointer"
                        (click)="openEditModal(col)"
                      >
                        Rename Collection
                      </a>
                      <a
                        cdkMenuItem
                        class="block px-4 py-2 text-sm hover:bg-background cursor-pointer"
                        (click)="confirmDelete(col)"
                      >
                        Delete Collection
                      </a>
                      } @else {
                      <a
                        cdkMenuItem
                        class="block px-4 py-2 text-sm hover:bg-background cursor-pointer"
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

      <!-- Sorting dropdown -->
      <div class="p-4 text-white">
        <label class="block mb-1 text-sm font-medium">Sorting</label>
        <ng-select
          class="ng-background"
          [formControl]="sortingControl"
          [items]="sortingOptions"
          [searchable]="true"
          [clearable]="false"
        ></ng-select>
      </div>

      <!-- User info & settings menu -->
      <div
        class="flex items-center gap-3 p-4 border-t border-surface text-white"
        [cdkMenuTriggerFor]="Usermenu"
        cdkOverlayOrigin
      >
        <span class="text-base font-medium">{{ username }}</span>
      </div>

      <!-- User menu overlay -->
      <ng-template #Usermenu cdkMenuPanel>
        <div
          cdkMenu
          class="z-10 w-48 origin-top-right rounded-md bg-surface text-on-background py-1 shadow-lg text-white ring-1"
          role="menu"
        >
          <a
            cdkMenuItem
            class="block px-4 py-2 text-sm hover:bg-background cursor-pointer"
            (click)="openChangeEmailModal()"
          >
            Change Email
          </a>
          <a
            cdkMenuItem
            class="block px-4 py-2 text-sm hover:bg-background cursor-pointer"
            (click)="openChangePasswordModal()"
          >
            Change Password
          </a>
          <a
            cdkMenuItem
            class="block px-4 py-2 text-sm hover:bg-background text-red-400 cursor-pointer"
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
  /** Emits when sidebar should be closed (e.g. after click in mobile view) */
  @Output() closeSidebar = new EventEmitter<void>();

  /** Input reference to automatically focus when showing new collection input */
  @ViewChild('inputRef') inputRef?: ElementRef<HTMLInputElement>;

  /** Controls whether the add-collection input is shown */
  showAddInput = false;

  /** Holds the input value for a new collection name */
  newCollectionName = '';

  /** Stores the username to be displayed in the user menu */
  username = '';

  /** FormControl for sorting dropdown */
  sortingControl = new FormControl<SortingOption>('created', {
    nonNullable: true,
  });

  /** Available sorting options */
  readonly sortingOptions: SortingOption[] = [
    'created',
    'alphabetically',
    'counter',
  ];

  /** Angular Router for navigation and active state checking */
  private readonly router = inject(Router);

  /** CDK Overlay service to open modals */
  private readonly overlay = inject(Overlay);

  /** Collection store managing all collection-related state and operations */
  readonly store = inject(CollectionStore);

  constructor(
    private storeAuth: AuthService,
    private accountService: AccountService,
    @Host() private parent: LayoutComponent // Access to parent layout for logout callback
  ) {
    // Load sorting preference and username once at init
    this.accountService.getSortingPreference().subscribe({
      next: (res) => {
        this.sortingControl.setValue(res.sorting);
        this.username = res.username;
      },
      error: (err) =>
        console.error('Error while retrieving sorting preference', err),
    });

    // Persist sorting changes immediately when user changes selection
    this.sortingControl.valueChanges.subscribe((value) => {
      this.accountService.updateSortingPreference(value).subscribe({
        next: () => {
          console.log('Sorting updated:', value);
          this.closeSidebar.emit(); // optional: close sidebar on change
        },
        error: (err) =>
          console.error('Error while setting sorting preference', err),
      });
    });
  }

  /** Automatically focus input when input field becomes visible */
  ngAfterViewChecked(): void {
    if (this.showAddInput && this.inputRef) {
      this.inputRef.nativeElement.focus();
    }
  }

  /** Checks if a collection is the currently active route */
  isActive(id: string): boolean {
    return this.router.isActive(`/collection/${id}`, {
      paths: 'subset',
      queryParams: 'ignored',
      matrixParams: 'ignored',
      fragment: 'ignored',
    });
  }

  /** Creates a new collection and resets the input */
  addCollection(): void {
    const name = this.newCollectionName.trim();
    if (!name) return;

    this.store.addCollection(name);
    this.resetAddForm();
    this.closeSidebar.emit();
  }

  /** Cancels the "add collection" flow */
  cancelAddCollection(): void {
    this.resetAddForm();
  }

  /** Resets internal state after collection add/cancel */
  private resetAddForm(): void {
    this.newCollectionName = '';
    this.showAddInput = false;
  }

  /** Triggers logout and delegates auth reset to parent layout */
  onLogout() {
    this.storeAuth.logout().subscribe({
      next: () => {
        this.parent.userLoggedOut(); // notify layout
        this.router.navigate(['/']);
      },
      error: (err) => console.error('Logout failed', err),
    });
  }

  /** Opens modal to share a collection (owners only) */
  openShareModal(col: Collection) {
    const ref = this.openModal(ShareCollectionModalComponent);
    ref.instance.collection = { _id: col._id, shareId: col.shareId };
    this.closeSidebar.emit();
  }

  /** Opens modal to rename a collection */
  openEditModal(col: Collection) {
    const ref = this.openModal(EditCollectionModalComponent);
    ref.instance.collection = { id: col._id, name: col.name };

    ref.instance.updatedName.subscribe((name: string) => {
      this.store.updateCollectionName(col._id, name);
      ref.destroy();
      this.closeSidebar.emit();
    });
  }

  /** Opens a confirmation dialog to delete a collection */
  confirmDelete(col: Collection) {
    const ref = this.openModal(ConfirmModalComponent);
    ref.instance.title = 'Delete Collection?';
    ref.instance.description = `Do you really want to delete “${col.name}”?`;

    ref.instance.confirmed.subscribe((ok: boolean) => {
      if (ok) {
        this.store.deleteCollection(col._id);
      }
      ref.destroy();
      this.closeSidebar.emit();
    });
  }

  /** Opens a confirmation dialog to leave a shared collection */
  confirmLeave(col: Collection) {
    const ref = this.openModal(ConfirmModalComponent);
    ref.instance.title = 'Leave Collection?';
    ref.instance.description = `Do you really want to leave “${col.name}”?`;

    ref.instance.confirmed.subscribe(() => {
      this.store.leaveCollection(col._id);
      this.store.loadAll();
      ref.destroy();
      this.closeSidebar.emit();
    });
  }

  /** Opens modal to update user email */
  openChangeEmailModal() {
    const ref = this.openModal(ChangeEmailModalComponent);
    ref.instance.updated.subscribe(() => ref.destroy());
  }

  /** Opens modal to update user password */
  openChangePasswordModal() {
    const ref = this.openModal(ChangePasswordModalComponent);
    ref.instance.updated.subscribe(() => ref.destroy());
  }

  /**
   * Utility method to open any component as a centered modal overlay.
   * Automatically closes on backdrop click.
   */
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

/** Lightweight interface for collection context menu entries */
interface CollectionLink {
  name: string;
  id: string;
}
