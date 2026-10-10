import { Component, Inject, OnDestroy, OnInit, inject } from '@angular/core';
import { CommonModule, DOCUMENT } from '@angular/common';
import { RouterLink } from '@angular/router';
import { Meta, Title } from '@angular/platform-browser';
import { AuthService } from '../../auth/auth.service';
import { SeoService } from '../../core/seo.service';
import { SchemaOrgHelper } from '../../core/schema-org.helper';
import { BreadcrumbComponent } from '../../shared/components/breadcrumb/breadcrumb.component';

interface DocFeature {
  icon: 'camera' | 'receipt' | 'shield' | 'hash';
  title: string;
  text: string;
}

interface DocUseCase {
  icon: 'tag' | 'receipt' | 'shield' | 'wrench';
  title: string;
  text: string;
}

/**
 * Strona informacyjna „Dokumenty roweru w jednym miejscu” (/dokumenty-roweru) — opisuje profil roweru
 * w panelu klienta (zdjęcia, dowód zakupu, karta gwarancyjna, numer ramy) i prowadzi do dodania roweru.
 */
@Component({
  selector: 'app-bike-documents-page',
  standalone: true,
  imports: [CommonModule, RouterLink, BreadcrumbComponent],
  templateUrl: './bike-documents-page.component.html',
  styleUrls: ['./bike-documents-page.component.css']
})
export class BikeDocumentsPageComponent implements OnInit, OnDestroy {
  private meta = inject(Meta);
  private title = inject(Title);
  private seoService = inject(SeoService);
  private authService = inject(AuthService);

  constructor(@Inject(DOCUMENT) private document: Document) {}

  /** Zalogowany klient przechodzi od razu do formularza roweru, pozostali do rejestracji konta. */
  get addBikeLink(): string {
    return this.authService.isLoggedIn() ? '/bicycles/add' : '/register';
  }

  openFaqIndex: number | null = 0;

  readonly features: DocFeature[] = [
    { icon: 'camera', title: 'Zdjęcia roweru', text: 'Pomagają go zidentyfikować, gdy zajdzie taka potrzeba.' },
    { icon: 'receipt', title: 'Dowód zakupu', text: 'Wystarczy zdjęcie paragonu lub faktury.' },
    { icon: 'shield', title: 'Kartę gwarancyjną', text: 'Masz ją pod ręką, gdy składasz reklamację.' },
    { icon: 'hash', title: 'Numer ramy', text: 'Wpisujesz go raz i nie musisz go szukać na ramie.' }
  ];

  readonly useCases: DocUseCase[] = [
    { icon: 'tag', title: 'Sprzedajesz rower', text: 'Zdjęcia i dane masz gotowe, więc ogłoszenie przygotujesz szybciej.' },
    { icon: 'receipt', title: 'Reklamujesz część', text: 'Otwierasz profil roweru i znajdujesz paragon bez przekopywania szuflad.' },
    { icon: 'shield', title: 'Rozmawiasz z ubezpieczycielem', text: 'Pokazujesz zdjęcia roweru, dowód zakupu i numer ramy.' },
    { icon: 'wrench', title: 'Oddajesz rower do serwisu', text: 'Serwis widzi podstawowe dane techniczne roweru. Twoich dokumentów nie widzi.' }
  ];

  readonly steps: string[] = [
    'Dodaj rower do swojego garażu w CycloPick.',
    'Wpisz numer ramy i dodaj zdjęcia roweru oraz dokumentów.',
    'Wracaj do zapisanych informacji, gdy ich potrzebujesz.'
  ];

  readonly youSee: string[] = ['Zdjęcia roweru', 'Dowód zakupu', 'Kartę gwarancyjną', 'Numer ramy', 'Dane techniczne'];

  readonly faqData: Array<{ question: string; answer: string }> = [
    {
      question: 'Czy mogę dodać zdjęcia dokumentów?',
      answer: 'Tak. Dodasz zdjęcia roweru oraz dokumentów, na przykład dowodu zakupu i karty gwarancyjnej.'
    },
    {
      question: 'Czy mogę zapisać kilka rowerów?',
      answer: 'Tak. Każdy rower ma osobny profil z własnymi zdjęciami i dokumentami.'
    },
    {
      question: 'Czy serwis zobaczy mój dowód zakupu lub kartę gwarancyjną?',
      answer: 'Nie. Serwis widzi dane techniczne roweru, ale nie ma dostępu do Twoich dokumentów.'
    },
    {
      question: 'Jakie formaty zdjęć obsługuje CycloPick?',
      answer: 'JPG i PNG. Zrób zdjęcie dokumentu telefonem i dodaj je do profilu.'
    }
  ];

  ngOnInit(): void {
    this.setMetaTags();
    this.setCanonicalUrl();
    this.generateSchemaMarkup();
  }

  ngOnDestroy(): void {
    this.seoService.removeStructuredData();
  }

  toggleFaq(index: number): void {
    this.openFaqIndex = this.openFaqIndex === index ? null : index;
  }

  scrollTo(id: string): void {
    this.document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  private setMetaTags(): void {
    const pageTitle = 'Dokumenty roweru w jednym miejscu | CycloPick';
    const pageDescription = 'Zdjęcia roweru, dowód zakupu, karta gwarancyjna i numer ramy w jednym profilu roweru. Sięgniesz po nie przy sprzedaży, reklamacji albo rozmowie z ubezpieczycielem.';

    this.title.setTitle(pageTitle);
    this.meta.updateTag({ name: 'description', content: pageDescription });
    this.meta.updateTag({ name: 'robots', content: 'index, follow, max-image-preview:large' });

    this.meta.updateTag({ property: 'og:title', content: pageTitle });
    this.meta.updateTag({ property: 'og:description', content: pageDescription });
    this.meta.updateTag({ property: 'og:type', content: 'website' });
    this.meta.updateTag({ property: 'og:url', content: 'https://www.cyclopick.pl/dokumenty-roweru' });
    this.meta.updateTag({ property: 'og:image', content: 'https://www.cyclopick.pl/assets/images/og-image-cyclopick.jpg' });
    this.meta.updateTag({ property: 'og:locale', content: 'pl_PL' });
    this.meta.updateTag({ property: 'og:site_name', content: 'CycloPick' });
  }

  private setCanonicalUrl(): void {
    const existingLink = this.document.querySelector('link[rel="canonical"]');
    if (existingLink) existingLink.remove();
    const link = this.document.createElement('link');
    link.setAttribute('rel', 'canonical');
    link.setAttribute('href', 'https://www.cyclopick.pl/dokumenty-roweru');
    this.document.head.appendChild(link);
  }

  private generateSchemaMarkup(): void {
    const breadcrumb = SchemaOrgHelper.generateBreadcrumb([
      { name: 'Strona główna', url: 'https://www.cyclopick.pl/' },
      { name: 'Dokumenty roweru', url: 'https://www.cyclopick.pl/dokumenty-roweru' }
    ]);

    this.seoService.addMultipleStructuredData([
      SchemaOrgHelper.generateOrganization(),
      breadcrumb,
      SchemaOrgHelper.generateFAQPage(this.faqData)
    ].filter(Boolean));
  }
}
