import { Component, Inject, OnDestroy, OnInit, inject } from '@angular/core';
import { CommonModule, DOCUMENT } from '@angular/common';
import { RouterLink } from '@angular/router';
import { Meta, Title } from '@angular/platform-browser';
import { AuthService } from '../../auth/auth.service';
import { SeoService } from '../../core/seo.service';
import { SchemaOrgHelper } from '../../core/schema-org.helper';
import { BreadcrumbComponent } from '../../shared/components/breadcrumb/breadcrumb.component';

interface HistoryFeature {
  icon: 'calendar' | 'wrench' | 'search' | 'sliders' | 'receipt' | 'shop';
  title: string;
  text: string;
}

interface HistoryUseCase {
  icon: 'wrench' | 'heart' | 'cart' | 'tag';
  title: string;
  text: string;
}

interface HistoryStep {
  lead: string;
  text: string;
}

/**
 * Strona informacyjna „Historia serwisowa roweru” (/historia-serwisowa-roweru) — wyjaśnia, jak serwis
 * współpracujący z CycloPick zapisuje naprawy w profilu roweru, i prowadzi do dodania roweru.
 */
@Component({
  selector: 'app-bike-history-info-page',
  standalone: true,
  imports: [CommonModule, RouterLink, BreadcrumbComponent],
  templateUrl: './bike-history-info-page.component.html',
  styleUrls: ['./bike-history-info-page.component.css']
})
export class BikeHistoryInfoPageComponent implements OnInit, OnDestroy {
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

  readonly features: HistoryFeature[] = [
    { icon: 'calendar', title: 'Przeglądy okresowe', text: 'Sprawdzisz, kiedy rower był serwisowany.' },
    { icon: 'wrench', title: 'Naprawy i wymiany części', text: 'Zobaczysz, jakie prace zostały wykonane.' },
    { icon: 'search', title: 'Diagnozy serwisowe', text: 'Sprawdzisz, jakie problemy zostały rozpoznane przez serwis.' },
    { icon: 'sliders', title: 'Regulacje i ustawienia', text: 'Zachowasz informacje o wykonanych czynnościach serwisowych.' },
    { icon: 'receipt', title: 'Daty i koszty', text: 'Sprawdzisz, kiedy wykonano usługę i ile kosztowała.' },
    { icon: 'shop', title: 'Dane serwisu', text: 'Zobaczysz, który serwis odpowiada za dany wpis.' }
  ];

  readonly useCases: HistoryUseCase[] = [
    {
      icon: 'wrench',
      title: 'Oddajesz rower do serwisu',
      text: 'Mechanik może sprawdzić wcześniejsze naprawy i diagnozy. Dzięki temu łatwiej ustalić, co już było robione i od czego zacząć dalszą diagnostykę.'
    },
    {
      icon: 'heart',
      title: 'Chcesz zadbać o rower',
      text: 'Nie musisz polegać wyłącznie na pamięci. Sprawdzisz, kiedy wymieniano łańcuch, klocki hamulcowe czy inne części, i łatwiej zaplanujesz kolejne wizyty w serwisie.'
    },
    {
      icon: 'cart',
      title: 'Kupujesz części',
      text: 'Jeśli w historii zapisano model zamontowanej części, możesz sprawdzić tę informację przed zakupem. Mniej zgadywania, większa szansa na dobranie właściwego elementu.'
    },
    {
      icon: 'tag',
      title: 'Sprzedajesz rower',
      text: 'Historia napraw pomaga pokazać, jak dbano o rower. Możesz otworzyć ją na telefonie i pokazać potencjalnemu kupującemu daty oraz zakres wykonanych prac. To dodatkowa informacja, która może ułatwić ocenę stanu roweru i budować zaufanie.'
    }
  ];

