import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';

@Component({
  selector: 'app-welcome-page',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="welcome-container">
      <h1>Witamy w środku</h1>
    </div>
  `,
  styles: [`
    .welcome-container {
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
export class WelcomePage implements OnInit {
  constructor(private router: Router) {}

  ngOnInit() {
    console.log('Welcome page initialized');
  }
}