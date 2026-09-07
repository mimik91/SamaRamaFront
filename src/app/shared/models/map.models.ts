// src/app/pages/services-map-page/services/map.models.ts

/**
 * Koordynaty serwisu (używane przez stare wersje map.service.ts)
 */
export interface Coordinate {
  serviceId: number;
  name: string;
  latitude: number;
  longitude: number;
}

export interface MapPin {
  id: number;
  name: string;
  latitude: number;
  longitude: number;
  address?: string;
  description?: string;
  phoneNumber?: string;
  email?: string;
  verified?: boolean;
  reservationAvailable?: boolean;
  category?: string;
  logoUrl?: string;
  transportCost?: number;
  // Statystyki z RegisteredServiceInfo (zadanie 3) — null/0 gdy serwis nie ma jeszcze danych
  averageRating?: number | null;
  reviewCount?: number | null;
  medianServiceDurationHours?: number | null;
}

export interface ServiceDetails {
  id: number;
  name: string;
  email: string;
  street: string;
  building: string;
  flat?: string;
  postalCode?: string;
  city: string;
  latitude?: number;
  longitude?: number;
  phoneNumber: string;
  description?: string;
  verified: boolean;
  transportCost?: number;
  transportAvailable: boolean;
  createdAt: string;
  updatedAt?: string;
  registered: boolean;
  logoUrl?: string;
  reservationAvailable?: boolean;
  suffix?: string;
}

export interface CitySuggestion {
  cityName: string;
  cityLabel : string;
  latitude: number;
  longitude: number;
  type: string;
  point?: {
    coordinates: [number, number];
  };
}

export interface CityBounds {
  sw: { latitude: number; longitude: number };
  ne: { latitude: number; longitude: number };
  center: { latitude: number; longitude: number };
  zoom: number;
}

export interface StatsSummaryDto {
  totalServices: number;
  totalCities: number;
}

export interface BikeRepairCoverageDto {
  id: number;
  name: string;
  categoryId: number;
}

export interface BikeRepairCoverageCategoryDto {
  id: number;
  name: string;
  displayOrder: number;
}

export interface BikeRepairCoverageMapDto {
  coveragesByCategory: { [key: string]: BikeRepairCoverageDto[] };
}

export interface FilterByCoverageRequest {
  coverageIds: number[];
}

export interface MapServicesRequestDto {
  type?: string;
  payload?: {
    website?: string;
    screen?: string;
    hostname?: string;
    language?: string;
    referrer?: string;
    title?: string;
    url?: string;
  };
  bounds?: string;
  page?: number;
  perPage?: number;
  coverageIds?: number[];
  search?: string;
}

export interface MapServicesResponseDto {
  data: MapPin[];
  total: number;
  totalPages?: number;
  sortColumn?: string;
  sortDirection?: string;
  page?: number;
  previous?: number;
  next?: number;
  perPage?: number;
  bounds?: any;
  cache?: string;
  /** true = request faktycznie się nie wykonał (sieć/CORS/5xx) - data/total to tylko bezpieczny
   * fallback, NIE prawdziwy pusty wynik. Ustawiane w map.service.ts::getServices() catchError. */
  requestFailed?: boolean;
}

export interface MapBounds {
  south: number;
  west: number;
  north: number;
  east: number;
}

export interface MapViewState {
  center: { lat: number; lng: number };
  zoom: number;
  bounds?: MapBounds;
}

export interface SearchFiltersState {
  cityQuery: string;
  serviceQuery: string;
  verifiedOnly: boolean;
  selectedCoverageIds: number[];
}

export interface CoverageCategory {
  category: BikeRepairCoverageCategoryDto;
  coverages: BikeRepairCoverageDto[];
}

/**
 * Bounds dla widoku miasta na mapie (zoom 13, viewport ~3000x1800m) — używane zarówno przez
 * resolver strony miasta (SSR), jak i przez odświeżanie listy po zmianie filtrów po stronie klienta.
 */
export function calculateCityBounds(lat: number, lng: number): { south: number; west: number; north: number; east: number } {
  const zoom = 13;
  const viewportWidth = 3000;
  const viewportHeight = 1800;
  const metersPerPixel = 156543.03392 * Math.cos(lat * Math.PI / 180) / Math.pow(2, zoom);
  const halfWidthDeg = (viewportWidth * metersPerPixel) / 111320 / 2;
  const halfHeightDeg = (viewportHeight * metersPerPixel) / 110540 / 2;

  return {
    south: lat - halfHeightDeg,
    north: lat + halfHeightDeg,
    west: lng - halfWidthDeg,
    east: lng + halfWidthDeg
  };
}