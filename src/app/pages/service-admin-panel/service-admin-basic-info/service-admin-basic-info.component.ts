import { Component, Input, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';

interface BikeServiceRegisteredDto {
  id: number;
  name: string;
  email?: string;
  street?: string;
  building?: string;
  flat?: string;
  postalCode?: string;
  city?: string;
  latitude?: number;
  longitude?: number;
  phoneNumber?: string;
  transportCost?: number;
  transportAvailable: boolean;
  createdAt?: string;
  updatedAt?: string;
  suffix?: string;
  contactPerson?: string;
  website?: string;
  facebook?: string;
  instagram?: string;
  tiktok?: string;
  youtube?: string;
  description?: string;
  isRegistered: boolean;
}

interface ServiceProfileUpdateDto {
  email?: string;
  phoneNumber?: string;
  contactPerson?: string;
  website?: string;
  facebook?: string;
  instagram?: string;
  tiktok?: string;
  youtube?: string;
  description?: string;
}

@Component({
  selector: 'app-service-admin-basic-info',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './service-admin-basic-info.component.html',
  styleUrls: ['./service-admin-basic-info.component.css']
})
export class ServiceAdminBasicInfoComponent implements OnInit {
  @Input() serviceDetails!: BikeServiceRegisteredDto;
  @Input() serviceId!: number;

  isEditMode: boolean = false;
  isSaving: boolean = false;
  saveError: string = '';
  saveSuccess: boolean = false;
  
  editableData: ServiceProfileUpdateDto = {};

  constructor(private http: HttpClient) {}

  ngOnInit(): void {
    this.initEditableData();
  }

  initEditableData(): void {
    if (!this.serviceDetails) return;
    
    this.editableData = {
      email: this.serviceDetails.email || '',
      phoneNumber: this.serviceDetails.phoneNumber || '',
      contactPerson: this.serviceDetails.contactPerson || '',
      website: this.serviceDetails.website || '',
      facebook: this.serviceDetails.facebook || '',
      instagram: this.serviceDetails.instagram || '',
      tiktok: this.serviceDetails.tiktok || '',
      youtube: this.serviceDetails.youtube || '',
      description: this.serviceDetails.description || ''
    };
  }

  toggleEditMode(): void {
    if (this.isEditMode) {
      // Cancel - restore original data
      this.initEditableData();
    }
    this.isEditMode = !this.isEditMode;
    this.saveError = '';
    this.saveSuccess = false;
  }

  saveChanges(): void {
    if (!this.serviceId) return;
    
    this.isSaving = true;
    this.saveError = '';
    this.saveSuccess = false;

    const url = `/api/bike-service/my-service?serviceId=${this.serviceId}`;
    
    this.http.put(url, this.editableData).subscribe({
      next: () => {
        this.isSaving = false;
        this.saveSuccess = true;
        this.isEditMode = false;
        
        // Update service details with new values
        Object.assign(this.serviceDetails, this.editableData);
        
        // Hide success message after 3 seconds
        setTimeout(() => {
          this.saveSuccess = false;
        }, 3000);
      },
      error: (err: any) => {
        this.isSaving = false;
        this.saveError = 'Nie udało się zapisać zmian. Spróbuj ponownie.';
        console.error('Error saving changes:', err);
      }
    });
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
}