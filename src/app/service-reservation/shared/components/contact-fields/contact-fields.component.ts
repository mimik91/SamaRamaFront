import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormGroup, ReactiveFormsModule } from '@angular/forms';

/** Karta „Dane kontaktowe" (imię, nazwisko, e-mail, telefon) — niewidoczna dla zalogowanego klienta. */
@Component({
  selector: 'app-contact-fields',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './contact-fields.component.html',
  styleUrls: ['../../reservation-form.shared.css']
})
export class ContactFieldsComponent {
  @Input({ required: true }) form!: FormGroup;
  /** Numer karty w nagłówku. */
  @Input() cardNumber: number | null = null;

  isInvalid(field: string): boolean {
    const f = this.form.get(field);
    return !!(f?.invalid && (f.dirty || f.touched));
  }
}