  readonly steps: HistoryStep[] = [
    { lead: 'Dodajesz rower', text: 'do swojego garażu w CycloPick.' },
    {
      lead: 'Oddajesz go do serwisu współpracującego z CycloPick.',
      text: 'Po wykonanej usłudze serwis dodaje wpis do historii.'
    },
    {
      lead: 'Sprawdzasz historię, kiedy potrzebujesz.',
      text: 'W profilu roweru znajdziesz zapisane daty, opisy prac, koszty i informacje o serwisie.'
    }
  ];

  readonly faqData: Array<{ question: string; answer: string }> = [
    {
      question: 'Czy mogę samodzielnie dodawać wpisy do historii?',
      answer: 'Nie. Wpisy dotyczące napraw i przeglądów dodają serwisy współpracujące z CycloPick. Dzięki temu historia dokumentuje prace zgłoszone przez serwis, a nie tylko własne notatki właściciela.'
    },
    {
      question: 'Czy serwis widzi wcześniejsze naprawy mojego roweru?',
      answer: 'Tak. Serwis współpracujący z CycloPick może sprawdzić wcześniejsze wpisy w historii serwisowej. Ułatwia to poznanie historii napraw i przygotowanie się do kolejnej usługi.'
    },
    {
      question: 'Czy mogę prowadzić historię kilku rowerów?',
      answer: 'Tak. Każdy rower dodany do Twojego garażu ma własny profil i własną historię serwisową.'
    },
    {
      question: 'Jakie informacje są zapisywane w historii?',
      answer: 'Historia może zawierać datę usługi, opis wykonanych prac, informacje o wymienionych częściach, koszt oraz dane serwisu, który wykonał usługę.'
    },
    {
      question: 'Czy mogę pokazać historię serwisową osobie, która chce kupić mój rower?',
      answer: 'Tak. Możesz otworzyć historię na telefonie i pokazać ją potencjalnemu kupującemu. Dzięki temu łatwiej przedstawić udokumentowane naprawy i przeglądy.'
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
    const pageTitle = 'Historia serwisowa roweru | CycloPick';
    const pageDescription = 'Historia napraw i przeglądów Twojego roweru w jednym miejscu: daty, zakres prac, wymienione części, koszty i dane serwisu. Jak książka serwisowa samochodu, tylko dla roweru.';

    this.title.setTitle(pageTitle);
    this.meta.updateTag({ name: 'description', content: pageDescription });
    this.meta.updateTag({ name: 'robots', content: 'index, follow, max-image-preview:large' });

    this.meta.updateTag({ property: 'og:title', content: pageTitle });
    this.meta.updateTag({ property: 'og:description', content: pageDescription });
    this.meta.updateTag({ property: 'og:type', content: 'website' });
    this.meta.updateTag({ property: 'og:url', content: 'https://www.cyclopick.pl/historia-serwisowa-roweru' });
    this.meta.updateTag({ property: 'og:image', content: 'https://www.cyclopick.pl/assets/images/og-image-cyclopick.jpg' });
    this.meta.updateTag({ property: 'og:locale', content: 'pl_PL' });
    this.meta.updateTag({ property: 'og:site_name', content: 'CycloPick' });
  }

  private setCanonicalUrl(): void {
    const existingLink = this.document.querySelector('link[rel="canonical"]');
    if (existingLink) existingLink.remove();
    const link = this.document.createElement('link');
    link.setAttribute('rel', 'canonical');
    link.setAttribute('href', 'https://www.cyclopick.pl/historia-serwisowa-roweru');
    this.document.head.appendChild(link);
  }

  private generateSchemaMarkup(): void {
    const breadcrumb = SchemaOrgHelper.generateBreadcrumb([
      { name: 'Strona główna', url: 'https://www.cyclopick.pl/' },
      { name: 'Historia serwisowa roweru', url: 'https://www.cyclopick.pl/historia-serwisowa-roweru' }
    ]);

    this.seoService.addMultipleStructuredData([
      SchemaOrgHelper.generateOrganization(),
      breadcrumb,
      SchemaOrgHelper.generateFAQPage(this.faqData)
    ].filter(Boolean));
  }
}
