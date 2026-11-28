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
  /** Brak dla zamówienia za 0 zł (np. po kuponie) — kończy się bez PayU */
  payuOrderId?: string;
}

/** Dane tylko do wyświetlenia na ekranie potwierdzenia — kwotę i zawartość zamówienia i tak wylicza backend. */
export interface PaymentSummaryDetails {
  /** Serwis, w którym zostanie zarezerwowana wizyta (zwykła rezerwacja z płatnym transportem). */
  serviceName?: string;
  packageName?: string;
  packagePrice?: number;
  plannedDate?: string;
  pickupDate?: string;
  pickupPlace?: string;
  bikes?: string[];
  discountCoupon?: string;
}

/** Formularz, do którego można wrócić z podsumowania płatności (z zapamiętanymi polami). */
export interface PaymentReturnTarget {
  /** Wewnętrzna ścieżka aplikacji, np. '/krakow/zarezerwuj'. */
  url: string;
  label?: string;
}

export interface PaymentNavigationState {
  orderType: PaymentOrderType;
  orderData: Record<string, unknown>;
  totalPrice: number;
  bikeCount?: number;
  details?: PaymentSummaryDetails;
  returnTo?: PaymentReturnTarget;
}
