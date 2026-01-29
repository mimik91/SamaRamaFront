import { bootstrapApplication } from '@angular/platform-browser';
import { AppComponent } from './app/app.component';
import { appConfig } from './app/app.config';
import { initKlaro } from './klaro-config';

bootstrapApplication(AppComponent, appConfig)
  .then(() => {
    initKlaro();
  })
  .catch((err) => console.error(err));
