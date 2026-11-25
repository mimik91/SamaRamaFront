export type PaymentOrderType = 'TRANSPORT' | 'RESERVATION' | 'SERVICE_ORDER' | 'REPAIR_PLAN';

export type PaymentStatus = 'SUCCESS' | 'CANCELED' | 'PENDING' | 'ERROR';

export interface PaymentStatusResponse {
  status: PaymentStatus;
  /** Rodzaj płatności po stronie backendu (gdy znany) — pozwala rozpoznać dopłatę bez zapisu w sessionStorage */
  orderType?: PaymentOrderType;
}

export interface InitiatePaymentRequest {
  orderType: PaymentOrderType;
  orderData: Record<string, unknown>;
}

export interface InitiatePaymentResponse {
  redirectUrl: string;
  payuOrderId: string;
}

export interface PaymentNavigationState {
  orderType: PaymentOrderType;
  orderData: Record<string, unknown>;
  totalPrice: number;
  bikeCount?: number;
}
