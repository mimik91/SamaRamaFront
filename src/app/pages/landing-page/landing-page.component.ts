import { Component, OnInit, Inject } from '@angular/core';
import { CommonModule, DOCUMENT } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { Meta, Title, DomSanitizer, SafeHtml, SafeStyle } from '@angular/platform-browser';

@Component({
  selector: 'app-landing-page',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './landing-page.component.html',
  styleUrls: ['./landing-page.component.css']
})
export class LandingPageComponent implements OnInit {
  
  // Zmienna na bezpieczny JSON-LD
  schemaJson: SafeHtml | null = null;

  // Tło hero – przez sanitizer, żeby Angular nie blokował url() ze spacją w nazwie pliku
  heroBgStyle!: SafeStyle;

  features = [
    {
      icon: 'map-pin',
      title: 'Serwis rowerowy door-to-door w Krakowie',
      description: 'Znajdź certyfikowanego Partnera CycloPick w Krakowie z darmowym transportem roweru. Odbiór spod drzwi, dostawa po naprawie – bez wychodzenia z domu.'
    },
    {
      icon: 'truck',
      title: 'Transport rowerów Kraków – 0 zł lub 60 zł',
      description: 'U Partnerów CycloPick transport jest w cenie serwisu (0 zł). Do dowolnego serwisu rowerowego w Krakowie – stała cena 60 zł w obie strony.'
    },
    {
      icon: 'star',
      title: 'Niebieska pinezka = darmowy transport',
      description: 'Niebieskie pinezki na mapie CycloPick to zweryfikowani Partnerzy z darmowym transportem door-to-door, systemem rezerwacji online i cyfrową historią napraw.'
    },
    {
      icon: 'clock',
      title: 'Cyfrowa historia serwisowa roweru',
      description: 'Każda naprawa u Partnera CycloPick zapisywana jest w cyfrowej historii. Eksportuj „Certyfikat CycloPick" i zwiększ wartość roweru nawet o 20% przy sprzedaży.'
    }
  ];

  // Dane do FAQ (zoptymalizowane pod SEO: serwis rowerowy Kraków door-to-door + edukacja o pinezkach)
  faqData = [
    {
      question: 'Co oznacza niebieska pinezka na mapie CycloPick?',
      answer: 'Niebieska pinezka oznacza Partnera CycloPick w Krakowie. U Partnerów CycloPick zarezerwujesz serwis rowerowy online i zyskasz darmowy transport door-to-door – kurier odbiera rower spod Twoich drzwi i odwozi po naprawie. Transport kosztuje 0 zł.'
    },
    {
      question: 'Co oznacza zielona pinezka na mapie CycloPick?',
      answer: 'Zielona pinezka to zweryfikowany serwis rowerowy w Krakowie, który nie należy jeszcze do sieci Partnerów CycloPick. Możesz do niego zamówić transport rowerów w Krakowie za stałą cenę 60 zł w obie strony.'
    },
    {
      question: 'Ile kosztuje transport roweru w Krakowie przez CycloPick?',
      answer: 'Transport roweru w Krakowie kosztuje 0 zł do serwisów Partnerskich CycloPick (transport jest wliczony w cenę serwisu). Do dowolnego innego serwisu rowerowego w Krakowie – stała cena 60 zł za transport tam i z powrotem. Płatność gotówką lub BLIKIEM przy odbiorze roweru.'
    },
    {
      question: 'Jak zamówić serwis rowerowy door-to-door w Krakowie?',
      answer: 'Wejdź na mapę CycloPick, znajdź niebieską pinezkę (Partner CycloPick) w Krakowie, zarezerwuj wizytę online i zamów transport. Nasz kurier odbierze Twój rower między 18:00 a 22:00 dzień przed wizytą, a po naprawie odwiezie go pod Twoje drzwi.'
    },
    {
      question: 'Czym jest cyfrowa historia serwisowa roweru CycloPick?',
      answer: 'Cyfrowa historia serwisowa to zapis wszystkich napraw wykonanych u Partnerów CycloPick. Każdy wpis zawiera datę, zakres prac i dane serwisanta. Możesz wyeksportować „Certyfikat CycloPick" w PDF – dokumentacja historii serwisowej zwiększa wartość roweru nawet o 20% przy odsprzedaży.'
    },
    {
      question: 'Czy korzystanie z mapy serwisów rowerowych CycloPick jest darmowe?',
      answer: 'Tak, przeglądanie mapy serwisów rowerowych i korzystanie z wyszukiwarki CycloPick jest całkowicie bezpłatne. Płacisz wyłącznie za naprawę roweru – transport do Partnerów CycloPick jest w cenie serwisu.'
    },
    {
      question: 'Jak dodać swój serwis rowerowy do mapy CycloPick?',
      answer: 'Zarejestruj się przez formularz „Zarejestruj serwis". Podstawowa wizytówka na mapie jest darmowa. Jako Partner CycloPick zyskujesz klientów door-to-door, system rezerwacji online i cyfrową historię napraw dla Twoich klientów.'
    }
  ];

