import { Component, OnInit, ViewChild, Inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { RouterOutlet, Router, NavigationEnd } from '@angular/router';
import { filter } from 'rxjs/operators';
import { NotificationsComponent } from './core/notifications.component';
import { NavigationComponent } from './core/navigation/navigation.component';
import { SeoService } from './core/seo.service';

declare let gtag: Function;

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, NotificationsComponent, NavigationComponent],
  template: `
    <app-navigation #navigation></app-navigation>
    <div class="content-container">
      <app-notifications></app-notifications>
      <router-outlet></router-outlet>
    </div>
  `,
  styles: [`
    .content-container {
      padding-top: 60px; 
    }
  `]
})
export class AppComponent implements OnInit {
  title = 'CycloPick';
  @ViewChild('navigation') navigationComponent!: NavigationComponent;

  // 🔹 2. Wstrzyknięcie SeoService w konstruktorze
  constructor(
    private router: Router,
    private seoService: SeoService,
    @Inject(PLATFORM_ID) private platformId: Object
  ) {}

  ngOnInit() {
    this.router.events.pipe(
      filter(event => event instanceof NavigationEnd)
    ).subscribe((event: NavigationEnd) => {
      
      // 🔹 3. Aktualizacja linku kanonicznego po każdej nawigacji
      this.seoService.updateSeoTags(event.urlAfterRedirects);

      // Zamykamy menu mobilne
      if (this.navigationComponent) {
        this.navigationComponent.closeMobileMenu();
      }

      // Google Analytics — gtag istnieje tylko w przeglądarce (ładowany przez <script> w index.html),
      // na serwerze (SSR/prerender) nie istnieje.
      if (isPlatformBrowser(this.platformId) && typeof gtag === 'function') {
        gtag('config', 'G-9ZYH1T3NCJ', {
          page_path: event.urlAfterRedirects
        });
      }
    });
  }
}