import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { catchError, map, Observable, of } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private readonly base = '/api/';

  constructor(private http: HttpClient) {}

  login(username: string, password: string) {
    return this.http.post(
      '/auth/login',
      { username, password },
      {
        withCredentials: true,
        responseType: 'text',
      }
    );
  }

  register(username: string, password: string) {
    return this.http.post(
      '/auth/register',
      { username, password },
      { withCredentials: true, responseType: 'text' }
    );
  }

  /** Checks if session cookie is still valid */
  checkAuth() {
    return this.http
      .get(
        this.base + 'account/', // new route
        { withCredentials: true, responseType: 'text' }
      )
      .pipe(
        map(() => true), // 200 → logged in
        catchError(() => of(false)) // 401 → not logged in
      );
  }

  logout() {
    return this.http.post(
      '/auth/logout',
      {},
      {
        withCredentials: true,
        responseType: 'text',
      }
    );
  }

  activateDevice(id: string) {
    return this.http.post(
      '/device/confirm',
      { userCode: id },
      {
        withCredentials: true,
        responseType: 'text',
      }
    );
  }
}
