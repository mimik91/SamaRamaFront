import { AfterViewInit, Component, ElementRef, Inject, NgZone, OnDestroy, OnInit, PLATFORM_ID, ViewChild, inject } from '@angular/core';
import { CommonModule, DOCUMENT, isPlatformBrowser } from '@angular/common';
import { RouterModule } from '@angular/router';
import { Meta, Title } from '@angular/platform-browser';
import { SeoService } from '../../core/seo.service';
import { SchemaOrgHelper } from '../../core/schema-org.helper';
import { BreadcrumbComponent } from '../../shared/components/breadcrumb/breadcrumb.component';

@Component({
  selector: 'app-jak-dziala-serwis-ekspresowy',
  standalone: true,
  imports: [CommonModule, RouterModule, BreadcrumbComponent],
  templateUrl: './jak-dziala-serwis-ekspresowy.component.html',
  styleUrls: ['./jak-dziala-serwis-ekspresowy.component.css']
})
export class JakDzialaSerwisEkspresowyComponent implements OnInit, AfterViewInit, OnDestroy {
  private platformId = inject(PLATFORM_ID);
  private ngZone = inject(NgZone);

  @ViewChild('reviewsTrack') reviewsTrackRef!: ElementRef<HTMLElement>;

  // Marquee state — opinie (ten sam mechanizm co na /transport-rowerow-krakow)
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
      name: 'Wybierz pakiet i termin',
      text: 'Na stronie rezerwacji wybierz pakiet serwisowy dopasowany do Twojego roweru oraz dostępny termin. Serwis ekspresowy działa w dni robocze, od poniedziałku do piątku.'
    },
    {
      name: 'Wybierz sposób odbioru roweru',
      text: 'Zdecyduj, czy kurier ma odebrać rower rano z biura, czy wieczorem z domu. Obie opcje mają inny harmonogram zwrotu, opisany w wariantach poniżej.'
    },
    {
      name: 'Kurier odbiera rower i trafia on do serwisu',
      text: 'Kurier CycloPick odbiera rower we wskazanym miejscu i dowozi go do sprawdzonego warsztatu w Krakowie, wybranego przez nas spośród najlepszych partnerów. Mechanicy wykonują zakres prac z wybranego pakietu.'
    },
    {
      name: 'Odbierz gotowy rower',
      text: 'Gdy naprawa jest gotowa, kurier zwraca rower pod wskazany adres. Otrzymujesz potwierdzenie mailem, a wykonana usługa trafia do cyfrowej historii serwisowej Twojego roweru.'
    }
  ];

  readonly faqData = [
    {
      question: 'Czym jest serwis ekspresowy CycloPick w Krakowie?',
      answer: 'Serwis ekspresowy to usługa serwisowa z transportem „od drzwi do drzwi" w Krakowie. Rezerwujesz pakiet serwisowy online, a CycloPick organizuje odbiór roweru kurierem, wybiera warsztat i dowozi gotowy rower z powrotem. Nie dzwonisz do serwisu ani nie wozisz roweru sam.'
    },
    {
      question: 'Ile trwa serwis ekspresowy i czym różnią się warianty odbioru?',
      answer: 'Przy odbiorze z biura kurier odbiera rower rano i zwraca go tego samego dnia przed 17:00. Przy odbiorze z domu kurier odbiera rower wieczorem i zwraca go pod dom następnego dnia wieczorem.'
    },
    {
      question: 'Ile kosztuje serwis ekspresowy? Czy transport jest płatny osobno?',
      answer: 'Płacisz cenę wybranego pakietu serwisowego, transport w obie strony jest już w niej wliczony. Jeśli mechanik podczas przeglądu zauważy dodatkowe usterki wymagające wymiany części, skontaktuje się z Tobą z wyceną, a dodatkowe naprawy zrobi dopiero po Twojej akceptacji.'
    },
    {
      question: 'Czy mogę wybrać konkretny warsztat rowerowy?',
      answer: 'Nie. W serwisie ekspresowym warsztat wybiera CycloPick spośród sprawdzonych partnerów w Krakowie, tak aby dotrzymać terminu tego samego dnia lub następnego wieczoru. Jeśli chcesz samodzielnie wybrać serwis, skorzystaj z mapy serwisów i standardowej rezerwacji.'
    },
    {
      question: 'Czy mój rower jest ubezpieczony podczas transportu?',
      answer: 'Tak, każdy rower przewożony przez CycloPick objęty jest ubezpieczeniem do 20 000 zł na czas transportu.'
    },
    {
      question: 'Jak zapłacić za serwis ekspresowy?',
      answer: 'Płatność odbywa się online przez PayU: kartą, BLIK-iem lub przelewem. Jest wymagana od razu po złożeniu rezerwacji, aby potwierdzić termin.'
    },
    {
      question: 'Czy mogę sprawdzić status mojej naprawy?',
      answer: 'Tak. Po złożeniu rezerwacji dostajesz mailem link do swojego zlecenia, bez zakładania konta i logowania. Widzisz tam aktualny status naprawy oraz wiadomości od mechanika. Jeśli zaproponuje dodatkowy zakres prac, zaakceptujesz go lub odrzucisz bezpośrednio z tego linku.'
    },
    {
      question: 'Na jakie dni mogę zarezerwować serwis ekspresowy?',
      answer: 'Serwis ekspresowy dostępny jest w dni robocze, od poniedziałku do piątku.'
    },
    {
      question: 'Czy serwis ekspresowy jest dostępny tylko w Krakowie?',
      answer: 'Tak, serwis ekspresowy działa na razie tylko w Krakowie i najbliższych okolicach. W pozostałych miastach możesz zarezerwować standardową wizytę u wybranego warsztatu z mapy CycloPick.'
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
    const pageTitle = 'Jak działa serwis ekspresowy CycloPick w Krakowie? | CycloPick';
    const pageDescription = 'Sprawdź krok po kroku, jak zamówić serwis ekspresowy roweru w Krakowie: wybierz pakiet, odbiór z biura lub z domu, a CycloPick zorganizuje transport i naprawę tego samego dnia.';

    this.title.setTitle(pageTitle);
    this.meta.updateTag({ name: 'description', content: pageDescription });
    this.meta.updateTag({ name: 'keywords', content: 'serwis ekspresowy Kraków, serwis rowerowy tego samego dnia, naprawa roweru z odbiorem, CycloPick Kraków' });
    this.meta.updateTag({ name: 'robots', content: 'index, follow, max-image-preview:large' });

    this.meta.updateTag({ property: 'og:title', content: pageTitle });
    this.meta.updateTag({ property: 'og:description', content: pageDescription });
    this.meta.updateTag({ property: 'og:type', content: 'website' });
    this.meta.updateTag({ property: 'og:url', content: 'https://www.cyclopick.pl/krakow/jak-dziala-serwis-ekspresowy' });
    this.meta.updateTag({ property: 'og:image', content: 'https://www.cyclopick.pl/assets/images/og-image-cyclopick.jpg' });
    this.meta.updateTag({ property: 'og:locale', content: 'pl_PL' });
    this.meta.updateTag({ property: 'og:site_name', content: 'CycloPick' });

    this.meta.updateTag({ name: 'twitter:card', content: 'summary_large_image' });
    this.meta.updateTag({ name: 'twitter:title', content: pageTitle });
    this.meta.updateTag({ name: 'twitter:description', content: pageDescription });
    this.meta.updateTag({ name: 'twitter:image', content: 'https://www.cyclopick.pl/assets/images/og-image-cyclopick.jpg' });
  }

  private setCanonicalUrl(): void {
    const canonicalUrl = 'https://www.cyclopick.pl/krakow/jak-dziala-serwis-ekspresowy';
    const existingLink = this.document.querySelector('link[rel="canonical"]');
    if (existingLink) existingLink.remove();
    const link = this.document.createElement('link');
    link.setAttribute('rel', 'canonical');
    link.setAttribute('href', canonicalUrl);
    this.document.head.appendChild(link);
  }

  private generateSchemaMarkup(): void {
    const expressService = {
      '@context': 'https://schema.org',
      '@type': 'Service',
      '@id': 'https://www.cyclopick.pl/krakow/jak-dziala-serwis-ekspresowy#express-service',
      name: 'Serwis ekspresowy roweru Kraków',
      serviceType: 'Serwis rowerowy z odbiorem i zwrotem tego samego dnia',
      description: 'Serwis ekspresowy CycloPick w Krakowie. Rezerwacja pakietu serwisowego online, odbiór roweru kurierem z biura lub z domu, naprawa u sprawdzonego partnera i zwrot gotowego roweru tego samego dnia lub następnego wieczoru.',
      areaServed: { '@type': 'City', name: 'Kraków', addressCountry: 'PL' },
      provider: { '@type': 'Organization', name: 'CycloPick', url: 'https://www.cyclopick.pl' },
      potentialAction: {
        '@type': 'ReserveAction',
        target: 'https://www.cyclopick.pl/krakow/zarezerwuj'
      }
    };

    const breadcrumb = SchemaOrgHelper.generateBreadcrumb([
      { name: 'Strona główna', url: 'https://www.cyclopick.pl/' },
      { name: 'Serwisy rowerowe Kraków', url: 'https://www.cyclopick.pl/serwisy/krakow' },
      { name: 'Jak działa serwis ekspresowy', url: 'https://www.cyclopick.pl/krakow/jak-dziala-serwis-ekspresowy' }
    ]);

    const howTo = SchemaOrgHelper.generateHowTo(
      'Jak zamówić serwis ekspresowy roweru w Krakowie',
      'Cztery kroki do naprawy roweru tego samego dnia z odbiorem i zwrotem kurierem CycloPick w Krakowie.',
      this.howToSteps.map(s => ({ name: s.name, text: s.text }))
    );

    const faqPage = SchemaOrgHelper.generateFAQPage(this.faqData);

    this.seoService.addMultipleStructuredData([
      SchemaOrgHelper.generateOrganization(),
      expressService,
      breadcrumb,
      howTo,
      faqPage
    ].filter(Boolean));
  }
}
