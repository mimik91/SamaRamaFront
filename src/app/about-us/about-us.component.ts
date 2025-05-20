import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-about-us',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './about-us.component.html',
  styleUrls: ['./about-us.component.css']
})
export class AboutUsComponent implements OnInit {
  // Jedno duże zdjęcie zamiast galerii
  heroImage = {
    src: 'assets/images/about-us/about4.jpg',
    alt: 'Profesjonalny serwis rowerowy CycloPick'
  };

  locationList = [
    'Kraków',
    'Węgrzce',
    'Zielonki',
    'Bosutów',
    'Bibice',
    'Batowice',
    'Michałowice',
    'Dziekanowice',
    'Raciborowice',
    'Boleń'
  ];

  values = [
    {
      name: 'Jakość',
      icon: 'shield',
      description: 'Bezpieczeństwo i niezawodność to nasz priorytet.'
    },
    {
      name: 'Odpowiedzialność',
      icon: 'clock',
      description: 'Dotrzymujemy terminów i realizujemy usługi zgodnie z obietnicą.'
    },
    {
      name: 'Ekologia',
      icon: 'leaf',
      description: 'Rower to przyszłość ekologicznego transportu, a my pomagamy go utrzymać w doskonałym stanie.'
    },
    {
      name: 'Pasja',
      icon: 'heart',
      description: 'Kochamy rowery i dzielimy się tą pasją z naszymi klientami.'
    },
    {
      name: 'Innowacyjność',
      icon: 'lightbulb',
      description: 'Rozwijamy naszą platformę w odpowiedzi na potrzeby użytkowników, aby była jeszcze bardziej funkcjonalna i przyjazna.'
    }
  ];

  steps = [
    {
      number: 1,
      title: 'Zarejestruj rower',
      description: 'Dodaj jednoślad do systemu, podając podstawowe informacje.',
      icon: 'file-text'
    },
    {
      number: 2,
      title: 'Wybierz pakiet serwisowy',
      description: 'Od podstawowego przeglądu po kompleksową obsługę.',
      icon: 'package'
    },
    {
      number: 3,
      title: 'Ustal termin odbioru',
      description: 'Wskaż dogodny dzień, a my odbierzemy Twój rower spod wskazanego adresu.',
      icon: 'calendar'
    },
    {
      number: 4,
      title: 'Bezpieczne przekazanie',
      description: 'Przypnij rower zapięciem na szyfr i prześlij nam lokalizację oraz kod.',
      icon: 'lock'
    },
    {
      number: 5,
      title: 'Serwisowanie',
      description: 'Dostarczymy rower do certyfikowanego serwisu, który oceni jego stan i skontaktuje się z Tobą w przypadku dodatkowych napraw.',
      icon: 'tool'
    },
    {
      number: 6,
      title: 'Zwrot roweru',
      description: 'Po zakończeniu serwisowania dostarczymy go z powrotem pod wskazany adres, gotowego do jazdy.',
      icon: 'truck'
    }
  ];

  benefits = [
    {
      title: 'Oszczędność czasu',
      description: 'Nie musisz osobiście dostarczać roweru do serwisu, my zajmiemy się transportem.',
      icon: 'clock'
    },
    {
      title: 'Profesjonalizm',
      description: 'Współpracujemy wyłącznie z certyfikowanymi serwisantami z wieloletnim doświadczeniem.',
      icon: 'award'
    },
    {
      title: 'Przejrzystość',
      description: 'Jasno określone pakiety usług z ustalonymi cenami, bez ukrytych kosztów.',
      icon: 'dollar-sign'
    },
    {
      title: 'Wygoda',
      description: 'Intuicyjna aplikacja, dzięki której masz pełną kontrolę nad serwisowaniem roweru 24/7.',
      icon: 'smartphone'
    },
    {
      title: 'Historia serwisowa',
      description: 'Wszystkie przeglądy i naprawy Twojego roweru w jednym miejscu.',
      icon: 'list'
    }
  ];

  constructor() { }

  ngOnInit(): void {
  }

  scrollToSection(sectionId: string): void {
    const element = document.getElementById(sectionId);
    if (element) {
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