import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule } from '@angular/forms';
import { OfficeAddressDto } from '../../../../shared/models/office-address.model';
import { ReservationFormStore } from '../../reservation-form.store';

/** Autocomplete biurowców/kompleksów biurowych — po wyborze uzupełnia adres odbioru. */
@Component({
  selector: 'app-office-autocomplete',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './office-autocomplete.component.html',
  styleUrls: ['../../reservation-form.shared.css', './office-autocomplete.component.css']
})
export class OfficeAutocompleteComponent {
  @Input({ required: true }) store!: ReservationFormStore;

  filteredOffices: OfficeAddressDto[] = [];
  showDropdown = false;

  get invalid(): boolean {
    const c = this.store.officeNameControl;
    return !c.value?.trim() && c.dirty;
  }

  onInput(event: Event): void {
    const q = (event.target as HTMLInputElement).value;
    this.store.officeNameControl.setValue(q, { emitEvent: false });
    this.filter(q);
    if (this.store.selectedOffice) {
      this.store.selectedOffice = null;
      this.store.clearAddressFields();
    }
  }

  onFocus(): void {
    this.filter(this.store.officeNameControl.value || '', false);
  }

  onBlur(): void {
    setTimeout(() => { this.showDropdown = false; }, 200);
  }

  expandAll(): void {
    this.filteredOffices = [...this.store.officeAddresses];
    this.showDropdown = this.filteredOffices.length > 0;
  }

  select(office: OfficeAddressDto): void {
    this.store.selectOffice(office);
    this.showDropdown = false;
  }

  clear(): void {
    this.store.clearOfficeSelection();
    this.showDropdown = false;
    this.filteredOffices = [];
  }

  private filter(q: string, resetWhenShort = true): void {
    if (q.length >= 3) {
      this.filteredOffices = this.store.officeAddresses.filter(o => o.name.toLowerCase().includes(q.toLowerCase()));
      this.showDropdown = this.filteredOffices.length > 0;
    } else if (resetWhenShort) {
      this.showDropdown = false;
      this.filteredOffices = [];
    }
  }
}
