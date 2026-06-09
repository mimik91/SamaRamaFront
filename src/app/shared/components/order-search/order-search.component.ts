import { Component, Input, Output, EventEmitter, OnChanges, HostListener, ElementRef, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  CalendarOrder,
  OrderSearchFilter,
  EMPTY_ORDER_SEARCH_FILTER,
  hasActiveFilter
} from '../../models/service-calendar.models';

type FilterField = keyof OrderSearchFilter;

interface SearchField {
  key: FilterField;
  placeholder: string;
}

const SEARCH_FIELDS: SearchField[] = [
  { key: 'firstName', placeholder: 'Imię'        },
  { key: 'lastName',  placeholder: 'Nazwisko'     },
  { key: 'bikeBrand', placeholder: 'Marka roweru' },
  { key: 'bikeModel', placeholder: 'Model roweru' },
  { key: 'email',     placeholder: 'Email'        },
  { key: 'phone',     placeholder: 'Telefon'      },
];

@Component({
  selector: 'app-order-search',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './order-search.component.html',
  styleUrls: ['./order-search.component.css']
})
export class OrderSearchComponent implements OnChanges {
  private el = inject(ElementRef);

  @Input() allOrders: CalendarOrder[] = [];
  @Output() filterChange = new EventEmitter<OrderSearchFilter>();

  readonly fields = SEARCH_FIELDS;

  filter: OrderSearchFilter = { ...EMPTY_ORDER_SEARCH_FILTER };
  suggestions: Record<FilterField, string[]> = {
    firstName: [], lastName: [], bikeBrand: [], bikeModel: [], email: [], phone: []
  };
  openField: FilterField | null = null;

  ngOnChanges(): void {
    if (this.openField) {
      this.suggestions[this.openField] = this.buildSuggestions(this.openField, this.filter[this.openField]);
    }
  }

  get hasActive(): boolean {
    return hasActiveFilter(this.filter);
  }

  onInput(field: FilterField, value: string): void {
    this.filter[field] = value;
    if (value.length >= 2) {
      this.suggestions[field] = this.buildSuggestions(field, value);
      this.openField = field;
    } else {
      this.suggestions[field] = [];
      if (this.openField === field) this.openField = null;
    }
    this.filterChange.emit({ ...this.filter });
  }

  selectSuggestion(field: FilterField, value: string): void {
    this.filter[field] = value;
    this.suggestions[field] = [];
    this.openField = null;
    this.filterChange.emit({ ...this.filter });
  }

  clearField(field: FilterField, event: Event): void {
    event.stopPropagation();
    this.filter[field] = '';
    this.suggestions[field] = [];
    if (this.openField === field) this.openField = null;
    this.filterChange.emit({ ...this.filter });
  }

  clearAll(event: Event): void {
    event.stopPropagation();
    this.filter = { ...EMPTY_ORDER_SEARCH_FILTER };
    this.openField = null;
    this.suggestions = { firstName: [], lastName: [], bikeBrand: [], bikeModel: [], email: [], phone: [] };
    this.filterChange.emit({ ...this.filter });
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    if (!this.el.nativeElement.contains(event.target)) {
      this.openField = null;
    }
  }

  private buildSuggestions(field: FilterField, query: string): string[] {
    const q = query.toLowerCase();
    const seen = new Set<string>();
    for (const order of this.allOrders) {
      const val = this.extractValue(field, order);
      if (val && val.toLowerCase().includes(q)) seen.add(val);
    }
    return Array.from(seen).slice(0, 8);
  }

  private extractValue(field: FilterField, order: CalendarOrder): string {
    const nameParts = (order.clientName ?? '').split(' ');
    switch (field) {
      case 'firstName': return nameParts[0] ?? '';
      case 'lastName':  return nameParts.slice(1).join(' ');
      case 'bikeBrand': return order.bicycleBrand ?? '';
      case 'bikeModel': return order.bicycleModel ?? '';
      case 'email':     return order.clientEmail ?? '';
      case 'phone':     return order.clientPhone ?? '';
    }
  }
}
