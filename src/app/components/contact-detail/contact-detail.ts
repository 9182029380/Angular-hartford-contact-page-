import { Component, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { ContactService } from '../../services/contact';
import { Contact } from '../../models/contact.model';

@Component({
  selector: 'app-contact-detail',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './contact-detail.html',
  styleUrl: './contact-detail.css'
})
export class ContactDetailComponent {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private contactService = inject(ContactService);

  // 🔹 Signals
  contact = signal<Contact | null>(null);
  loading = signal(true);
  deleting = signal(false);

  constructor() {
    this.route.paramMap.subscribe(params => {
      const employeeIdParam = params.get('employeeId');
      const employeeId = employeeIdParam ? Number(employeeIdParam) : null;

      if (employeeId && !isNaN(employeeId) && employeeId > 0) {
        this.loading.set(true);
        this.contact.set(null);

        this.contactService.getContactByEmployeeId(employeeId).subscribe({
          next: (data) => {
            this.contact.set(data);
            this.loading.set(false);
          },
          error: () => {
            this.loading.set(false);
            this.contact.set(null);
          }
        });
      } else {
        this.loading.set(false);
        this.contact.set(null);
      }
    });
  }

  deleteContact(): void {
    const contact = this.contact();
    const employeeId = contact?.employeeId;
    const contactName = contact?.name || 'this contact';

    if (!employeeId || isNaN(employeeId) || employeeId <= 0) {
      alert('Cannot delete contact: Invalid Employee ID');
      return;
    }

    if (confirm(`Are you sure you want to delete ${contactName} (Employee ID: ${employeeId})?`)) {
      this.deleting.set(true);

      this.contactService.deleteContactByEmployeeId(employeeId).subscribe({
        next: () => {
          this.deleting.set(false);
          this.router.navigate(['/contacts']);
        },
        error: (err) => {
          this.deleting.set(false);
          const errorMessage = err?.message ||
            (err?.status
              ? `Failed to delete contact. HTTP ${err.status}: ${err.statusText || 'Unknown error'}`
              : 'Failed to delete contact. Please check if JSON server is running.');
          alert(errorMessage);
        }
      });
    }
  }

  openWhatsApp(): void {
    const phone = this.contact()?.phone;
    if (phone) {
      window.open(`https://wa.me/${phone.replace(/\D/g, '')}`, '_blank');
    }
  }

  openInstagram(): void {
    const instagram = this.contact()?.instagram;
    if (instagram) {
      window.open(`https://instagram.com/${instagram}`, '_blank');
    }
  }

  openLinkedIn(): void {
    const linkedin = this.contact()?.linkedin;
    if (linkedin) {
      window.open(`https://linkedin.com/in/${linkedin}`, '_blank');
    }
  }
}
