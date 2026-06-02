import { Component, OnInit, OnDestroy, inject, Inject, PLATFORM_ID } from '@angular/core';
import { CommonModule, isPlatformBrowser, DOCUMENT } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, FormArray, Validators } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { Meta, Title } from '@angular/platform-browser';
import { EnumerationService } from '../../core/enumeration.service';
import { BikeFormService, BikeFormData } from '../../home/bike-form.service';
import { ServiceSlotService } from '../../service-slots/service-slot.service';
import { HomeHeroComponent } from '../../home/home-hero.component';
import { NotificationService } from '../../core/notification.service';
import { I18nService } from '../../core/i18n.service';

@Component({
  selector: 'app-how-it-works-page',
  standalone: true,
  imports: [
    CommonModule, 
    ReactiveFormsModule,
    HomeHeroComponent,
  ],
  templateUrl: './how-it-works-page.component.html',
  styleUrls: ['./how-it-works-page.component.css']
})
export class HowItWorksPageComponent implements OnInit, OnDestroy {
  private fb = inject(FormBuilder);
  private router = inject(Router);
  private enumerationService = inject(EnumerationService);
  private bikeFormService = inject(BikeFormService);
  private serviceSlotService = inject(ServiceSlotService);
  private notificationService = inject(NotificationService);
  private route = inject(ActivatedRoute);
  private meta = inject(Meta);
  private title = inject(Title);
  private i18n = inject(I18nService);
  private isBrowser: boolean;

  activeHowItWorksView: 'transport' | 'service' = 'transport';
  formSubmitted = false;

  private readonly transportStepIcons = ['calendar', 'file-text', 'truck', 'tool'];
  private readonly serviceStepIcons = ['file-text', 'clock', 'package', 'truck', 'tool', 'credit-card'];

  bikeForm: FormGroup;
  brands: string[] = [];
  loadingBrands = true;
  maxBikesPerOrder = 5; // Default value
  loadingMaxBikes = true;

  get currentSteps(): { number: number; icon: string; title: string; description: string }[] {
    const isTransport = this.activeHowItWorksView === 'transport';
    const icons = isTransport ? this.transportStepIcons : this.serviceStepIcons;
    const key = isTransport ? 'how_it_works_page.transport_steps' : 'how_it_works_page.service_steps';
    const steps = this.i18n.instant(key) as { title: string; description: string }[];
    return steps.map((s, i) => ({ number: i + 1, icon: icons[i], ...s }));
  }

  t(key: string): string {
    return this.i18n.instant(key) as string;
  }

  constructor(
    @Inject(PLATFORM_ID) private platformId: Object,
    @Inject(DOCUMENT) private document: Document
  ) {
    this.isBrowser = isPlatformBrowser(this.platformId);

    this.bikeForm = this.fb.group({
      bikes: this.fb.array([this.createBikeFormGroup()])
    });
  }

  ngOnInit(): void {
    this.setMetaTags();
    this.setCanonicalUrl();
    this.loadBrands();
    this.loadMaxBikesConfiguration();
    
    // Sprawdzamy, czy mamy zapisane dane formularza w serwisie
    const savedBikesData = this.bikeFormService.getBikesDataValue();
    if (savedBikesData.length > 0) {
      // Jeśli mamy dane, usuwamy domyślny, pusty formularz
      while (this.bikesArray.length !== 0) {
        this.bikesArray.removeAt(0);
      }
      
      // Dodajemy formularze bazując na zapisanych danych
      savedBikesData.forEach(bikeData => {
        const bikeGroup = this.createBikeFormGroup();
        bikeGroup.patchValue(bikeData);
        this.bikesArray.push(bikeGroup);
      });
    }

    // Sprawdź, czy mamy parametr 'section' w URL i przewiń do odpowiedniej sekcji
    if (this.isBrowser) {
      this.route.queryParams.subscribe(params => {
        if (params['section']) {
          setTimeout(() => {
            this.scrollToSection(params['section']);
          }, 500);
        }
      });
    }
  }

  private loadBrands(): void {
    this.loadingBrands = true;
    this.enumerationService.getEnumeration('BRAND').subscribe({
      next: (brands) => {
        this.brands = brands;
        this.loadingBrands = false;
      },
      error: () => {
        this.loadingBrands = false;
        this.brands = ['Trek', 'Specialized', 'Giant', 'Cannondale', 'Scott'];
      }
    });
  }
  
  private loadMaxBikesConfiguration(): void {
    this.loadingMaxBikes = true;
    
    const today = new Date();
    const formattedDate = today.toISOString().split('T')[0];
    
    this.serviceSlotService.getSlotAvailability(formattedDate).subscribe({
      next: (availability) => {
        if (availability && availability.maxBikesPerOrder) {
          this.maxBikesPerOrder = availability.maxBikesPerOrder;
        }
        this.loadingMaxBikes = false;
      },
      error: (error) => {
        console.error('Error loading maximum bikes configuration:', error);
        this.loadingMaxBikes = false;
      }
    });
  }

