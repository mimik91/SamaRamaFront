import { Component, OnInit, Inject } from '@angular/core';
import { CommonModule, DOCUMENT } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { Meta, Title, DomSanitizer, SafeHtml } from '@angular/platform-browser';

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

  features = [
    {
      icon: 'map-pin',
      title: 'Ponad 2000 warsztatów na mapie',
      description: 'Największa baza punktów naprawy rowerów w Polsce. Znajdź miejsce w swojej okolicy i sprawdź dane kontaktowe.'
    },
    {
      icon: 'filter',
      title: 'Filtrowanie po usługach',
      description: 'Szukasz konkretnej naprawy? Przefiltruj wyniki według oferowanych usług (np. naprawa amortyzatorów) i znajdź specjalistę.'
    },
    {
      icon: 'star',
      title: 'Wyróżnione warsztaty',
      description: 'Szukaj niebieskich pinezek – to zweryfikowane miejsca z pełnym profilem, cennikiem i godzinami otwarcia.'
    },
    {
      icon: 'clock',
      title: 'Cenniki i godziny otwarcia',
      description: 'Wiele warsztatów udostępnia cenniki usług i aktualne godziny pracy. Sprawdź przed wizytą.'
    }
  ];

  popularCities = [
    { name: 'Warszawa', slug: 'warszawa' },
    { name: 'Kraków', slug: 'krakow' },
    { name: 'Wrocław', slug: 'wroclaw' },
    { name: 'Poznań', slug: 'poznan' },
    { name: 'Gdańsk', slug: 'gdansk' },
    { name: 'Łódź', slug: 'lodz' },
    { name: 'Katowice', slug: 'katowice' },
    { name: 'Szczecin', slug: 'szczecin' }
  ];

  // Dane do FAQ (ważne dla AIO)
  faqData = [
    {
      question: 'Czy korzystanie z mapy serwisów jest darmowe?',
      answer: 'Tak, wyszukiwanie i przeglądanie bazy serwisów rowerowych w CycloPick jest całkowicie darmowe dla rowerzystów.'
    },
    {
      question: 'Jak dodać swój serwis rowerowy do mapy?',
      answer: 'Wystarczy zarejestrować się poprzez formularz "Zarejestruj serwis". Podstawowa wizytówka jest darmowa.'
    },
    {
      question: 'Czy mogę umówić wizytę przez CycloPick?',
      answer: 'Możesz znaleźć dane kontaktowe serwisu i skontaktować się z nim bezpośrednio telefonicznie lub mailowo.'
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
    this.setMetaTags();
    this.setCanonicalUrl(); // Warto rozważyć przeniesienie tego do serwisu globalnego
    this.generateSchemaMarkup();
  }

  private setMetaTags(): void {
    const pageTitle = 'Serwis rowerowy blisko Ciebie | CycloPick - mapa warsztatów';
    const pageDescription = 'Znajdź serwis rowerowy w swojej okolicy. Ponad 2000 warsztatów na interaktywnej mapie Polski. Sprawdź cenniki, godziny otwarcia i umów wizytę.';
    
    this.title.setTitle(pageTitle);
    this.meta.updateTag({ name: 'description', content: pageDescription });
    this.meta.updateTag({ name: 'keywords', content: 'serwis rowerowy, warsztat rowerowy, naprawa rowerów, przegląd roweru, mapa serwisów, CycloPick' });
    this.meta.updateTag({ name: 'robots', content: 'index, follow, max-image-preview:large' }); // max-image-preview dla Google Discover

    // Open Graph
    this.meta.updateTag({ property: 'og:title', content: pageTitle });
    this.meta.updateTag({ property: 'og:description', content: pageDescription });
    this.meta.updateTag({ property: 'og:type', content: 'website' });
    this.meta.updateTag({ property: 'og:url', content: 'https://www.cyclopick.pl/' });
    this.meta.updateTag({ property: 'og:image', content: 'https://www.cyclopick.pl/assets/images/og-image-cyclopick.jpg' }); // Zalecane dedykowane zdjęcie 1200x630
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

    // Sanityzacja JSON-LD, aby można go było bezpiecznie wstrzyknąć do HTML
    this.schemaJson = this.sanitizer.bypassSecurityTrustHtml(
      `<script type="application/ld+json">${JSON.stringify(schema)}</script>`
    );
  }

  navigateToMap(): void {
    this.router.navigate(['/mapa-serwisow']);
  }

  navigateToForServices(): void {
    this.router.navigate(['/for-services']);
  }
}