  constructor(
    private router: Router,
    private meta: Meta,
    private title: Title,
    private sanitizer: DomSanitizer,
    @Inject(DOCUMENT) private document: Document
  ) { }

  ngOnInit(): void {
    this.heroBgStyle = this.sanitizer.bypassSecurityTrustStyle(
      "url('assets/images/pictures/Rowerzysta na tle wawelu.webp')"
    );
    this.setMetaTags();
    this.setCanonicalUrl(); // Warto rozważyć przeniesienie tego do serwisu globalnego
    this.generateSchemaMarkup();
  }

  private setMetaTags(): void {
    const pageTitle = 'Serwis Rowerowy Kraków Door-to-Door – Darmowy Transport | CycloPick';
    const pageDescription = 'Serwis rowerowy door-to-door w Krakowie z darmowym transportem. Kurier odbiera rower spod drzwi. Partnerzy CycloPick: transport 0 zł. Inne serwisy: 60 zł. Rezerwacja online, cyfrowa historia napraw.';

    this.title.setTitle(pageTitle);
    this.meta.updateTag({ name: 'description', content: pageDescription });
    this.meta.updateTag({ name: 'keywords', content: 'serwis rowerowy Kraków, transport rowerów Kraków, serwis rowerowy door-to-door, naprawa roweru Kraków, warsztat rowerowy Kraków, CycloPick' });
    this.meta.updateTag({ name: 'robots', content: 'index, follow, max-image-preview:large' });

    // Open Graph
    this.meta.updateTag({ property: 'og:title', content: pageTitle });
    this.meta.updateTag({ property: 'og:description', content: pageDescription });
    this.meta.updateTag({ property: 'og:type', content: 'website' });
    this.meta.updateTag({ property: 'og:url', content: 'https://www.cyclopick.pl/' });
    this.meta.updateTag({ property: 'og:image', content: 'https://www.cyclopick.pl/assets/images/og-image-cyclopick.jpg' });
    this.meta.updateTag({ property: 'og:locale', content: 'pl_PL' });
    this.meta.updateTag({ property: 'og:site_name', content: 'CycloPick' });

    // Twitter
    this.meta.updateTag({ name: 'twitter:card', content: 'summary_large_image' });
    this.meta.updateTag({ name: 'twitter:title', content: pageTitle });
    this.meta.updateTag({ name: 'twitter:description', content: pageDescription });
  }

  private setCanonicalUrl(): void {
    const canonicalUrl = 'https://www.cyclopick.pl/';

    // Usuń istniejący canonical link jeśli istnieje
    const existingLink = this.document.querySelector('link[rel="canonical"]');
    if (existingLink) {
      existingLink.remove();
    }

    // Dodaj nowy canonical link
    const link = this.document.createElement('link');
    link.setAttribute('rel', 'canonical');
    link.setAttribute('href', canonicalUrl);
    this.document.head.appendChild(link);
  }

