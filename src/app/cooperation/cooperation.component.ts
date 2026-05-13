import { Component, OnInit, OnDestroy, Inject, PLATFORM_ID, inject } from '@angular/core';
import { CommonModule, isPlatformBrowser, DOCUMENT } from '@angular/common';
import { RouterModule } from '@angular/router';
import { Meta, Title } from '@angular/platform-browser';
import { SeoService } from '../core/seo.service';
import { SchemaOrgHelper } from '../core/schema-org.helper';

@Component({
  selector: 'app-cooperation',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './cooperation.component.html',
  styleUrls: ['./cooperation.component.css']
})
export class CooperationComponent implements OnInit, OnDestroy {
  private seoService = inject(SeoService);

  cooperationAreas = [
    {
      title: 'Rozwój aplikacji',
      image: 'assets/images/cooperation/dev.webp',
      description: 'Pomóż nam rozwijać CycloPick od strony technologicznej. Kod, UX, mobilne innowacje — Twoje pomysły mogą realnie ulepszyć nasz produkt.'
    },
    {
      title: 'Marketing i promocja',
      image: 'assets/images/cooperation/marketing.webp',
      description: 'Pomóż nam dotrzeć do tysięcy rowerzystów w całej Polsce. Jeśli potrafisz angażować ludzi, Twoje miejsce jest właśnie tutaj.'
    },
    {
      title: 'Biznes i strategia',
      image: 'assets/images/cooperation/strategy.webp',
      description: 'Współtwórz model działania CycloPick, wspieraj nas wiedzą z zakresu logistyki, partnerstw i skalowania biznesu.'
    },
    {
      title: 'Społeczność i eventy',
      image: 'assets/images/cooperation/events.webp',
      description: 'Łącz ludzi, organizuj wydarzenia i buduj społeczność miłośników rowerów. Wspólnie napędzajmy pasję do dwóch kółek.'
    },
    {
      title: 'Serwisy i warsztaty',
      image: 'assets/images/cooperation/workshop.webp',
      description: 'Dołącz do naszej sieci partnerów serwisowych. Wspólnie sprawmy, by każdy rower był w najlepszych rękach.'
    },
    {
      title: 'Inne pomysły',
      image: 'assets/images/cooperation/ideas2.webp',
      description: 'Masz coś, co nie pasuje do powyższych kategorii? Świetnie! Napisz do nas – każda świeża perspektywa ma znaczenie.'
    }
  ];

  benefits = [
    {
      title: 'Buduj przyszłość branży rowerowej',
      icon: '🚴‍♀️',
      description: 'Twórz rozwiązania, które realnie wpływają na sposób, w jaki ludzie dbają o swoje rowery.'
    },
    {
      title: 'Rozwijaj swoje umiejętności',
      icon: '💡',
      description: 'Zdobądź doświadczenie w startupie, który łączy technologię, pasję i społeczność.'
    },
    {
      title: 'Miej wpływ',
      icon: '🎯',
      description: 'Twoje pomysły nie zginą w skrzynce mailowej — u nas liczy się każdy głos.'
    },
    {
      title: 'Dołącz do ludzi z pasją',
      icon: '❤️',
      description: 'Pracuj wśród osób, które myślą podobnie, działają z sercem i cieszą się każdą przejażdżką.'
    }
  ];

  constructor(
    private meta: Meta,
    private title: Title,
    @Inject(PLATFORM_ID) private platformId: Object,
    @Inject(DOCUMENT) private document: Document
  ) { }

  ngOnInit(): void {
    this.setMetaTags();
    this.setCanonicalUrl();
    this.seoService.addStructuredData(SchemaOrgHelper.generateOrganization());
  }

  ngOnDestroy(): void {
    this.seoService.removeStructuredData();
  }

  private setMetaTags(): void {
    const pageTitle = 'Współpraca z CycloPick | Dołącz do zespołu rowerowego startupu';
    const pageDescription = 'Dołącz do CycloPick - startupu zmieniającego branżę rowerową w Polsce. Szukamy osób do współpracy w obszarach: rozwój aplikacji, marketing, biznes, organizacja eventów rowerowych. Współtwórz przyszłość serwisów rowerowych!';
    const keywords = 'współpraca CycloPick, praca startup rowerowy, dołącz do CycloPick, kariera rowery, startup Polska, branża rowerowa, marketing rowerowy, aplikacja rowerowa, serwis rowerowy współpraca';

    this.title.setTitle(pageTitle);
    this.meta.updateTag({ name: 'description', content: pageDescription });
    this.meta.updateTag({ name: 'keywords', content: keywords });
    this.meta.updateTag({ name: 'robots', content: 'index, follow' });

    // Open Graph
    this.meta.updateTag({ property: 'og:title', content: pageTitle });
    this.meta.updateTag({ property: 'og:description', content: pageDescription });
    this.meta.updateTag({ property: 'og:type', content: 'website' });
    this.meta.updateTag({ property: 'og:url', content: 'https://www.cyclopick.pl/cooperation' });
    this.meta.updateTag({ property: 'og:image', content: 'https://www.cyclopick.pl/assets/images/logo-cyclopick.webp' });
    this.meta.updateTag({ property: 'og:locale', content: 'pl_PL' });

    this.meta.updateTag({ name: 'twitter:card', content: 'summary_large_image' });
    this.meta.updateTag({ name: 'twitter:title', content: pageTitle });
    this.meta.updateTag({ name: 'twitter:description', content: pageDescription });
    this.meta.updateTag({ name: 'twitter:image', content: 'https://www.cyclopick.pl/assets/images/logo-cyclopick.webp' });
  }

  private setCanonicalUrl(): void {
    const canonicalUrl = 'https://www.cyclopick.pl/cooperation';
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
