import { Component, EventEmitter, inject, Input, OnInit, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { ServiceRecord } from '../../../../service-records/service-record.model';
import { ServiceRecordService } from '../../../../service-records/service-record.service';
import { isKrakowCity, normalizeCityName } from '../../../../shared/utils/city.util';
import { environment } from '../../../../environments/environments';

@Component({
  selector: 'app-book-service-modal',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './book-service-modal.component.html',
  styleUrls: ['./book-service-modal.component.css']
})
export class BookServiceModalComponent implements OnInit {
  @Input({ required: true }) bicycleId!: number;
  @Output() close = new EventEmitter<void>();

  private serviceRecordService = inject(ServiceRecordService);
  private router = inject(Router);

  loading = true;
  lastRecord: ServiceRecord | null = null;

  ngOnInit(): void {
    this.serviceRecordService.getBicycleServiceRecords(this.bicycleId).subscribe({
      next: (records) => {
        this.lastRecord = records[0] ?? null;
        this.loading = false;
      },
      error: () => {
        this.lastRecord = null;
        this.loading = false;
      }
    });
  }

  get wasExpress(): boolean {
    return !!this.lastRecord?.wasExpress;
  }

  get expressAvailable(): boolean {
    return isKrakowCity(this.lastRecord?.city);
  }

  get showLastServiceOption(): boolean {
    // suffix bywa puste, gdy warsztat z ostatniego serwisu został od tego czasu usunięty z platformy
    // (patrz IndividualUserController — join do BikeServiceRegistered po prostu nic nie zwraca) —
    // bez tego warunku przycisk by się pokazywał, ale klik nic by nie robił (chooseLastService go i tak wycisza).
    return !!this.lastRecord && !this.wasExpress && !!this.lastRecord.suffix;
  }

  get showExpressOption(): boolean {
    if (!this.lastRecord) return false;
    return this.wasExpress || this.expressAvailable;
  }

  get hasNoHistory(): boolean {
    return !this.loading && !this.lastRecord;
  }

  onClose(): void {
    this.close.emit();
  }

  chooseExpress(): void {
    this.router.navigate(['/krakow/zarezerwuj'], { state: { bicycleId: this.bicycleId } });
  }

  chooseLastService(): void {
    if (!this.lastRecord?.suffix) return;
    this.router.navigate(['/', this.lastRecord.suffix, 'zarezerwuj'], { state: { bicycleId: this.bicycleId } });
  }

  chooseOwnPick(): void {
    const citySlug = this.resolveCitySlug(this.lastRecord?.city);
    if (citySlug) {
      this.router.navigate(['/serwisy', citySlug]);
    } else {
      this.router.navigate(['/serwisy']);
    }
  }

  private resolveCitySlug(city: string | null | undefined): string | null {
    if (!city) return null;
    const match = environment.settings.seoCities.find(c => normalizeCityName(c.name) === normalizeCityName(city));
    return match?.slug ?? null;
  }
}
