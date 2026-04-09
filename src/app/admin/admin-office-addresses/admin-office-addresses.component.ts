import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { AdminService } from '../admin-service';
import { NotificationService } from '../../core/notification.service';
import { OfficeAddressDto } from '../../shared/models/office-address.model';

@Component({
  selector: 'app-admin-office-addresses',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './admin-office-addresses.component.html',
  styleUrls: ['./admin-office-addresses.component.css']
})
export class AdminOfficeAddressesComponent implements OnInit {
  private fb = inject(FormBuilder);
  private router = inject(Router);
  private adminService = inject(AdminService);
  private notificationService = inject(NotificationService);

  loading = true;
  saving = false;
  error: string | null = null;

  addresses: OfficeAddressDto[] = [];
  selectedAddress: OfficeAddressDto | null = null;
  isEditing = false;
  isAddingNew = false;

  form: FormGroup = this.fb.group({
    name: ['', Validators.required],
    street: ['', Validators.required],
    building: ['', Validators.required],
    apartment: [''],
    city: ['', Validators.required],
    postalCode: [''],
    latitude: [null as number | null],
    longitude: [null as number | null],
    active: [true]
  });

  ngOnInit(): void {
    this.loadAddresses();
  }

  private loadAddresses(): void {
    this.loading = true;
    this.error = null;
    this.adminService.getAllOfficeAddresses().subscribe({
      next: (addresses) => {
        this.addresses = addresses;
        this.loading = false;
      },
      error: () => {
        this.error = 'Nie udało się załadować listy kompleksów biurowych.';
        this.loading = false;
      }
    });
  }

  get activeAddresses(): OfficeAddressDto[] {
    return this.addresses.filter(a => a.active);
  }

  get inactiveAddresses(): OfficeAddressDto[] {
    return this.addresses.filter(a => !a.active);
  }

  selectAddress(address: OfficeAddressDto): void {
    this.selectedAddress = address;
    this.isEditing = false;
    this.isAddingNew = false;
  }

  startAddingNew(): void {
    this.selectedAddress = null;
    this.isEditing = false;
    this.isAddingNew = true;
    this.form.reset({ active: true });
  }

  startEditing(): void {
    if (!this.selectedAddress) return;
    this.isEditing = true;
    this.isAddingNew = false;
    this.form.patchValue({
      name: this.selectedAddress.name,
      street: this.selectedAddress.street,
      building: this.selectedAddress.building,
      apartment: this.selectedAddress.apartment ?? '',
      city: this.selectedAddress.city,
      postalCode: this.selectedAddress.postalCode ?? '',
      latitude: this.selectedAddress.latitude,
      longitude: this.selectedAddress.longitude,
      active: this.selectedAddress.active
    });
  }

  cancelEdit(): void {
    this.isEditing = false;
    this.isAddingNew = false;
  }

  save(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      this.notificationService.warning('Wypełnij wymagane pola.');
      return;
    }

    this.saving = true;
    const value = this.form.value;
    const dto: OfficeAddressDto = {
      id: this.selectedAddress?.id ?? 0,
      name: value.name,
      street: value.street,
      building: value.building,
      apartment: value.apartment || null,
      city: value.city,
      postalCode: value.postalCode || null,
      latitude: value.latitude != null && value.latitude !== '' ? Number(value.latitude) : null,
      longitude: value.longitude != null && value.longitude !== '' ? Number(value.longitude) : null,
      active: value.active
    };

    if (this.isAddingNew) {
      this.adminService.createOfficeAddress(dto).subscribe({
        next: () => {
          this.notificationService.success('Kompleks biurowy został dodany.');
          this.saving = false;
          this.isAddingNew = false;
          this.loadAddresses();
        },
        error: (err) => {
          this.notificationService.error(err.error?.message || 'Błąd podczas dodawania kompleksu biurowego.');
          this.saving = false;
        }
      });
    } else if (this.isEditing && this.selectedAddress) {
      this.adminService.updateOfficeAddress(this.selectedAddress.id, dto).subscribe({
        next: (updated) => {
          this.notificationService.success('Kompleks biurowy został zaktualizowany.');
          this.saving = false;
          this.isEditing = false;
          this.selectedAddress = updated;
          this.loadAddresses();
        },
        error: (err) => {
          this.notificationService.error(err.error?.message || 'Błąd podczas aktualizacji kompleksu biurowego.');
          this.saving = false;
        }
      });
    }
  }

  deleteAddress(id: number): void {
    if (!confirm('Czy na pewno chcesz usunąć ten kompleks biurowy? Operacja jest nieodwracalna.')) return;
    this.adminService.deleteOfficeAddress(id).subscribe({
      next: () => {
        this.notificationService.success('Kompleks biurowy został usunięty.');
        if (this.selectedAddress?.id === id) {
          this.selectedAddress = null;
        }
        this.loadAddresses();
      },
      error: () => {
        this.notificationService.error('Nie udało się usunąć kompleksu biurowego.');
      }
    });
  }

  isFieldInvalid(field: string): boolean {
    const control = this.form.get(field);
    return control ? control.invalid && (control.dirty || control.touched) : false;
  }

  goBack(): void {
    this.router.navigate(['/admin-dashboard']);
  }
}
