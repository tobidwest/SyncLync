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
      <div
        class="fixed inset-y-0 left-0 z-40 w-96 bg-[#0E1923] shadow-lg transform transition-transform duration-300 lg:relative lg:translate-x-0"
      >
        <app-side-navigation></app-side-navigation>
      </div>
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

  constructor(
    private auth: AuthService,
    private collections: CollectionStore
  ) {}

  ngOnInit(): void {
    // 1) Check session cookie
    this.auth.checkAuth().subscribe((ok) => {
      console.log(ok);
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
    this.collections.clear(); // small helper method (see collection store)
  }
}
