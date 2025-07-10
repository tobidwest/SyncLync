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
      <!-- Mobile Burger Button -->
      <button
        class="lg:hidden absolute top-4 left-4 z-50 text-white"
        (click)="toggleSidebar()"
      >
        <!-- Heroicons Outline Menu Icon -->
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

      <!-- Backdrop when sidebar is open (mobile only) -->
      <div
        class="fixed inset-0 bg-black bg-opacity-50 z-30 transition-opacity hehe"
        *ngIf="showSidebar"
        (click)="closeSidebar()"
      ></div>

      <!-- Sidebar -->
      <div
        class="fixed inset-y-0 left-0 z-40 w-3/4 max-w-sm bg-[#0E1923] shadow-lg transform transition-transform duration-300
             lg:relative lg:translate-x-0 lg:w-96"
        [class.-translate-x-full]="!showSidebar"
        [class.translate-x-0]="showSidebar"
      >
        <app-side-navigation (closeSidebar)="closeSidebar()" />
      </div>

      <!-- Content -->
      <div class="flex-1 p-4 bg-[#0E1923] pt-8 h-full overflow-y-auto">
        <router-outlet></router-outlet>
      </div>
      } @else {
      <app-login class="w-full" (loggedIn)="userLoggedIn()" />
      }
    </div>
  `,
  styles: ``,
})
export class LayoutComponent {
  loggedIn = false;
  showSidebar = false;

  constructor(
    private auth: AuthService,
    private collections: CollectionStore
  ) {}

  ngOnInit(): void {
    this.auth.checkAuth().subscribe((ok) => {
      this.loggedIn = ok;
      if (ok) this.collections.loadAll();
    });
  }

  userLoggedIn(): void {
    this.loggedIn = true;
    this.collections.loadAll();
  }

  userLoggedOut(): void {
    this.loggedIn = false;
    this.collections.clear();
  }

  toggleSidebar(): void {
    this.showSidebar = !this.showSidebar;
  }

  closeSidebar(): void {
    this.showSidebar = false;
  }
}
