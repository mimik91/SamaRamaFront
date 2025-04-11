import { Bicycle } from '../bicycles/bicycle.model';
import { BikeService } from '../service-panel/bike-service.model';

export type ServicePackage = string;
export type OrderStatus = string;

export interface ServiceOrder {
  id: number;
  bicycle: Bicycle;
  servicePackage: ServicePackage;
  pickupDate: string;
  pickupAddress: string;
  price: number;
  orderDate: string;
  additionalNotes?: string;
  status: OrderStatus;
  serviceNotes?: string;
  service?: BikeService;
}

export interface CreateServiceOrderRequest {
  bicycleId: number;
  servicePackage: ServicePackage;
  pickupDate: string;
  pickupAddress: string;
  additionalNotes?: string;
}

export interface ServicePackageInfo {
  type: ServicePackage;
  name: string;
  price: number;
  description: string;
  features: string[];
}