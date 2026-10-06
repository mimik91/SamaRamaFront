import { AfterViewInit, Component, ElementRef, Inject, NgZone, OnDestroy, OnInit, PLATFORM_ID, ViewChild, inject } from '@angular/core';
import { CommonModule, DOCUMENT, isPlatformBrowser } from '@angular/common';
import { RouterModule } from '@angular/router';
import { Meta, Title } from '@angular/platform-browser';
import { SeoService } from '../../core/seo.service';
import { SchemaOrgHelper } from '../../core/schema-org.helper';
import { BreadcrumbComponent } from '../../shared/components/breadcrumb/breadcrumb.component';

@Component({
  selector: 'app-jak-dziala-ekspresowa-wymiana-detki',
  standalone: true,
  imports: [CommonModule, RouterModule, BreadcrumbComponent],
  templateUrl: './jak-dziala-ekspresowa-wymiana-detki.component.html',
  styleUrls: ['./jak-dziala-ekspresowa-wymiana-detki.component.css']
})
export class JakDzialaEkspresowaWymianaDetkiComponent implements OnInit, AfterViewInit, OnDestroy {
  private platformId = inject(PLATFORM_ID);
  private ngZone = inject(NgZone);

  @ViewChild('reviewsTrack') reviewsTrackRef!: ElementRef<HTMLElement>;

  // Marquee state — opinie (ten sam mechanizm co na /krakow/jak-dziala-serwis-ekspresowy)
  private reviewsRafId: number | null = null;
  private reviewsPos = 0;
  private reviewsHalfWidth = 0;
  private readonly REVIEWS_SPEED = 0.4;

  isReviewsDragging = false;
  private reviewsDragStartX = 0;
  private reviewsDragStartPos = 0;

  private readonly onReviewsMouseMoveBound = (e: MouseEvent) => this.onReviewsMouseMove(e);
  private readonly onReviewsMouseUpBound = () => this.onReviewsDragEnd();
  private readonly onReviewsTouchMoveBound = (e: TouchEvent) => this.onReviewsTouchMove(e);
  private readonly onReviewsTouchEndBound = () => this.onReviewsDragEnd();

  readonly reviewImages = [
    'assets/images/opinie/opinia 1.webp',
    'assets/images/opinie/opinia 2.webp',
    'assets/images/opinie/opinia 3.webp',
    'assets/images/opinie/opinia 4.webp',
    'assets/images/opinie/opinia 5.webp',
    'assets/images/opinie/opinia 6.webp',
    'assets/images/opinie/opinia 7.webp',
    'assets/images/opinie/opinia 8.webp',
    'assets/images/opinie/opinia 9.webp',
    'assets/images/opinie/opinia 10.webp'
  ];

  readonly howToSteps = [
    {
      name: 'Zamów wymianę dętki (nawet dzisiaj)',
      text: 'Na stronie rezerwacji wybierz pakiet "Wymiana dętki". Działamy w dni robocze, od poniedziałku do piątku, a termin wybierzesz nawet na dziś. Zamów przed 20:00, a kurier przyjedzie jeszcze tego samego dnia.'
    },
    {
      name: 'Wybierz miejsce odbioru roweru',
      text: 'Zdecyduj, czy kurier ma odebrać i zwrócić rower pod biuro, czy pod adres domowy, w granicach IV obwodnicy Krakowa. W szczegółach zlecenia możesz opisać rower i dokładnie wskazać, gdzie się znajduje — w razie wątpliwości kurier się z Tobą skontaktuje.'
    },
    {
      name: 'Kurier odbiera rower i jedzie do warsztatu',
      text: 'Kurier CycloPick odbiera rower we wskazanym miejscu i dowozi go do sprawdzonego partnera w Krakowie. Wymiana dętki to najprostsza naprawa, jaką robimy, więc traktujemy ją priorytetowo.'
    },
    {
      name: 'Odbierz gotowy rower (zwykle w mniej niż godzinę)',
      text: 'W ponad 90% przypadków rower wraca do Ciebie w mniej niż godzinę od odbioru przez kuriera. Gwarantowany maksymalny czas to 24h. Otrzymujesz potwierdzenie mailem.'
    }
  ];

