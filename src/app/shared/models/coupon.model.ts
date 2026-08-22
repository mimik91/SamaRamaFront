export type CouponScope = 'TRANSPORT' | 'SERWIS' | 'OBA';
export type DiscountType = 'PERCENTAGE' | 'FIXED_AMOUNT';
export type DiscountTarget = 'FIRST_UNIT' | 'WHOLE_ORDER';

export interface CouponDto {
  id: number;
  couponCode: string;
  scope: CouponScope;
  discountType: DiscountType;
  discountTarget: DiscountTarget;
  percentageValue: number | null;
  fixedAmountValue: number | null;
  expirationDate: string;
  usageCount: number;
  usageLimit: number | null;
  active: boolean;
}
