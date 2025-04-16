import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormGroup, FormBuilder, FormArray, Validators } from '@angular/forms';
import { AdminService } from '../admin-service';
import { NotificationService } from '../../core/notification.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-admin-enumerations-manager',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  templateUrl: './admin-enumerations-manager.component.html',
  styleUrls: ['./admin-enumerations-manager.component.css']
})
export class AdminEnumerationsManagerComponent implements OnInit {
  private adminService = inject(AdminService);
  private notificationService = inject(NotificationService);
  private formBuilder = inject(FormBuilder);
  private router = inject(Router);

  // Enumerations data
  allEnumerations: Record<string, string[]> = {};
  selectedType: string = '';
  
  // Form state
  enumerationsForm!: FormGroup;
  loading = true;
  saving = false;
  error: string | null = null;
  
  // Constants for enumeration types
  readonly BRAND = 'BRAND';
  readonly BIKE_TYPE = 'BIKE_TYPE';
  readonly FRAME_MATERIAL = 'FRAME_MATERIAL';
  readonly ORDER_STATUS = 'ORDER_STATUS';

  ngOnInit(): void {
    this.loadEnumerations();
    this.initForm();
  }

  private initForm(): void {
    this.enumerationsForm = this.formBuilder.group({
      values: this.formBuilder.array([])
    });
  }

  private loadEnumerations(): void {
    this.loading = true;
    this.error = null;
    
    this.adminService.getAllEnumerations().subscribe({
      next: (enumerations) => {
        this.allEnumerations = enumerations;
        this.loading = false;
        
        // Set BRAND as default selected type if available
        if (Object.keys(enumerations).length > 0) {
          this.selectedType = this.BRAND in enumerations ? this.BRAND : Object.keys(enumerations)[0];
          this.selectEnumerationType(this.selectedType);
        }
      },
      error: (err) => {
        console.error('Error loading enumerations:', err);
        this.error = 'Nie udało się załadować danych enumeracji. Spróbuj ponownie później.';
        this.loading = false;
        this.notificationService.error(this.error);
      }
    });
  }

  get valuesArray(): FormArray {
    return this.enumerationsForm.get('values') as FormArray;
  }

  selectEnumerationType(type: string): void {
    this.selectedType = type;
    this.resetValuesForm();
    
    if (this.allEnumerations[type]) {
      const values = this.allEnumerations[type];
      values.forEach(value => {
        this.addValueToForm(value);
      });
    }
  }
  
  private resetValuesForm(): void {
    while (this.valuesArray.length !== 0) {
      this.valuesArray.removeAt(0);
    }
  }
  
  addValueToForm(value: string = ''): void {
    this.valuesArray.push(
      this.formBuilder.group({
        value: [value, Validators.required]
      })
    );
  }
  
  removeValue(index: number): void {
    this.valuesArray.removeAt(index);
  }
  
  onSubmit(): void {
    if (this.enumerationsForm.invalid) {
      this.markFormGroupTouched(this.enumerationsForm);
      this.notificationService.warning('Wypełnij poprawnie wszystkie pola');
      return;
    }
    
    this.saving = true;
    const values = this.valuesArray.value.map((item: {value: string}) => item.value);
    
    this.adminService.updateEnumeration(this.selectedType, values).subscribe({
      next: () => {
        this.notificationService.success(`Wartości dla ${this.getEnumerationTypeName(this.selectedType)} zostały zaktualizowane`);
        this.loadEnumerations(); // Refresh data
        this.saving = false;
      },
      error: (err) => {
        console.error(`Error updating enumeration ${this.selectedType}:`, err);
        this.notificationService.error(`Nie udało się zaktualizować wartości dla ${this.getEnumerationTypeName(this.selectedType)}`);
        this.saving = false;
      }
    });
  }
  
  // Helper function to mark all form controls as touched
  private markFormGroupTouched(formGroup: FormGroup): void {
    Object.values(formGroup.controls).forEach(control => {
      control.markAsTouched();
      
      if (control instanceof FormGroup) {
        this.markFormGroupTouched(control);
      } else if (control instanceof FormArray) {
        control.controls.forEach(ctrl => {
          if (ctrl instanceof FormGroup) {
            this.markFormGroupTouched(ctrl);
          } else {
            ctrl.markAsTouched();
          }
        });
      }
    });
  }
  
  // Get display name for enumeration type
  getEnumerationTypeName(type: string): string {
    switch (type) {
      case this.BRAND: return 'Marki rowerów';
      case this.BIKE_TYPE: return 'Typy rowerów';
      case this.FRAME_MATERIAL: return 'Materiały ram';
      case this.ORDER_STATUS: return 'Statusy zamówień';
      default: return type;
    }
  }
  
  goBack(): void {
    this.router.navigate(['/admin-dashboard']);
  }
}