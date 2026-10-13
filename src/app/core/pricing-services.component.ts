import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { TRANSPORT_PRICING } from '../shared/constants/transport-pricing.constants';
import { BreadcrumbComponent } from '../shared/components/breadcrumb/breadcrumb.component';

interface PricingBenefit {
  icon: 'calendar' | 'pin' | 'globe' | 'sms' | 'truck';
  title: string;
  text: string;
  pill?: { label: string; kind: 'new' | 'city' };
}

/** Oferta i cennik CycloPick dla serwisów rowerowych (/cennik-serwisy). */
@Component({
  selector: 'app-pricing-services',
  standalone: true,
  imports: [CommonModule, RouterLink, BreadcrumbComponent],
  templateUrl: './pricing-services.component.html',
  styleUrls: ['./pricing-services.component.css']
})
export class PricingServicesComponent {
  readonly partnerTransportLabel = `${TRANSPORT_PRICING.partnerCost} zł`;
  readonly contactMail = 'mailto:kontakt@cyclopick.pl';

  openFaqIndex: number | null = 0;

  readonly benefits: PricingBenefit[] = [
    {
      icon: 'calendar',
      title: 'Panel rezerwacji online',
      text: 'Rezerwacje i terminy w jednym miejscu — kalendarz, kanban i historia zleceń. Mniej ręcznego zapisywania, łatwiejsza obsługa klientów.'
    },
    {
      icon: 'pin',
      title: 'Wyróżnienie na mapie',
      text: 'Wyróżniona pinezka pomaga klientom zauważyć Twój serwis na mapie i odróżnić go od pozostałych punktów.'
    },
    {
      icon: 'globe',
      title: 'Logo i link na stronie głównej',
      text: 'Dodatkowa ekspozycja Twojego serwisu na cyclopick.pl i bezpośredni link do profilu. Klientom łatwiej poznać Twoją ofertę.'
    },
    {
      icon: 'sms',
      title: 'Powiadomienia SMS dla klientów',
      text: 'Automatyczne SMS-y o przyjęciu roweru i zakończeniu prac. Klient wie, co się dzieje, a Ty rzadziej odbierasz telefony z pytaniem o status.',
      pill: { label: 'Nowość', kind: 'new' }
    },
    {
      icon: 'truck',
      title: 'Logistyka CycloPick',
      text: `Klient może zamówić transport roweru do Twojego serwisu i z powrotem (door-to-door, ${this.partnerTransportLabel}) — wygodna alternatywa dla samodzielnego dowozu. Usługa dostępna na terenie Krakowa.`,
      pill: { label: 'Kraków', kind: 'city' }
    }
  ];

  readonly faq: Array<{ question: string; answer: string }> = [
    {
      question: 'Czy rejestracja serwisu jest bezpłatna?',
      answer: 'Do 28 lutego 2027 r. tak. Od 1 marca 2027 r. opłata rejestracyjna wynosi 300 zł jednorazowo.'
    },
    {
      question: 'Czy muszę płacić za prowadzenie konta?',
      answer: 'Nie. Prowadzenie konta jest bezpłatne co najmniej do 30 września 2027 r. Później rozważamy niewysoką opłatę — poinformujemy o niej z wyprzedzeniem. Nie naliczamy opłat w ciemno.'
    },
    {
      question: 'Co się stanie, jeśli nie zdecyduję się zapłacić?',
      answer: 'Stracisz jedynie dostęp do funkcji płatnych.'
    },
    {
      question: 'Czym był program Early Access?',
      answer: 'Pierwsze 20 serwisów partnerskich otrzymało bezpłatne prowadzenie konta do 1 marca 2029 r. przy spełnieniu warunków partnerskich. Wszystkie miejsca są już zajęte.'
    },
    {
      question: 'Jak zacząć?',
      answer: 'Zarejestruj serwis, uzupełnij profil (pakiety, cennik, godziny otwarcia) i skonfiguruj panel rezerwacji.'
    }
  ];

  toggleFaq(index: number): void {
    this.openFaqIndex = this.openFaqIndex === index ? null : index;
  }
}
