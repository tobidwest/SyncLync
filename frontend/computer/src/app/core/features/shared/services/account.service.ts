// src/app/shared/services/account.service.ts
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';

/**
 * Enum-like union of available collection sorting options.
 * Used both for UI dropdowns and persisted preferences.
 */
export type SortingOption = 'alphabetically' | 'counter' | 'created';

@Injectable({ providedIn: 'root' })
export class AccountService {
  // Base endpoint for all account-related API calls
  private readonly apiUrl = '/api/account';

  constructor(private http: HttpClient) {}

  /**
   * Retrieves the user's current sorting preference and username.
   * This is usually called when initializing the app or sidebar UI.
   *
   * Returns an observable with the sorting strategy and username,
   * e.g. `{ sorting: 'alphabetically', username: 'paul' }`.
   */
  getSortingPreference() {
    return this.http.get<{ sorting: SortingOption; username: string }>(
      this.apiUrl,
      {
        withCredentials: true, // include cookies for session-based auth
      }
    );
  }

  /**
   * Persists the selected sorting preference for the current user.
   * The backend will store this so it's applied on future logins.
   *
   * @param sorting The chosen sorting strategy (alphabetically, counter, created)
   */
  updateSortingPreference(sorting: SortingOption) {
    return this.http.put(
      `${this.apiUrl}/sorting/`,
      { sorting },
      {
        withCredentials: true,
      }
    );
  }

  /**
   * Updates the user's email address.
   * Triggers a backend call to change the current email to the new one.
   *
   * @param newEmail The new email address to be assigned
   */
  updateEmail(newEmail: string) {
    console.log('Updating email to:', newEmail); // Optional debug log
    return this.http.put<void>(
      `${this.apiUrl}/email/`,
      { newEmail },
      {
        withCredentials: true,
      }
    );
  }

  /**
   * Changes the user's password.
   * Requires both the old password and a new one.
   *
   * @param oldPassword The current password (used for verification)
   * @param newPassword The new password to be set
   */
  updatePassword(oldPassword: string, newPassword: string) {
    return this.http.put<void>(
      `${this.apiUrl}/password`,
      { oldPassword, newPassword },
      {
        withCredentials: true,
      }
    );
  }
}
