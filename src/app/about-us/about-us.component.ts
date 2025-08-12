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
      title: 'Umów się na serwis w swoim serwisie rowerowym',
      description: 'Skontaktuj się z wybranym serwisem i umów termin na serwis Twojego roweru.',
      icon: 'calendar'
    },
    {
      number: 2,
      title: 'Wypełnij formularz na naszej stronie',
      description: 'Dodaj rower do systemu, podaj wymagane dane i wybierz dzień odbioru (dzień przed serwisem). Odbierzemy go spod wskazanego adresu w godzinach 18:00–22:00.',
      icon: 'file-text'
    },
    {
      number: 3,
      title: 'Odbierzemy rower i zawieziemy do serwisu',
      description: 'Możesz też przypiąć rower zapięciem na szyfr i przesłać nam lokalizację oraz kod do zapięcia.',
      icon: 'truck'
    },
    {
      number: 4,
      title: 'Po zakończonym serwisie dostarczymy Ci rower z powrotem',
      description: 'Przywozimy go z powrotem pod wskazany adres, gotowego do jazdy.',
      icon: 'tool'
    }
  ];

  benefits = [
    {
      title: 'Oszczędność czasu',
      description: 'Nie musisz osobiście dostarczać roweru do serwisu, my zajmiemy się transportem.',
      icon: 'clock'
    },
    {
      title: 'Przejrzystość',
      description: 'Jasno określona usługa z ustaloną ceną, bez ukrytych kosztów.',
      icon: 'dollar-sign'
    },
    {
      title: 'Wygoda',
      description: 'Intuicyjna strona, dzięki której masz pełną kontrolę nad serwisowaniem roweru 24/7 i nie musisz instalować kolejnej aplikacji na telefonie',
      icon: 'smartphone'
    },
    //{
      //title: 'Historia serwisowa',
      //description: 'Wszystkie przeglądy i naprawy Twojego roweru w jednym miejscu.',
      //icon: 'list'
    //}
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