import { Component, ElementRef, Inject, OnDestroy, OnInit, ViewChild, inject } from '@angular/core';
import { CommonModule, DOCUMENT } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { Meta, Title } from '@angular/platform-browser';
import { StolenBikesService } from './stolen-bikes.service';
import { ApiKeyService } from '../../shared/api-key.service';
import { NotificationService } from '../../core/notification.service';
import { SeoService } from '../../core/seo.service';
import { SchemaOrgHelper } from '../../core/schema-org.helper';
import { BreadcrumbComponent } from '../../shared/components/breadcrumb/breadcrumb.component';
import { StolenLookupResult } from '../../shared/models/stolen-bike.models';

/**
 * Publiczna baza skradzionych rowerów CycloPick — wyszukiwarka po numerze ramy/marce/modelu,
 * kontakt ze znalazcą przez jednorazowy relay mailowy (żadne dane kontaktowe nie są ujawniane
 * publicznie), sekcja wyjaśniająca czym różni się ta baza od alternatyw, FAQ, oraz sekcja
 * rejestracji klucza API dla zewnętrznych integracji. Patrz PLANNED_CHANGES.md.
 */
@Component({
  selector: 'app-stolen-bikes-search-page',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, BreadcrumbComponent],
  templateUrl: './stolen-bikes-search-page.component.html',
  styleUrls: ['./stolen-bikes-search-page.component.css']
})
export class StolenBikesSearchPageComponent implements OnInit, OnDestroy {
  private stolenBikesService = inject(StolenBikesService);
  private apiKeyService = inject(ApiKeyService);
  private notificationService = inject(NotificationService);
  private meta = inject(Meta);
  private title = inject(Title);
  private seoService = inject(SeoService);

  @ViewChild('frameNumberInput') frameNumberInput?: ElementRef<HTMLInputElement>;

  constructor(@Inject(DOCUMENT) private document: Document) {}

  // Wyszukiwarka
  frameNumber = '';
  brand = '';
  model = '';
  results: StolenLookupResult[] = [];
  searching = false;
  hasSearched = false;
  lastSearchByFrame = false;

  // Modal kontaktowy
  contactingBicycle: StolenLookupResult | null = null;
  finderName = '';
  finderEmail = '';
  finderPhone = '';
  contactMessage = '';
  finderPersonalDataAccepted = false;
  finderDataSharingAccepted = false;
  sendingContact = false;

  // Lightbox galerii
  lightboxBicycle: StolenLookupResult | null = null;
  lightboxIndex = 0;

  // Rejestracja klucza API (zewnętrzni, bez konta)
  apiKeyEmail = '';
  apiKeyPhone = '';
  apiKeyName = '';
  apiKeyCompany = '';
  apiKeyPrivacyAccepted = false;
  registeringApiKey = false;
  revealedApiKey: string | null = null;

