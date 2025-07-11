import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { catchError, map, Observable, of } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  // Base API path (used as prefix for some requests)
  private readonly base = '/api/';

  constructor(private http: HttpClient) {}

  /**
   * Authenticates a user with the given credentials.
   * On success, a session cookie is set by the backend.
   *
   * @param username - The user's login name
   * @param password - The user's password
   * @returns Observable of response (text/plain)
   */
  login(username: string, password: string) {
    return this.http.post(
      '/auth/login',
      { username, password },
      {
        withCredentials: true, // include cookies
        responseType: 'text', // expect text response from backend
      }
    );
  }

  /**
   * Registers a new user with the given credentials.
   * On success, a session may also be initiated.
   *
   * @param username - Desired username
   * @param password - Desired password
   * @returns Observable of response (text/plain)
   */
  register(username: string, password: string) {
    return this.http.post(
      '/auth/register',
      { username, password },
      {
        withCredentials: true,
        responseType: 'text',
      }
    );
  }

  /**
   * Checks whether the current session is still valid.
   * Uses the /api/account endpoint to determine login status.
   *
   * @returns Observable<boolean> — true if session is valid, false otherwise
   */
  checkAuth(): Observable<boolean> {
    return this.http
      .get(this.base + 'account/', {
        withCredentials: true,
        responseType: 'text',
      })
      .pipe(
        map(() => true), // If request succeeds, user is logged in
        catchError(() => of(false)) // If unauthorized (e.g. 401), return false
      );
  }

  /**
   * Logs out the current user by invalidating the session.
   * Typically clears the cookie on the server side.
   *
   * @returns Observable of response (text/plain)
   */
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

  /**
   * Confirms a device pairing using a userCode (e.g. from QR login).
   *
   * @param id - The device's confirmation token (userCode)
   * @returns Observable of response (text/plain)
   */
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
