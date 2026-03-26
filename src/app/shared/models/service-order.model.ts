import { Bicycle } from './bicycle.model';
import { User } from '../../core/models/user.models';
import { ServicePackage } from '../../service-package/service-package.model';

export type OrderStatus = string;

export interface ServiceOrder {
  id: number;
  orderType?: string; // "SERVICE" lub "TRANSPORT"

  // Standard bicycle object - may not be present in API response
  bicycle?: Bicycle | null;
  bicycleId?: number;
  bicycleBrand?: string;
  bicycleModel?: string;
  bicycleDescription?: string;

  client?: User;

  servicePackage?: ServicePackage;
  servicePackageId?: number;
  servicePackageName?: string;
  servicePackageCode?: string;
  servicePackageDescription?: string;

  pickupDate: string;
  pickupAddress: string;
  pickupLatitude?: number;
  pickupLongitude?: number;

  targetServiceName?: string;
  deliveryAddress?: string;

  price: number;
  totalPrice?: number;

  orderDate: string;
  additionalNotes?: string;
  transportNotes?: string;
  serviceNotes?: string;

  status: OrderStatus;
  statusDisplayName?: string;

  lastModifiedBy?: string;
  lastModifiedDate?: string;
}

export interface CreateServiceOrderRequest {
  bicycleIds: number[];

  servicePackageId?: number;
  servicePackageCode?: string;

  pickupDate: string;

  pickupStreet: string;
  pickupBuildingNumber: string;
  pickupCity: string;

  pickupLatitude?: number;
  pickupLongitude?: number;
  additionalNotes?: string;
}

export interface CreateGuestServiceOrderRequest {
  email: string;
  phone: string;

  pickupStreet: string;
  pickupBuildingNumber: string;
  pickupCity: string;
  transportNotes?: string;

  bicycles: {
    brand: string;
    model?: string;
    additionalInfo?: string;
  }[];

  servicePackageId: number;
  pickupDate: string;
}

export interface ServicePackageInfo {
  type: string;
  name: string;
  price: number;
  description: string;
  features: string[];
}
