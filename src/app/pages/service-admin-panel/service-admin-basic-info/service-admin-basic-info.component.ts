import { Component, Input, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environments';

interface BikeServiceRegisteredDto {
  id: number;
  name: string;
  email?: string;
  street?: string;
  building?: string;
  flat?: string;
  postalCode?: string;
  city?: string;
  district?: string | null;
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
  displayEmail?: boolean;
  displayPhoneNumber?: boolean;
  reservationAvailable?: boolean;
}

interface ServiceProfileUpdateDto {
  email?: string;
  phoneNumber?: string;
  contactPerson?: string;
  district?: string;
  website?: string;
  facebook?: string;
  instagram?: string;
  tiktok?: string;
  youtube?: string;
  description?: string;
  displayEmail?: boolean;
  displayPhoneNumber?: boolean;
  reservationAvailable?: boolean;
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

  availableDistricts: string[] = [];
  filteredDistricts: string[] = [];
  showDistrictDropdown: boolean = false;

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
      district: this.serviceDetails.district || '',
      website: this.serviceDetails.website || '',
      facebook: this.serviceDetails.facebook || '',
      instagram: this.serviceDetails.instagram || '',
      tiktok: this.serviceDetails.tiktok || '',
      youtube: this.serviceDetails.youtube || '',
      description: this.serviceDetails.description || '',
      displayEmail: this.serviceDetails.displayEmail ?? true,
      displayPhoneNumber: this.serviceDetails.displayPhoneNumber ?? true,
      reservationAvailable: this.serviceDetails.reservationAvailable ?? false
    };
  }

  toggleEditMode(): void {
    if (this.isEditMode) {
      this.initEditableData();
      this.showDistrictDropdown = false;
    } else {
      this.loadDistrictSuggestions();
    }
    this.isEditMode = !this.isEditMode;
    this.saveError = '';
    this.saveSuccess = false;
  }

  private loadDistrictSuggestions(): void {
    const city = this.serviceDetails?.city;
    if (!city) return;
    const url = `${environment.apiUrl}/bike-services/districts?city=${encodeURIComponent(city)}`;
    this.http.get<string[]>(url).subscribe({
      next: (districts) => {
        this.availableDistricts = districts;
        this.filteredDistricts = districts;
      },
      error: () => {
        this.availableDistricts = [];
        this.filteredDistricts = [];
      }
    });
  }

  onDistrictInput(): void {
    const val = (this.editableData.district || '').toLowerCase();
    this.filteredDistricts = val
      ? this.availableDistricts.filter(d => d.toLowerCase().includes(val))
      : this.availableDistricts;
    this.showDistrictDropdown = this.filteredDistricts.length > 0;
  }

  openDistrictDropdown(): void {
    this.filteredDistricts = this.availableDistricts;
    if (this.filteredDistricts.length > 0) {
      this.showDistrictDropdown = true;
    }
  }

  selectDistrict(district: string): void {
    this.editableData.district = district;
    this.showDistrictDropdown = false;
  }

  closeDistrictDropdown(): void {
    setTimeout(() => {
      this.showDistrictDropdown = false;
    }, 150);
  }

  saveChanges(): void {
    if (!this.serviceId) return;

    const url = `${environment.apiUrl}/bike-services-registered/my-service?serviceId=${this.serviceId}`;
    
    this.isSaving = true;
    this.saveError = '';
    this.saveSuccess = false;
    
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
        const body = err?.error;
        if (body?.errors?.length) {
          this.saveError = body.errors.join('\n');
        } else if (body?.message) {
          this.saveError = body.message;
        } else {
          this.saveError = 'Nie udało się zapisać zmian. Spróbuj ponownie.';
        }
        console.error('Error saving changes:', err);
      }
    });
  }

  isValidUrl(url: string | undefined): boolean {
    if (!url) return false;
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
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