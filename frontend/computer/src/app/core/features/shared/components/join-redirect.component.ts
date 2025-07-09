// src/app/join-redirect/join-redirect.component.ts
import { Component } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { CollectionStore } from '../services/collection-store.service';

@Component({
  selector: 'app-join-redirect',
  standalone: true,
  template: `<p class="text-white p-8">Joining collection …</p>`,
})
export class JoinRedirectComponent {
  constructor(
    private route: ActivatedRoute,
    private store: CollectionStore,
    private router: Router
  ) {}

  ngOnInit() {
    const shareId = this.route.snapshot.paramMap.get('shareId');
    if (shareId) {
      this.store.joinByShareId(shareId);
    } else {
      // Fallback → redirect to homepage
      this.router.navigate(['/']);
    }
  }
}