  private generateSchemaMarkup(): void {
    // Rozbudowana schema łącząca WebSite, SoftwareApplication i FAQPage
    const schema = {
      '@context': 'https://schema.org',
      '@graph': [
        {
          '@type': 'WebSite',
          '@id': 'https://www.cyclopick.pl/#website',
          'url': 'https://www.cyclopick.pl/',
          'name': 'CycloPick',
          'description': 'Znajdź serwis rowerowy w swojej okolicy. Największa baza warsztatów w Polsce.',
          'publisher': {
            '@type': 'Organization',
            'name': 'CycloPick',
            'logo': {
              '@type': 'ImageObject',
              'url': 'https://www.cyclopick.pl/assets/images/logo-cyclopick.png'
            }
          },
          'potentialAction': {
            '@type': 'SearchAction',
            'target': {
              '@type': 'EntryPoint',
              'urlTemplate': 'https://www.cyclopick.pl/serwisy/{city}'
            },
            'query-input': 'required name=city'
          }
        },
        {
          '@type': 'SoftwareApplication',
          'name': 'CycloPick',
          'applicationCategory': 'LifestyleApplication',
          'operatingSystem': 'Web',
          'offers': {
            '@type': 'Offer',
            'price': '0',
            'priceCurrency': 'PLN'
          },
          'description': 'Aplikacja internetowa do znajdowania warsztatów rowerowych w Polsce.'
        },
        {
          '@type': 'FAQPage',
          'mainEntity': this.faqData.map(item => ({
            '@type': 'Question',
            'name': item.question,
            'acceptedAnswer': {
              '@type': 'Answer',
              'text': item.answer
            }
          }))
        }
      ]
    };

    // Dane strukturalne: Usługa transportu rowerów w Krakowie (LocalBusiness + Service)
    const transportServiceSchema = {
      '@context': 'https://schema.org',
      '@graph': [
        {
          '@type': 'Service',
          '@id': 'https://www.cyclopick.pl/#transport-service',
          'name': 'Transport roweru door-to-door Kraków',
          'serviceType': 'Serwis rowerowy z transportem door-to-door',
          'description': 'Kompleksowy serwis rowerowy door-to-door w Krakowie. Transport roweru od drzwi do drzwi. U Partnerów CycloPick transport gratis, do pozostałych serwisów 60 zł w obie strony.',
          'areaServed': {
            '@type': 'City',
            'name': 'Kraków',
            'addressCountry': 'PL'
          },
          'provider': {
            '@type': 'Organization',
            'name': 'CycloPick',
            'url': 'https://www.cyclopick.pl'
          },
          'offers': [
            {
              '@type': 'Offer',
              'name': 'Transport roweru do Partnera CycloPick',
              'description': 'Darmowy transport roweru door-to-door do serwisów partnerskich CycloPick w Krakowie',
              'price': '0',
              'priceCurrency': 'PLN',
              'availability': 'https://schema.org/InStock'
            },
            {
              '@type': 'Offer',
              'name': 'Transport roweru do dowolnego serwisu w Krakowie',
              'description': 'Transport roweru do dowolnego serwisu rowerowego w Krakowie za stałą cenę',
              'price': '60',
              'priceCurrency': 'PLN',
              'availability': 'https://schema.org/InStock'
            }
          ]
        }
      ]
    };

    const combinedSchema = {
      '@context': 'https://schema.org',
      '@graph': [
        ...schema['@graph'],
        ...transportServiceSchema['@graph']
      ]
    };

    // Sanityzacja JSON-LD, aby można go było bezpiecznie wstrzyknąć do HTML
    this.schemaJson = this.sanitizer.bypassSecurityTrustHtml(
      `<script type="application/ld+json">${JSON.stringify(combinedSchema)}</script>`
    );
  }

  scrollToOptions(): void {
    const el = this.document.getElementById('options-section');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }

  navigateToMap(): void {
    this.router.navigate(['/mapa-serwisow']);
  }

  navigateToKrakowMap(): void {
    this.router.navigate(['/mapa-serwisow'], {
      queryParams: { lat: '50.0647', lng: '19.9450', zoom: '14' }
    });
  }

  navigateToKrakowMapPartner(): void {
    this.router.navigate(['/mapa-serwisow'], {
      queryParams: { lat: '50.0647', lng: '19.9450', zoom: '14', coverages: '342' }
    });
  }

}