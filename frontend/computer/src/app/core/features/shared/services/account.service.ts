// src/app/shared/services/account.service.ts
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';

export type SortingOption = 'alphabetically' | 'counter' | 'created';

@Injectable({ providedIn: 'root' })
export class AccountService {
  private readonly apiUrl = '/api/account';

  constructor(private http: HttpClient) {}

  /** Fetch current sorting preference */
  getSortingPreference() {
    return this.http.get<{ sorting: SortingOption; username: string }>(
      this.apiUrl,
      {
        withCredentials: true,
      }
    );
  }

  /** Update sorting preference */
  updateSortingPreference(sorting: SortingOption) {
    return this.http.put(
      `${this.apiUrl}/sorting/`,
      { sorting },
      { withCredentials: true }
    );
  }

  updateEmail(newEmail: string) {
    console.log('Updating email to:', newEmail);
    return this.http.put<void>(
      `${this.apiUrl}/email/`,
      { newEmail },
      {
        withCredentials: true,
      }
    );
  }

  updatePassword(oldPassword: string, newPassword: string) {
    return this.http.put<void>(
      `${this.apiUrl}/password`,
      { oldPassword, newPassword },
      { withCredentials: true }
    );
  }
}
