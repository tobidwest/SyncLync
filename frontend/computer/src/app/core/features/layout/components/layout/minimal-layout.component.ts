import { Component, OnInit } from '@angular/core';
import { RouterModule } from '@angular/router';
import { LoginComponent } from '../login/login.component';

@Component({
  selector: 'app-minimal-layout',
  standalone: true,
  imports: [RouterModule, LoginComponent],
  template: `
    <div class="w-full h-full flex">
      <!-- Show login screen if user is not authenticated -->
      @if (!loggedIn) {
      <app-login (loggedIn)="userLoggedIn()" class="w-full" />
      }
      <!-- Show routed content if logged in -->
      @else {
      <router-outlet></router-outlet>
      }
    </div>
  `,
})
export class MinimalLayoutComponent implements OnInit {
  /** Tracks whether the user is logged in */
  loggedIn = false;

  /** Lifecycle hook for initialization */
  ngOnInit() {
    console.log('MinimalLayoutComponent initialized');
  }

  /** Called when login was successful */
  userLoggedIn() {
    this.loggedIn = true;

    // Optionally load other data after login
    // this.collections.loadAll();
  }
}
