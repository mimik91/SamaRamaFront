// ============================================
// COURIER MODELS
// ============================================

/**
 * Zamówienie dla kuriera
 */
export interface CourierOrder {
  id: number;
  status: 'CONFIRMED' | 'PICKED_UP' | 'ON_THE_WAY' | 'DELIVERED' | 'READY_FOR_RETURN' | 'RETURNING' | 'ON_THE_WAY_BACK' | 'COMPLETED';
  orderDate: string;
  pickupDate: string;
  pickupTimeWindow?: string;
  pickupAddress: string;
  pickupOfficeName?: string | null;
  deliveryAddress: string;
  bikeBrand?: string;
  bikeModel?: string;
  clientEmail: string;
  clientPhone?: string;
  transportNotes?: string;
  lastModifiedDate?: string;
}