  readonly faqData = [
    {
      question: 'Jak szybko wymienicie dętkę w moim rowerze?',
      answer: 'Wymiana dętki to nasza najszybsza usługa ekspresowa. W ponad 90% przypadków zwracamy rower w mniej niż godzinę od odbioru przez kuriera. Gwarantowany maksymalny czas to 24h, czyli margines bezpieczeństwa na wyjątkowe sytuacje.'
    },
    {
      question: 'Czy mogę zamówić wymianę dętki na dziś?',
      answer: 'Tak. Jeśli złożysz zamówienie przed 20:00, kurier odbierze rower jeszcze tego samego dnia. Po 20:00 odbiór przechodzi na następny poranek.'
    },
    {
      question: 'Ile kosztuje wymiana dętki i czy dętka jest wliczona w cenę?',
      answer: 'Cenę zobaczysz przy wyborze pakietu "Wymiana dętki" w formularzu rezerwacji. Obejmuje ona standardową dętkę oraz transport w obie strony. Jeśli wymiana okaże się bardziej skomplikowana, zadzwonimy i zapytamy, czy mimo wyższej ceny chcesz, żebyśmy wykonali usługę. Obsługujemy też koła z oponami bezdętkowymi (tubeless) — w takim przypadku usługa kosztuje 150 zł.'
    },
    {
      question: 'Co jeśli okaże się, że to nie tylko dętka, tylko też opona?',
      answer: 'Pakiet obejmuje wyłącznie wymianę dętki. Jeśli mechanik stwierdzi, że trzeba wymienić też oponę, zadzwoni i zapyta, czy się na to zgadzasz. Po Twojej zgodzie wymieni ją od razu w tej samej wizycie. Robocizna jest już w cenie pakietu, dopłacasz tylko za samą oponę.'
    },
    {
      question: 'Jaką dętkę i wentyl zamontujecie?',
      answer: 'Standardowo montujemy dętkę z wentylem Presta. Jeśli wolisz wentyl samochodowy (Schrader), napisz to w szczegółach zlecenia — zamontujemy taki, jeśli będzie dostępny. Jeśli akurat nie będziemy mieli na miejscu pasującej dętki, skontaktujemy się i zapytamy, czy wolisz poczekać, aż ją sprowadzimy, czy żebyśmy zwrócili rower bez naprawy.'
    },
    {
      question: 'Skąd kurier będzie wiedział, gdzie jest mój rower i o której dokładnie przyjedzie?',
      answer: 'W szczegółach zlecenia możesz opisać rower oraz dokładnie wskazać, gdzie się znajduje. Po złożeniu zamówienia kontaktujemy się, aby doprecyzować dokładny termin odbioru, a w razie dodatkowych wątpliwości kurier skontaktuje się z Tobą jeszcze raz przed przyjazdem. Zazwyczaj dzwonimy — jeśli wolisz kontakt mailowy lub SMS, napisz to w szczegółach zlecenia, a dostosujemy się.'
    },
    {
      question: 'Czy mogę zrezygnować, jeśli wymiana okaże się droższa niż standardowa?',
      answer: 'Tak. Jeśli po naszym kontakcie zdecydujesz się zrezygnować z naprawy, pobierzemy opłatę tylko za transport roweru.'
    },
    {
      question: 'Co jeśli usługa nie dojdzie do skutku z Waszej winy?',
      answer: 'Podejmujemy próby kontaktu, aby zrealizować usługę zgodnie z zamówieniem. Jeśli z naszej winy nie dojdzie do jej wykonania, zwracamy pieniądze.'
    },
    {
      question: 'Czy usługa działa w całym Krakowie?',
      answer: 'Odbiór i zwrot działają w granicach IV obwodnicy Krakowa, czyli m.in. Stare Miasto, Krowodrza, Zwierzyniec, Dębniki (w tym Ruczaj), Podgórze, Grzegórzki i Nowa Huta. Adres poza tym obszarem też możemy obsłużyć, ale napisz lub zadzwoń do nas przed rezerwacją, żeby to uzgodnić — zwykle wiąże się to z niewielką dopłatą, którą ustalamy bardzo szybko.'
    },
    {
      question: 'Czy muszę założyć konto, żeby zamówić usługę?',
      answer: 'Nie, konto nie jest wymagane do złożenia zamówienia. Służy wyłącznie do śledzenia statusu naprawy.'
    },
    {
      question: 'Czy mój rower jest ubezpieczony podczas transportu?',
      answer: 'Tak, każdy rower przewożony przez CycloPick objęty jest ubezpieczeniem do 20 000 zł na czas transportu.'
    },
    {
      question: 'Jak zapłacić?',
      answer: 'Płatność odbywa się online przez PayU: kartą, BLIK-iem lub przelewem. Jest wymagana od razu po złożeniu rezerwacji, aby potwierdzić termin.'
    },
    {
      question: 'A jeśli mój rower potrzebuje czegoś więcej niż wymiana dętki?',
      answer: 'Wybierz pakiet "Przegląd ogólny" zamiast "Wymiana dętki" w formularzu rezerwacji. Mechanik zajmie się szerszym zakresem prac. Sprawdź, jak działa cały serwis ekspresowy CycloPick.'
    }
  ];

