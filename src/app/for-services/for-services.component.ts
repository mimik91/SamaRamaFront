// for-services.component.ts

import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router'; 

@Component({
  selector: 'app-for-services', 
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './for-services.component.html', 
  styleUrls: ['./for-services.component.css']
})
export class ForServicesComponent implements OnInit {

  // Powrót do logo CycloPick
  heroImage = {
    src: '\\assets\\images\\logo-cyclopick.webp', 
    alt: 'Logo CycloPick - Usługi dla serwisów rowerowych'
  };

  // Nowe kreatywne hasło CTA
  mainCtaText: string = 'Zacznij zyskiwać klientów'; 

  // Skracamy nagłówki, by były bardziej skanowalne.
  serviceBenefits = [
    {
      title: 'Nowi klienci szukający Twoich usług', // Wzmocnimy w HTML
      description: 'Docieraj do osób, które aktywnie szukają serwisu o Twoim profilu. Oszczędzasz czas na klientach, a trafiasz do tych, którzy szukają właśnie Ciebie. Zwiększ widoczność swojego serwisu rowerowego!',
      icon: 'search' 
    },
    {
      title: 'Wizytówka Twojego serwisu',
      description: 'Zyskaj profesjonalną stronę-wizytówkę w ramach CycloPick, dzięki czemu nie musisz tworzyć i utrzymywać własnej strony internetowej (status: w trakcie rozwoju).',
      icon: 'layout'
    },
    {
      title: 'Widoczność na mapie serwisów',
      description: 'Twój warsztat zostanie dodany do interaktywnej **mapy serwisów rowerowych**, co ułatwi lokalnym klientom (zwłaszcza w Krakowie i okolicach) szybkie znalezienie Cię. Zwiększ widoczność swojego **serwisu rowerowego**!',
      icon: 'map-pin'
    },
    {
      title: 'Darmowa promocja i zarządzanie danymi',
      description: 'Brak ukrytych kosztów za obecność na platformie, widoczność na mapie czy promocję. Masz też możliwość łatwego zarządzania informacjami o swoim serwisie (status: w trakcie rozwoju).',
      icon: 'dollar-sign'
    },
    {
      title: 'Transport rowerów jako usługa dodatkowa',
      description: 'Zajmij się tym, co robisz najlepiej – serwisowaniem. My zajmiemy się logistyką! Możesz zaoferować swoim klientom usługę **transportu rowerów** door-to-door w Krakowie i okolicach. To dodatkowa przewaga na rynku **usług dla serwisów rowerowych**.',
      icon: 'truck'
    }
  ];

  contactInfo = [
    'Jesteśmy otwarci na wszelkie formy współpracy, krytykę, sugestie i opinie. Możesz do nas napisać e-mail, SMS, zadzwonić lub skontaktować się przez media społecznościowe (np. FB).'
  ];
  
  constructor(private router: Router) { } 

  ngOnInit(): void {
  }

  navigateToRegisterService(): void {
    this.router.navigate(['/register-service']);
  }
}