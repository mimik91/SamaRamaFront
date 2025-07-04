import { Component, OnInit, ViewChild } from '@angular/core';
import { RouterOutlet, Router, NavigationEnd } from '@angular/router';
import { filter } from 'rxjs/operators';
import { NotificationsComponent } from './core/notifications.component';
import { NavigationComponent } from './core/navigation/navigation.component';

// 🔹 Dodajemy deklarację funkcji gtag
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

  constructor(private router: Router) {}

  ngOnInit() {
    this.router.events.pipe(
      filter(event => event instanceof NavigationEnd)
    ).subscribe((event: NavigationEnd) => {
      // 🔹 Zamykamy menu mobilne po każdej nawigacji
      if (this.navigationComponent) {
        this.navigationComponent.closeMobileMenu();
      }

      // 🔹 Wysyłamy informację do Google Analytics o zmianie trasy
      gtag('config', 'G-9ZYH1T3NCJ', {
        page_path: event.urlAfterRedirects
      });
    });
  }
}