// src/app/service-panel/service-panel.component.ts
import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-service-panel',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="service-panel-container">
      <h1>Witaj w swoim serwisie</h1>
    </div>
  `,
  styles: [`
    .service-panel-container {
      display: flex;
      justify-content: center;
      align-items: center;
      height: 100vh;
      font-family: Arial, sans-serif;
      background-color: #f5f5f5;
    }
    
    h1 {
      font-size: 2.5rem;
      color: #333;
      text-align: center;
      padding: 2rem;
      background-color: white;
      border-radius: 8px;
      box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
    }
  `]
})
export class ServicePanelComponent {}