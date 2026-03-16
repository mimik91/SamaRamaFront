import { Component, OnInit, OnDestroy, inject, Inject, PLATFORM_ID } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { RouterLink, Router } from '@angular/router';
import { Meta, Title } from '@angular/platform-browser';
import { SeoService } from '../../core/seo.service';
import { SchemaOrgHelper } from '../../core/schema-org.helper';

@Component({
  selector: 'app-transport-krakow',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './transport-krakow.component.html',
  styleUrls: ['./transport-krakow.component.css']
})
export class TransportKrakowComponent implements OnInit, OnDestroy {
  private meta = inject(Meta);
  private title = inject(Title);
  private seoService = inject(SeoService);
  private router = inject(Router);

  constructor(@Inject(PLATFORM_ID) private platformId: Object) {}

  ngOnInit(): void {
    this.title.setTitle('Transport Roweru Kraków – Serwis Rowerowy Door to Door | CycloPick');
    this.meta.updateTag({
      name: 'description',
      content: 'Transport roweru Kraków door to door – kurier odbiera rower spod Twoich drzwi i dostarcza do dowolnego serwisu rowerowego w Krakowie. Zamieniamy każdy warsztat w Krakowie na serwis z dojazdem. Zamów online!'
    });
    this.meta.updateTag({
      name: 'keywords',
      content: 'transport roweru Kraków, serwis rowerowy Kraków door to door, mobilny serwis rowerowy Kraków, mechanik rowerowy z dojazdem Kraków, odbiór roweru Kraków, naprawa roweru z dojazdem Kraków, serwis rowerowy z odbiorem Kraków'
    });
    this.meta.updateTag({ name: 'robots', content: 'index, follow' });
    this.meta.updateTag({ property: 'og:title', content: 'Transport Roweru Kraków – Serwis Door to Door | CycloPick' });
    this.meta.updateTag({ property: 'og:description', content: 'Kurier odbiera rower spod Twoich drzwi i dostarcza do dowolnego serwisu rowerowego w Krakowie. Zamów transport online.' });

    this.addStructuredData();
  }

  ngOnDestroy(): void {
    this.seoService.removeStructuredData();
  }

  navigateToOrder(): void {
    this.router.navigate(['/serwisy/krakow']);
  }

  private addStructuredData(): void {
    const service = {
      '@context': 'https://schema.org',
      '@type': 'Service',
      name: 'Transport roweru door-to-door Kraków',
      serviceType: 'BikeTransport',
      description: 'Odbiór roweru od klienta w Krakowie, transport do wybranego serwisu rowerowego i zwrot po naprawie pod wskazany adres. Zamieniamy każdy serwis rowerowy w Krakowie na serwis door-to-door.',
      provider: {
        '@type': 'LocalBusiness',
        name: 'CycloPick',
        url: 'https://www.cyclopick.pl'
      },
      areaServed: {
        '@type': 'City',
        name: 'Kraków'
      },
      availableChannel: {
        '@type': 'ServiceChannel',
        serviceUrl: 'https://www.cyclopick.pl/transport-roweru-krakow'
      }
    };

    const faqSchema = SchemaOrgHelper.generateFAQPage([
      {
        question: 'Jak działa transport roweru door-to-door w Krakowie?',
        answer: 'Wybierasz serwis rowerowy z naszej listy, zamawiasz transport online, a kurier wieczorem (18:00–22:00) odbiera rower spod Twoich drzwi i dostarcza go do warsztatu. Po naprawie odwozi rower z powrotem pod wskazany adres.'
      },
      {
        question: 'Do jakich serwisów rowerowych w Krakowie mogę zamówić transport?',
        answer: 'Dzięki CycloPick możesz zamówić transport do dowolnego z 90+ serwisów rowerowych działających w Krakowie. Zamieniamy każdy warsztat rowerowy w Krakowie na serwis z dojazdem door-to-door.'
      },
      {
        question: 'Czy możecie odebrać rower elektryczny door-to-door w Krakowie?',
        answer: 'Tak, obsługujemy rowery elektryczne. Usługa transportu door-to-door w Krakowie działa zarówno dla standardowych rowerów, jak i e-bike\'ów.'
      },
      {
        question: 'W jakich dzielnicach Krakowa działa odbiór roweru z dojazdem?',
        answer: 'Obsługujemy cały Kraków: Stare Miasto, Śródmieście, Krowodrza, Bronowice, Nowa Huta, Mistrzejowice, Podgórze, Łagiewniki, Prądnik Biały, Prądnik Czerwony, Grzegórzki, Zwierzyniec, Ruczaj, Dębniki i Bieńczyce.'
      },
      {
        question: 'Ile kosztuje transport roweru door-to-door w Krakowie?',
        answer: 'Cena transportu zależy od odległości i jest wyświetlana podczas zamawiania. Płatność odbywa się gotówką lub BLIKIEM przy odbiorze roweru przez kuriera.'
      }
    ]);

    this.seoService.addMultipleStructuredData([service, faqSchema].filter(Boolean));
  }
}
