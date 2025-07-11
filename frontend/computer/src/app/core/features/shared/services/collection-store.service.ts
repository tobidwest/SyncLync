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
    // Track current route URL as a reactive Signal
    this.routeUrl = toSignal(
      this.router.events.pipe(
        filter((e): e is NavigationEnd => e instanceof NavigationEnd),
        map((e) => e.urlAfterRedirects)
      ),
      { initialValue: this.router.url }
    );
  }

  /* -------------------- STATE -------------------- */

  // Private mutable state for all collections
  private readonly _collections = signal<Collection[]>([]);

  // Public read-only signal for components
  readonly collections = this._collections.asReadonly();

  // Derives the currently selected collection from the route
  readonly current = computed(() => {
    const id = this.routeUrl().match(/\/collection\/([^/]+)/)?.[1];
    return this._collections().find((c) => c._id === id) ?? null;
  });

  /** Clears all stored collections from memory */
  clear(): void {
    this._collections.set([]);
  }

  /** Loads all user collections from the server */
  loadAll(): void {
    this.http
      .get<Collection[]>(this.apiUrl, { withCredentials: true })
      .subscribe({
        next: (cols) => {
          this._collections.set(cols);

          // If not inside a collection route, navigate to the first one
          if (!this.router.url.startsWith('/collection/') && cols.length) {
            this.router.navigate(['/collection', cols[0]._id]);
          }
        },
        error: (err) => console.error('Error while loading collections:', err),
      });
  }

  /** Deletes a collection and redirects if necessary */
  deleteCollection(id: string): void {
    this.http
      .delete(`${this.apiUrl}${id}`, { withCredentials: true })
      .subscribe({
        next: () => {
          this.loadAll();

          // If the current collection was deleted, redirect to another
          if (this.current()?._id === id && this.collections().length) {
            const fallback = this.collections().find((c) => c._id !== id);
            this.router.navigate(
              fallback ? ['/collection', fallback._id] : ['/']
            );
          }
        },
        error: (err) => console.error('Error while deleting collection:', err),
      });
  }

  /** Updates a collection’s name */
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

  /** Programmatically navigates to a specific collection */
  goTo(id: string): void {
    this.router.navigate(['/collection', id]);
  }

  /** Adds a new link to the given collection */
  addLink(collectionId: string, partial: { name: string; url: string }): void {
    const url = `${this.apiUrl}${collectionId}/links/`;

    this.http.post<Link>(url, partial, { withCredentials: true }).subscribe({
      next: () => this.loadAll(),
      error: (err) => {
        console.error('Failed to create link', err);

        // Display more user-friendly error message if available
        let message = 'Could not create link.';
        try {
          if (err.error?.error) message = err.error.error;
          else if (err.message) message = err.message;
        } catch (_) {}

        alert('Failed to create link: ' + message);
      },
    });
  }

  /** Adds an existing link to another collection */
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

  /** Creates a new collection and navigates to it */
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

  /** Removes current user from the given collection */
  leaveCollection(id: string): void {
    const url = `${this.apiUrl}${id}/leave`;

    this.http.post<void>(url, {}, { withCredentials: true }).subscribe({
      next: () => {
        this.loadAll();

        // Redirect if the left collection was currently selected
        if (this.current()?._id === id && this.collections().length) {
          const fallback = this.collections().find((c) => c._id !== id);
          this.router.navigate(
            fallback ? ['/collection', fallback._id] : ['/']
          );
        }
      },
      error: (err) => console.error('Failed to leave collection:', err),
    });
  }

  /** Updates the link metadata (name and/or URL) */
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

  /** Removes a link from a specific collection */
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

  /**
   * Joins a shared collection via a public shareId.
   * Will only proceed if the user is currently authenticated.
   */
  joinByShareId(shareId: string): void {
    // First verify the user is logged in
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

          // Join the collection if logged in
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
