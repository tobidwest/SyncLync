import { Component, EventEmitter, HostBinding, Output } from '@angular/core';
import {
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../../shared/services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [ReactiveFormsModule, CommonModule],
  template: `
    <div
      class="flex min-h-full flex-col justify-center py-12 sm:px-6 lg:px-8 bg-background"
    >
      <div class="sm:mx-auto sm:w-full sm:max-w-md h-full">
        <!-- Logo & heading -->
        <img class="mx-auto h-20 w-auto" src="logo.png" alt="Your Company" />
        <h2
          class="mt-6 text-center text-xl/9 font-bold tracking-tight text-white"
        >
          {{ registerMode ? 'Register for SyncLink' : 'Log in to SyncLink' }}
        </h2>
      </div>

      <div class="mt-10 sm:mx-auto sm:w-full sm:max-w-[480px] px-8 rounded-xl">
        <div
          class="bg-surface px-6 py-12 shadow sm:rounded-lg sm:px-12 rounded-xl"
        >
          <!-- Auth form -->
          <form class="space-y-6" [formGroup]="form" (submit)="onSubmit()">
            <!-- Username field -->
            <div>
              <label for="email" class="block text-sm font-medium text-white">
                Username
              </label>
              <input
                type="text"
                id="username"
                formControlName="username"
                class="mt-1 block w-full rounded-md bg-background px-3 py-1.5 text-base text-white outline outline-1 -outline-offset-1 outline-gray-300 placeholder:text-gray-400 focus:outline-indigo-600"
              />
            </div>

            <!-- Password field -->
            <div>
              <label
                for="password"
                class="block text-sm font-medium text-white"
              >
                Password
              </label>
              <input
                type="password"
                id="password"
                formControlName="password"
                class="mt-1 block w-full rounded-md bg-background px-3 py-1.5 text-base text-white outline outline-1 -outline-offset-1 outline-gray-300 placeholder:text-gray-400 focus:outline-indigo-600"
              />
            </div>

            <!-- Submit button & mode switch -->
            <div>
              <button
                type="submit"
                class="flex w-full justify-center rounded-md bg-primary px-3 py-1.5 text-sm font-semibold text-white shadow-sm hover:bg-mhd/80 focus:outline focus:outline-2 focus:outline-offset-2 focus:outline-indigo-600"
              >
                {{ registerMode ? 'Register' : 'Login' }}
              </button>

              <!-- Toggle between login and registration -->
              <p
                class="text-center text-white text-xs pt-2 cursor-pointer hover:underline"
                (click)="toggleMode()"
              >
                {{
                  registerMode
                    ? 'Already have an account? Login now!'
                    : 'Need an account? Register now!'
                }}
              </p>
            </div>
          </form>
        </div>
      </div>
    </div>
  `,
})
export class LoginComponent {
  /** Full-height styling for flex container */
  @HostBinding('class') class = 'h-full';

  /** Emits an event when login is successful */
  @Output() loggedIn = new EventEmitter<void>();

  /** Reactive form group for login/registration */
  form: FormGroup;

  /** Toggles between login and registration mode */
  registerMode = false;

  constructor(private fb: FormBuilder, private authService: AuthService) {
    // Initialize form with required username and password fields
    this.form = this.fb.group({
      username: ['', Validators.required],
      password: ['', Validators.required],
    });
  }

  /** Switch between login and register modes */
  toggleMode(): void {
    this.registerMode = !this.registerMode;
  }

  /**
   * Handles login flow
   * Emits `loggedIn` event on success
   */
  private login(username: string, password: string): void {
    this.authService.login(username, password).subscribe({
      next: () => {
        console.log('Login successful');
        this.loggedIn.emit();
      },
      error: (err) => {
        console.error('Login failed:', err);
        alert('Login failed.\n' + err.message);
      },
    });
  }

  /**
   * Handles submit of login or registration form
   * Registers and then logs in if in register mode
   */
  async onSubmit(): Promise<void> {
    if (this.form.invalid) return;

    const { username, password } = this.form.value;

    if (this.registerMode) {
      // Registration mode: register and then auto-login
      this.authService.register(username, password).subscribe({
        next: () => {
          console.log('Registration successful');
          this.login(username, password);
        },
        error: (err) => {
          console.error('Registration failed:', err);
          alert('Registration failed.\n' + err.message);
        },
      });
    } else {
      // Standard login
      this.login(username, password);
    }
  }
}
