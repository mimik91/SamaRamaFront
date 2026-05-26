export interface RepairPlanLineItem {
  pricelistItemId: number | null;
  name: string;
  price: number;
}

// ===== REQUEST =====

export interface SendRepairPlanRequest {
  requiresConfirmation: boolean;
}

export interface SaveRepairPlanRequest {
  packageId: number | null;
  packagePriceSnapshot: number | null;
  items: SaveRepairPlanItemRequest[];
  customTotal: number | null;
  notes: string | null;
}

export interface SaveRepairPlanItemRequest {
  name: string;
  price: number;
}

// ===== RESPONSE =====

export interface RepairPlanResponse {
  id: number;
  packageId: number | null;
  packageName: string | null;
  packagePriceSnapshot: number | null;
  items: RepairPlanItemResponse[];
  customTotal: number | null;
  notes: string | null;
  status: 'DRAFT' | 'SENT_TO_CLIENT' | 'ACCEPTED' | 'REJECTED';
  createdAt: string;
  updatedAt: string;
}

export interface RepairPlanItemResponse {
  id: number;
  name: string;
  price: number;
}
