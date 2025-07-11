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
    private route: ActivatedRoute, // to access the shareId from the route
    private store: CollectionStore, // service to handle collection joining logic
    private router: Router // for fallback navigation if join fails
  ) {}

  ngOnInit() {
    // Attempt to extract the "shareId" from the URL path
    const shareId = this.route.snapshot.paramMap.get('shareId');

    if (shareId) {
      // If a share ID is found, trigger the join logic
      this.store.joinByShareId(shareId);
    } else {
      // If no share ID is present, redirect the user to the homepage
      this.router.navigate(['/']);
    }
  }
}
