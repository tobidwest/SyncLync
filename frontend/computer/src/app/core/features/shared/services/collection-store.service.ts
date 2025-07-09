// src/app/shared/state/collection-store.service.ts
import { Injectable, Signal, computed, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { NavigationEnd, Router } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { catchError, filter, map, of, switchMap } from 'rxjs';

export interface Link {
  _id: string;
  url: string;
  name: string;
  icon: string;
  counter: number;
  lastAccessedAt: string;
  createdAt: string;
  updatedAt: string;
}

export interface Collection {
  _id: string;
  name: string;
  links: Link[];
  isOwner: boolean;
  shareId: string;
}

@Injectable({ providedIn: 'root' })
export class CollectionStore {
  private readonly apiUrl = '/api/collections/';

  private routeUrl!: Signal<string>;

  constructor(private http: HttpClient, private router: Router) {
    // Initialize reactive route tracking
    this.routeUrl = toSignal(
      this.router.events.pipe(
        filter((e): e is NavigationEnd => e instanceof NavigationEnd),
        map((e) => e.urlAfterRedirects)
      ),
      { initialValue: this.router.url }
    );
  }

  /* --------------------   STATE   -------------------- */
  private readonly _collections = signal<Collection[]>([]);
  /** Read-only view for components */
  readonly collections = this._collections.asReadonly();

  /** Currently selected collection based on URL */
  readonly current = computed(() => {
    const id = this.routeUrl().match(/\/collection\/([^/]+)/)?.[1];
    return this._collections().find((c) => c._id === id) ?? null;
  });

  clear(): void {
    this._collections.set([]);
  }

  /** Loads all collections for the logged-in user */
  loadAll(): void {
    this.http
      .get<Collection[]>(this.apiUrl, { withCredentials: true })
      .subscribe({
        next: (cols) => {
          this._collections.set(cols);

          // Redirect to first collection if none is selected
          if (!this.router.url.startsWith('/collection/') && cols.length) {
            this.router.navigate(['/collection', cols[0]._id]);
          }
        },
        error: (err) => console.error('Error while loading collections:', err),
      });
  }

  deleteCollection(id: string): void {
    this.http
      .delete(`${this.apiUrl}${id}`, { withCredentials: true })
      .subscribe({
        next: () => {
          this.loadAll();

          if (this.current()?._id === id && this.collections().length) {
            const fallback = this.collections().find((c) => c._id !== id);
            if (fallback) {
              this.router.navigate(['/collection', fallback._id]);
            } else {
              this.router.navigate(['/']);
            }
          }
        },
        error: (err) => console.error('Error while deleting collection:', err),
      });
  }

  updateCollectionName(id: string, name: string): void {
    this.http
      .put<Collection>(
        `${this.apiUrl}${id}/name`,
        { name },
        { withCredentials: true }
      )
      .subscribe({
        next: () => this.loadAll(),
        error: (err) => console.error('Error while renaming collection:', err),
      });
  }

  /** Navigate to a collection programmatically */
  goTo(id: string): void {
    this.router.navigate(['/collection', id]);
  }

  addLink(collectionId: string, partial: { name: string; url: string }): void {
    const url = `${this.apiUrl}${collectionId}/links/`;

    this.http.post<Link>(url, partial, { withCredentials: true }).subscribe({
      next: () => this.loadAll(),
      error: (err) => {
        console.error('Failed to create link', err);

        let message = 'Could not create link.';
        try {
          if (err.error?.error) message = err.error.error;
          else if (err.message) message = err.message;
        } catch (_) {}

        alert('Failed to create link: ' + message);
      },
    });
  }

  addExistingLinkToCollection(
    linkId: string,
    targetCollectionId: string
  ): void {
    const url = `${this.apiUrl}${targetCollectionId}/links/${linkId}`;

    this.http.post<void>(url, {}, { withCredentials: true }).subscribe({
      next: () => this.loadAll(),
      error: (err) => console.error('Failed to add link to collection:', err),
    });
  }

  addCollection(name: string): void {
    this.http
      .post<Collection>(this.apiUrl, { name }, { withCredentials: true })
      .subscribe({
        next: (created) => {
          this.loadAll();
          this.router.navigate(['/collection', created._id]);
        },
        error: (err) => console.error('Failed to create collection:', err),
      });
  }

  leaveCollection(id: string): void {
    const url = `${this.apiUrl}${id}/leave`;

    this.http.post<void>(url, {}, { withCredentials: true }).subscribe({
      next: () => {
        this.loadAll();

        if (this.current()?._id === id && this.collections().length) {
          const fallback = this.collections().find((c) => c._id !== id);
          if (fallback) {
            this.router.navigate(['/collection', fallback._id]);
          } else {
            this.router.navigate(['/']);
          }
        }
      },
      error: (err) => console.error('Failed to leave collection:', err),
    });
  }

  updateLink(linkId: string, partial: { name: string; url: string }): void {
    this.http
      .put<void>(`/api/links/${linkId}`, partial, {
        withCredentials: true,
      })
      .subscribe({
        next: () => this.loadAll(),
        error: (err) => console.error('Failed to update link:', err),
      });
  }

  removeLinkFromCollection(collectionId: string, linkId: string): void {
    this.http
      .delete(`${this.apiUrl}${collectionId}/links/${linkId}`, {
        withCredentials: true,
      })
      .subscribe({
        next: () => this.loadAll(),
        error: (err) =>
          console.error('Failed to remove link from collection:', err),
      });
  }

  joinByShareId(shareId: string): void {
    this.http
      .get('/api/account/', {
        withCredentials: true,
        responseType: 'text',
      })
      .pipe(
        map(() => true),
        catchError(() => of(false)),
        switchMap((isLoggedIn) => {
          if (!isLoggedIn) {
            console.warn('Not logged in – aborting join request');
            return of(null);
          }

          return this.http.post<Collection>(
            `${this.apiUrl}join/${shareId}`,
            {},
            { withCredentials: true }
          );
        })
      )
      .subscribe({
        next: (collection) => {
          if (!collection) return;

          this.loadAll();
          this.router.navigate(['/collection', collection._id]);
        },
        error: (err) => console.error('Join via shareId failed:', err),
      });
  }
}
