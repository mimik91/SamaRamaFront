import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';

@Component({
  selector: 'app-terms-of-service',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="terms-container">
      <div class="terms-header">
        <h1>Regulamin Serwisu</h1>
        <button class="back-btn" (click)="goBack()">← Powrót</button>
      </div>
      
      <div class="terms-content">
        <p class="placeholder-text">Tu będzie regulamin</p>
      </div>
    </div>
  `,
  styles: [`
    .terms-container {
      max-width: 800px;
      margin: 0 auto;
      padding: 30px 20px;
      min-height: 100vh;
      background-color: #f8f9fa;
    }

    .terms-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 30px;
      padding-bottom: 20px;
      border-bottom: 2px solid #007bff;
    }

    h1 {
      color: #333;
      margin: 0;
      font-size: 2rem;
    }

    .back-btn {
      padding: 10px 20px;
      background-color: #6c757d;
      color: white;
      border: none;
      border-radius: 4px;
      cursor: pointer;
      font-weight: 500;
      transition: background-color 0.2s;
    }

    .back-btn:hover {
      background-color: #5a6268;
    }

    .terms-content {
      background-color: white;
      padding: 40px;
      border-radius: 8px;
      box-shadow: 0 2px 10px rgba(0,0,0,0.1);
      min-height: 400px;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .placeholder-text {
      font-size: 1.2rem;
      color: #6c757d;
      text-align: center;
      font-style: italic;
      margin: 0;
    }

    @media (max-width: 768px) {
      .terms-header {
        flex-direction: column;
        gap: 15px;
        text-align: center;
      }

      h1 {
        font-size: 1.5rem;
      }

      .terms-content {
        padding: 20px;
      }
    }
  `]
})
export class TermsOfServiceComponent {
  constructor(private router: Router) {}

  goBack(): void {
    window.history.back();
  }
}