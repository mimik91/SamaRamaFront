import { Component, OnInit, Inject, PLATFORM_ID } from '@angular/core';
import { CommonModule, isPlatformBrowser, DOCUMENT } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { Meta, Title } from '@angular/platform-browser';

@Component({
  selector: 'app-landing-page',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './landing-page.component.html',
  styleUrls: ['./landing-page.component.css']
})
export class LandingPageComponent implements OnInit {

  features = [
    {
      icon: 'map-pin',
      title: 'Ponad 2000 serwisów na mapie',
      description: 'Największa baza warsztatów rowerowych w Polsce. Znajdź serwis w swojej okolicy i sprawdź jego dane kontaktowe.'
    },
    {
      icon: 'filter',
      title: 'Filtrowanie po usługach',
      description: 'Szukasz konkretnej naprawy? Przefiltruj serwisy według oferowanych usług i znajdź specjalistę.'
    },
    {
      icon: 'star',
      title: 'Wyróżnione warsztaty',
      description: 'Szukaj niebieskich pinezek – to zweryfikowane serwisy z pełnym profilem, cennikiem i godzinami otwarcia.'
    },
    {
      icon: 'clock',
      title: 'Cenniki i godziny otwarcia',
      description: 'Wiele serwisów udostępnia cenniki usług i aktualne godziny pracy. Sprawdź przed wizytą.'
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

  constructor(
    private router: Router,
    private meta: Meta,
    private title: Title,
    @Inject(DOCUMENT) private document: Document,
    @Inject(PLATFORM_ID) private platformId: Object
  ) { }

  ngOnInit(): void {
    this.setMetaTags();
    this.setCanonicalUrl();
    this.addSchemaMarkup();
  }

  private setMetaTags(): void {
    const pageTitle = 'CycloPick | Mapa serwisów rowerowych w Polsce - znajdź warsztat rowerowy';
    const pageDescription = 'Ponad 2000 serwisów rowerowych na jednej mapie. CycloPick to największa baza warsztatów rowerowych w Polsce. Sprawdź godziny otwarcia, cenniki i oferowane usługi. Naprawa rowerów, przeglądy, regulacja hamulców i przerzutek.';
    const keywords = 'serwis rowerowy, warsztat rowerowy, naprawa rowerów, mapa serwisów rowerowych, przegląd roweru, regulacja przerzutek, naprawa hamulców, serwis rowerowy Warszawa, serwis rowerowy Kraków, CycloPick';

    this.title.setTitle(pageTitle);
    this.meta.updateTag({ name: 'description', content: pageDescription });
    this.meta.updateTag({ name: 'keywords', content: keywords });
    this.meta.updateTag({ name: 'robots', content: 'index, follow' });

    // Open Graph
    this.meta.updateTag({ property: 'og:title', content: pageTitle });
    this.meta.updateTag({ property: 'og:description', content: pageDescription });
    this.meta.updateTag({ property: 'og:type', content: 'website' });
    this.meta.updateTag({ property: 'og:url', content: 'https://www.cyclopick.pl/' });
    this.meta.updateTag({ property: 'og:image', content: 'https://www.cyclopick.pl/assets/images/logo-cyclopick.png' });
    this.meta.updateTag({ property: 'og:locale', content: 'pl_PL' });
    this.meta.updateTag({ property: 'og:site_name', content: 'CycloPick' });

    // Twitter Card
    this.meta.updateTag({ name: 'twitter:card', content: 'summary_large_image' });
    this.meta.updateTag({ name: 'twitter:title', content: pageTitle });
    this.meta.updateTag({ name: 'twitter:description', content: pageDescription });
  }

  private setCanonicalUrl(): void {
    const canonicalUrl = 'https://www.cyclopick.pl/';
    let link: HTMLLinkElement | null = this.document.querySelector("link[rel='canonical']");

    if (link) {
      link.setAttribute('href', canonicalUrl);
    } else {
      link = this.document.createElement('link');
      link.setAttribute('rel', 'canonical');
      link.setAttribute('href', canonicalUrl);
      this.document.head.appendChild(link);
    }
  }

  private addSchemaMarkup(): void {
    if (isPlatformBrowser(this.platformId)) {
      const schema = {
        '@context': 'https://schema.org',
        '@type': 'WebSite',
        'name': 'CycloPick',
        'alternateName': 'CycloPick - Mapa serwisów rowerowych',
        'url': 'https://www.cyclopick.pl/',
        'description': 'Ponad 2000 serwisów rowerowych na jednej mapie. Największa baza warsztatów rowerowych w Polsce.',
        'potentialAction': {
          '@type': 'SearchAction',
          'target': {
            '@type': 'EntryPoint',
            'urlTemplate': 'https://www.cyclopick.pl/serwisy/{city}'
          },
          'query-input': 'required name=city'
        },
        'publisher': {
          '@type': 'Organization',
          'name': 'CycloPick',
          'logo': {
            '@type': 'ImageObject',
            'url': 'https://www.cyclopick.pl/assets/images/logo-cyclopick.png'
          }
        }
      };

      const script = this.document.createElement('script');
      script.type = 'application/ld+json';
      script.text = JSON.stringify(schema);
      this.document.head.appendChild(script);
    }
  }

  navigateToMap(): void {
    this.router.navigate(['/mapa-serwisow']);
  }

  navigateToForServices(): void {
    this.router.navigate(['/for-services']);
  }

  navigateToCity(slug: string): void {
    this.router.navigate(['/serwisy', slug]);
  }
}
