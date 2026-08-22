import { Component, OnInit, OnDestroy, AfterViewInit, Inject, inject, ViewChild, ElementRef, PLATFORM_ID, NgZone } from '@angular/core';
import { isPlatformBrowser, CommonModule, DOCUMENT } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { Meta, Title, DomSanitizer, SafeStyle } from '@angular/platform-browser';
import { SeoService } from '../../core/seo.service';
import { SchemaOrgHelper } from '../../core/schema-org.helper';
import { TRANSPORT_PRICING } from '../../shared/constants/transport-pricing.constants';
import { BreadcrumbComponent } from '../../shared/components/breadcrumb/breadcrumb.component';

@Component({
  selector: 'app-transport-rowerow-krakow',
  standalone: true,
  imports: [CommonModule, RouterModule, BreadcrumbComponent],
  templateUrl: './transport-rowerow-krakow.component.html',
  styleUrls: ['./transport-rowerow-krakow.component.css']
})
export class TransportRowerowKrakowComponent implements OnInit, AfterViewInit, OnDestroy {
  private platformId = inject(PLATFORM_ID);
  private ngZone = inject(NgZone);
  private seoService = inject(SeoService);

  @ViewChild('reviewsTrack') reviewsTrackRef!: ElementRef<HTMLElement>;

  // Marquee state — reviews
  private reviewsRafId: number | null = null;
  private reviewsPos = 0;
  private reviewsHalfWidth = 0;
  private readonly REVIEWS_SPEED = 0.4;

  // Drag state — reviews
  isReviewsDragging = false;
  private reviewsDragStartX = 0;
  private reviewsDragStartPos = 0;

  // Bound listeners for cleanup — reviews
  private readonly onReviewsMouseMoveBound = (e: MouseEvent) => this.onReviewsMouseMove(e);
  private readonly onReviewsMouseUpBound = () => this.onReviewsDragEnd();
  private readonly onReviewsTouchMoveBound = (e: TouchEvent) => this.onReviewsTouchMove(e);
  private readonly onReviewsTouchEndBound = () => this.onReviewsDragEnd();

  readonly partnerTransportLabel = `${TRANSPORT_PRICING.partnerCost} zł`;
  readonly standardTransportLabel = `${TRANSPORT_PRICING.standardCost} zł`;

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

  // Tło hero – przez sanitizer, żeby Angular nie blokował url() ze spacją w nazwie pliku
  heroBgStyle!: SafeStyle;

