import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, catchError, throwError } from 'rxjs';
import { environment } from '../../environments/environments';
import { ReviewContext, SubmitReviewRequest } from '../models/review.model';

@Injectable({ providedIn: 'root' })
export class ReviewService {
  private http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiUrl}${environment.endpoints.reviews}`;

  getContext(token: string): Observable<ReviewContext> {
    return this.http.get<ReviewContext>(`${this.baseUrl}/${token}`).pipe(
      catchError(error => {
        console.error('Error fetching review context:', error);
        return throwError(() => error);
      })
    );
  }

  submitReview(token: string, payload: SubmitReviewRequest): Observable<{ message: string }> {
    return this.http.post<{ message: string }>(`${this.baseUrl}/${token}`, payload).pipe(
      catchError(error => {
        console.error('Error submitting review:', error);
        return throwError(() => error);
      })
    );
  }
}
