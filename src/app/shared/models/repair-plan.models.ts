export type RepairPlanItemType = 'PART' | 'SERVICE';

export interface RepairPlanLineItem {
  pricelistItemId: number | null;
  /** Rozwiązana pozycja katalogu części — tylko dla type='PART', analogiczne do pricelistItemId dla usług */
  partCatalogItemId: number | null;
  name: string;
  price: number;
  type: RepairPlanItemType;
  excluded?: boolean;
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
  type: RepairPlanItemType;
  partCatalogItemId?: number | null;
  pricelistItemId?: number | null;
}

// ===== RESPONSE =====

export interface RepairPlanResponse {
  id: number;
  packageId: number | null;
  packageName: string | null;
  packageDescription: string | null;
  packagePriceSnapshot: number | null;
  packageExcluded: boolean;
  items: RepairPlanItemResponse[];
  customTotal: number | null;
  calculatedTotal: number;
  notes: string | null;
  status: 'DRAFT' | 'SENT_TO_CLIENT' | 'ACCEPTED' | 'REJECTED';
  requiresConfirmation: boolean;
  createdAt: string;
  updatedAt: string;
  /** Plan serwisu ekspresowego: pakiet opłacony przy rezerwacji, serwis nie widzi jego ceny */
  expressPlan: boolean;
  /** Plan ekspresowy: dodatki zaakceptowane przez klienta, dotychczasowe wpłaty i kwota „do zapłaty" (zwykłe plany: 0) */
  acceptedTotal: number;
  amountPaid: number;
  amountDue: number;
}

export interface RepairPlanItemResponse {
  id: number;
  name: string;
  price: number;
  type: RepairPlanItemType;
  excluded: boolean;
  partCatalogItemId: number | null;
  pricelistItemId: number | null;
}

export interface ConfirmRepairPlanRequest {
  excludedItemIds: number[];
  excludePackage: boolean;
  /** Plan ekspresowy z dopłatą: potwierdzam, ale zapłacę później */
  payLater: boolean;
}

export interface ConfirmRepairPlanResponse {
  message: string;
  plan: RepairPlanResponse;
  /** Kwota do zapłaty za dodatki po potwierdzeniu (0, gdy nic nie trzeba opłacać) */
  amountDue: number;
}
