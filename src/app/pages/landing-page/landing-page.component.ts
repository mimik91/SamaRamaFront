import { Component, OnInit, OnDestroy, AfterViewInit, Inject, inject, ViewChild, ElementRef, PLATFORM_ID, NgZone } from '@angular/core';
import { isPlatformBrowser, CommonModule, DOCUMENT } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { Meta, Title, DomSanitizer, SafeStyle } from '@angular/platform-browser';
import { ServiceProfileService } from '../service-profile/service-profile.service';
import { SeoService } from '../../core/seo.service';
import { SchemaOrgHelper } from '../../core/schema-org.helper';
import { TRANSPORT_PRICING } from '../../shared/constants/transport-pricing.constants';

@Component({
  selector: 'app-landing-page',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './landing-page.component.html',
  styleUrls: ['./landing-page.component.css']
})
export class LandingPageComponent implements OnInit, AfterViewInit, OnDestroy {
  private serviceProfileService = inject(ServiceProfileService);
  private platformId = inject(PLATFORM_ID);
  private ngZone = inject(NgZone);
  private seoService = inject(SeoService);

  @ViewChild('partnerTrack') partnerTrackRef!: ElementRef<HTMLElement>;
  @ViewChild('reviewsTrack') reviewsTrackRef!: ElementRef<HTMLElement>;

  // Marquee state — partner logos
  private rafId: number | null = null;
  private marqueePos = 0;
  private marqueeHalfWidth = 0;
  private readonly MARQUEE_SPEED = 0.6;

  // Marquee state — reviews
  private reviewsRafId: number | null = null;
  private reviewsPos = 0;
  private reviewsHalfWidth = 0;
  private readonly REVIEWS_SPEED = 0.4;

  // Drag state — partner logos
  isDragging = false;
  private dragStartX = 0;
  private dragStartPos = 0;

  // Drag state — reviews
  isReviewsDragging = false;
  private reviewsDragStartX = 0;
  private reviewsDragStartPos = 0;

  // Bound listeners for cleanup — partner logos
  private readonly onMouseMoveBound = (e: MouseEvent) => this.onMouseMove(e);
  private readonly onMouseUpBound = () => this.onDragEnd();
  private readonly onTouchMoveBound = (e: TouchEvent) => this.onTouchMove(e);
  private readonly onTouchEndBound = () => this.onDragEnd();

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


  partnerLogos: { serviceId: number; logoUrl: string; suffix: string }[] = [];

  // Tło hero – przez sanitizer, żeby Angular nie blokował url() ze spacją w nazwie pliku
  heroBgStyle!: SafeStyle;

