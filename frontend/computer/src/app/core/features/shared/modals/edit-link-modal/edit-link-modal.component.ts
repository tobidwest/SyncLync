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
    <h2 class="text-xl font-semibold mb-4 text-white">Edit Link</h2>

    <form
      [formGroup]="form"
      class="flex flex-col gap-4"
      (ngSubmit)="onSubmit()"
    >
      <input
        type="text"
        placeholder="Link name"
        formControlName="name"
        class="p-2 rounded border border-gray-600 bg-surface text-white placeholder-gray-400"
      />
      <input
        type="text"
        placeholder="Link URL"
        formControlName="url"
        class="p-2 rounded border border-gray-600 bg-surface text-white placeholder-gray-400"
      />

      <div class="flex justify-end gap-2 mt-2">
        <button
          type="button"
          class="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-600/60"
          (click)="close()"
        >
          Cancel
        </button>
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
  @HostBinding('class') host =
    'flex flex-col p-4 bg-surface rounded-lg shadow-lg w-[400px]';

  @Input({ required: true }) link!: { name: string; url: string };

  @Output() saved = new EventEmitter<{ name: string; url: string } | null>();

  form!: FormGroup;

  constructor(private fb: FormBuilder) {}

  ngOnInit(): void {
    this.form = this.fb.group({
      name: [this.link.name, Validators.required],
      url: [this.link.url, Validators.required],
    });
  }

  close(): void {
    this.saved.emit(null);
  }

  onSubmit(): void {
    if (this.form.invalid) return;
    this.saved.emit(this.form.value);
  }
}
