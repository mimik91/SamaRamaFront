import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { NotificationsComponent } from './core/notifications.component';
import { NavigationComponent } from './core/navigation/navigation.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, NotificationsComponent, NavigationComponent],
  template: `
    <app-navigation></app-navigation>
    <div class="content-container">
      <app-notifications></app-notifications>
      <router-outlet></router-outlet>
    </div>
  `,
  styles: [`
    .content-container {
      padding-top: 60px; /* Match the height of the navbar */
    }
  `]
})
export class AppComponent {
  title = 'SamaRama';
}