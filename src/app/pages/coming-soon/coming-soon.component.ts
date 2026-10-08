import { ChangeDetectionStrategy, Component, OnInit, inject } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { Meta } from '@angular/platform-browser';

/** Prosta strona "w przygotowaniu" dla podstron, które jeszcze nie istnieją. Nagłówek z `route.data.heading`. */
@Component({
  selector: 'app-coming-soon',
  standalone: true,
  imports: [RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section class="coming-soon">
      <h1>{{ heading }}</h1>
      <p>Ta funkcja jest w przygotowaniu. Wkrótce dodamy tu więcej informacji.</p>
      <a routerLink="/" class="coming-soon-link">Wróć na stronę główną</a>
    </section>
  `,
  styles: [`
    .coming-soon {
      max-width: 640px;
      margin: 0 auto;
      padding: var(--spacing-16) var(--spacing-4);
      text-align: center;
    }
    h1 {
      font-size: var(--font-size-display-2);
      color: var(--text-dark);
      margin: 0 0 var(--spacing-4);
    }
    p {
      color: var(--text-secondary);
      font-size: var(--font-size-lg);
      margin: 0 0 var(--spacing-6);
    }
    .coming-soon-link {
      display: inline-flex;
      align-items: center;
      min-height: 44px;
      color: var(--color-primary);
      font-weight: var(--font-weight-semibold);
    }
  `]
})
export class ComingSoonComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private meta = inject(Meta);

  heading = 'Strona w przygotowaniu';

  ngOnInit(): void {
    this.heading = this.route.snapshot.data['heading'] ?? this.heading;
    this.meta.updateTag({ name: 'robots', content: 'noindex, follow' });
  }
}
