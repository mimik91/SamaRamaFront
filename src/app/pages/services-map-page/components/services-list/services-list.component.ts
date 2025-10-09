// src/app/pages/services-map-page/components/services-list/services-list.component.ts

import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MapPin } from '../../services/map.models';

@Component({
  selector: 'app-services-list',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './services-list.component.html',
  styleUrls: ['./services-list.component.css']
})
export class ServicesListComponent {
  // Inputs
  @Input() services: MapPin[] = [];
  @Input() selectedServiceId: number | null = null;
  @Input() loading = false;
  @Input() loadingMore = false;
  @Input() hasMoreServices = false;
  @Input() error = false;
  @Input() totalServices = 0;
  @Input() currentPage = 0;
  @Input() totalPages = 0;

  // Outputs
  @Output() serviceSelected = new EventEmitter<MapPin>();
  @Output() serviceDetailsRequested = new EventEmitter<MapPin>();
  @Output() scrollEnd = new EventEmitter<void>();
  @Output() retryRequested = new EventEmitter<void>();

  onScroll(event: any): void {
    const element = event.target;
    const scrollTop = element.scrollTop;
    const scrollHeight = element.scrollHeight;
    const clientHeight = element.clientHeight;
    const atBottom = Math.abs(scrollHeight - scrollTop - clientHeight) < 5;
    
    console.log('Scroll event:', {
      scrollTop,
      scrollHeight,
      clientHeight,
      atBottom,
      hasMore: this.hasMoreServices,
      loadingMore: this.loadingMore
    });
    
    if (atBottom && this.hasMoreServices && !this.loadingMore) {
      console.log('Triggering scrollEnd event - loading more services');
      this.scrollEnd.emit();
    }
  }

  onServiceClick(service: MapPin): void {
    this.serviceSelected.emit(service);
  }

  onViewDetails(service: MapPin, event: Event): void {
    event.stopPropagation();
    this.serviceDetailsRequested.emit(service);
  }

  onRetry(): void {
    this.retryRequested.emit();
  }

  isVerified(service: MapPin): boolean {
    return service.verified === true;
  }

  showServiceTags(service: MapPin): boolean {
    return service.verified !== undefined;
  }

  trackByServiceId(index: number, service: MapPin): number {
    return service.id;
  }

  buildAddress(service: MapPin): string {
    if (service.address && service.address.trim()) {
      return service.address;
    }
    return service.name || 'Serwis rowerowy';
  }
}