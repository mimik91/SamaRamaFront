import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { NotificationsComponent } from './core/notifications.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, NotificationsComponent],
  template: `
    <app-notifications></app-notifications>
    <router-outlet></router-outlet>
  `
})
export class AppComponent {
  title = 'SamaRama';
}