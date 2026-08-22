import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { AdminService } from '../admin-service';
import { NotificationService } from '../../core/notification.service';
import { CouponDto } from '../../shared/models/coupon.model';

@Component({
  selector: 'app-admin-coupons',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './admin-coupons.component.html',
  styleUrls: ['./admin-coupons.component.css']
})
export class AdminCouponsComponent implements OnInit {
  private fb = inject(FormBuilder);
  private router = inject(Router);
  private adminService = inject(AdminService);
  private notificationService = inject(NotificationService);

  loading = true;
  saving = false;
  error: string | null = null;

  coupons: CouponDto[] = [];
  selectedCoupon: CouponDto | null = null;
  isEditing = false;
  isAddingNew = false;

  form: FormGroup = this.fb.group({
    couponCode: ['', Validators.required],
    scope: ['OBA', Validators.required],
    discountType: ['PERCENTAGE', Validators.required],
    discountTarget: ['FIRST_UNIT', Validators.required],
    percentageValue: [null as number | null],
    fixedAmountValue: [null as number | null],
    expirationDate: ['', Validators.required],
    usageLimit: [null as number | null],
    active: [true]
  });

  ngOnInit(): void {
    this.loadCoupons();
  }

  private loadCoupons(): void {
    this.loading = true;
    this.error = null;
    this.adminService.getAllCoupons().subscribe({
      next: (coupons) => {
        this.coupons = coupons;
        this.loading = false;
      },
      error: () => {
        this.error = 'Nie udało się załadować listy kuponów.';
        this.loading = false;
      }
    });
  }

  get activeCoupons(): CouponDto[] {
    return this.coupons.filter(c => c.active);
  }

  get inactiveCoupons(): CouponDto[] {
    return this.coupons.filter(c => !c.active);
  }

  get isPercentage(): boolean {
    return this.form.get('discountType')?.value === 'PERCENTAGE';
  }

  selectCoupon(coupon: CouponDto): void {
    this.selectedCoupon = coupon;
    this.isEditing = false;
    this.isAddingNew = false;
  }

  startAddingNew(): void {
    this.selectedCoupon = null;
    this.isEditing = false;
    this.isAddingNew = true;
    this.form.reset({
      scope: 'OBA',
      discountType: 'PERCENTAGE',
      discountTarget: 'FIRST_UNIT',
      active: true
    });
  }

  startEditing(): void {
    if (!this.selectedCoupon) return;
    this.isEditing = true;
    this.isAddingNew = false;
    this.form.patchValue({
      couponCode: this.selectedCoupon.couponCode,
      scope: this.selectedCoupon.scope,
      discountType: this.selectedCoupon.discountType,
      discountTarget: this.selectedCoupon.discountTarget,
      percentageValue: this.selectedCoupon.percentageValue,
      fixedAmountValue: this.selectedCoupon.fixedAmountValue,
      expirationDate: this.selectedCoupon.expirationDate,
      usageLimit: this.selectedCoupon.usageLimit,
      active: this.selectedCoupon.active
    });
  }

  cancelEdit(): void {
    this.isEditing = false;
    this.isAddingNew = false;
  }

  save(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      this.notificationService.warning('Wypełnij wymagane pola.');
      return;
    }

    this.saving = true;
    const value = this.form.value;
    const dto: Omit<CouponDto, 'id' | 'usageCount'> = {
      couponCode: value.couponCode,
      scope: value.scope,
      discountType: value.discountType,
      discountTarget: value.discountTarget,
      percentageValue: value.discountType === 'PERCENTAGE' && value.percentageValue !== ''
        ? Number(value.percentageValue) : null,
      fixedAmountValue: value.discountType === 'FIXED_AMOUNT' && value.fixedAmountValue !== ''
        ? Number(value.fixedAmountValue) : null,
      expirationDate: value.expirationDate,
      usageLimit: value.usageLimit != null && value.usageLimit !== '' ? Number(value.usageLimit) : null,
      active: value.active
    };

    if (this.isAddingNew) {
      this.adminService.createCoupon(dto).subscribe({
        next: (res) => {
          this.notificationService.success('Kupon został dodany.');
          this.saving = false;
          this.isAddingNew = false;
          this.selectedCoupon = res.coupon;
          this.loadCoupons();
        },
        error: (err) => {
          this.notificationService.error(err.error?.message || 'Błąd podczas dodawania kuponu.');
          this.saving = false;
        }
      });
    } else if (this.isEditing && this.selectedCoupon) {
      this.adminService.updateCoupon(this.selectedCoupon.id, dto).subscribe({
        next: (res) => {
          this.notificationService.success('Kupon został zaktualizowany.');
          this.saving = false;
          this.isEditing = false;
          this.selectedCoupon = res.coupon;
          this.loadCoupons();
        },
        error: (err) => {
          this.notificationService.error(err.error?.message || 'Błąd podczas aktualizacji kuponu.');
          this.saving = false;
        }
      });
    }
  }

  deleteCoupon(id: number): void {
    if (!confirm('Czy na pewno chcesz usunąć ten kupon? Operacja jest nieodwracalna.')) return;
    this.adminService.deleteCoupon(id).subscribe({
      next: () => {
        this.notificationService.success('Kupon został usunięty.');
        if (this.selectedCoupon?.id === id) {
          this.selectedCoupon = null;
        }
        this.loadCoupons();
      },
      error: () => {
        this.notificationService.error('Nie udało się usunąć kuponu.');
      }
    });
  }

  isFieldInvalid(field: string): boolean {
    const control = this.form.get(field);
    return control ? control.invalid && (control.dirty || control.touched) : false;
  }

  goBack(): void {
    this.router.navigate(['/admin-dashboard']);
  }
}
