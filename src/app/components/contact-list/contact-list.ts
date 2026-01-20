import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { ContactService } from '../../services/contact';
import { Contact } from '../../models/contact.model';

@Component({
  selector: 'app-contact-list',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './contact-list.html',
  styleUrl: './contact-list.css'
})
export class ContactListComponent {
  private contactService = inject(ContactService);
  private router = inject(Router);

  // 🔹 Signals
  contacts = signal<Contact[]>([]);
  loading = signal(true);
  deletingEmployeeId = signal<number | null>(null);

  constructor() {
    this.loadContacts();
  }

  loadContacts(): void {
    this.loading.set(true);
    this.contactService.getContacts().subscribe({
      next: (data) => {
        this.contacts.set(
          data.map((contact, index) => {
            if (!contact.id) {
              console.warn(`Contact at index ${index} has no ID:`, contact);
            }
            return contact;
          })
        );
        this.loading.set(false);
      },
      error: (err) => {
        console.error('Error loading contacts:', err);
        this.loading.set(false);
      }
    });
  }

  viewContact(employeeId: number | undefined): void {
    if (employeeId !== undefined && employeeId !== null && !isNaN(employeeId)) {
      this.router.navigate(['/contacts', employeeId]).catch(err => {
        console.error('Navigation error:', err);
      });
    } else {
      console.error('Invalid employee ID:', employeeId);
    }
  }

  openWhatsApp(phone: string): void {
    window.open(`https://wa.me/${phone.replace(/\D/g, '')}`, '_blank');
  }

  openInstagram(username: string | undefined): void {
    if (username) {
      window.open(`https://instagram.com/${username}`, '_blank');
    }
  }

  openLinkedIn(profile: string | undefined): void {
    if (profile) {
      window.open(`https://linkedin.com/in/${profile}`, '_blank');
    }
  }

  deleteContact(employeeId: number | undefined, event: Event): void {
    event.stopPropagation();

    if (!employeeId || isNaN(employeeId) || employeeId <= 0) {
      alert('Cannot delete contact: Invalid Employee ID');
      return;
    }

    const contactToDelete = this.contacts().find(c => c.employeeId === employeeId);
    const contactName = contactToDelete?.name || 'this contact';

    if (confirm(`Are you sure you want to delete ${contactName} (Employee ID: ${employeeId})?`)) {
      this.deletingEmployeeId.set(employeeId);

      this.contactService.deleteContactByEmployeeId(employeeId).subscribe({
        next: () => {
          this.deletingEmployeeId.set(null);
          this.loadContacts();
        },
        error: (deleteErr) => {
          this.deletingEmployeeId.set(null);
          const errorMessage = deleteErr?.message ||
            (deleteErr?.status
              ? `Failed to delete contact. HTTP ${deleteErr.status}: ${deleteErr.statusText || 'Unknown error'}`
              : 'Failed to delete contact. Please check if JSON server is running.');
          alert(errorMessage);
        }
      });
    }
  }
}