  constructor(
    private meta: Meta,
    private title: Title,
    private seoService: SeoService,
    @Inject(DOCUMENT) private document: Document
  ) { }

  ngOnInit(): void {
    this.setMetaTags();
    this.setCanonicalUrl();
    this.generateSchemaMarkup();
  }

  ngAfterViewInit(): void {
    setTimeout(() => this.startReviewsMarquee(), 100);
  }

  ngOnDestroy(): void {
    this.seoService.removeStructuredData();
    this.stopReviewsMarquee();
    if (isPlatformBrowser(this.platformId)) {
      document.removeEventListener('mousemove', this.onReviewsMouseMoveBound);
      document.removeEventListener('mouseup', this.onReviewsMouseUpBound);
      document.removeEventListener('touchmove', this.onReviewsTouchMoveBound);
      document.removeEventListener('touchend', this.onReviewsTouchEndBound);
    }
  }

  scrollToSteps(): void {
    const el = this.document.getElementById('jak-to-dziala');
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  // ============================================================
  // REVIEWS MARQUEE
  // ============================================================

  private startReviewsMarquee(): void {
    if (!isPlatformBrowser(this.platformId)) return;
    const track = this.reviewsTrackRef?.nativeElement;
    if (!track) return;

    this.reviewsHalfWidth = track.scrollWidth / 2;
    if (this.reviewsHalfWidth === 0) return;

    this.stopReviewsMarquee();

    this.ngZone.runOutsideAngular(() => {
      const step = () => {
        if (!this.isReviewsDragging) {
          this.reviewsPos += this.REVIEWS_SPEED;
          if (this.reviewsPos >= this.reviewsHalfWidth) {
            this.reviewsPos = 0;
          }
          track.style.transform = `translateX(-${this.reviewsPos}px)`;
        }
        this.reviewsRafId = requestAnimationFrame(step);
      };
      this.reviewsRafId = requestAnimationFrame(step);
    });
  }

  private stopReviewsMarquee(): void {
    if (this.reviewsRafId !== null) {
      cancelAnimationFrame(this.reviewsRafId);
      this.reviewsRafId = null;
    }
  }

  onReviewsMouseDown(e: MouseEvent): void {
    this.isReviewsDragging = true;
    this.reviewsDragStartX = e.clientX;
    this.reviewsDragStartPos = this.reviewsPos;
    document.addEventListener('mousemove', this.onReviewsMouseMoveBound);
    document.addEventListener('mouseup', this.onReviewsMouseUpBound);
  }

  onReviewsTouchStart(e: TouchEvent): void {
    this.isReviewsDragging = true;
    this.reviewsDragStartX = e.touches[0].clientX;
    this.reviewsDragStartPos = this.reviewsPos;
    document.addEventListener('touchmove', this.onReviewsTouchMoveBound, { passive: true });
    document.addEventListener('touchend', this.onReviewsTouchEndBound);
  }

  private onReviewsMouseMove(e: MouseEvent): void {
    this.handleReviewsDragMove(e.clientX);
  }

  private onReviewsTouchMove(e: TouchEvent): void {
    this.handleReviewsDragMove(e.touches[0].clientX);
  }

  private handleReviewsDragMove(clientX: number): void {
    if (!this.isReviewsDragging) return;
    const delta = this.reviewsDragStartX - clientX;
    let newPos = this.reviewsDragStartPos + delta;
    newPos = ((newPos % this.reviewsHalfWidth) + this.reviewsHalfWidth) % this.reviewsHalfWidth;
    this.reviewsPos = newPos;
    const track = this.reviewsTrackRef?.nativeElement;
    if (track) track.style.transform = `translateX(-${this.reviewsPos}px)`;
  }

  private onReviewsDragEnd(): void {
    this.isReviewsDragging = false;
    document.removeEventListener('mousemove', this.onReviewsMouseMoveBound);
    document.removeEventListener('mouseup', this.onReviewsMouseUpBound);
    document.removeEventListener('touchmove', this.onReviewsTouchMoveBound);
    document.removeEventListener('touchend', this.onReviewsTouchEndBound);
  }

  private setMetaTags(): void {
    const pageTitle = 'Ekspresowa wymiana dętki Kraków | CycloPick';
    const pageDescription = 'Złapałeś gumę w Krakowie? Wymieniamy dętkę zwykle w mniej niż godzinę od odbioru, z odbiorem nawet dziś spod biura lub domu. Sprawdź, jak to działa.';

    this.title.setTitle(pageTitle);
    this.meta.updateTag({ name: 'description', content: pageDescription });
    this.meta.updateTag({ name: 'keywords', content: 'wymiana dętki Kraków, przebita dętka Kraków, pogotowie rowerowe Kraków, naprawa dętki z dojazdem, guma w rowerze Kraków, serwis ekspresowy Kraków, CycloPick' });
    this.meta.updateTag({ name: 'robots', content: 'index, follow, max-image-preview:large' });

    this.meta.updateTag({ property: 'og:title', content: pageTitle });
    this.meta.updateTag({ property: 'og:description', content: pageDescription });
    this.meta.updateTag({ property: 'og:type', content: 'website' });
    this.meta.updateTag({ property: 'og:url', content: 'https://www.cyclopick.pl/krakow/jak-dziala-ekspresowa-wymiana-detki' });
    this.meta.updateTag({ property: 'og:image', content: 'https://www.cyclopick.pl/assets/images/og-image-cyclopick.jpg' });
    this.meta.updateTag({ property: 'og:locale', content: 'pl_PL' });
    this.meta.updateTag({ property: 'og:site_name', content: 'CycloPick' });

    this.meta.updateTag({ name: 'twitter:card', content: 'summary_large_image' });
    this.meta.updateTag({ name: 'twitter:title', content: pageTitle });
    this.meta.updateTag({ name: 'twitter:description', content: pageDescription });
    this.meta.updateTag({ name: 'twitter:image', content: 'https://www.cyclopick.pl/assets/images/og-image-cyclopick.jpg' });
  }

  private setCanonicalUrl(): void {
    const canonicalUrl = 'https://www.cyclopick.pl/krakow/jak-dziala-ekspresowa-wymiana-detki';
    const existingLink = this.document.querySelector('link[rel="canonical"]');
    if (existingLink) existingLink.remove();
    const link = this.document.createElement('link');
    link.setAttribute('rel', 'canonical');
    link.setAttribute('href', canonicalUrl);
    this.document.head.appendChild(link);
  }

  private generateSchemaMarkup(): void {
    const tubeReplacementService = {
      '@context': 'https://schema.org',
      '@type': 'Service',
      '@id': 'https://www.cyclopick.pl/krakow/jak-dziala-ekspresowa-wymiana-detki#wymiana-detki-service',
      name: 'Ekspresowa wymiana dętki roweru — Kraków',
      serviceType: 'Ekspresowa wymiana dętki roweru z odbiorem kurierem',
      description: 'Ekspresowa wymiana dętki w Krakowie z odbiorem i zwrotem roweru kurierem CycloPick. W ponad 90% przypadków rower wraca w mniej niż godzinę od odbioru, maksymalnie w 24h. Odbiór nawet tego samego dnia (zamówienia do 20:00), w granicach IV obwodnicy Krakowa.',
      areaServed: { '@type': 'City', name: 'Kraków', addressCountry: 'PL' },
      provider: { '@type': 'Organization', name: 'CycloPick', url: 'https://www.cyclopick.pl' },
      isPartOf: { '@id': 'https://www.cyclopick.pl/krakow/jak-dziala-serwis-ekspresowy#express-service' },
      potentialAction: {
        '@type': 'ReserveAction',
        target: 'https://www.cyclopick.pl/krakow/zarezerwuj?pakiet=detka'
      }
    };

    const breadcrumb = SchemaOrgHelper.generateBreadcrumb([
      { name: 'Strona główna', url: 'https://www.cyclopick.pl/' },
      { name: 'Jak działa serwis ekspresowy', url: 'https://www.cyclopick.pl/krakow/jak-dziala-serwis-ekspresowy' },
      { name: 'Ekspresowa wymiana dętki', url: 'https://www.cyclopick.pl/krakow/jak-dziala-ekspresowa-wymiana-detki' }
    ]);

    const howTo = SchemaOrgHelper.generateHowTo(
      'Jak zamówić ekspresową wymianę dętki w Krakowie',
      'Cztery kroki do wymiany dętki z odbiorem i zwrotem kurierem CycloPick w Krakowie, zwykle w mniej niż godzinę.',
      this.howToSteps.map(s => ({ name: s.name, text: s.text }))
    );

    const faqPage = SchemaOrgHelper.generateFAQPage(this.faqData);

    this.seoService.addMultipleStructuredData([
      SchemaOrgHelper.generateOrganization(),
      tubeReplacementService,
      breadcrumb,
      howTo,
      faqPage
    ].filter(Boolean));
  }
}
