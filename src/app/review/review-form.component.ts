import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { ReviewService } from '../shared/services/review.service';
import { NotificationService } from '../core/notification.service';
import { ReviewContext } from '../shared/models/review.model';

type ReviewPageState = 'loading' | 'form' | 'alreadySubmitted' | 'invalid' | 'success';

@Component({
  selector: 'app-review-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './review-form.component.html',
  styleUrls: ['./review-form.component.css']
})
export class ReviewFormComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private reviewService = inject(ReviewService);
  private notificationService = inject(NotificationService);
  private fb = inject(FormBuilder);

  state: ReviewPageState = 'loading';
  context: ReviewContext | null = null;
  submitting = false;
  private token: string | null = null;

  readonly stars = [1, 2, 3, 4, 5];

  form: FormGroup = this.fb.group({
    courteousService: [null, Validators.required],
    priceWasKnownUpfront: [null, Validators.required],
    turnaroundAcceptable: [null, Validators.required],
    issueResolved: [null, Validators.required],
    overallRating: [0, [Validators.required, Validators.min(1)]],
    comment: ['']
  });

  ngOnInit(): void {
    this.token = this.route.snapshot.queryParamMap.get('token');
    if (!this.token) {
      this.state = 'invalid';
      return;
    }

    this.reviewService.getContext(this.token).subscribe({
      next: (context) => {
        this.context = context;
        this.state = context.alreadySubmitted ? 'alreadySubmitted' : 'form';
      },
      error: () => {
        this.state = 'invalid';
      }
    });
  }

  setRating(value: number): void {
    this.form.get('overallRating')?.setValue(value);
  }

  isFieldInvalid(field: string): boolean {
    const control = this.form.get(field);
    return !!(control?.invalid && (control.dirty || control.touched));
  }

  submit(): void {
    if (this.form.invalid || !this.token) {
      this.form.markAllAsTouched();
      this.notificationService.warning('Odpowiedz na wszystkie pytania przed wysłaniem.');
      return;
    }

    this.submitting = true;
    const value = this.form.value;

    this.reviewService.submitReview(this.token, {
      courteousService: value.courteousService,
      priceWasKnownUpfront: value.priceWasKnownUpfront,
      turnaroundAcceptable: value.turnaroundAcceptable,
      issueResolved: value.issueResolved,
      overallRating: value.overallRating,
      comment: value.comment?.trim() || null
    }).subscribe({
      next: () => {
        this.state = 'success';
        this.submitting = false;
      },
      error: (err) => {
        this.submitting = false;
        if (err.status === 409) {
          this.state = 'alreadySubmitted';
          return;
        }
        this.notificationService.error(err.error?.message || 'Nie udało się wysłać opinii. Spróbuj ponownie.');
      }
    });
  }
}
