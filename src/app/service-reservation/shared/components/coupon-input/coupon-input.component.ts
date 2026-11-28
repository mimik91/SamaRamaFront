import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormControl, ReactiveFormsModule } from '@angular/forms';

/** Pole kuponu rabatowego — sam interfejs; cenę przelicza powłoka po evencie `apply`. */
@Component({
  selector: 'app-coupon-input',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './coupon-input.component.html',
  styleUrls: ['../../reservation-form.shared.css', './coupon-input.component.css']
})
export class CouponInputComponent {
  @Input({ required: true }) control!: FormControl<string | null>;
  @Input() applying = false;
  @Input() message: string | null = null;
  @Input() invalid = false;
  @Output() apply = new EventEmitter<void>();
}
