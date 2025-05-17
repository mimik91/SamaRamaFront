import { Component, OnInit, HostListener, ElementRef, ViewChild, Inject, PLATFORM_ID } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
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
      <button class="arrow-btn next-btn" (click)="nextSlide()" [disabled]="activeIndex >= Math.max(0, images.length - visibleSlides)">
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <polyline points="9 18 15 12 9 6"></polyline>
        </svg>
      </button>
      
      <!-- Kontener zdjęć z obsługą dotknięć -->
      <div #trackWrapper class="carousel-track-wrapper" 
           (touchstart)="onTouchStart($event)"
           (touchmove)="onTouchMove($event)"
           (touchend)="onTouchEnd()">
        <div class="carousel-track" [ngStyle]="{'transform': 'translateX(' + translateX + 'px)'}">
          <div class="carousel-slide" *ngFor="let image of images; let i = index">
            <div class="process-image">
              <img [src]="image.src" [alt]="image.alt">
              
              <div class="image-buttons">
                <button class="image-btn order-btn" (click)="scrollToOrderForm()">Zamów serwis</button>
                <button class="image-btn learn-more-btn" (click)="toggleOverlay(i)">Dowiedz się więcej</button>
              </div>
              
              <div class="image-overlay" [class.active]="activeOverlays[i]" (click)="toggleOverlay(i)">
                <p [innerHTML]="image.description"></p>
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
      width: 95%;
      max-width: 5650px; /* Zwiększona maksymalna szerokość */
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
      position: relative; /* Dodano pozycję, aby zapobiec przewijaniu poza granicami */
      touch-action: pan-y; /* Pozwala na przewijanie strony w pionie, ale obsługuje swipe w poziomie */
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
      will-change: transform; /* Optymalizacja wydajności */
    }
    
    .carousel-slide {
      flex: 0 0 auto;
      width: 920px; /* Zwiększona szerokość slajdu, aby pomieścić zdjęcie 900px + padding */
      padding: 0 10px;
      display: flex;
      flex-direction: column;
      align-items: center; /* Wycentrowanie zawartości slajdu */
    }
    
    /* Styl zdjęć z nowymi wymiarami */
    .process-image {
      position: relative;
      overflow: hidden;
      height: 600px; /* Nowa wysokość */
      width: 900px; /* Nowa szerokość */
      border-radius: 8px; /* Dodane łagodne zaokrąglenie rogów */
      box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1); /* Subtelny cień */
    }
    
    .process-image img {
      width: 100%;
      height: 100%;
      object-fit: cover;
      transition: transform 0.3s ease;
    }
    
    /* Przyciski na zdjęciach - zmienione aby były obok siebie */
    .image-buttons {
      position: absolute;
      bottom: 30px;
      left: 0;
      right: 0;
      display: flex;
      flex-direction: row; /* Przyciski obok siebie */
      align-items: center;
      justify-content: center;
      gap: 15px;
      padding: 0 20px;
      z-index: 5;
    }
    
    .image-btn {
      width: auto; /* Zmienione z 70% na auto */
      padding: 10px 16px; /* Zmniejszony padding */
      border-radius: 25px;
      font-size: 0.95rem; /* Mniejsza czcionka */
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
      padding: 30px;
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
      font-size: 1.2rem;
      text-align: center;
      margin: 0;
      line-height: 1.6;
    }
    
    .image-caption {
      font-weight: 600;
      color: #2c3e50;
      margin: 15px 0 0;
      font-size: 1.3rem;
      text-align: center;
    }
    
    /* Wskaźniki (kropki) */
    .carousel-indicators {
      display: flex;
      justify-content: center;
      gap: 10px;
      margin-top: 20px;
    }
    
    .indicator-dot {
      width: 14px;
      height: 14px;
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
    @media screen and (max-width: 1200px) {
      .carousel-slide {
        width: 620px;
      }
      
      .process-image {
        height: 420px;
        width: 600px;
      }
      
      .image-btn {
        width: auto; /* Auto zamiast 80% */
        padding: 8px 14px; /* Zmniejszony padding */
        font-size: 0.9rem;
      }
    }
    
    @media screen and (max-width: 768px) {
      .carousel-container {
        padding: 0 15px;
        width: 100%;
      }
      
      .arrow-btn {
        width: 34px;
        height: 34px;
      }
      
      .arrow-btn svg {
        width: 20px;
        height: 20px;
      }
      
      .carousel-slide {
        width: 480px; /* Zwiększone o ~150% z 320px */
      }
      
      .process-image {
        height: 330px; /* Zwiększone o ~150% z 220px */
        width: 450px; /* Zwiększone o ~150% z 300px */
      }
      
      .image-buttons {
        bottom: 15px;
        gap: 10px;
      }
      
      .image-btn {
        width: auto; /* Auto zamiast 85% */
        padding: 6px 10px; /* Zmniejszony padding */
        font-size: 0.8rem;
      }
    }
    
    @media screen and (max-width: 480px) {
      .carousel-container {
        padding: 0 10px;
      }
      
      .carousel-slide {
        width: 405px; /* Zwiększone o ~150% z 270px */
      }
      
      .process-image {
        height: 300px; /* Zwiększone o ~150% z 200px */
        width: 375px; /* Zwiększone o ~150% z 250px */
      }
      
      .image-btn {
        width: auto; /* Auto zamiast 90% */
        padding: 5px 8px; /* Zmniejszony padding */
        font-size: 0.75rem;
      }
      
      .image-overlay p {
        font-size: 0.9rem;
      }
      
      .image-caption {
        font-size: 1rem;
        margin-top: 10px;
      }
    }
  `]
})
export class ProcessCarouselComponent implements OnInit {
  @ViewChild('trackWrapper') trackWrapper!: ElementRef;
  
  // Bezpieczne odwołanie do obiektu window
  private isBrowser: boolean;
  
  images: ProcessImage[] = [
    {
      src: '../../assets/images/jak-dzialamy/przyjmowanie-zamowienia.jpg',
      alt: 'Przyjmowanie zamówienia',
      caption: '1. Przyjmujemy zamówienie',
      description: 'Zamów tak, jak Ci wygodnie! Telefon, e-mail, Messenger, a może wygodny formularz online? Wybierz najdogodniejszy sposób.'
    },
    {
      src: '../../assets/images/jak-dzialamy/odbieramy.jpg',
      alt: 'Odbieramy rower',
      caption: '2. Odbieramy rower od klienta',
      description: 'Wygodny odbiór roweru! Przyjedziemy po Twój rower prosto pod dom lub inne wygodne miejsce – od niedzieli do czwartku, między 18:00 a 22:00. Ty decydujesz, gdzie go odbierzemy!'
    },
    {
      src: '../../assets/images/jak-dzialamy/transport.jpg',
      alt: 'Transport roweru',
      caption: '3. Zawozimy rower do serwisu',
      description: 'Bezpieczny transport* do serwisu! Twój rower** trafi do stacjonarnego serwisu, wyposażonego w profesjonalne narzędzia diagnostyczne i naprawcze. <br><br> *Przewóz rowerów z karbonowymi ramami dostępny od 2025 roku. <br> **Przewóz rowerów niestandardowych po uzgodnieniu'
    },
    {
      src: '../../assets/images/jak-dzialamy/serwis.jpg',
      alt: 'Przegląd roweru',
      caption: '4. Serwis dokonuje przeglądu roweru',
      description: 'Dokładny przegląd i indywidualne podejście! Nasz serwisant sprawdzi kluczowe elementy Twojego roweru. Jeśli wykryjemy usterki wymagające dodatkowych napraw, które wykraczają poza standardowy zakres serwisu, skontaktujemy się z Tobą, aby wspólnie zdecydować o dalszych działaniach.'
    },
    {
      src: '../../assets/images/jak-dzialamy/serwis2.jpg',
      alt: 'Serwis roweru',
      caption: '5. Wykonujemy serwis',
      description: 'W ramach serwisu wykonamy: <br> ✅ Regulację hamulców i przerzutek <br> ✅ Smarowanie łańcucha i piast <br> ✅ Sprawdzenie ciśnienia i stanu opon <br> ✅ Kontrolę luzów sterów, połączeń śrubowych oraz elementów ruchomych <br> ✅ Dokręcenie mechanizmu korbowego, piast, pedałów i sterów <br> ✅ Sprawdzenie linek, pancerzy i skręcenia całej konstrukcji <br><br> 🔧 Dodatkowe naprawy również są możliwe'
    },
    {
      src: '../../assets/images/jak-dzialamy/zwrot.jpg',
      alt: 'Zwrot roweru',
      caption: '6. Przywozimy rower z powrotem',
      description: 'Wygodny zwrot roweru! Oddajemy rower dokładnie tam, skąd go odebraliśmy – lub w inne, wcześniej ustalone miejsce. Wszystko w dogodnych godzinach: od 18:00 do 22:00.'
    }
  ];

  activeIndex = 0;
  visibleSlides = 2; // Zmniejszona liczba widocznych slajdów ze względu na większe wymiary
  slideWidth = 920; // Zwiększona szerokość slajdu
  taus = 1000;
  isMobile = false;
  activeOverlays: boolean[] = [];
  Math = Math; // Aby móc użyć Math w szablonie
  
  // Zmienne dla obsługi swipe'ów
  touchStartX = 0;
  touchEndX = 0;
  minSwipeDistance = 50; // Minimalna odległość przesunięcia uznawana za swipe
  isSwiping = false;
  translateX = 0; // Pozycja śledzenia karuzeli
  dragOffset = 0; // Przesunięcie podczas przeciągania

  constructor(
    private router: Router,
    @Inject(PLATFORM_ID) private platformId: Object
  ) {
    this.isBrowser = isPlatformBrowser(this.platformId);
    this.activeOverlays = new Array(this.images.length).fill(false);
  }

  ngOnInit(): void {
    // Wykonuj tylko w przeglądarce
    if (this.isBrowser) {
      this.updateScreenSize();
      
      // Dodane: sprawdzenie czy istnieje maksymalna liczba slajdów
      // i ustawienie początkowego stanu karuzeli
      const maxIndex = Math.max(0, this.images.length - this.visibleSlides);
      if (this.activeIndex > maxIndex) {
        this.activeIndex = maxIndex;
      }
      
      // Inicjalizacja translateX
      this.updateTranslateX();
    } else {
      // Ustawienia domyślne dla SSR
      this.visibleSlides = 1;
      this.slideWidth = 320;
      this.translateX = 0;
    }
  }

  // Aktualizacja translateX na podstawie aktualnego indeksu
  updateTranslateX(): void {
    this.translateX = -this.activeIndex * this.slideWidth;
  }

  @HostListener('window:resize')
  updateScreenSize(): void {
    // Wykonuj tylko w przeglądarce
    if (!this.isBrowser) return;
    
    const width = window.innerWidth;
    
    if (width <= 480) {
      this.visibleSlides = 1;
      this.slideWidth = 405; // Zwiększone o ~150% z 270px
      this.isMobile = true;
    } else if (width <= 768) {
      this.visibleSlides = 1;
      this.slideWidth = 480; // Zwiększone o ~150% z 320px
      this.isMobile = true;
    } else if (width <= 1200) {
      this.visibleSlides = 1;
      this.slideWidth = 620;
      this.isMobile = false;
    } else if (width <= 1600) {
      this.visibleSlides = 2;
      this.slideWidth = 920;
      this.isMobile = false;
    } else {
      this.visibleSlides = 2; // Zmniejszona liczba ze względu na większe zdjęcia
      this.slideWidth = 920;
      this.isMobile = false;
    }
    
    // Sprawdź, czy aktualny indeks nie przekracza dozwolonego limitu
    const maxIndex = Math.max(0, this.images.length - this.visibleSlides);
    if (this.activeIndex > maxIndex) {
      this.activeIndex = maxIndex;
    }
    
    // Aktualizacja translateX
    this.updateTranslateX();
  }

  // Generuje tablicę z liczbą kropek odpowiadającą liczbie grup zdjęć
  getDotArray(): number[] {
    const dotCount = Math.ceil(this.images.length / this.visibleSlides);
    return Array(dotCount).fill(0).map((_, i) => i);
  }

  nextSlide(): void {
    // Zmodyfikowana logika - ogranicza przesuwanie do ostatniego dostępnego slajdu
    const maxIndex = Math.max(0, this.images.length - this.visibleSlides);
    if (this.activeIndex < maxIndex) {
      this.activeIndex++;
      this.updateTranslateX();
    }
  }

  prevSlide(): void {
    if (this.activeIndex > 0) {
      this.activeIndex--;
      this.updateTranslateX();
    }
  }

  goToSlide(index: number): void {
    this.activeIndex = index;
    this.updateTranslateX();
  }

  goToDot(dotIndex: number): void {
    const newIndex = dotIndex * this.visibleSlides;
    // Upewnij się, że nie przekraczamy maksymalnego indeksu
    const maxIndex = Math.max(0, this.images.length - this.visibleSlides);
    this.activeIndex = Math.min(newIndex, maxIndex);
    this.updateTranslateX();
  }

  toggleOverlay(index: number): void {
    this.activeOverlays[index] = !this.activeOverlays[index];
  }

  // Metoda do przewijania do formularza zamówienia
  scrollToOrderForm(): void {
    // Wykonuj tylko w przeglądarce
    if (!this.isBrowser) return;
    
    const orderFormSection = document.getElementById('order-form');
    if (orderFormSection) {
      orderFormSection.scrollIntoView({ behavior: 'smooth' });
    } else {
      // Fallback w przypadku gdy element nie zostanie znaleziony
      this.router.navigate(['/guest-order']);
    }
  }
  
  // Obsługa dotknięć - start
  onTouchStart(event: TouchEvent): void {
    if (!this.isBrowser || !this.trackWrapper) return;
    
    this.touchStartX = event.touches[0].clientX;
    this.isSwiping = true;
    this.dragOffset = 0;
    
    // Zatrzymaj animację podczas przeciągania
    const track = this.trackWrapper.nativeElement.querySelector('.carousel-track');
    if (track) {
      track.style.transition = 'none';
    }
  }
  
  // Obsługa dotknięć - przesuwanie
  onTouchMove(event: TouchEvent): void {
    if (!this.isBrowser || !this.isSwiping) return;
    
    const currentX = event.touches[0].clientX;
    this.dragOffset = currentX - this.touchStartX;
    
    // Ograniczenie przeciągania poza granice
    const maxIndex = Math.max(0, this.images.length - this.visibleSlides);
    const minTranslate = -maxIndex * this.slideWidth;
    
    let newTranslate = -this.activeIndex * this.slideWidth + this.dragOffset;
    
    // Dodanie "oporu" przy próbie przeciągnięcia poza granice
    if (newTranslate > 0) {
      newTranslate = this.dragOffset / 3; // Efekt oporu na początku
    } else if (newTranslate < minTranslate) {
      const overDrag = newTranslate - minTranslate;
      newTranslate = minTranslate + overDrag / 3; // Efekt oporu na końcu
    }
    
    // Aktualizacja pozycji
    this.translateX = newTranslate;
  }
  
  // Obsługa dotknięć - koniec
  onTouchEnd(): void {
    if (!this.isBrowser || !this.isSwiping || !this.trackWrapper) return;
    
    // Przywrócenie animacji
    const track = this.trackWrapper.nativeElement.querySelector('.carousel-track');
    if (track) {
      track.style.transition = 'transform 0.5s ease-in-out';
    }
    
    // Sprawdzenie czy przesunięcie było wystarczająco duże aby uznać je za swipe
    if (Math.abs(this.dragOffset) > this.minSwipeDistance) {
      if (this.dragOffset > 0) {
        this.prevSlide(); // Swipe w prawo - poprzedni slajd
      } else {
        this.nextSlide(); // Swipe w lewo - następny slajd
      }
    } else {
      // Jeśli przesunięcie było zbyt małe, wróć do aktualnego slajdu
      this.updateTranslateX();
    }
    
    this.isSwiping = false;
  }
}