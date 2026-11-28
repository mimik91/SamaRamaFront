import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule } from '@angular/forms';
import { ReservationFormStore } from '../../reservation-form.store';
import { bikesNoun } from '../../reservation-form.utils';

interface BrandState {
  filtered: string[];
  showDropdown: boolean;
}

/** Karty rowerów: marka (autocomplete), model, opis; w trybie klienta wybór z „moich rowerów". */
@Component({
  selector: 'app-reservation-bikes',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './reservation-bikes.component.html',
  styleUrls: ['../../reservation-form.shared.css', './reservation-bikes.component.css']
})
export class ReservationBikesComponent {
  @Input({ required: true }) store!: ReservationFormStore;
  /** Podpowiedź pod opisem usterek (np. odwołanie do cennika). */
  @Input() infoHint: string | null = null;
  @Input() infoPlaceholder = 'Co Cię niepokoi w działaniu roweru? np. pisk hamulców, luz w sterach...';

  private brandStates: BrandState[] = [];

  state(index: number): BrandState {
    return (this.brandStates[index] ??= { filtered: [], showDropdown: false });
  }

  limitText(): string {
    const max = this.store.maxBikes;
    return `W jednym zleceniu możesz dodać maksymalnie ${max} ${bikesNoun(max)}.`;
  }

  addBike(): void {
    this.store.addBike();
  }

  removeBike(index: number): void {
    this.store.removeBike(index);
    this.brandStates.splice(index, 1);
  }

  isInvalid(index: number, field: string): boolean {
    const ctrl = this.store.bikesArray.at(index).get(field);
    return !!(ctrl?.invalid && (ctrl.dirty || ctrl.touched));
  }

  onBicycleSelectChange(event: Event, index: number): void {
    const value = (event.target as HTMLSelectElement).value;
    this.store.onBicycleSelected(index, value === 'OTHER' ? 'OTHER' : +value);
  }

  // ----- Autocomplete marki -----

  onBrandInput(event: Event, index: number): void {
    const q = (event.target as HTMLInputElement).value;
    this.store.bikesArray.at(index).get('brand')?.setValue(q, { emitEvent: false });
    this.filterBrands(index, q);
  }

  onBrandFocus(index: number): void {
    this.filterBrands(index, this.store.bikesArray.at(index).get('brand')?.value || '', false);
  }

  onBrandBlur(index: number): void {
    setTimeout(() => { this.state(index).showDropdown = false; }, 200);
  }

  selectBrand(brand: string, index: number): void {
    this.store.bikesArray.at(index).get('brand')?.setValue(brand);
    this.state(index).showDropdown = false;
  }

  expandAllBrands(index: number): void {
    const s = this.state(index);
    s.filtered = [...this.store.brands];
    s.showDropdown = true;
  }

  private filterBrands(index: number, q: string, hideWhenShort = true): void {
    const s = this.state(index);
    if (q.length >= 3) {
      s.filtered = this.store.brands.filter(b => b.toLowerCase().includes(q.toLowerCase()));
      s.showDropdown = s.filtered.length > 0;
    } else if (hideWhenShort) {
      s.showDropdown = false;
    }
  }
}
