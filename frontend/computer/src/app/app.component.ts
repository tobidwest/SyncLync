import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet],
  template: `<div class="h-full w-full"><router-outlet></router-outlet></div>`,
  styles: ``,
})
export class AppComponent {
  title = 'syncLink';
}
