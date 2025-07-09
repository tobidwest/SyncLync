import { Routes } from '@angular/router';
import { ListComponent } from './core/features/collections/list/list.component';
import { JoinRedirectComponent } from './core/features/shared/components/join-redirect.component';
import { LayoutComponent } from './core/features/layout/components/layout/layout.component';
import { MinimalLayoutComponent } from './core/features/layout/components/layout/minimal-layout.component';
import { SsoConfirmComponent } from './core/features/layout/components/login/sso-confirm.component';

export const routes: Routes = [
  // ── Admin-Pfad (mit Sidebar) ────────────────────────────────
  {
    path: '',
    component: LayoutComponent, // dein bisheriges Layout
    children: [
      { path: 'collection/:id', component: ListComponent },
      { path: 'join/:shareId', component: JoinRedirectComponent },
      { path: '', redirectTo: 'collection/overview', pathMatch: 'full' },
    ],
  },

  // ── Device-Pfad (ohne Sidebar) ──────────────────────────────
  {
    path: 'confirmDevice/:deviceID',
    component: MinimalLayoutComponent, // Login + reiner Outlet
    children: [{ path: '', component: SsoConfirmComponent }],
  },

  // ── Fallback ────────────────────────────────────────────────
  { path: '**', redirectTo: '' },
];
