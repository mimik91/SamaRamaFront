/**
 * Transport Order Models
 * Modele dla zamówień transportowych
 */

// === REQUEST MODELS ===

/**
 * Model roweru dla gościa (bez rejestracji)
 */
export interface GuestBicycleDto {
  brand: string;
  model?: string;
  additionalInfo?: string;
}

/**
 * DTO dla żądania utworzenia/aktualizacji zamówienia transportowego
 * Mapuje na TransportOrderRequestDto z backendu
 */
export interface TransportOrderRequestDto {
  bicycles: GuestBicycleDto[];
  email: string;
  phone: string;
  pickupDate: string; // format: YYYY-MM-DD
  pickupStreet: string;
  pickupBuildingNumber: string;
  pickupApartmentNumber?: string;
  pickupCity: string;
  pickupPostalCode: string;
  targetServiceId: number;
  transportPrice: number;
  transportNotes?: string;
  additionalNotes?: string;
  discountCoupon?: string;
}

// === RESPONSE MODELS ===

/**
 * Pełny model zamówienia transportowego
 * Mapuje na TransportOrderResponseDto z backendu
 */
export interface TransportOrder {
  id: number;
  
  // Bicycle info
  bicycleId?: number;
  bicycleBrand?: string;
  bicycleModel?: string;
  bicycleType?: string;
  
  // Client info
  clientEmail?: string;
  clientPhone?: string;
  clientName?: string;
  
  // Pickup info - aggregated
  pickupDate: string;
  pickupAddress: string;
  pickupTimeWindow?: string;
  
  // Pickup info - detailed
  pickupStreet?: string;
  pickupBuildingNumber?: string;
  pickupApartmentNumber?: string;
  pickupCity?: string;
  pickupPostalCode?: string;
  
  // Delivery info
  deliveryAddress: string;
  targetServiceName?: string;
  targetServiceId?: number;
  
  // Transport details
  transportPrice: number;
  estimatedTime?: number;
  
  // Actual times
  actualPickupTime?: string;
  actualDeliveryTime?: string;
  actualReturnTime?: string;
  
  // Status and dates
  status: string;
  statusDisplayName?: string;
  orderDate: string;
  
  // Notes
  additionalNotes?: string;
  transportNotes?: string;
  
  // Related order
  relatedServiceOrderId?: number;
  
  // Metadata
  lastModifiedBy?: string;
  lastModifiedDate?: string;
  createdAt?: string;
  updatedAt?: string;
}

/**
 * Skrócona wersja zamówienia dla list
 */
export interface TransportOrderSummary {
  id: number;
  clientEmail: string;
  clientName?: string;
  bicycleBrand?: string;
  pickupDate: string;
  status: string;
  transportPrice: number;
}

// === FILTER MODELS ===

/**
 * Filtry dla wyszukiwania zamówień
 */
export interface OrderFilter {
  pickupDateFrom?: string;
  pickupDateTo?: string;
  status?: string;
  searchTerm?: string;
  sortBy?: string;
  sortOrder?: 'ASC' | 'DESC';
}

// === PAGINATION ===

/**
 * Generyczna odpowiedź z paginacją
 */
export interface PagedResponse<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  size: number;
  number: number;
  first: boolean;
  last: boolean;
}

// === STATUS ===

/**
 * Dostępne statusy zamówień transportowych
 * Zgodne z TransportOrder.OrderStatus w Javie
 */
export enum TransportOrderStatus {
  PENDING = 'PENDING',
  CONFIRMED = 'CONFIRMED',
  TO_PICK_UP = 'TO_PICK_UP',
  PICKED_UP = 'PICKED_UP',
  ON_THE_WAY = 'ON_THE_WAY',
  DELIVERED = 'DELIVERED',
  RETURNING = 'RETURNING',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED'
}

/**
 * Mapowanie statusów na polskie nazwy
 */
export const TRANSPORT_ORDER_STATUS_LABELS: Record<TransportOrderStatus, string> = {
  [TransportOrderStatus.PENDING]: 'Oczekujące',
  [TransportOrderStatus.CONFIRMED]: 'Potwierdzone',
  [TransportOrderStatus.TO_PICK_UP]: 'W drodze po rower',
  [TransportOrderStatus.PICKED_UP]: 'Odebrane',
  [TransportOrderStatus.ON_THE_WAY]: 'W drodze do serwisu',
  [TransportOrderStatus.DELIVERED]: 'Dostarczone do serwisu',
  [TransportOrderStatus.RETURNING]: 'W drodze powrotnej',
  [TransportOrderStatus.COMPLETED]: 'Zakończone',
  [TransportOrderStatus.CANCELLED]: 'Anulowane'
};

/**
 * Helper do pobierania listy statusów dla selectów
 */
export function getTransportOrderStatuses(): Array<{value: string, label: string}> {
  return Object.entries(TRANSPORT_ORDER_STATUS_LABELS).map(([value, label]) => ({
    value,
    label
  }));
}

// === VALIDATION ===

/**
 * Walidacja danych zamówienia transportowego
 */
export interface TransportOrderValidationError {
  field: string;
  message: string;
}

/**
 * Sprawdza czy zamówienie można edytować
 */
export function canEditOrder(order: TransportOrder): boolean {
  return order.status === TransportOrderStatus.PENDING || 
         order.status === TransportOrderStatus.CONFIRMED;
}

/**
 * Sprawdza czy zamówienie można anulować
 */
export function canCancelOrder(order: TransportOrder): boolean {
  return order.status === TransportOrderStatus.PENDING || 
         order.status === TransportOrderStatus.CONFIRMED;
}

/**
 * Sprawdza czy zamówienie jest zakończone
 */
export function isOrderCompleted(order: TransportOrder): boolean {
  return order.status === TransportOrderStatus.COMPLETED || 
         order.status === TransportOrderStatus.CANCELLED;
}

/**
 * Konwertuje TransportOrder na TransportOrderRequestDto (do edycji)
 */
export function transportOrderToRequestDto(order: TransportOrder): TransportOrderRequestDto {
  return {
    bicycles: [{
      brand: order.bicycleBrand || '',
      model: order.bicycleModel,
      additionalInfo: order.bicycleType
    }],
    email: order.clientEmail || '',
    phone: order.clientPhone || '',
    pickupDate: order.pickupDate,
    pickupStreet: order.pickupStreet || '',
    pickupBuildingNumber: order.pickupBuildingNumber || '',
    pickupApartmentNumber: order.pickupApartmentNumber,
    pickupCity: order.pickupCity || '',
    pickupPostalCode: order.pickupPostalCode || '',
    targetServiceId: order.targetServiceId || 0,
    transportPrice: order.transportPrice,
    transportNotes: order.transportNotes,
    additionalNotes: order.additionalNotes
  };
}