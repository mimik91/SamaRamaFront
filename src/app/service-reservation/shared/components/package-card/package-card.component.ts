import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';

/** Karta pakietu serwisowego: pozycja cennika (tylko podgląd) albo wybieralna opcja. */
@Component({
  selector: 'app-package-card',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './package-card.component.html',
  styleUrls: ['./package-card.component.css']
})
export class PackageCardComponent {
  @Input({ required: true }) title = '';
  @Input() description: string | null = null;
  @Input({ required: true }) price = 0;
  @Input() selectable = false;
  @Input() selected = false;
  @Output() picked = new EventEmitter<void>();

  onClick(): void {
    if (this.selectable) this.picked.emit();
  }
}