  faqData = [
    {
      question: 'Co oznacza niebieska pinezka na mapie CycloPick?',
      answer: `Niebieska pinezka oznacza Partnera CycloPick w Krakowie. U Partnerów CycloPick zarezerwujesz serwis rowerowy online i zyskasz transport door-to-door – kurier odbiera rower spod Twoich drzwi i odwozi po naprawie. Transport kosztuje tylko ${TRANSPORT_PRICING.partnerCost} zł.`
    },
    {
      question: 'Co oznacza zielona pinezka na mapie CycloPick?',
      answer: `Zielona pinezka to zweryfikowany serwis rowerowy w Krakowie, który nie należy jeszcze do sieci Partnerów CycloPick. Możesz do niego zamówić transport rowerów w Krakowie za stałą cenę ${TRANSPORT_PRICING.standardCost} zł w obie strony.`
    },
    {
      question: 'Ile kosztuje transport roweru w Krakowie przez CycloPick?',
      answer: `Transport roweru w Krakowie kosztuje ${TRANSPORT_PRICING.partnerCost} zł do serwisów Partnerskich CycloPick. Do dowolnego innego serwisu rowerowego w Krakowie – stała cena ${TRANSPORT_PRICING.standardCost} zł za transport tam i z powrotem. Każdy kolejny rower to +${TRANSPORT_PRICING.additionalBikeCost} zł. Płatność gotówką lub BLIKIEM przy odbiorze roweru.`
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
      answer: `Tak, przeglądanie mapy serwisów rowerowych i korzystanie z wyszukiwarki CycloPick jest całkowicie bezpłatne. Płacisz wyłącznie za naprawę roweru i transport – transport do Partnerów CycloPick kosztuje tylko ${TRANSPORT_PRICING.partnerCost} zł.`
    },
    {
      question: 'Czy mój rower jest bezpieczny podczas transportu?',
      answer: 'Tak – każdy rower przewożony przez CycloPick jest objęty ubezpieczeniem do 20 000 zł. Nasi kurierzy zabezpieczają sprzęt przed załadunkiem i transportują go dedykowanym pojazdem. W razie jakiejkolwiek szkody – choć jeszcze nigdy się to nie zdarzyło – jesteś w pełni chroniony.'
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

  // ============================================================
  // META / SEO
  // ============================================================

  private setMetaTags(): void {
    const pageTitle = `Serwis Rowerowy Kraków Door-to-Door – Transport od ${TRANSPORT_PRICING.partnerCost} zł | CycloPick`;
    const pageDescription = `Serwis rowerowy door-to-door w Krakowie z transportem od ${TRANSPORT_PRICING.partnerCost} zł. Kurier odbiera rower spod drzwi. Partnerzy CycloPick: transport ${TRANSPORT_PRICING.partnerCost} zł. Inne serwisy: ${TRANSPORT_PRICING.standardCost} zł. Rezerwacja online, cyfrowa historia napraw.`;

    this.title.setTitle(pageTitle);
    this.meta.updateTag({ name: 'description', content: pageDescription });
    this.meta.updateTag({ name: 'keywords', content: 'serwis rowerowy Kraków, transport rowerów Kraków, serwis rowerowy door-to-door, naprawa roweru Kraków, warsztat rowerowy Kraków, CycloPick' });
    this.meta.updateTag({ name: 'robots', content: 'index, follow, max-image-preview:large' });

    this.meta.updateTag({ property: 'og:title', content: pageTitle });
    this.meta.updateTag({ property: 'og:description', content: pageDescription });
    this.meta.updateTag({ property: 'og:type', content: 'website' });
    this.meta.updateTag({ property: 'og:url', content: 'https://www.cyclopick.pl/transport-rowerow-krakow' });
    this.meta.updateTag({ property: 'og:image', content: 'https://www.cyclopick.pl/assets/images/og-image-cyclopick.jpg' });
    this.meta.updateTag({ property: 'og:locale', content: 'pl_PL' });
    this.meta.updateTag({ property: 'og:site_name', content: 'CycloPick' });

    this.meta.updateTag({ name: 'twitter:card', content: 'summary_large_image' });
    this.meta.updateTag({ name: 'twitter:title', content: pageTitle });
    this.meta.updateTag({ name: 'twitter:description', content: pageDescription });
    this.meta.updateTag({ name: 'twitter:image', content: 'https://www.cyclopick.pl/assets/images/og-image-cyclopick.jpg' });
  }

  private setCanonicalUrl(): void {
    const canonicalUrl = 'https://www.cyclopick.pl/transport-rowerow-krakow';
    const existingLink = this.document.querySelector('link[rel="canonical"]');
    if (existingLink) existingLink.remove();
    const link = this.document.createElement('link');
    link.setAttribute('rel', 'canonical');
    link.setAttribute('href', canonicalUrl);
    this.document.head.appendChild(link);
  }

  private generateSchemaMarkup(): void {
    const transportService = {
      '@context': 'https://schema.org',
      '@type': 'Service',
      '@id': 'https://www.cyclopick.pl/transport-rowerow-krakow#transport-service',
      name: 'Transport roweru door-to-door Kraków',
      serviceType: 'Serwis rowerowy z transportem door-to-door',
      description: `Kompleksowy serwis rowerowy door-to-door w Krakowie. U Partnerów CycloPick transport ${TRANSPORT_PRICING.partnerCost} zł, do pozostałych serwisów ${TRANSPORT_PRICING.standardCost} zł w obie strony.`,
      areaServed: { '@type': 'City', name: 'Kraków', addressCountry: 'PL' },
      provider: { '@type': 'Organization', name: 'CycloPick', url: 'https://www.cyclopick.pl' },
      offers: [
        { '@type': 'Offer', name: 'Transport roweru do Partnera CycloPick', price: String(TRANSPORT_PRICING.partnerCost), priceCurrency: 'PLN', availability: 'https://schema.org/InStock' },
        { '@type': 'Offer', name: 'Transport roweru do dowolnego serwisu w Krakowie', price: String(TRANSPORT_PRICING.standardCost), priceCurrency: 'PLN', availability: 'https://schema.org/InStock' }
      ]
    };

    const faqPage = SchemaOrgHelper.generateFAQPage(this.faqData);

    // Uwaga: bez SchemaOrgHelper.generateWebSite() — to schema strony głównej (SearchAction, @id "#website"
    // zakotwiczony na "/"), teraz należy do nowego landing-page.component na trasie ''.
    this.seoService.addMultipleStructuredData([
      SchemaOrgHelper.generateOrganization(),
      transportService,
      faqPage
    ].filter(Boolean));
  }

  // ============================================================
  // NAVIGATION
  // ============================================================

  scrollToOptions(): void {
    const el = this.document.getElementById('options-section');
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  navigateToKrakowMap(): void {
    const zoom = window.innerWidth < 768 ? '11' : '13';
    this.router.navigate(['/mapa-serwisow'], { queryParams: { lat: '50.0647', lng: '19.9450', zoom } });
  }

  navigateToKrakow(): void {
    const zoom = window.innerWidth < 768 ? '11' : '13';
    this.router.navigate(['/mapa-serwisow'], { queryParams: { lat: '50.0647', lng: '19.9450', zoom } });
  }

  navigateToKrakowMapPartner(): void {
    this.router.navigate(['/serwisy/krakow']).then(() => { window.scrollTo({ top: 0 }); });
  }

  navigateToPolandMapPartner(): void {
    const zoom = window.innerWidth < 768 ? '6' : '8';
    this.router.navigate(['/mapa-serwisow'], { queryParams: { lat: '52.0', lng: '19.4', zoom, coverages: '342' } });
  }
}
