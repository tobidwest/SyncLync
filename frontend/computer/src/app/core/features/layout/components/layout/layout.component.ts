import { Component } from '@angular/core';
import { SideNavigationComponent } from '../side-navigation/side-navigation.component';
import { LoginComponent } from '../login/login.component';
import { RouterModule } from '@angular/router';
import { AuthService } from '../../../shared/services/auth.service';
import { CollectionStore } from '../../../shared/services/collection-store.service';

@Component({
  selector: 'app-layout',
  imports: [SideNavigationComponent, LoginComponent, RouterModule],
  template: `
    <div class="flex w-full h-full relative">
      @if(loggedIn) {
      <!-- Burger menu for mobile view -->
      <button
        class="lg:hidden absolute top-4 left-4 z-50 text-white"
        (click)="toggleSidebar()"
      >
        <!-- Heroicons hamburger icon -->
        <svg
          xmlns="http://www.w3.org/2000/svg"
          class="h-8 w-8"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          stroke-width="2"
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            d="M4 6h16M4 12h16M4 18h16"
          />
        </svg>
      </button>

      <!-- Dimmed background overlay shown when sidebar is open (on mobile) -->
      @if(showSidebar){
      <div
        class="fixed inset-0 bg-black bg-opacity-50 z-30 transition-opacity"
        (click)="closeSidebar()"
      ></div>
      }

      <!-- Sidebar navigation -->
      <div
        class="fixed inset-y-0 left-0 z-40 w-3/4 max-w-sm bg-[#0E1923] shadow-lg transform transition-transform duration-300
             lg:relative lg:translate-x-0 lg:w-96"
        [class.-translate-x-full]="!showSidebar"
        [class.translate-x-0]="showSidebar"
      >
        <!-- Side navigation emits closeSidebar event to close on mobile -->
        <app-side-navigation (closeSidebar)="closeSidebar()" />
      </div>

      <!-- Main application content area -->
      <div class="flex-1 p-4 bg-[#0E1923] pt-8 h-full overflow-y-auto">
        <router-outlet></router-outlet>
      </div>
      } @else {
      <!-- Render login form if user is not authenticated -->
      <app-login class="w-full" (loggedIn)="userLoggedIn()" />
      }
    </div>
  `,
  styles: ``,
})
export class LayoutComponent {
  /** Whether user is logged in and app content should be displayed */
  loggedIn = false;

  /** Controls visibility of the sidebar on small screens */
  showSidebar = false;

  constructor(
    private auth: AuthService,
    private collections: CollectionStore
  ) {}

  /** Check user authentication on app load */
  ngOnInit(): void {
    this.auth.checkAuth().subscribe((ok) => {
      this.loggedIn = ok;
      // Load all collections if user is authenticated
      if (ok) this.collections.loadAll();
    });
  }

  /** Handler when login is successful */
  userLoggedIn(): void {
    this.loggedIn = true;
    this.collections.loadAll();
  }

  /** Handler for logout actions */
  userLoggedOut(): void {
    this.loggedIn = false;
    this.collections.clear();
  }

  /** Opens or closes sidebar in mobile view */
  toggleSidebar(): void {
    this.showSidebar = !this.showSidebar;
  }

  /** Closes sidebar (used by backdrop or child component) */
  closeSidebar(): void {
    this.showSidebar = false;
  }
}
