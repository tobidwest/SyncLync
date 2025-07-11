import {
  Component,
  EventEmitter,
  HostBinding,
  Input,
  Output,
  OnInit,
} from '@angular/core';
import {
  ReactiveFormsModule,
  FormBuilder,
  Validators,
  FormGroup,
} from '@angular/forms';

@Component({
  selector: 'app-edit-link-modal',
  standalone: true,
  imports: [ReactiveFormsModule],
  template: `
    <!-- Modal heading -->
    <h2 class="text-xl font-semibold mb-4 text-white">Edit Link</h2>

    <!-- Form to update the link -->
    <form
      [formGroup]="form"
      class="flex flex-col gap-4"
      (ngSubmit)="onSubmit()"
    >
      <!-- Input for link name -->
      <input
        type="text"
        placeholder="Link name"
        formControlName="name"
        class="p-2 rounded border border-gray-600 bg-surface text-white placeholder-gray-400"
      />

      <!-- Input for link URL -->
      <input
        type="text"
        placeholder="Link URL"
        formControlName="url"
        class="p-2 rounded border border-gray-600 bg-surface text-white placeholder-gray-400"
      />

      <!-- Action buttons -->
      <div class="flex justify-end gap-2 mt-2">
        <!-- Cancel closes the modal without saving -->
        <button
          type="button"
          class="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-600/60"
          (click)="close()"
        >
          Cancel
        </button>

        <!-- Submit only when the form is valid -->
        <button
          type="submit"
          class="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-600/60"
          [disabled]="form.invalid"
        >
          Save
        </button>
      </div>
    </form>
  `,
})
export class EditLinkModalComponent implements OnInit {
  // Host styles for modal layout and appearance
  @HostBinding('class') host =
    'flex flex-col p-4 bg-surface rounded-lg shadow-lg w-[400px]';

  /**
   * Input object containing the link's current name and URL.
   * This is required to prefill the form.
   */
  @Input({ required: true }) link!: { name: string; url: string };

  /**
   * Emits the updated link object when saved,
   * or `null` if the modal was canceled.
   */
  @Output() saved = new EventEmitter<{ name: string; url: string } | null>();

  /** Reactive form group for editing the link */
  form!: FormGroup;

  constructor(private fb: FormBuilder) {}

  ngOnInit(): void {
    // Initialize the form with values from the input link
    this.form = this.fb.group({
      name: [this.link.name, Validators.required],
      url: [this.link.url, Validators.required],
    });
  }

  /** Called when the user clicks cancel */
  close(): void {
    this.saved.emit(null);
  }

  /** Called when the form is submitted */
  onSubmit(): void {
    if (this.form.invalid) return;

    // Emit the updated link data
    this.saved.emit(this.form.value);
  }
}