  features = [
    {
      icon: 'map-pin',
      title: 'Serwis rowerowy door-to-door w Krakowie',
      description: `Znajdź certyfikowanego Partnera CycloPick w Krakowie z transportem roweru od ${TRANSPORT_PRICING.partnerCost} zł. Odbiór spod drzwi, dostawa po naprawie – bez wychodzenia z domu.`
    },
    {
      icon: 'truck',
      title: `Transport rowerów Kraków – ${TRANSPORT_PRICING.partnerCost} zł lub ${TRANSPORT_PRICING.standardCost} zł`,
      description: `U Partnerów CycloPick transport to tylko ${TRANSPORT_PRICING.partnerCost} zł. Do dowolnego serwisu rowerowego w Krakowie – stała cena ${TRANSPORT_PRICING.standardCost} zł w obie strony.`
    },
    {
      icon: 'star',
      title: `Niebieska pinezka = transport ${TRANSPORT_PRICING.partnerCost} zł`,
      description: `Niebieskie pinezki na mapie CycloPick to zweryfikowani Partnerzy z transportem door-to-door od ${TRANSPORT_PRICING.partnerCost} zł, systemem rezerwacji online i cyfrową historią napraw.`
    },
    {
      icon: 'clock',
      title: 'Cyfrowa historia serwisowa roweru',
      description: 'Każda naprawa u Partnera CycloPick zapisywana jest w cyfrowej historii. Eksportuj „Certyfikat CycloPick" i zwiększ wartość roweru nawet o 20% przy sprzedaży.'
    }
  ];

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
    this.loadPartnerLogos();
  }

  ngAfterViewInit(): void {
    setTimeout(() => this.startReviewsMarquee(), 100);
  }

  ngOnDestroy(): void {
    this.seoService.removeStructuredData();
    this.stopMarquee();
    this.stopReviewsMarquee();
    if (isPlatformBrowser(this.platformId)) {
      document.removeEventListener('mousemove', this.onMouseMoveBound);
      document.removeEventListener('mouseup', this.onMouseUpBound);
      document.removeEventListener('touchmove', this.onTouchMoveBound);
      document.removeEventListener('touchend', this.onTouchEndBound);
      document.removeEventListener('mousemove', this.onReviewsMouseMoveBound);
      document.removeEventListener('mouseup', this.onReviewsMouseUpBound);
      document.removeEventListener('touchmove', this.onReviewsTouchMoveBound);
      document.removeEventListener('touchend', this.onReviewsTouchEndBound);
    }
  }

  // ============================================================
  // PARTNER LOGOS
  // ============================================================

  private loadPartnerLogos(): void {
    this.serviceProfileService.getReservationServicesLogos().subscribe({
      next: (logos) => {
        this.partnerLogos = logos;
        // Dajemy czas na wyrenderowanie *ngFor przed pomiarem szerokości
        setTimeout(() => this.startMarquee(), 100);
      },
      error: () => { /* pasek po prostu nie wyświetli się */ }
    });
  }

  // ============================================================
  // MARQUEE (requestAnimationFrame)
  // ============================================================

  private startMarquee(): void {
    if (!isPlatformBrowser(this.platformId)) return;
    const track = this.partnerTrackRef?.nativeElement;
    if (!track) return;

    // Połowa szerokości tracka = szerokość jednego zestawu logo (oryginał)
    this.marqueeHalfWidth = track.scrollWidth / 2;
    if (this.marqueeHalfWidth === 0) return;

    this.stopMarquee();

    // Uruchamiamy poza strefą Angular – nie triggeruje change detection na każdą klatkę
    this.ngZone.runOutsideAngular(() => {
      const step = () => {
        if (!this.isDragging) {
          this.marqueePos += this.MARQUEE_SPEED;
          // Gdy przesuniemy o dokładnie połowę – reset do 0 (seamless loop)
          if (this.marqueePos >= this.marqueeHalfWidth) {
            this.marqueePos = 0;
          }
          track.style.transform = `translateX(-${this.marqueePos}px)`;
        }
        this.rafId = requestAnimationFrame(step);
      };
      this.rafId = requestAnimationFrame(step);
    });
  }

  private stopMarquee(): void {
    if (this.rafId !== null) {
      cancelAnimationFrame(this.rafId);
      this.rafId = null;
    }
  }

  // ============================================================
  // DRAG (mouse + touch)
  // ============================================================

  onMouseDown(e: MouseEvent): void {
    this.startDrag(e.clientX);
    document.addEventListener('mousemove', this.onMouseMoveBound);
    document.addEventListener('mouseup', this.onMouseUpBound);
  }

  onTouchStart(e: TouchEvent): void {
    this.startDrag(e.touches[0].clientX);
    document.addEventListener('touchmove', this.onTouchMoveBound, { passive: true });
    document.addEventListener('touchend', this.onTouchEndBound);
  }

  private startDrag(clientX: number): void {
    this.isDragging = true;
    this.dragStartX = clientX;
    this.dragStartPos = this.marqueePos;
  }

  private onMouseMove(e: MouseEvent): void {
    this.handleDragMove(e.clientX);
  }

  private onTouchMove(e: TouchEvent): void {
    this.handleDragMove(e.touches[0].clientX);
  }

  private handleDragMove(clientX: number): void {
    if (!this.isDragging) return;
    const delta = this.dragStartX - clientX;
    let newPos = this.dragStartPos + delta;
    // Wrap within [0, halfWidth)
    newPos = ((newPos % this.marqueeHalfWidth) + this.marqueeHalfWidth) % this.marqueeHalfWidth;
    this.marqueePos = newPos;
    const track = this.partnerTrackRef?.nativeElement;
    if (track) track.style.transform = `translateX(-${this.marqueePos}px)`;
  }

  private onDragEnd(): void {
    this.isDragging = false;
    document.removeEventListener('mousemove', this.onMouseMoveBound);
    document.removeEventListener('mouseup', this.onMouseUpBound);
    document.removeEventListener('touchmove', this.onTouchMoveBound);
    document.removeEventListener('touchend', this.onTouchEndBound);
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
    this.meta.updateTag({ property: 'og:url', content: 'https://www.cyclopick.pl/' });
    this.meta.updateTag({ property: 'og:image', content: 'https://www.cyclopick.pl/assets/images/og-image-cyclopick.jpg' });
    this.meta.updateTag({ property: 'og:locale', content: 'pl_PL' });
    this.meta.updateTag({ property: 'og:site_name', content: 'CycloPick' });

    this.meta.updateTag({ name: 'twitter:card', content: 'summary_large_image' });
    this.meta.updateTag({ name: 'twitter:title', content: pageTitle });
    this.meta.updateTag({ name: 'twitter:description', content: pageDescription });
    this.meta.updateTag({ name: 'twitter:image', content: 'https://www.cyclopick.pl/assets/images/og-image-cyclopick.jpg' });
  }

  private setCanonicalUrl(): void {
    const canonicalUrl = 'https://www.cyclopick.pl/';
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
      '@id': 'https://www.cyclopick.pl/#transport-service',
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

    this.seoService.addMultipleStructuredData([
      SchemaOrgHelper.generateOrganization(),
      SchemaOrgHelper.generateWebSite(),
      transportService
    ]);
  }

  // ============================================================
  // NAVIGATION
  // ============================================================

  scrollToOptions(): void {
    const el = this.document.getElementById('options-section');
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  navigateToMap(): void {
    this.router.navigate(['/mapa-serwisow']);
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
