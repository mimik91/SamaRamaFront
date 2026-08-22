export interface ReviewContext {
  bikeServiceName: string;
  alreadySubmitted: boolean;
}

export interface SubmitReviewRequest {
  courteousService: boolean;
  priceWasKnownUpfront: boolean;
  turnaroundAcceptable: boolean;
  issueResolved: boolean;
  communicationClear: boolean;
  overallRating: number;
  comment: string | null;
}
