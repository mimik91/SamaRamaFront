import { BicycleForOrder, BicycleSummary } from './bicycle.model';

export interface TransportOrderRequest {
  bicycleIds?: number[];
  bicycles?: BicycleForOrder[];
  
  // === TRANSPORT ===
  pickupDate: string;
  pickupAddress: string;
  pickupLatitude?: number;
  pickupLongitude?: number;
  
  deliveryAddress?: string;
  deliveryLatitude?: number;
  deliveryLongitude?: number;
  
  targetServiceId: number;
  transportPrice?: number;
  
  pickupTimeFrom?: string;
  pickupTimeTo?: string;
  estimatedTime?: number;
  transportNotes?: string;
  additionalNotes?: string;
  
  // === DANE GOŚCI ===
  clientEmail?: string;
  clientPhone?: string;
  clientName?: string;
  city?: string;
}

export interface TransportOrderResponse {
  id: number;
  orderType: string;
  bicycleId?: number;
  bicycleBrand?: string;
  bicycleModel?: string;
  clientEmail: string;
  clientPhone?: string;
  clientName?: string;
  pickupDate: string;
  pickupAddress: string;
  deliveryAddress: string;
  price: number;
  orderDate: string;
  additionalNotes?: string;
  status: string;
  serviceNotes?: string;
  lastModifiedBy?: string;
  lastModifiedDate?: string;
}

export interface TransportOrderSummaryDto {
  bicycleIds?: number[];
  bicycles?: BicycleSummary[];
  recipientEmail?: string;
  pickupDate: string;
  pickupAddress: string;
  deliveryAddress?: string;
  transportPrice: number;
}

export interface TransportOrderCreateResponse {
  id?: number;
  orderIds?: number[];
  message?: string;
}