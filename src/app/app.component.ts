import { Component, OnInit, ViewChild } from '@angular/core';
import { RouterOutlet, Router, NavigationEnd } from '@angular/router';
import { filter } from 'rxjs/operators';
import { NotificationsComponent } from './core/notifications.component';
import { NavigationComponent } from './core/navigation/navigation.component';

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
  title = 'SamaRama';
  @ViewChild('navigation') navigationComponent!: NavigationComponent;

  constructor(private router: Router) {}

  ngOnInit() {
    // Zamykaj menu mobilne po każdej nawigacji
    this.router.events.pipe(
      filter(event => event instanceof NavigationEnd)
    ).subscribe(() => {
      if (this.navigationComponent) {
        this.navigationComponent.closeMobileMenu();
      }
    });
  }
}