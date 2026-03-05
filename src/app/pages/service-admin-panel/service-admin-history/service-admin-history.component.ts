import { Component, Input, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient, HttpParams } from '@angular/common/http';
import { environment } from '../../../environments/environments';

interface ItemDto {
  name: string;
  price: number;
  quantity: number;
}

interface ServiceRecordServiceDto {
  id: number;
  serviceDate: string;
  bicycleBrand: string;
  bicycleModel: string | null;
  bicycleFrameNumber: string | null;
  clientFirstName: string;
  clientLastName: string | null;
  clientEmail: string | null;
  clientPhone: string | null;
  items: ItemDto[];
  totalPrice: number;
  orderNotes: string | null;
  serviceNotes: string | null;
  maintenanceAdvice: string | null;
  recommendedRepairs: string | null;
}

interface Page<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  number: number;
  size: number;
}

@Component({
  selector: 'app-service-admin-history',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './service-admin-history.component.html',
  styleUrls: ['./service-admin-history.component.css']
})
export class ServiceAdminHistoryComponent implements OnInit {
  @Input() serviceId!: number;

  private http = inject(HttpClient);

  records: ServiceRecordServiceDto[] = [];
  totalElements = 0;
  totalPages = 0;
  currentPage = 0;
  readonly pageSize = 20;

  loading = false;
  error = '';

  expandedRecordId: number | null = null;

  ngOnInit(): void {
    this.loadRecords();
  }

  loadRecords(page = 0): void {
    this.loading = true;
    this.error = '';
    this.expandedRecordId = null;

    const params = new HttpParams()
      .set('serviceId', this.serviceId.toString())
      .set('page', page.toString())
      .set('size', this.pageSize.toString());

    const url = `${environment.apiUrl}${environment.endpoints.bikeServicesRegistered.serviceRecords}`;

    this.http.get<Page<ServiceRecordServiceDto>>(url, { params }).subscribe({
      next: (data) => {
        this.records = data.content;
        this.totalElements = data.totalElements;
        this.totalPages = data.totalPages;
        this.currentPage = data.number;
        this.loading = false;
      },
      error: (err) => {
        console.error('Error loading service records:', err);
        this.error = 'Nie udało się załadować historii zleceń. Spróbuj ponownie.';
        this.loading = false;
      }
    });
  }

  toggleExpand(recordId: number): void {
    this.expandedRecordId = this.expandedRecordId === recordId ? null : recordId;
  }

  isExpanded(recordId: number): boolean {
    return this.expandedRecordId === recordId;
  }

  prevPage(): void {
    if (this.currentPage > 0) {
      this.loadRecords(this.currentPage - 1);
    }
  }

  nextPage(): void {
    if (this.currentPage < this.totalPages - 1) {
      this.loadRecords(this.currentPage + 1);
    }
  }

  formatDate(dateStr: string): string {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    return date.toLocaleDateString('pl-PL', { year: 'numeric', month: 'long', day: 'numeric' });
  }

  getClientName(record: ServiceRecordServiceDto): string {
    return `${record.clientFirstName} ${record.clientLastName || ''}`.trim();
  }

  getBikeName(record: ServiceRecordServiceDto): string {
    const parts = [record.bicycleBrand, record.bicycleModel].filter(Boolean);
    return parts.join(' ') || 'Nieznany rower';
  }

  formatPrice(price: number): string {
    if (price == null) return '—';
    return price.toFixed(2).replace('.', ',') + ' zł';
  }

  get firstRecord(): number {
    return this.totalElements === 0 ? 0 : this.currentPage * this.pageSize + 1;
  }

  get lastRecord(): number {
    return Math.min((this.currentPage + 1) * this.pageSize, this.totalElements);
  }
}
