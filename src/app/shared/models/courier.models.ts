// ============================================
// COURIER MODELS
// ============================================

/**
 * Zamówienie dla kuriera
 */
export interface CourierOrder {
  id: number;
  status: 'CONFIRMED' | 'ON_THE_WAY_BACK';
  orderDate: string;
  pickupDate: string;
  pickupTimeWindow?: string;
  pickupAddress: string;
  deliveryAddress: string;
  bikeBrand?: string;
  bikeModel?: string;
  clientEmail: string;
  clientPhone?: string;
}
