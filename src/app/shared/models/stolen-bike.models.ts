/**
 * Wspólny kształt wyniku z ujednoliconego GET /api/bicycle-status/stolen-lookup — łączy wewnętrzną
 * bazę CycloPick (source: 'INTERNAL', ma zdjęcia/galerię) i fallback do numerramy.pl
 * (source: 'EXTERNAL', tylko numer ramy + nazwa roweru, bez zdjęć).
 */
export interface StolenLookupResult {
  source: 'INTERNAL' | 'EXTERNAL';
  id: number | null;
  frameNumber: string | null;
  brand: string | null;
  model: string | null;
  mainPhotoUrl: string | null;
  galleryUrls: string[] | null;
  bikeName: string | null;
}

export interface StolenLookupResponse {
  results: StolenLookupResult[];
  notice?: string;
}

export interface ServiceStolenMatch {
  bicycleId: number | null;
  source: 'INTERNAL' | 'EXTERNAL';
  frameNumber: string;
  brand: string | null;
  model: string | null;
  bikeName: string | null;
  mainPhotoUrl: string | null;
  ownedByClient: boolean;
}

export interface ServiceStolenCheckResponse {
  results: ServiceStolenMatch[];
}

export interface StolenBikeContactRequest {
  finderName: string;
  finderEmail: string;
  finderPhone?: string;
  message: string;
  personalDataAccepted: boolean;
  dataSharingAccepted: boolean;
}
