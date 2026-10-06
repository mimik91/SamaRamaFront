export interface BicycleHistoryItemDto {
  name: string;
  categoryName: string | null;
  price: number;
  quantity: number;
  subtotal: number;
}

export interface BicycleHistoryRepairPlanItemDto {
  name: string;
  price: number;
  type: 'PART' | 'SERVICE';
}

export interface BicycleHistoryRepairPlanDto {
  packageName: string | null;
  items: BicycleHistoryRepairPlanItemDto[];
  totalPrice: number;
  status: 'DRAFT' | 'SENT_TO_CLIENT' | 'ACCEPTED' | 'REJECTED';
}

export interface BicycleHistoryReviewDto {
  totalScore: number;
  comment: string | null;
}

/**
 * Wpis historii roweru widziany z perspektywy serwisu — analogiczny do klienckiego ServiceRecord,
 * ale scoped tylko do własnego serwisu (patrz PLANNED_CHANGES.md, wpis nr 2) i z dodatkowym
 * serviceOrderId, potrzebnym do dociągnięcia wątku wiadomości per wpis.
 */
export interface BicycleHistoryRecordDto {
  id: number;
  serviceDate: string;
  serviceOrderId: number | null;
  bicycleBrand: string | null;
  bicycleModel: string | null;
  bicycleFrameNumber: string | null;
  clientFirstName: string | null;
  clientLastName: string | null;
  clientEmail: string | null;
  clientPhone: string | null;
  items: BicycleHistoryItemDto[];
  totalPrice: number | null;
  orderNotes: string | null;
  serviceNotes: string | null;
  maintenanceAdvice: string | null;
  recommendedRepairs: string | null;
  repairPlan: BicycleHistoryRepairPlanDto | null;
  actualDurationHours: number | null;
  review: BicycleHistoryReviewDto | null;
}
