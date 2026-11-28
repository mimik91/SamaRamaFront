import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule } from '@angular/forms';
import { ReservationFormStore } from '../../reservation-form.store';
import { OfficeAutocompleteComponent } from '../office-autocomplete/office-autocomplete.component';

/** Adres odbioru roweru: autocomplete biurowca (dla OFFICE), ulica/numer/kod/miasto i uwagi dla kuriera. */
@Component({
  selector: 'app-pickup-address',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, OfficeAutocompleteComponent],
  templateUrl: './pickup-address.component.html',
  styleUrls: ['../../reservation-form.shared.css', './pickup-address.component.css']
})
export class PickupAddressComponent {
  @Input({ required: true }) store!: ReservationFormStore;
  /** Lista miast do wyboru; null — miasto wpisywane ręcznie. */
  @Input() cities: string[] | null = null;
  @Input() loadingCities = false;

  get lockedByOffice(): boolean {
    return this.store.isOfficePick && !!this.store.selectedOffice;
  }

  isInvalid(field: string): boolean {
    return this.store.isFieldInvalid(field, this.store.transportForm);
  }
}
