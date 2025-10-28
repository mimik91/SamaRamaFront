// src/app/pages/services-map-page/services/map.models.ts

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
  category?: string;
}

export interface ServiceDetails {
  id: number;
  name: string;
  street: string;
  building: string;
  flat?: string;
  postalCode?: string;
  city: string;
  phoneNumber: string;
  email: string;
  latitude?: number;
  longitude?: number;
  description?: string;
  verified: boolean;
  transportCost?: number;
  transportAvailable: boolean;
  createdAt: string;
  updatedAt?: string;
  registered: boolean;
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