import { Component, Inject, PLATFORM_ID } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-home-hero',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <div class="hero-section">
      <!-- Użycie *ngIf="isBrowser" dla obrazu -->
      <img *ngIf="isBrowser" 
           src="assets/images/home-image.jpg" 
           alt="CycloPick Home Image" 
           class="hero-image" 
           onerror="this.src='https://placehold.co/1600x500/57BCD8/FFFFFF?text=CycloPick+Serwis+Rowerowy'">
      
      <!-- Fallback dla SSR -->
      <div *ngIf="!isBrowser" class="hero-image-placeholder">
        CycloPick Serwis Rowerowy
      </div>
      
      <!-- Nakładka na zdjęcie z tekstem i przyciskami -->
      <div class="hero-overlay">
        <div class="hero-content">
          <h1 class="hero-title">CycloPick.pl</h1>
          <p class="hero-subtitle">Odbieramy, naprawiamy, odwozimy</p>
          <p class="hero-description">Serwis rowerowy najbliżej Ciebie</p>
          <div class="hero-buttons">
            <button type="button" class="hero-btn learn-more-btn" (click)="scrollToSection('how-it-works')">
              Dowiedz się więcej
            </button>
            <button type="button" class="hero-btn order-btn" (click)="scrollToSection('order-form')">
              Zamów serwis
            </button>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .hero-section {
      width: 100%;
      margin-top: 0;
      position: relative;
      overflow: hidden;
      z-index: 1;
      display: block;
      line-height: 0;
    }
    
    .hero-image {
      width: 100%;
      height: 600px;
      display: block;
      object-fit: cover;
      object-position: center 20%;
      vertical-align: top;
      margin: 0;
      padding: 0;
      filter: brightness(0.8);
    }
    
    /* Placeholder dla SSR */
    .hero-image-placeholder {
      width: 100%;
      height: 600px;
      display: flex;
      align-items: center;
      justify-content: center;
      background-color: #57BCD8;
      color: #FFFFFF;
      font-size: 2rem;
      font-weight: bold;
      text-align: center;
      filter: brightness(0.8);
    }
    
    .hero-overlay {
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background-color: rgba(0, 0, 0, 0.5);
      display: flex;
      align-items: center;
      justify-content: center;
      text-align: center;
      padding: 20px;
    }
    
    .hero-content {
      max-width: 800px;
      color: white;
    }
    
    .hero-title {
      font-size: 4.5rem;
      font-weight: bold;
      margin-bottom: 30px;
      text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.5);
      letter-spacing: 1px;
    }
    
    .hero-subtitle {
      font-size: 1.8rem;
      margin-bottom: 15px;
      text-shadow: 1px 1px 2px rgba(0, 0, 0, 0.5);
      font-weight: 400;
      line-height: 1.4;
    }
    
    .hero-description {
      font-size: 1.3rem;
      margin-bottom: 35px;
      text-shadow: 1px 1px 2px rgba(0, 0, 0, 0.5);
      font-weight: 300;
      font-style: italic;
    }
    
    .hero-buttons {
      display: flex;
      justify-content: center;
      gap: 20px;
    }
    
    .hero-btn {
      padding: 12px 24px;
      font-size: 1.1rem;
      border-radius: 30px;
      font-weight: 500;
      cursor: pointer;
      transition: all 0.3s;
      border: none;
      box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
    }
    
    .learn-more-btn {
      background-color: transparent;
      color: white;
      border: 2px solid white;
    }
    
    .learn-more-btn:hover {
      background-color: rgba(255, 255, 255, 0.1);
      transform: translateY(-3px);
      box-shadow: 0 6px 8px rgba(0, 0, 0, 0.2);
    }
    
    .order-btn {
      background-color: #3498db;
      color: white;
    }
    
    .order-btn:hover {
      background-color: #2980b9;
      transform: translateY(-3px);
      box-shadow: 0 6px 8px rgba(0, 0, 0, 0.2);
    }
    
    /* Responsive styles */
    @media screen and (max-width: 768px) {
      .hero-title {
        font-size: 3rem;
        margin-bottom: 20px;
      }
      
      .hero-subtitle {
        font-size: 1.4rem;
        margin-bottom: 10px;
      }
      
      .hero-description {
        font-size: 1.1rem;
        margin-bottom: 25px;
      }
      
      .hero-buttons {
        flex-direction: column;
        gap: 15px;
      }
      
      .hero-btn {
        width: 100%;
      }
    }
    
    @media screen and (max-width: 480px) {
      .hero-title {
        font-size: 2.5rem;
      }
      
      .hero-subtitle {
        font-size: 1.2rem;
      }
      
      .hero-description {
        font-size: 1rem;
      }
    }
  `]
})
export class HomeHeroComponent {
  // Flaga do sprawdzania środowiska
  isBrowser: boolean;

  constructor(@Inject(PLATFORM_ID) private platformId: Object) {
    this.isBrowser = isPlatformBrowser(platformId);
  }

  // Method to scroll to a section with ID - działa tylko w przeglądarce
  scrollToSection(sectionId: string): void {
    if (this.isBrowser) {
      const element = document.getElementById(sectionId);
      if (element) {
        // Add offset to account for navbar and other elements
        const offset = 80; 
        const elementPosition = element.getBoundingClientRect().top;
        const offsetPosition = elementPosition + window.pageYOffset - offset;
        
        window.scrollTo({
          top: offsetPosition,
          behavior: 'smooth'
        });
      }
    }
  }
}