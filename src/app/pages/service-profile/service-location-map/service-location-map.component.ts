import {
  Component, Input, OnDestroy, AfterViewInit, ViewChild, ElementRef,
  Inject, PLATFORM_ID, ChangeDetectionStrategy, ChangeDetectorRef
} from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { loadLeaflet } from '../../../shared/utils/leaflet-loader';

declare var L: any;

/**
 * Statyczna, nieinteraktywna mini-mapa z jedną pinezką — do podglądu lokalizacji serwisu na profilu.
 * Bez klastrowania/popupów/zależności od MapService — dla tego celu wystarczy goły Leaflet + jeden marker.
 */
@Component({
  selector: 'app-service-location-map',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './service-location-map.component.html',
  styleUrls: ['./service-location-map.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ServiceLocationMapComponent implements AfterViewInit, OnDestroy {
  @ViewChild('mapContainer', { static: false }) mapContainer!: ElementRef<HTMLDivElement>;

  @Input({ required: true }) latitude!: number;
  @Input({ required: true }) longitude!: number;
  @Input() serviceName = '';

  loading = true;
  error = false;

  private map: any = null;
  private isBrowser: boolean;

  constructor(
    @Inject(PLATFORM_ID) platformId: Object,
    private cdr: ChangeDetectorRef
  ) {
    this.isBrowser = isPlatformBrowser(platformId);
  }

  ngAfterViewInit(): void {
    if (!this.isBrowser) return;
    this.initMap();
  }

  ngOnDestroy(): void {
    if (this.map) {
      this.map.remove();
      this.map = null;
    }
  }

  private async initMap(): Promise<void> {
    try {
      await loadLeaflet();
      if (!this.mapContainer?.nativeElement) return;

      this.map = L.map(this.mapContainer.nativeElement, {
        center: [this.latitude, this.longitude],
        zoom: 13,
        zoomControl: false,
        dragging: false,
        touchZoom: false,
        scrollWheelZoom: false,
        doubleClickZoom: false,
        boxZoom: false,
        keyboard: false
      });

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors',
        maxZoom: 19
      }).addTo(this.map);

      L.marker([this.latitude, this.longitude]).addTo(this.map);

      this.loading = false;
      this.cdr.markForCheck();

      setTimeout(() => this.map?.invalidateSize(), 150);
    } catch (err) {
      console.error('[ServiceLocationMap] Failed to load static map:', err);
      this.error = true;
      this.loading = false;
      this.cdr.markForCheck();
    }
  }
}
