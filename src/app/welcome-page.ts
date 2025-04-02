import { Component, OnInit, PLATFORM_ID, inject } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { Router } from '@angular/router';

@Component({
  selector: 'app-welcome-page',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="welcome-container">
      <h1>Witamy w środku</h1>
      <div class="map-container">
        <!-- iFrame version - much simpler, no need for additional libraries -->
        <iframe 
          width="100%" 
          height="100%" 
          frameborder="0" 
          scrolling="no" 
          marginheight="0" 
          marginwidth="0" 
          src="https://www.openstreetmap.org/export/embed.html?bbox=19.90364624023438%2C50.04937360424024%2C20.010719299316403%2C50.109624273399845&amp;layer=mapnik&amp;marker=50.03951594382469%2C19.95218276977539"
        >
    </iframe>
      </div>
    </div>
  `,
  styles: [`
    .welcome-container {
      display: flex;
      flex-direction: column;
      align-items: center;
      min-height: 100vh;
      font-family: Arial, sans-serif;
      background-color: #f5f5f5;
      padding: 20px;
    }
    
    h1 {
      font-size: 2.5rem;
      color: #333;
      text-align: center;
      padding: 1rem;
      margin-bottom: 20px;
    }

    .map-container {
      width: 40%;
      height: 500px;
      border-radius: 8px;
      overflow: hidden;
      box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
      margin-bottom: 30px;
    }
    
    @media (max-width: 768px) {
      .map-container {
        width: 80%;
      }
    }
  `]
})
export class WelcomePage implements OnInit {
  private platformId = inject(PLATFORM_ID);
  
  constructor() {}

  ngOnInit() {
    if (isPlatformBrowser(this.platformId)) {
      console.log('Welcome page initialized in browser');
    } else {
      console.log('Welcome page initialized on server');
    }
  }
}