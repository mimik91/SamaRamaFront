import { Component, OnInit, inject, PLATFORM_ID } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { CycloPickLogoComponent } from '../shared/cyclopick-logo/cyclopick-logo.component';

interface PricingCategory {
  id: string;
  title: string;
  icon: string;
  services: PricingService[];
}

interface PricingService {
  name: string;
  price: string;
  description?: string;
}

@Component({
  selector: 'app-pricing',
  standalone: true,
  imports: [CommonModule, CycloPickLogoComponent],
  templateUrl: './pricing.component.html',
  styleUrls: ['./pricing.component.css']
})
export class PricingComponent implements OnInit {
  private isBrowser: boolean;
  
  selectedCategory: string = 'przerzutki';
  
  pricingCategories: PricingCategory[] = [
    {
      id: 'przerzutki',
      title: 'Przerzutki',
      icon: 'settings',
      services: [
        { name: 'Regulacja przerzutki przedniej / tylnej', price: '30 zł' },
        { name: 'Wymiana i regulacja przerzutki przedniej / tylnej', price: '60 zł' },
        { name: 'Wymiana i regulacja pancerza / linki', price: '50 - 80 zł' },
        { name: 'Wymiana i regulacja manetki', price: '70 zł' },
        { name: 'Wymiana i regulacja klamkomanetki', price: '90 zł' }
      ]
    },
    {
      id: 'hamulce-szczekowe',
      title: 'Hamulce szczękowe',
      icon: 'disc',
      services: [
        { name: 'Regulacja hamulca', price: '30 zł' },
        { name: 'Wymiana dźwigni hamulca', price: '50 zł' },
        { name: 'Wymiana i regulacja szczęk hamulcowych', price: '60 zł' },
        { name: 'Wymiana i regulacja linki / pancerza', price: '50 zł' },
        { name: 'Wymiana klocków hamulcowych (para)', price: '30 zł' }
      ]
    },
    {
      id: 'hamulce-tarczowe',
      title: 'Hamulce tarczowe',
      icon: 'disc',
      services: [
        { name: 'Wymiana i regulacja okładzin hamulcowych', price: '50 zł' },
        { name: 'Wymiana tarczy hamulcowej', price: '40 zł' },
        { name: 'Prostowanie tarczy hamulcowej', price: '50 zł' },
        { name: 'Wymiana hamulca bez skracania przewodu', price: '75 zł' },
        { name: 'Odpowietrzanie hydraulicznych układów hamulcowych', price: '80 zł' },
        { name: 'Skracanie przewodów i odpowietrzanie', price: '100 zł' },
        { name: 'Wymiana elementów hydraulicznych układów hamulcowych', price: '120 zł' }
      ]
    },
    {
      id: 'kola',
      title: 'Koła',
      icon: 'circle',
      services: [
        { name: 'Wymiana opony / dętki', price: '30 zł' },
        { name: 'Wymiana opony / dętki tylnej w rowerach holenderskich', price: '90 zł' },
        { name: 'Przegląd piasty przedniej / tylnej', price: '50 zł' },
        { name: 'Przegląd piasty tylnej wraz z bębenkiem', price: '80 zł' },
        { name: 'Przegląd piasty typu torpedo', price: '80 zł' },
        { name: 'Przegląd piasty z przekładnią planetarną', price: 'od 120 zł' },
        { name: 'Wymiana łożysk piasty przedniej / tylnej', price: '75 / 150 zł' },
        { name: 'Centrowanie koła', price: '40 - 100 zł' },
        { name: 'Zaplecenie koła', price: '100 zł' },
        { name: 'Przeplecenie koła', price: '130 zł' },
        { name: 'Dostosowanie obręczy do systemu tubeless', price: '70 zł' },
        { name: 'Montaż opony typu tubeless', price: '60 zł' }
      ]
    },
    {
      id: 'uklad-napedowy',
      title: 'Układ napędowy',
      icon: 'rotate-cw',
      services: [
        { name: 'Wymiana łańcucha', price: '30 zł' },
        { name: 'Wymiana kasety / wolnobiegu', price: '40 zł' },
        { name: 'Wymiana mechanizmu korbowego', price: '50 zł' },
        { name: 'Wymiana suportu', price: '60 zł' },
        { name: 'Wymiana łożysk suportu', price: '90 zł' },
        { name: 'Kompleksowe czyszczenie ultradźwiękami i konserwacja napędu', price: '120 zł' }
      ]
    },
    {
      id: 'uklad-kierowniczy',
      title: 'Układ kierowniczy',
      icon: 'navigation',
      services: [
        { name: 'Wymiana kierownicy prostej / szosowej', price: '60 / 100 zł' },
        { name: 'Wymiana wspornika kierownicy', price: '30 - 75 zł' },
        { name: 'Wymiana widelca', price: '60 zł' },
        { name: 'Konserwacja łożysk sterów', price: '60 zł' },
        { name: 'Wymiana sterów', price: '80 zł' },
        { name: 'Wymiana chwytów', price: '20 zł' },
        { name: 'Montaż owijki', price: '70 zł' },
        { name: 'Skracanie rury sterowej widelca', price: '50 zł' }
      ]
    },
    {
      id: 'rama',
      title: 'Rama',
      icon: 'triangle',
      services: [
        { name: 'Gwintowanie / prostowanie haka przerzutki', price: '50 zł' },
        { name: 'Gwintowanie / planowanie mufy suportu', price: '60 zł' },
        { name: 'Wymiana insertu', price: '30 zł' },
        { name: 'Złożenie roweru', price: '300 zł' },
        { name: 'Wymiana ramy', price: '360 zł' },
        { name: 'Złożenie i regulacja roweru "z kartonu"', price: '180 zł' }
      ]
    },
    {
      id: 'zawieszenie',
      title: 'Zawieszenie',
      icon: 'minimize-2',
      services: [
        { name: 'Podstawowy przegląd widelca', price: '90 zł' },
        { name: 'Pełny przegląd widelca', price: '270 zł' },
        { name: 'Przegląd dampera', price: '360 zł' },
        { name: 'Wymiana łożyska w zawieszeniu tylnym', price: '40 zł' }
      ]
    },
    {
      id: 'oswietlenie',
      title: 'Oświetlenie i elektronika',
      icon: 'zap',
      services: [
        { name: 'Montaż lampki na baterie', price: '15 zł' },
        { name: 'Wymiana baterii w lampce', price: '15 zł' },
        { name: 'Przegląd oświetlenia na dynamo / prądnice', price: '50 zł' },
        { name: 'Wymiana baterii w liczniku', price: '20 zł' },
        { name: 'Montaż i ustawienie licznika', price: '30 zł' }
      ]
    },
    {
      id: 'akcesoria',
      title: 'Akcesoria',
      icon: 'plus-circle',
      services: [
        { name: 'Montaż koszyka na bidon', price: '15 zł' },
        { name: 'Montaż nóżki', price: '15 - 35 zł' },
        { name: 'Wymiana siodełka', price: '20 zł' },
        { name: 'Montaż błotników', price: '40 zł' },
        { name: 'Montaż błotników ze wspornikami', price: '70 zł' },
        { name: 'Montaż koszyka na kierownicę', price: '30 - 60 zł' },
        { name: 'Montaż bagażnika', price: '50 zł' },
        { name: 'Montaż fotelika dziecięcego', price: '60 zł' },
        { name: 'Montaż osłony łańcucha', price: '15 - 120 zł' },
        { name: 'Demontaż akcesoriów', price: '15 - 120 zł' }
      ]
    }
  ];

  constructor() {
  this.isBrowser = isPlatformBrowser(inject(PLATFORM_ID));
}

  ngOnInit(): void {
    // Component initialization
  }

  selectCategory(categoryId: string): void {
    this.selectedCategory = categoryId;
    
    // Smooth scroll to content on mobile
    if (this.isBrowser && window.innerWidth <= 768) {
      setTimeout(() => {
        const contentElement = document.getElementById('pricing-content');
        if (contentElement) {
          contentElement.scrollIntoView({ behavior: 'smooth' });
        }
      }, 100);
    }
  }

  getSelectedCategory(): PricingCategory | undefined {
    return this.pricingCategories.find(cat => cat.id === this.selectedCategory);
  }

  scrollToTop(): void {
    if (this.isBrowser) {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }
}