  readonly faqData = [
    {
      question: 'Czy sprawdzenie numeru ramy jest bezpłatne?',
      answer: 'Tak, sprawdzenie w wyszukiwarce jest całkowicie bezpłatne i nie wymaga konta.'
    },
    {
      question: 'Czy do sprawdzenia roweru potrzebuję konta?',
      answer: 'Nie. Konto potrzebne jest tylko do zgłoszenia własnego roweru jako skradzionego.'
    },
    {
      question: 'Co oznacza, jeśli numer ramy znajduje się w bazie?',
      answer: 'Ktoś z kontem CycloPick zgłosił ten numer jako skradziony. Nie finalizuj transakcji i rozważ kontakt z Policją.'
    },
    {
      question: 'Co oznacza, jeśli numeru ramy nie ma w bazie?',
      answer: 'Nikt go nie zgłosił w naszej bazie ani w dostępnych zewnętrznych źródłach. To nie potwierdza legalnego pochodzenia roweru.'
    },
    {
      question: 'Jak zgłosić skradziony rower?',
      answer: 'Załóż konto lub zaloguj się, dodaj rower (marka, model, numer ramy, zdjęcie) i oznacz go jako skradziony w panelu klienta.'
    },
    {
      question: 'Czy mogę zgłosić rower, jeśli nie miałem konta przed kradzieżą?',
      answer: 'Tak. Możesz założyć konto dopiero po kradzieży i wtedy dodać rower.'
    },
    {
      question: 'Czy zgłoszenie w CycloPick zastępuje zgłoszenie na Policję?',
      answer: 'Nie. Zawsze zgłoś kradzież też na Policji.'
    },
    {
      question: 'Czy moje dane kontaktowe są widoczne dla osób sprawdzających rower?',
      answer: 'Nie. Kontakt odbywa się przez CycloPick mailem, bez ujawniania numeru telefonu czy adresu.'
    },
    {
      question: 'Czy zgłoszenia są weryfikowane przez CycloPick?',
      answer: 'Nie, zgłoszenie opiera się na deklaracji osoby z kontem CycloPick. Wymaga podania numeru ramy, marki, modelu i zdjęcia.'
    },
    {
      question: 'Jak serwis, komis lub lombard może korzystać z API?',
      answer: 'Przez bezpłatne API do automatycznego sprawdzania numerów ram. Klucz i instrukcja integracji przychodzą mailem po wypełnieniu krótkiego formularza.'
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

  private setMetaTags(): void {
    const pageTitle = 'Baza skradzionych rowerów - sprawdź numer ramy | CycloPick';
    const pageDescription = 'Sprawdź bezpłatnie, czy rower jest zgłoszony jako skradziony. Wpisz numer ramy albo markę i model bez konta, w ogólnopolskiej bazie CycloPick.';

    this.title.setTitle(pageTitle);
    this.meta.updateTag({ name: 'description', content: pageDescription });
    this.meta.updateTag({ name: 'robots', content: 'index, follow, max-image-preview:large' });

    this.meta.updateTag({ property: 'og:title', content: pageTitle });
    this.meta.updateTag({ property: 'og:description', content: pageDescription });
    this.meta.updateTag({ property: 'og:type', content: 'website' });
    this.meta.updateTag({ property: 'og:url', content: 'https://www.cyclopick.pl/skradzione-rowery' });
    this.meta.updateTag({ property: 'og:image', content: 'https://www.cyclopick.pl/assets/images/og-image-cyclopick.jpg' });
    this.meta.updateTag({ property: 'og:locale', content: 'pl_PL' });
    this.meta.updateTag({ property: 'og:site_name', content: 'CycloPick' });
  }

  private setCanonicalUrl(): void {
    const canonicalUrl = 'https://www.cyclopick.pl/skradzione-rowery';
    const existingLink = this.document.querySelector('link[rel="canonical"]');
    if (existingLink) existingLink.remove();
    const link = this.document.createElement('link');
    link.setAttribute('rel', 'canonical');
    link.setAttribute('href', canonicalUrl);
    this.document.head.appendChild(link);
  }

  private generateSchemaMarkup(): void {
    const breadcrumb = SchemaOrgHelper.generateBreadcrumb([
      { name: 'Strona główna', url: 'https://www.cyclopick.pl/' },
      { name: 'Baza skradzionych rowerów', url: 'https://www.cyclopick.pl/skradzione-rowery' }
    ]);

    const faqPage = SchemaOrgHelper.generateFAQPage(this.faqData);

    this.seoService.addMultipleStructuredData([
      SchemaOrgHelper.generateOrganization(),
      breadcrumb,
      faqPage
    ].filter(Boolean));
  }

  scrollToSearch(): void {
    this.frameNumberInput?.nativeElement.focus({ preventScroll: true });
    const el = this.document.getElementById('wyszukiwarka');
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  get canSearch(): boolean {
    const frame = this.frameNumber.trim();
    if (frame && frame.length < 4) return false;
    return !!(frame || (this.brand.trim() && this.model.trim()));
  }

  search(): void {
    if (!this.canSearch || this.searching) return;
    this.searching = true;
    this.hasSearched = true;
    this.lastSearchByFrame = !!this.frameNumber.trim();
    this.stolenBikesService.search(this.frameNumber, this.brand, this.model).subscribe({
      next: (response) => {
        this.results = response.results;
        this.searching = false;
      },
      error: () => {
        this.results = [];
        this.searching = false;
        this.notificationService.error('Nie udało się wyszukać rowerów. Spróbuj ponownie.');
      }
    });
  }

  openContactModal(bicycle: StolenLookupResult): void {
    this.contactingBicycle = bicycle;
    this.finderName = '';
    this.finderEmail = '';
    this.finderPhone = '';
    this.contactMessage = '';
    this.finderPersonalDataAccepted = false;
    this.finderDataSharingAccepted = false;
  }

  closeContactModal(): void {
    this.contactingBicycle = null;
  }

  get isContactFormValid(): boolean {
    return !!(
      this.finderName.trim() &&
      this.finderEmail.trim() &&
      this.contactMessage.trim() &&
      this.finderPersonalDataAccepted &&
      this.finderDataSharingAccepted
    );
  }

  sendContact(): void {
    if (!this.contactingBicycle?.id || !this.isContactFormValid || this.sendingContact) return;

    this.sendingContact = true;
    this.stolenBikesService.contactOwner(this.contactingBicycle.id, {
      finderName: this.finderName.trim(),
      finderEmail: this.finderEmail.trim(),
      finderPhone: this.finderPhone.trim() || undefined,
      message: this.contactMessage.trim(),
      personalDataAccepted: this.finderPersonalDataAccepted,
      dataSharingAccepted: this.finderDataSharingAccepted
    }).subscribe({
      next: () => {
        this.notificationService.success('Wiadomość została wysłana do właściciela roweru.');
        this.sendingContact = false;
        this.contactingBicycle = null;
      },
      error: (err) => {
        this.notificationService.error(err?.error?.message ?? 'Nie udało się wysłać wiadomości.');
        this.sendingContact = false;
      }
    });
  }

  openLightbox(bicycle: StolenLookupResult, index: number): void {
    this.lightboxBicycle = bicycle;
    this.lightboxIndex = index;
  }

  closeLightbox(): void {
    this.lightboxBicycle = null;
  }

  allPhotos(bicycle: StolenLookupResult): string[] {
    const photos = [...(bicycle.galleryUrls || [])];
    if (bicycle.mainPhotoUrl && !photos.includes(bicycle.mainPhotoUrl)) {
      photos.unshift(bicycle.mainPhotoUrl);
    }
    return photos;
  }

  get isApiKeyFormValid(): boolean {
    return !!(this.apiKeyEmail.trim() && this.apiKeyPhone.trim() && this.apiKeyPrivacyAccepted);
  }

  registerApiKey(): void {
    if (!this.isApiKeyFormValid || this.registeringApiKey) return;

    this.registeringApiKey = true;
    this.apiKeyService.registerExternal({
      email: this.apiKeyEmail.trim(),
      phone: this.apiKeyPhone.trim(),
      name: this.apiKeyName.trim() || undefined,
      company: this.apiKeyCompany.trim() || undefined,
      privacyAccepted: this.apiKeyPrivacyAccepted
    }).subscribe({
      next: (res) => {
        this.revealedApiKey = res.apiKey;
        this.registeringApiKey = false;
      },
      error: (err) => {
        this.notificationService.error(err?.error?.message ?? 'Nie udało się zarejestrować klucza API.');
        this.registeringApiKey = false;
      }
    });
  }
}