  private createBikeFormGroup(): FormGroup {
    return this.fb.group({
      brand: ['', Validators.required],
      model: [''],
      additionalInfo: ['']
    });
  }

  get bikesArray(): FormArray {
    return this.bikeForm.get('bikes') as FormArray;
  }
  
  canAddMoreBikes(): boolean {
    return this.bikesArray.length < this.maxBikesPerOrder;
  }

  addBike(): void {
    if (this.canAddMoreBikes()) {
      this.bikesArray.push(this.createBikeFormGroup());
    } else {
      this.notificationService.warning(`Możesz dodać maksymalnie ${this.maxBikesPerOrder} rowerów. Aby dodać więcej, zarejestruj się lub zaloguj.`);
    }
  }

  removeBike(index: number): void {
    if (this.bikesArray.length > 1) {
      this.bikesArray.removeAt(index);
    }
  }

  isFieldInvalid(index: number, fieldName: string): boolean {
    const field = this.bikesArray.at(index).get(fieldName);
    return field ? (field.invalid && (field.dirty || field.touched)) : false;
  }

  onSubmit(): void {
    if (this.bikeForm.valid) {
      const bikesData: BikeFormData[] = this.bikesArray.controls.map(control => {
        return {
          brand: control.get('brand')?.value,
          model: control.get('model')?.value,
          additionalInfo: control.get('additionalInfo')?.value
        };
      });
      
      this.bikeFormService.setBikesData(bikesData);
      this.router.navigate(['/guest-order']);
    } else {
      this.markFormGroupTouched(this.bikeForm);
      this.notificationService.warning('Proszę wypełnić wszystkie wymagane pola formularza.');
    }
  }

  private markFormGroupTouched(formGroup: FormGroup | FormArray): void {
    Object.keys(formGroup.controls).forEach(key => {
      const control = formGroup.get(key);
      
      if (control instanceof FormGroup || control instanceof FormArray) {
        this.markFormGroupTouched(control);
      } else {
        control?.markAsTouched();
      }
    });
  }

  goToServiceOrder(): void {
    const bikesData: BikeFormData[] = this.bikesArray.controls.map(control => {
      return {
        brand: control.get('brand')?.value || 'Nieznana',
        model: control.get('model')?.value || '',
        additionalInfo: control.get('additionalInfo')?.value || ''
      };
    });
    
    this.bikeFormService.setBikesData(bikesData);
    this.notificationService.success('Dane roweru zostały zapisane');
    this.router.navigate(['/guest-order']);
  }

  resetForm(): void {
    while (this.bikesArray.length > 1) {
      this.bikesArray.removeAt(1);
    }
    
    this.bikesArray.at(0).reset({
      brand: '',
      model: '',
      additionalInfo: ''
    });
    
    this.formSubmitted = false;
    this.bikeFormService.clearData();
    this.notificationService.info('Formularz został zresetowany');
  }

  navigateTo(route: string): void {
    this.router.navigate([route]);
  }
  
  scrollToSection(sectionId: string): void {
    if (!this.isBrowser) return;
    
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

  switchHowItWorksView(view: 'transport' | 'service'): void {
    this.router.navigate(['/']);
  }

  goToMap(): void {
    this.router.navigate(['/mapa-serwisow']);
  }

  ngOnDestroy(): void {
    // Cleanup if needed
  }

  private setMetaTags(): void {
    const pageTitle = 'Transport rowerów w Krakowie | Odbiór i dostawa roweru door-to-door | CycloPick';
    const pageDescription = 'Zamów transport roweru w Krakowie. Odbieramy rower spod drzwi, dostarczamy do serwisu i przywozimy naprawiony z powrotem. Usługa door-to-door dla rowerów w Krakowie i okolicach. Wygodna naprawa roweru bez wychodzenia z domu.';
    const keywords = 'transport rowerów Kraków, odbiór roweru Kraków, dostawa roweru, serwis rowerowy door-to-door, naprawa roweru Kraków, kurier rowerowy, przewóz roweru, CycloPick, transport roweru do serwisu';

    this.title.setTitle(pageTitle);
    this.meta.updateTag({ name: 'description', content: pageDescription });
    this.meta.updateTag({ name: 'keywords', content: keywords });
    this.meta.updateTag({ name: 'robots', content: 'index, follow' });

    // Open Graph
    this.meta.updateTag({ property: 'og:title', content: pageTitle });
    this.meta.updateTag({ property: 'og:description', content: pageDescription });
    this.meta.updateTag({ property: 'og:type', content: 'website' });
    this.meta.updateTag({ property: 'og:url', content: 'https://www.cyclopick.pl/jak-dzialamy' });
  }

  private setCanonicalUrl(): void {
    const canonicalUrl = 'https://www.cyclopick.pl/jak-dzialamy';
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
}