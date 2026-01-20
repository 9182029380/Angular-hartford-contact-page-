import { Component, computed, effect, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, AbstractControl, ValidationErrors } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { ContactService } from '../../services/contact';
import { Contact } from '../../models/contact.model';
import { toSignal } from '@angular/core/rxjs-interop';
import { map, of } from 'rxjs';

@Component({
  selector: 'app-contact-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './contact-form.html',
  styleUrl: './contact-form.css'
})
export class ContactFormComponent {
  private fb = inject(FormBuilder);
  private contactService = inject(ContactService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);

  // 🔹 Signals
  isEditMode = signal(false);
  employeeId = signal<number | null>(null);
  loading = signal(false);

  // 🔹 Convert contacts observable to signal
  allContacts = toSignal(this.contactService.getContacts(), { initialValue: [] });

  // 🔹 Form
  contactForm: FormGroup = this.fb.group({
    employeeId: ['', [Validators.required, Validators.min(1)], [this.uniqueEmployeeIdValidator.bind(this)]],
    name: ['', [Validators.required]],
    phone: ['', [Validators.required]],
    email: ['', [Validators.required, Validators.email]],
    photo: ['', [Validators.required]],
    instagram: [''],
    linkedin: [''],
    whatsapp: [''],
    company: [''],
    address: [''],
    notes: ['']
  });

  constructor() {
    const employeeIdParam = this.route.snapshot.paramMap.get('employeeId');

    if (employeeIdParam) {
      this.isEditMode.set(true);
      this.employeeId.set(Number(employeeIdParam));
      this.loadContact(Number(employeeIdParam));
    }
  }

  // 🔹 Async Validator using signals
  uniqueEmployeeIdValidator(control: AbstractControl) {
    if (!control.value) {
      return of(null);
    }

    return this.contactService.getContacts().pipe(
      map((contacts) => {
        const enteredId = Number(control.value);
        const existing = contacts.find(c => c.employeeId === enteredId);

        if (this.isEditMode() && this.employeeId() === enteredId) {
          return null;
        }

        return existing ? { uniqueEmployeeId: true } : null;
      })
    );
  }

  loadContact(employeeId: number): void {
    this.contactService.getContactByEmployeeId(employeeId).subscribe({
      next: (contact) => {
        this.contactForm.patchValue(contact);
        this.contactForm.get('employeeId')?.disable();
      },
      error: () => {
        alert('Contact not found');
        this.router.navigate(['/contacts']);
      }
    });
  }

  onSubmit(): void {
    if (this.contactForm.invalid) {
      Object.values(this.contactForm.controls).forEach(control =>
        control.markAsTouched()
      );
      return;
    }

    this.loading.set(true);
    const contact: Contact = this.contactForm.getRawValue();

    if (this.isEditMode() && this.employeeId()) {
      this.contactService.updateContactByEmployeeId(this.employeeId()!, contact).subscribe({
        next: () => {
          this.loading.set(false);
          this.router.navigate(['/contacts', this.employeeId()]);
        },
        error: () => {
          alert('Failed to update contact. Please try again.');
          this.loading.set(false);
        }
      });
    } else {
      this.contactService.createContact(contact).subscribe({
        next: () => {
          this.loading.set(false);
          this.router.navigate(['/contacts']);
        },
        error: (err) => {
          if (err.error?.message?.includes('employeeId')) {
            alert('Employee ID already exists. Please use a different ID.');
          } else {
            alert('Failed to create contact. Please try again.');
          }
          this.loading.set(false);
        }
      });
    }
  }

  cancel(): void {
    if (this.isEditMode() && this.employeeId()) {
      this.router.navigate(['/contacts', this.employeeId()]);
    } else {
      this.router.navigate(['/contacts']);
    }
  }
}
