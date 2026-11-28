import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-reservation-stepper',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './reservation-stepper.component.html',
  styleUrls: ['./reservation-stepper.component.css']
})
export class ReservationStepperComponent {
  @Input() currentStep = 1;
  @Input() labels: string[] = ['Dane rezerwacji', 'Podsumowanie i wysyłka'];
  /** Kliknięcie ukończonego kroku — cofa do niego. */
  @Output() stepSelected = new EventEmitter<number>();

  get steps(): number[] {
    return this.labels.map((_, i) => i + 1);
  }

  isCompleted(step: number): boolean {
    return this.currentStep > step;
  }

  isActive(step: number): boolean {
    return this.currentStep === step;
  }

  select(step: number): void {
    if (this.isCompleted(step)) this.stepSelected.emit(step);
  }
}
