export type PaymentOrderType = 'TRANSPORT' | 'RESERVATION' | 'SERVICE_ORDER';

export type PaymentStatus = 'SUCCESS' | 'CANCELED' | 'PENDING' | 'ERROR';

export interface PaymentStatusResponse {
  status: PaymentStatus;
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
