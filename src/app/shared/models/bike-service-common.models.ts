// ============================================
// BIKE SERVICE COMMON MODELS
// Wspólne modele używane w różnych częściach aplikacji
// ============================================

/**
 * Podstawowy model serwisu rowerowego (publiczny)
 */
export interface BikeService {
  id: number;
  name: string;
  street?: string;
  city?: string;
  latitude?: number;
  longitude?: number;
  phoneNumber?: string;
  email?: string;
  building?: string;
  flat?: string;
  postalCode?: string;
  transportCost?: number;
}

/**
 * Uproszczony DTO z nazwą i ID serwisu (dla listy dropdown)
 */
export interface BikeServiceNameIdDto {
  id: number;
  name: string;
}

/**
 * Pełny DTO zarejestrowanego serwisu rowerowego (admin)
 */
export interface BikeServiceRegisteredDto {
  id: number;
  name: string;
  email?: string;
  street?: string;
  building?: string;
  flat?: string;
  postalCode?: string;
  city?: string;
  latitude?: number;
  longitude?: number;
  phoneNumber?: string;
  transportCost?: number;
  transportAvailable: boolean;
  createdAt?: string;
  updatedAt?: string;
  suffix?: string;
  contactPerson?: string;
  website?: string;
  facebook?: string;
  instagram?: string;
  tiktok?: string;
  youtube?: string;
  description?: string;
  isRegistered: boolean;
  openingHoursInfo?: string;
  openingHoursNote?: string;
  pricelistInfo?: string;
  pricelistNote?: string;
}

/**
 * Publiczne informacje o serwisie (dla profilu publicznego)
 */
export interface BikeServicePublicInfo {
  name: string;
  description: string | null;
  email: string | null;
  street: string | null;
  building: string | null;
  flat: string | null;
  postalCode: string | null;
  city: string | null;
  phoneNumber: string | null;
  transportCost: number | null;
  transportAvailable: boolean;
  website: string | null;
  facebook: string | null;
  instagram: string | null;
  tiktok: string | null;
  youtube: string | null;
}

/**
 * Status aktywności opcjonalnych sekcji serwisu
 */
export interface ServiceActiveStatus {
  openingHoursActive: boolean;
  pricelistActive: boolean;
  packagesActive: boolean;
}

// ============================================
// HELPER FUNCTIONS
// ============================================

/**
 * Sprawdza czy serwis ma kompletne dane adresowe
 */
export function hasCompleteAddress(service: BikeServiceRegisteredDto | BikeService): boolean {
  return !!(
    service.street &&
    service.building &&
    service.city &&
    ('postalCode' in service && service.postalCode)
  );
}

/**
 * Sprawdza czy serwis ma dane kontaktowe
 */
export function hasContactInfo(service: BikeServiceRegisteredDto | BikeServicePublicInfo): boolean {
  return !!(service.phoneNumber || service.email);
}

/**
 * Sprawdza czy serwis ma social media
 */
export function hasSocialMedia(service: BikeServiceRegisteredDto | BikeServicePublicInfo): boolean {
  return !!(
    ('facebook' in service && service.facebook) ||
    ('instagram' in service && service.instagram) ||
    ('tiktok' in service && service.tiktok) ||
    ('youtube' in service && service.youtube)
  );
}

/**
 * Formatuje adres serwisu do wyświetlenia
 */
export function formatServiceAddress(service: BikeServiceRegisteredDto | BikeService | BikeServicePublicInfo): string {
  const parts: string[] = [];
  
  if (service.street && service.building) {
    let address = `${service.street} ${service.building}`;
    if ('flat' in service && service.flat) {
      address += `/${service.flat}`;
    }
    parts.push(address);
  }
  
  if ('postalCode' in service && service.postalCode && service.city) {
    parts.push(`${service.postalCode} ${service.city}`);
  } else if (service.city) {
    parts.push(service.city);
  }
  
  return parts.join(', ');
}

// ============================================
// VALIDATION
// ============================================

/**
 * Wynik walidacji serwisu
 */
export interface ServiceValidation {
  isValid: boolean;
  errors: string[];
}

/**
 * Waliduje podstawowe dane serwisu
 */
export function validateServiceBasicInfo(service: Partial<BikeServiceRegisteredDto>): ServiceValidation {
  const errors: string[] = [];
  
  if (!service.name || service.name.trim().length < 3) {
    errors.push('Nazwa serwisu musi mieć co najmniej 3 znaki');
  }
  
  if (service.email && !isValidEmail(service.email)) {
    errors.push('Nieprawidłowy format adresu email');
  }
  
  if (service.phoneNumber && !isValidPhoneNumber(service.phoneNumber)) {
    errors.push('Nieprawidłowy format numeru telefonu');
  }
  
  if (service.website && !isValidUrl(service.website)) {
    errors.push('Nieprawidłowy format adresu strony internetowej');
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
}

/**
 * Waliduje email
 */
function isValidEmail(email: string): boolean {
  const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailPattern.test(email);
}

/**
 * Waliduje numer telefonu (9 cyfr)
 */
function isValidPhoneNumber(phone: string): boolean {
  const phonePattern = /^\d{9}$/;
  return phonePattern.test(phone.replace(/\s/g, ''));
}

/**
 * Waliduje URL
 */
function isValidUrl(url: string): boolean {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
}