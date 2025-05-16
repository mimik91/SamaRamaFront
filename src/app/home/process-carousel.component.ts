import { Component, OnInit, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';

interface ProcessImage {
  src: string;
  alt: string;
  caption: string;
  description: string;
}

@Component({
  selector: 'app-process-carousel',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="carousel-container">
      <!-- Strzałki nawigacyjne -->
      <button class="arrow-btn prev-btn" (click)="prevSlide()" [disabled]="activeIndex === 0">
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <polyline points="15 18 9 12 15 6"></polyline>
        </svg>
      </button>
      <button class="arrow-btn next-btn" (click)="nextSlide()" [disabled]="activeIndex >= images.length - visibleSlides">
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <polyline points="9 18 15 12 9 6"></polyline>
        </svg>
      </button>
      
      <!-- Kontener zdjęć -->
      <div class="carousel-track-wrapper">
        <div class="carousel-track" [ngStyle]="{'transform': 'translateX(-' + activeIndex * slideWidth + 'px)'}">
          <div class="carousel-slide" *ngFor="let image of images; let i = index">
            <div class="process-image">
              <img [src]="image.src" [alt]="image.alt">
              
              <div class="image-buttons">
                <button class="image-btn order-btn" (click)="scrollToOrderForm()">Zamów serwis</button>
                <button class="image-btn learn-more-btn" (click)="toggleOverlay(i)">Dowiedz się więcej</button>
              </div>
              
              <div class="image-overlay" [class.active]="activeOverlays[i]" (click)="toggleOverlay(i)">
                <p>{{image.description}}</p>
              </div>
            </div>
            <p class="image-caption">{{image.caption}}</p>
          </div>
        </div>
      </div>
      
      <!-- Wskaźniki (kropki) -->
      <div class="carousel-indicators">
        <ng-container *ngIf="!isMobile">
          <button 
            *ngFor="let i of getDotArray(); let dotIndex = index" 
            class="indicator-dot"
            [class.active]="Math.floor(activeIndex / visibleSlides) === dotIndex"
            (click)="goToDot(dotIndex)"
          ></button>
        </ng-container>
        <ng-container *ngIf="isMobile">
          <button 
            *ngFor="let image of images; let i = index" 
            class="indicator-dot"
            [class.active]="activeIndex === i"
            (click)="goToSlide(i)"
          ></button>
        </ng-container>
      </div>
    </div>
  `,
  styles: [`
    .carousel-container {
      position: relative;
      width: 100%;
      max-width: 2200px; /* Zwiększona maksymalna szerokość, aby zmieścić 6 zdjęć */
      margin: 0 auto; /* Wycentrowanie na ekranie */
      overflow: hidden;
      padding: 0 40px; /* Miejsce na strzałki */
    }
    
    /* Dodajemy wrapper dla lepszego centrowania ścieżki karuzeli */
    .carousel-track-wrapper {
      display: flex;
      justify-content: flex-start; /* Zmieniono na flex-start, aby zawsze pokazywać pierwsze zdjęcie */
      width: 100%;
      overflow: hidden;
    }
    
    /* Strzałki nawigacyjne */
    .arrow-btn {
      position: absolute;
      top: 45%;
      transform: translateY(-50%);
      width: 40px;
      height: 40px;
      background-color: rgba(52, 152, 219, 0.8);
      color: white;
      border: none;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      z-index: 10;
      transition: all 0.3s ease;
      box-shadow: 0 2px 5px rgba(0, 0, 0, 0.2);
    }
    
    .arrow-btn:hover:not([disabled]) {
      background-color: rgba(41, 128, 185, 1);
    }
    
    .arrow-btn[disabled] {
      opacity: 0.5;
      cursor: not-allowed;
    }
    
    .prev-btn {
      left: 5px;
    }
    
    .next-btn {
      right: 5px;
    }
    
    /* Kontener zdjęć */
    .carousel-track {
      display: flex;
      transition: transform 0.5s ease-in-out;
    }
    
    .carousel-slide {
      flex: 0 0 auto;
      width: 350px;
      padding: 0 5px;
      display: flex;
      flex-direction: column;
      align-items: center; /* Wycentrowanie zawartości slajdu */
    }
    
    /* Styl zdjęć z nowymi wymiarami */
    .process-image {
      position: relative;
      overflow: hidden;
      height: 525px; /* Nowa wysokość */
      width: 350px; /* Nowa szerokość */
      border-radius: 8px; /* Dodane łagodne zaokrąglenie rogów */
      box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1); /* Subtelny cień */
    }
    
    .process-image img {
      width: 100%;
      height: 100%;
      object-fit: cover;
      transition: transform 0.3s ease;
    }
    
    /* Przyciski na zdjęciach */
    .image-buttons {
      position: absolute;
      bottom: 20px;
      left: 0;
      right: 0;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      gap: 10px;
      padding: 0 20px;
      z-index: 5;
    }
    
    .image-btn {
      width: 90%;
      padding: 10px 12px;
      border-radius: 20px;
      font-size: 0.95rem;
      font-weight: 500;
      cursor: pointer;
      transition: all 0.2s;
      border: none;
      white-space: nowrap;
    }
    
    .order-btn {
      background-color: #3498db;
      color: white;
    }
    
    .order-btn:hover {
      background-color: #2980b9;
    }
    
    .learn-more-btn {
      background-color: rgba(255, 255, 255, 0.85);
      color: #2c3e50;
    }
    
    .learn-more-btn:hover {
      background-color: rgba(255, 255, 255, 1);
    }
    
    /* Nakładka z opisem */
    .image-overlay {
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background-color: rgba(0, 0, 0, 0.7);
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 25px;
      opacity: 0;
      visibility: hidden;
      transition: all 0.3s ease;
      z-index: 3;
    }
    
    .image-overlay.active {
      opacity: 1;
      visibility: visible;
    }
    
    .image-overlay p {
      color: white;
      font-size: 1.1rem;
      text-align: center;
      margin: 0;
      line-height: 1.5;
    }
    
    .image-caption {
      font-weight: 600;
      color: #2c3e50;
      margin: 10px 0 0;
      font-size: 1.2rem;
      text-align: center;
    }
    
    /* Wskaźniki (kropki) */
    .carousel-indicators {
      display: flex;
      justify-content: center;
      gap: 8px;
      margin-top: 15px;
    }
    
    .indicator-dot {
      width: 12px;
      height: 12px;
      border-radius: 50%;
      background-color: #e2e8f0;
      border: none;
      cursor: pointer;
      transition: all 0.2s;
    }
    
    .indicator-dot.active {
      background-color: #3498db;
      transform: scale(1.2);
    }
    
    /* Responsywność */
    @media screen and (max-width: 768px) {
      .carousel-container {
        padding: 0 30px;
      }
      
      .arrow-btn {
        width: 30px;
        height: 30px;
      }
      
      .arrow-btn svg {
        width: 18px;
        height: 18px;
      }
      
      .carousel-slide {
        width: 300px;
      }
      
      .process-image {
        height: 450px; /* Nieco niższa wysokość na urządzeniach mobilnych */
        width: 300px; /* Mniejsza szerokość na urządzeniach mobilnych */
      }
      
      .image-buttons {
        bottom: 15px;
      }
      
      .image-btn {
        padding: 8px 12px;
        font-size: 0.85rem;
      }
    }
    
    @media screen and (max-width: 480px) {
      .carousel-slide {
        width: 250px;
      }
      
      .process-image {
        height: 375px; /* Jeszcze niższa wysokość na małych ekranach */
        width: 250px; /* Jeszcze mniejsza szerokość na małych ekranach */
      }
      
      .image-btn {
        padding: 6px 10px;
        font-size: 0.8rem;
      }
    }
  `]
})
export class ProcessCarouselComponent implements OnInit {
  images: ProcessImage[] = [
    {
      src: '../../assets/images/jak-dzialamy/przyjmowanie-zamowienia.jpg',
      alt: 'Przyjmowanie zamówienia',
      caption: 'Przyjmujemy zamówienia',
      description: 'Szybki i prosty proces zamówienia online'
    },
    {
      src: '../../assets/images/jak-dzialamy/odbieramy.jpg',
      alt: 'Odbieramy rower',
      caption: 'Odbieramy rower od klienta',
      description: 'Bezpośrednio spod Twoich drzwi, w dogodnym terminie'
    },
    {
      src: '../../assets/images/jak-dzialamy/transport.jpg',
      alt: 'Transport roweru',
      caption: 'Zawozimy rower do serwisu',
      description: 'Bezpieczny transport do naszego profesjonalnego serwisu'
    },
    {
      src: '../../assets/images/jak-dzialamy/serwis.jpg',
      alt: 'Przegląd roweru',
      caption: 'Serwis dokonuje przeglądu roweru',
      description: 'Kompleksowa diagnostyka przez doświadczonych mechaników'
    },
    {
      src: '../../assets/images/jak-dzialamy/serwis2.jpg',
      alt: 'Serwis roweru',
      caption: 'Wykonujemy pełen serwis',
      description: 'Regulacja przerzutek i hamulców, smarowanie łańcucha, sprawdzenie opon'
    },
    {
      src: '../../assets/images/jak-dzialamy/zwrot.jpg',
      alt: 'Zwrot roweru',
      caption: 'Przywozimy rower z powrotem',
      description: 'Dostarczamy Twój rower pod same drzwi, gotowy do jazdy'
    }
  ];

  activeIndex = 0;
  visibleSlides = 6; // Domyślnie 6 widocznych slajdów na dużych ekranach
  slideWidth = 350; // Stała szerokość slajdu
  isMobile = false;
  activeOverlays: boolean[] = [];
  Math = Math; // Aby móc użyć Math w szablonie

  constructor(private router: Router) {
    // Inicjalizacja tabeli active overlays
    this.activeOverlays = new Array(this.images.length).fill(false);
  }

  ngOnInit(): void {
    this.updateScreenSize();
    console.log('Carousel initialized');
  }

  @HostListener('window:resize')
  updateScreenSize(): void {
    const width = window.innerWidth;
    
    if (width <= 480) {
      this.visibleSlides = 1;
      this.slideWidth = 250;
      this.isMobile = true;
    } else if (width <= 768) {
      this.visibleSlides = 2;
      this.slideWidth = 300;
      this.isMobile = true;
    } else if (width <= 1200) {
      this.visibleSlides = 3;
      this.slideWidth = 350;
      this.isMobile = false;
    } else if (width <= 1600) {
      this.visibleSlides = 4;
      this.slideWidth = 350;
      this.isMobile = false;
    } else {
      this.visibleSlides = 6; // 6 slajdów na największych ekranach
      this.slideWidth = 350;
      this.isMobile = false;
    }
    
    console.log(`Screen size updated: ${width}px, ${this.visibleSlides} visible slides, mobile: ${this.isMobile}`);
  }

  // Generuje tablicę z liczbą kropek odpowiadającą liczbie grup zdjęć
  getDotArray(): number[] {
    const dotCount = Math.ceil(this.images.length / this.visibleSlides);
    return Array(dotCount).fill(0).map((_, i) => i);
  }

  nextSlide(): void {
    if (this.activeIndex < this.images.length - this.visibleSlides) {
      this.activeIndex++;
      console.log(`Next slide: ${this.activeIndex}`);
    }
  }

  prevSlide(): void {
    if (this.activeIndex > 0) {
      this.activeIndex--;
      console.log(`Previous slide: ${this.activeIndex}`);
    }
  }

  goToSlide(index: number): void {
    this.activeIndex = index;
    console.log(`Go to slide: ${this.activeIndex}`);
  }

  goToDot(dotIndex: number): void {
    this.activeIndex = dotIndex * this.visibleSlides;
    if (this.activeIndex > this.images.length - this.visibleSlides) {
      this.activeIndex = this.images.length - this.visibleSlides;
    }
    console.log(`Go to dot: ${dotIndex}, slide: ${this.activeIndex}`);
  }

  toggleOverlay(index: number): void {
    this.activeOverlays[index] = !this.activeOverlays[index];
    console.log(`Toggle overlay for slide: ${index}, active: ${this.activeOverlays[index]}`);
  }

  // Metoda do przewijania do formularza zamówienia
  scrollToOrderForm(): void {
    const orderFormSection = document.getElementById('order-form');
    if (orderFormSection) {
      orderFormSection.scrollIntoView({ behavior: 'smooth' });
      console.log('Scrolling to order form');
    } else {
      // Fallback w przypadku gdy element nie zostanie znaleziony
      this.router.navigate(['/guest-order']);
      console.log('Order form not found, navigating to guest-order');
    }
  }
}