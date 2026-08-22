export interface ItemDto {
  name: string;
  quantity: number;
  price: number;
}

export interface RepairPlanItemDto {
  name: string;
  price: number;
}

export interface RepairPlanSummaryDto {
  packageName: string | null;
  items: RepairPlanItemDto[];
  totalPrice: number;
  status: 'DRAFT' | 'SENT_TO_CLIENT' | 'ACCEPTED' | 'REJECTED';
}

export interface ReviewSummaryDto {
  totalScore: number;
  comment: string | null;
}

export interface ServiceRecord {
  id: number;
  serviceDate: string;
  serviceName: string;
  suffix?: string | null;
  items: ItemDto[];
  totalPrice: number;
  orderNotes?: string;
  serviceNotes?: string;
  maintenanceAdvice?: string;
  recommendedRepairs?: string;
  repairPlan?: RepairPlanSummaryDto | null;
  actualDurationHours?: number | null;
  review?: ReviewSummaryDto | null;
}
