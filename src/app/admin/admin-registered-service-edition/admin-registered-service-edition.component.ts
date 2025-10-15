import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { AdminService, BikeServiceRegisteredDto } from '../admin-service';
import { NotificationService } from '../../core/notification.service';

@Component({
  selector: 'app-admin-registered-service-edition',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './admin-registered-service-edition.component.html',
  styleUrls: ['./admin-registered-service-edition.component.css']
})
export class AdminRegisteredServiceEditionComponent implements OnInit {
  private adminService = inject(AdminService);
  private notificationService = inject(NotificationService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);

  serviceId: number | null = null;
  loading = true;
  saving = false;
  deleting = false;

  editForm: Partial<BikeServiceRegisteredDto> = {};

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.serviceId = parseInt(id, 10);
      this.loadService();
    } else {
      this.notificationService.error('Brak ID serwisu');
      this.goBack();
    }
  }

  private loadService(): void {
    if (!this.serviceId) return;

    this.loading = true;
    this.adminService.getRegisteredServiceDetails(this.serviceId).subscribe({
      next: (service) => {
        this.editForm = { ...service };
        this.loading = false;
      },
      error: (error) => {
        console.error('Error loading service:', error);
        this.notificationService.error('Nie udało się załadować danych serwisu');
        this.loading = false;
        this.goBack();
      }
    });
  }

  saveService(): void {
    if (!this.serviceId || this.saving) {
      return;
    }

    // Validation
    if (!this.editForm.name || this.editForm.name.trim().length === 0) {
      this.notificationService.error('Nazwa serwisu jest wymagana');
      return;
    }

    if (!this.editForm.email || !this.isValidEmail(this.editForm.email)) {
      this.notificationService.error('Podaj poprawny adres email');
      return;
    }

    this.saving = true;

    const servicePayload: BikeServiceRegisteredDto = {
        id: this.editForm.id!,
        name: this.editForm.name!,
        email: this.editForm.email!,
        street: this.editForm.street,
        building: this.editForm.building,
        flat: this.editForm.flat,
        postalCode: this.editForm.postalCode,
        city: this.editForm.city,
        latitude: this.editForm.latitude,
        longitude: this.editForm.longitude,
        phoneNumber: this.editForm.phoneNumber,
        transportCost: this.editForm.transportCost,
        transportAvailable: this.editForm.transportAvailable,
        suffix: this.editForm.suffix,
        isRegistered: this.editForm.isRegistered!,
        description: this.editForm.description || null,
        contactPerson: this.editForm.contactPerson || null,
        website: this.editForm.website || null
    } as BikeServiceRegisteredDto;

    this.adminService.updateRegisteredBikeService(this.serviceId, servicePayload).subscribe({
    next: (response) => {
      this.notificationService.success('Serwis został zaktualizowany');
      this.saving = false;
      this.goBack();
    },
    error: (error) => {
      console.error('Error updating service:', error);
      this.notificationService.error('Nie udało się zaktualizować serwisu');
      this.saving = false;
    }
  });

  }

  deleteService(): void {
    if (!this.serviceId || this.deleting) {
      return;
    }

    const serviceName = this.editForm.name || 'ten serwis';
    if (!confirm(`Czy na pewno chcesz usunąć serwis "${serviceName}"?\n\nTej operacji nie można cofnąć!`)) {
      return;
    }

    this.deleting = true;

    this.adminService.deleteBikeService(this.serviceId).subscribe({
      next: (response) => {
        this.notificationService.success('Serwis został usunięty');
        this.deleting = false;
        this.goBack();
      },
      error: (error) => {
        console.error('Error deleting service:', error);
        this.notificationService.error('Nie udało się usunąć serwisu');
        this.deleting = false;
      }
    });
  }

  private isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  goBack(): void {
    this.router.navigate(['/admin-services-verification']);
  }

  cancel(): void {
    if (confirm('Czy na pewno chcesz anulować? Niezapisane zmiany zostaną utracone.')) {
      this.goBack();
    }
  }
}