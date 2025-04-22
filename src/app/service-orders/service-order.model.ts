import { Bicycle } from '../bicycles/bicycle.model';
import { User } from '../core/models/user.models';
import { ServicePackage } from '../service-package/service-package.model';

export type OrderStatus = string;

export interface ServiceOrder {
  id: number;
  bicycle: Bicycle | null;
  client?: User;
  
  // Nowe pole referencyjne do ServicePackage
  servicePackage?: ServicePackage;
  
  // Stare pole - dla wstecznej kompatybilności
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
}

export interface CreateServiceOrderRequest {
  bicycleId: number;
  
  // Nowe pola - można użyć albo id albo code
  servicePackageId?: number;
  servicePackageCode?: string;
  
  pickupDate: string;
  pickupAddress: string;
  pickupLatitude?: number;
  pickupLongitude?: number;
  additionalNotes?: string;
}

// Informacja o pakiecie serwisowym - można usunąć jeśli stosujemy już ServicePackage
export interface ServicePackageInfo {
  type: string;
  name: string;
  price: number;
  description: string;
  features: string[];
}