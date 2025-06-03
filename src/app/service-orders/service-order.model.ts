// service-order.model.ts
import { Bicycle } from '../bicycles/bicycle.model';
import { User } from '../core/models/user.models';
import { ServicePackage } from '../service-package/service-package.model';

export type OrderStatus = string;

export interface ServiceOrder {
  id: number;
  
  // Standard bicycle object - may not be present in API response
  bicycle?: Bicycle | null;
  bicycleId?: number;
  bicycleBrand?: string;
  bicycleModel?: string;
  
  client?: User;
  
  servicePackage?: ServicePackage;
  servicePackageId?: number;  // Add this property
  servicePackageName?: string;
  servicePackageCode?: string;
  
  pickupDate: string;
  pickupAddress: string;
  pickupLatitude?: number;
  pickupLongitude?: number;
  price: number;
  orderDate: string;
  additionalNotes?: string;
  status: OrderStatus;
  serviceNotes?: string;

  lastModifiedBy?: string;
  lastModifiedDate?: string;
}

export interface CreateServiceOrderRequest {
  bicycleIds: number[];
  
  servicePackageId?: number;
  servicePackageCode?: string;
  
  pickupDate: string;
  
  // Nowe pola adresowe - zastępują pickupAddress
  pickupStreet: string;
  pickupBuildingNumber: string;
  pickupCity: string;
  
  pickupLatitude?: number;
  pickupLongitude?: number;
  additionalNotes?: string;
}

// Interface dla guest orders (może mieć nieco inną strukturę)
export interface CreateGuestServiceOrderRequest {
  // Dane użytkownika
  email: string;
  phone: string;
  
  // Nowe pola adresowe
  pickupStreet: string;
  pickupBuildingNumber: string;
  pickupCity: string;
  transportNotes?: string;
  
  // Dane rowerów
  bicycles: {
    brand: string;
    model?: string;
    additionalInfo?: string;
  }[];
  
  // Dane zamówienia
  servicePackageId: number;
  pickupDate: string;
}

// Informacja o pakiecie serwisowym - można usunąć jeśli stosujemy już ServicePackage
export interface ServicePackageInfo {
  type: string;
  name: string;
  price: number;
  description: string;
  features: string[];
}