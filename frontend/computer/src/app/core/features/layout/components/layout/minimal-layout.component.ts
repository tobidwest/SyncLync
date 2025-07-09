import { Component, OnInit } from '@angular/core';
import { RouterModule } from '@angular/router';
import { LoginComponent } from '../login/login.component';

@Component({
  selector: 'app-minimal-layout',
  standalone: true,
  imports: [RouterModule, LoginComponent],
  template: `
    <div class="w-full h-full flex">
      <!-- not logged in -->
      @if (!loggedIn) {
      <app-login (loggedIn)="userLoggedIn()" class="w-full" />
      }
      <!-- logged in -->
      @else {
      <router-outlet></router-outlet>
      }
    </div>
  `,
})
export class MinimalLayoutComponent implements OnInit {
  loggedIn = false;

  ngOnInit() {
    console.log('MinimalLayoutComponent initialized');
  }

  userLoggedIn() {
    this.loggedIn = true;
    // this.collections.loadAll();
  }
}
