import { PricelistItemDto } from './service-pricelist.models';

export interface PricelistSuggestionSubmissionDto {
  bikeServiceId: number;
  bikeServiceName: string;
  proposedPrice: number;
  submittedAt: string;
}

export interface PricelistSuggestionDto {
  id: number;
  originalName: string;
  createdAt: string;
  submissions: PricelistSuggestionSubmissionDto[];
  similarItems: PricelistItemDto[];
}

export interface ApprovePricelistSuggestionRequest {
  finalName: string;
  categoryId: number;
}
