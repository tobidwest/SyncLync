import { Component, HostBinding } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { AuthService } from '../../../shared/services/auth.service';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-sso-confirm',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="flex flex-col items-center justify-center h-full text-white">
      <h1 class="text-2xl font-bold mb-6">Add Device</h1>

      <!-- Once added -->
      <ng-container *ngIf="deviceAdded; else confirmBlock">
        <p class="text-center">
          <strong>The device has been successfully added.</strong><br />
          You can now close this window.
        </p>
      </ng-container>

      <!-- Confirmation block -->
      <ng-template #confirmBlock>
        <p class="mb-4 text-center">
          Do you want to add this device (<code>{{ deviceId }}</code
          >) to your account?
        </p>
        <button
          class="px-6 py-2 rounded bg-primary hover:bg-primary/80"
          (click)="addDevice()"
        >
          Add Device
        </button>
      </ng-template>
    </div>
  `,
})
export class SsoConfirmComponent {
  @HostBinding('class') class = 'bg-[#0E1923] w-full h-full';
  deviceId!: string;
  deviceAdded = false;

  constructor(private route: ActivatedRoute, private auth: AuthService) {}

  ngOnInit() {
    this.deviceId = this.route.snapshot.paramMap.get('deviceID')!;
  }

  addDevice() {
    this.auth.activateDevice(this.deviceId).subscribe({
      next: () => (this.deviceAdded = true),
      error: (err) => {
        console.error(err);
        alert('Error while adding device.');
      },
    });
  }
}
