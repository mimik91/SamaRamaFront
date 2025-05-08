// service-order.model.ts
import { Bicycle } from '../bicycles/bicycle.model';
import { User } from '../core/models/user.models';
import { ServicePackage } from '../service-package/service-package.model';

export type OrderStatus = string;

export interface ServiceOrder {
  id: number;
  
  // Standard bicycle object - may not be present in API response
  bicycle?: Bicycle | null;
  
  // Direct bicycle properties from the API response
  bicycleId?: number;
  bicycleBrand?: string;
  bicycleModel?: string;
  
  client?: User;
  
  // Pełny obiekt pakietu serwisowego (jeśli zwrócony przez API)
  servicePackage?: ServicePackage;
  
  // Dane pakietu serwisowego bezpośrednio w API
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
}

export interface CreateServiceOrderRequest {
  bicycleIds: number[];
  
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