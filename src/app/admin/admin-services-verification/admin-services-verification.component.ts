import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { AdminService, BikeServiceRegisteredDto } from '../admin-service';
import { NotificationService } from '../../core/notification.service';

@Component({
  selector: 'app-admin-services-verification',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './admin-services-verification.component.html',
  styleUrls: ['./admin-services-verification.component.css']
})
export class AdminServicesVerificationComponent implements OnInit {
  private adminService = inject(AdminService);
  private notificationService = inject(NotificationService);
  private router = inject(Router);

  pendingServices: BikeServiceRegisteredDto[] = [];
  recentlyVerifiedServices: BikeServiceRegisteredDto[] = [];
  showRecentlyVerified = false;
  loading = true;
  verifyingServiceId: number | null = null;
  deletingServiceId: number | null = null;

  ngOnInit(): void {
    this.loadServices();
  }

  private loadServices(): void {
    this.loading = true;
    
    this.adminService.getAllRegisteredBikeServices().subscribe({
      next: (services) => {
        this.pendingServices = services.filter(s => !s.isRegistered);
        
        // Pokaż tylko zweryfikowane z ostatniego tygodnia
        const oneWeekAgo = new Date();
        oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
        
        this.recentlyVerifiedServices = services
          .filter(s => s.isRegistered)
          .filter(s => {
            const updatedAt = s.updatedAt ? new Date(s.updatedAt) : new Date(s.createdAt);
            return updatedAt >= oneWeekAgo;
          })
          .sort((a, b) => {
            const dateA = a.updatedAt ? new Date(a.updatedAt) : new Date(a.createdAt);
            const dateB = b.updatedAt ? new Date(b.updatedAt) : new Date(b.createdAt);
            return dateB.getTime() - dateA.getTime();
          });
        
        this.loading = false;
      },
      error: (error) => {
        console.error('Error loading services:', error);
        this.notificationService.error('Nie udało się załadować listy serwisów');
        this.loading = false;
      }
    });
  }

  verifyService(serviceId: number, event: Event): void {
    event.stopPropagation();
    
    if (this.verifyingServiceId) {
      return;
    }

    if (!confirm('Czy na pewno chcesz zweryfikować ten serwis?')) {
      return;
    }

    this.verifyingServiceId = serviceId;

    this.adminService.verifyBikeService(serviceId).subscribe({
      next: (response) => {
        this.notificationService.success('Serwis został pomyślnie zweryfikowany');
        this.verifyingServiceId = null;
        this.loadServices();
      },
      error: (error) => {
        console.error('Error verifying service:', error);
        this.notificationService.error('Nie udało się zweryfikować serwisu');
        this.verifyingServiceId = null;
      }
    });
  }

  deleteService(serviceId: number, serviceName: string, event: Event): void {
    event.stopPropagation();
    
    if (this.deletingServiceId) {
      return;
    }

    if (!confirm(`Czy na pewno chcesz usunąć serwis "${serviceName}"?\n\nTej operacji nie można cofnąć!`)) {
      return;
    }

    this.deletingServiceId = serviceId;

    this.adminService.deleteBikeService(serviceId).subscribe({
      next: (response) => {
        this.notificationService.success('Serwis został usunięty');
        this.deletingServiceId = null;
        this.loadServices();
      },
      error: (error) => {
        console.error('Error deleting service:', error);
        this.notificationService.error('Nie udało się usunąć serwisu');
        this.deletingServiceId = null;
      }
    });
  }

  editService(serviceId: number): void {
    this.router.navigate(['/admin-service-edit', serviceId]);
  }

  toggleRecentlyVerified(): void {
    this.showRecentlyVerified = !this.showRecentlyVerified;
  }

  getFullAddress(service: BikeServiceRegisteredDto): string {
    const parts: string[] = [];
    
    if (service.street) parts.push(service.street);
    if (service.building) parts.push(service.building);
    if (service.flat) parts.push(`/${service.flat}`);
    if (service.city) parts.push(`, ${service.city}`);
    if (service.postalCode) parts.push(service.postalCode);
    
    return parts.join(' ') || 'Brak adresu';
  }

  formatDate(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleDateString('pl-PL', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  goBack(): void {
    this.router.navigate(['/admin-dashboard']);
  }
}