import { Component, OnInit, OnDestroy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { I18nService } from '../../core/i18n.service';
import { ServiceProfileService } from './service-profile.service';
import { SeoService } from '../../core/seo.service';
import {
  SchemaOrgHelper,
  BikeRepairShopData,
  SchemaDayOfWeek,
  SchemaOpeningHours
} from '../../core/schema-org.helper';
import {
  BikeServicePublicInfo,
  ServiceActiveStatus
} from '../../shared/models/bike-service-common.models';
import { OpeningHoursWithInfoDto, DAY_NAMES_PL, DayOfWeek, DayInterval } from '../../shared/models/opening-hours.models';
import { ServicePricelistDto, CategoryWithItemsDto } from '../../shared/models/service-pricelist.models';
import {
  ServicePackagesConfigDto,
  ServicePackageDto,
  PackageLevel,
  filterPackagesByBikeType
} from '../../shared/models/service-packages.models';

type TabType = 'info' | 'hours' | 'pricelist' | 'packages';

@Component({
  selector: 'app-service-profile-page',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  templateUrl: './service-profile.component.html',
  styleUrls: ['./service-profile.component.css']
})
export class ServiceProfilePageComponent implements OnInit, OnDestroy {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private profileService = inject(ServiceProfileService);
  private i18n = inject(I18nService);
  private seoService = inject(SeoService);

  // Stan ładowania
  isLoading = true;
  error: string = '';
  
  // Dane serwisu
  serviceId: number | null = null;
  suffix: string = '';
  publicInfo: BikeServicePublicInfo | null = null;
  activeStatus: ServiceActiveStatus | null = null;
  
  // Dane opcjonalne (ładowane warunkowo)
  openingHours: OpeningHoursWithInfoDto | null = null;
  pricelist: ServicePricelistDto | null = null;
  availableItems: CategoryWithItemsDto[] = [];
  
  // Pakiety serwisowe
  packagesConfig: ServicePackagesConfigDto | null = null;
  packages: ServicePackageDto[] = [];
  bikeTypes: string[] = [];
  selectedBikeType: string | null = null;
  filteredPackages: ServicePackageDto[] = [];
  
  // Obrazy serwisu
  logoUrl: string = 'assets/images/logo-cyclopick.png';
  aboutUsImageUrl: string = 'assets/images/pictures/vertical/przelrzutka-rowerowa.webp';
  openingHoursImageUrl: string = 'assets/images/pictures/vertical/rower.webp';
  
  // Aktywna zakładka
  activeTab: TabType = 'info';
  
  // Dni tygodnia
  daysOfWeek: Array<{key: DayOfWeek, label: string}> = [
    { key: 'monday', label: DAY_NAMES_PL.monday },
    { key: 'tuesday', label: DAY_NAMES_PL.tuesday },
    { key: 'wednesday', label: DAY_NAMES_PL.wednesday },
    { key: 'thursday', label: DAY_NAMES_PL.thursday },
    { key: 'friday', label: DAY_NAMES_PL.friday },
    { key: 'saturday', label: DAY_NAMES_PL.saturday },
    { key: 'sunday', label: DAY_NAMES_PL.sunday }
  ];

  // Poziomy pakietów do wyświetlenia
  packageLevels: PackageLevel[] = [
    PackageLevel.BASIC,
    PackageLevel.ADVANCED,
    PackageLevel.FULL
  ];

  ngOnInit(): void {
    // Pobierz suffix z URL
    this.suffix = this.route.snapshot.paramMap.get('suffix') || '';

    if (!this.suffix) {
      this.error = this.i18n.instant('service_profile.errors.invalid_url');
      this.isLoading = false;
      return;
    }

    // Subscribe to route data changes to detect section changes
    this.route.data.subscribe(data => {
      const section = data['section'] as TabType | undefined;
      if (section) {
        this.activeTab = section;
        this.updateSeoForSection();
      }
    });

    this.loadServiceProfile();
  }

  private updateSeoForSection(): void {
    if (!this.publicInfo || !this.suffix) return;

    const serviceName = this.publicInfo.name;
    const city = this.publicInfo.city;
    const address = this.getFullAddress();
    let path = `/${this.suffix}`;
    let title = `${serviceName} | CycloPick`;
    let description = this.publicInfo.description || `Profesjonalny serwis rowerowy ${serviceName} w ${city}.`;
    let keywords: string[] = [
      'serwis rowerowy',
      `serwis rowerowy ${city}`,
      'naprawa rowerów',
      `naprawa rowerów ${city}`,
      serviceName,
      'warsztat rowerowy',
      'mechanik rowerowy'
    ];

    // Dostosuj SEO dla konkretnej sekcji
    if (this.activeTab === 'pricelist') {
      path += '/cennik';
      title = `${serviceName} - Cennik | CycloPick`;
      description = `Sprawdź cennik serwisu rowerowego ${serviceName} w ${city}. Pakiety serwisowe i ceny poszczególnych usług naprawy rowerów.`;
      keywords.push('cennik serwisu rowerowego', `cennik ${serviceName}`, 'ceny naprawy rowerów');
    } else if (this.activeTab === 'hours') {
      path += '/godziny-otwarcia';
      title = `${serviceName} - Godziny otwarcia | CycloPick`;
      description = `Sprawdź godziny otwarcia serwisu rowerowego ${serviceName} w ${city}. Zaplanuj wizytę w dogodnym dla Ciebie terminie.`;
      keywords.push('godziny otwarcia', `godziny otwarcia ${serviceName}`, 'kiedy otwarty');
    } else {
      // Default "O nas" section
      description += ` Sprawdź informacje o serwisie, dane kontaktowe i lokalizację.`;
      keywords.push('o nas', 'kontakt', 'adres serwisu');
    }

    // Użyj rozszerzonej metody SEO z Open Graph i Twitter Cards
    this.seoService.updateFullSeoTags(
      {
        title,
        description,
        image: this.logoUrl,
        type: 'profile',
        keywords
      },
      path
    );
  }

  loadServiceProfile(): void {
    this.isLoading = true;
    this.error = '';

    // Krok 1: Pobierz ID serwisu na podstawie suffixu
    this.profileService.getServiceIdBySuffix(this.suffix).subscribe({
      next: (response) => {
        this.serviceId = response.id;
        this.loadServiceData();
      },
      error: (err) => {
        console.error('Service not found:', err);
        this.error = this.i18n.instant('service_profile.errors.service_not_found');
        this.isLoading = false;
        // Opcjonalnie przekieruj na stronę główną
        setTimeout(() => {
          this.router.navigate(['/']);
        }, 3000);
      }
    });
  }

  loadServiceData(): void {
  if (!this.serviceId) return;

  // Krok 2: Pobierz podstawowe dane i status
  Promise.all([
    this.profileService.getPublicInfo(this.serviceId).toPromise(),
    this.profileService.getActiveStatus(this.serviceId).toPromise()
  ])
    .then(([publicInfo, activeStatus]) => {
      this.publicInfo = publicInfo || null;
      this.activeStatus = activeStatus || null;
      
      console.log('🔍 Active Status:', activeStatus); // DEBUG
      
      // Krok 3: Warunkowo załaduj dodatkowe dane
      const promises: Promise<any>[] = [];
      
      // Załaduj obrazy
      promises.push(this.loadServiceImages());
      
      if (activeStatus?.openingHoursActive) {
        console.log('⏰ Loading opening hours...'); // DEBUG
        promises.push(
          this.profileService.getOpeningHours(this.serviceId!).toPromise()
            .then(hours => { this.openingHours = hours || null; })
            .catch(() => { this.openingHours = null; })
        );
      }
      
      if (activeStatus?.pricelistActive) {
        console.log('📋 Pricelist is active, loading pricelist data...'); // DEBUG
        
        promises.push(
          this.profileService.getPricelist(this.serviceId!).toPromise()
            .then(pricelist => { 
              console.log('✅ Pricelist loaded:', pricelist);
              this.pricelist = pricelist || null; 
            })
            .catch(err => { 
              console.error('❌ Pricelist error:', err);
              this.pricelist = null; 
            })
        );
        
        promises.push(
          this.profileService.getAllAvailableItems().toPromise()
            .then(items => { 
              console.log('✅ Available items loaded:', items);
              this.availableItems = items || []; 
            })
            .catch(err => { 
              console.error('❌ Available items error:', err);
              this.availableItems = []; 
            })
        );

        // ✅ ZAWSZE ładuj pakiety gdy cennik jest aktywny
        // (pakiety są częścią cennika, więc ładujemy je razem)
        console.log('📦 Loading packages data...'); // DEBUG
        promises.push(
          this.loadPackagesData()
            .then(() => console.log('✅ Packages loaded successfully'))
            .catch(err => console.error('❌ Packages loading failed:', err))
        );
      }
      
      return Promise.all(promises);
    })
    .then(() => {
      this.isLoading = false;
      this.updateSeoForSection();

      // ✅ Dodaj structured data AFTER SEO tags
      this.updateStructuredData();

      console.log('✅ All data loaded successfully');
    })
    .catch(err => {
      console.error('❌ Error loading service data:', err);
      this.error = this.i18n.instant('service_profile.errors.load_failed');
      this.isLoading = false;
    });
}

  private async loadPackagesData(): Promise<void> {
  console.log('🎯 loadPackagesData() CALLED with serviceId:', this.serviceId);
  
  if (!this.serviceId) {
    console.error('❌ No serviceId in loadPackagesData!');
    return;
  }

  try {
    // ✅ TYLKO JEDEN REQUEST - config już zawiera packages!
    console.log('📦 Fetching packages config (with packages inside)...');
    this.packagesConfig = await this.profileService.getPackagesConfig(this.serviceId).toPromise() || null;
    console.log('📦 Packages Config received:', this.packagesConfig);
    
    // ✅ Wyciągnij packages z config
    if (this.packagesConfig && this.packagesConfig.packages) {
      this.packages = this.packagesConfig.packages;
      console.log('📦 Extracted packages from config:', this.packages);
    } else {
      this.packages = [];
      console.warn('⚠️ No packages in config!');
    }
    
    // Pobierz typy rowerów
    console.log('📦 Fetching bike types...');
    this.bikeTypes = await this.profileService.getBikeTypes(this.serviceId).toPromise() || [];
    console.log('📦 Bike Types received:', this.bikeTypes);
    
    // Ustaw domyślny typ roweru
    if (this.packagesConfig?.defaultBikeType && this.bikeTypes.includes(this.packagesConfig.defaultBikeType)) {
      this.selectedBikeType = this.packagesConfig.defaultBikeType;
      console.log('📦 Selected default bike type:', this.selectedBikeType);
    } else if (this.bikeTypes.length > 0) {
      this.selectedBikeType = this.bikeTypes[0];
      console.log('📦 Selected first bike type:', this.selectedBikeType);
    } else {
      console.warn('⚠️ No bike types available!');
    }
    
    // Filtruj pakiety według wybranego typu
    this.updateFilteredPackages();
    console.log('📦 Filtered packages:', this.filteredPackages);
    console.log('📦 Selected bike type:', this.selectedBikeType);
    
    console.log('✅ loadPackagesData() COMPLETED');
  } catch (err) {
    console.error('❌ Error in loadPackagesData():', err);
    console.error('❌ Error details:', err);
    this.packagesConfig = null;
    this.packages = [];
  }
}

  private async loadServiceImages(): Promise<void> {
    if (!this.serviceId) return;

    // Załaduj LOGO
    try {
      const logoResponse = await this.profileService.getServiceImage(this.serviceId, 'LOGO').toPromise();
      if (logoResponse?.url) {
        this.logoUrl = logoResponse.url;
      }
    } catch (err) {
      console.log('No custom logo, using default');
    }

    // Załaduj ABOUT_US
    try {
      const aboutUsResponse = await this.profileService.getServiceImage(this.serviceId, 'ABOUT_US').toPromise();
      if (aboutUsResponse?.url) {
        this.aboutUsImageUrl = aboutUsResponse.url;
      }
    } catch (err) {
      console.log('No ABOUT_US image, using default');
    }

    // Załaduj OPENING_HOURS
    try {
      const openingHoursResponse = await this.profileService.getServiceImage(this.serviceId, 'OPENING_HOURS').toPromise();
      if (openingHoursResponse?.url) {
        this.openingHoursImageUrl = openingHoursResponse.url;
      }
    } catch (err) {
      console.log('No OPENING_HOURS image, using default');
    }
  }

  // Metody pomocnicze dla zakładek
  setActiveTab(tab: TabType): void {
    // Navigate to appropriate URL instead of changing local state
    const urlMap: Record<TabType, string> = {
      'info': `/${this.suffix}`,
      'hours': `/${this.suffix}/godziny-otwarcia`,
      'pricelist': `/${this.suffix}/cennik`,
      'packages': `/${this.suffix}/cennik` // Packages are part of pricelist
    };

    const targetUrl = urlMap[tab];
    if (targetUrl) {
      this.router.navigateByUrl(targetUrl);
    }
  }

  // Metoda do zmiany typu roweru w pakietach
  onBikeTypeChange(bikeType: string): void {
    this.selectedBikeType = bikeType;
    this.updateFilteredPackages();
  }

  private updateFilteredPackages(): void {
    this.filteredPackages = filterPackagesByBikeType(this.packages, this.selectedBikeType);
  }

  // Pobiera pakiet dla danego poziomu
  getPackageForLevel(level: PackageLevel): ServicePackageDto | null {
    return this.filteredPackages.find(p => p.packageLevel === level) || null;
  }

  // Zwraca nazwę wyświetlaną pakietu
  getPackageDisplayName(pkg: ServicePackageDto): string {
    return pkg.customName || pkg.packageLevelDisplayName;
  }

  // Pomocnicza metoda do formatowania cennika
  getPricelistByCategories(): Array<{category: string, items: Array<{name: string, price: number}>}> {
    if (!this.pricelist || !this.availableItems) return [];
    
    return this.availableItems
      .map(categoryData => {
        const items = categoryData.items
          .filter((item: any) => this.pricelist!.items[item.id])
          .map((item: any) => ({
            name: item.name,
            price: this.pricelist!.items[item.id]
          }));
        
        return {
          category: categoryData.category.name,
          items: items
        };
      })
      .filter(cat => cat.items.length > 0);
  }

  // Pomocnicze metody dla wyświetlania danych
  getFullAddress(): string {
    if (!this.publicInfo) return '';
    
    const parts = [
      this.publicInfo.street,
      this.publicInfo.building,
      this.publicInfo.flat,
      this.publicInfo.postalCode,
      this.publicInfo.city
    ].filter(Boolean);
    
    return parts.join(', ');
  }

  hasContactInfo(): boolean {
    if (!this.publicInfo) return false;
    return !!(this.publicInfo.email || this.publicInfo.phoneNumber || this.publicInfo.website);
  }

  hasSocialMedia(): boolean {
    if (!this.publicInfo) return false;
    return !!(this.publicInfo.facebook || this.publicInfo.instagram || 
              this.publicInfo.tiktok || this.publicInfo.youtube || this.publicInfo.website);
  }

  getDayInterval(dayKey: DayOfWeek): DayInterval | null {
    if (!this.openingHours) return null;
    
    // Sprawdź czy są intervals (format z intervals object)
    if (this.openingHours.intervals) {
      const upperKey = dayKey.toUpperCase();
      if (this.openingHours.intervals[upperKey]) {
        return this.openingHours.intervals[upperKey];
      }
    }
    
    // Sprawdź czy są bezpośrednie pola (format: monday, tuesday, etc.)
    const dayHours = this.openingHours[dayKey];
    if (dayHours && !dayHours.closed && dayHours.open && dayHours.close) {
      return {
        openTime: dayHours.open,
        closeTime: dayHours.close
      };
    }
    
    return null;
  }

  getWebsiteUrl(url: string): string {
    if (!url) return '';
    // Jeśli URL nie ma protokołu, dodaj https://
    if (!url.startsWith('http://') && !url.startsWith('https://')) {
      return 'https://' + url;
    }
    return url;
  }

  // Metoda pomocnicza do tłumaczeń (dla template)
  t(key: string): string {
    return this.i18n.instant(key);
  }

  /**
   * ✅ NOWA METODA: Aktualizacja SEO i JSON-LD Structured Data
   *
   * Używa zrefaktoryzowanego SchemaOrgHelper z BikeRepairShop
   */
  private updateStructuredData(): void {
    if (!this.publicInfo) {
      console.warn('[ServiceProfile] Brak publicInfo - pomijam structured data');
      return;
    }

    const serviceName = this.publicInfo.name;
    const city = this.publicInfo.city || 'Polska';
    const description = this.publicInfo.description;

    // 1. Przygotuj dane dla BikeRepairShop schema
    const bikeShopData: BikeRepairShopData = {
      name: serviceName,
      description: description || `Profesjonalny serwis rowerowy ${serviceName}`,
      image: this.logoUrl,
      address: {
        street: `${this.publicInfo.street} ${this.publicInfo.building}${this.publicInfo.flat ? '/' + this.publicInfo.flat : ''}`,
        city: this.publicInfo.city || 'Polska',
        postalCode: this.publicInfo.postalCode || '00-000',
        country: 'PL'
      },
      url: `https://www.cyclopick.pl/${this.suffix}`,
      telephone: this.publicInfo.phoneNumber || undefined,
      email: this.publicInfo.email || undefined
    };

    // 2. Dodaj współrzędne geograficzne (jeśli dostępne)
    // TODO: Dodaj geo coordinates z API gdy będą dostępne
    // if (this.publicInfo.latitude && this.publicInfo.longitude) {
    //   bikeShopData.geo = {
    //     latitude: this.publicInfo.latitude,
    //     longitude: this.publicInfo.longitude
    //   };
    // }

    // 3. Dodaj godziny otwarcia (jeśli dostępne)
    if (this.openingHours && this.activeStatus?.openingHoursActive) {
      bikeShopData.openingHours = this.convertOpeningHoursToSchema();
    }

    // 4. Dodaj zakres cenowy (jeśli dostępny)
    if (this.pricelist && this.activeStatus?.pricelistActive) {
      bikeShopData.priceRange = this.estimatePriceRange();
    }

    // 5. Dodaj ocenę (jeśli dostępna)
    // TODO: Dodaj ratings z API gdy będą dostępne
    // if (this.publicInfo.rating && this.publicInfo.reviewCount) {
    //   bikeShopData.aggregateRating = {
    //     ratingValue: this.publicInfo.rating,
    //     reviewCount: this.publicInfo.reviewCount
    //   };
    // }

    // 6. Generuj schema i dodaj do DOM
    const bikeShopSchema = SchemaOrgHelper.generateBikeRepairShop(bikeShopData);

    if (bikeShopSchema) {
      // 7. Opcjonalnie: Dodaj breadcrumb
      const breadcrumb = SchemaOrgHelper.generateBreadcrumb([
        { name: 'CycloPick', url: 'https://www.cyclopick.pl' },
        { name: city, url: `https://www.cyclopick.pl?city=${encodeURIComponent(city)}` },
        { name: serviceName, url: `https://www.cyclopick.pl/${this.suffix}` }
      ]);

      // 8. Dodaj oba schematy jednocześnie (BikeRepairShop + Breadcrumb)
      if (breadcrumb) {
        this.seoService.addMultipleStructuredData([bikeShopSchema, breadcrumb]);
      } else {
        this.seoService.addStructuredData(bikeShopSchema);
      }

      console.log('[ServiceProfile] ✅ Structured data added:', bikeShopSchema);
    }
  }

  /**
   * Konwertuje godziny otwarcia z API na format Schema.org
   */
  private convertOpeningHoursToSchema(): SchemaOpeningHours[] {
    if (!this.openingHours) return [];

    const schemaHours: SchemaOpeningHours[] = [];

    const dayMapping: { [key: string]: SchemaDayOfWeek } = {
      'monday': SchemaDayOfWeek.Monday,
      'tuesday': SchemaDayOfWeek.Tuesday,
      'wednesday': SchemaDayOfWeek.Wednesday,
      'thursday': SchemaDayOfWeek.Thursday,
      'friday': SchemaDayOfWeek.Friday,
      'saturday': SchemaDayOfWeek.Saturday,
      'sunday': SchemaDayOfWeek.Sunday
    };

    this.daysOfWeek.forEach(({ key }) => {
      const interval = this.getDayInterval(key);

      if (interval && interval.openTime && interval.closeTime) {
        const schemaDay = dayMapping[key];

        if (schemaDay) {
          schemaHours.push({
            dayOfWeek: schemaDay,
            opens: interval.openTime,
            closes: interval.closeTime
          });
        }
      }
    });

    return schemaHours;
  }

  /**
   * Estymuje zakres cenowy na podstawie cennika
   * Zwraca format "PLN min-max" dla najlepszej precyzji
   *
   * @returns Zakres cenowy w formacie "PLN 50-300" lub "$$" jako fallback
   */
  private estimatePriceRange(): string {
    if (!this.pricelist || !this.pricelist.items) {
      return '$$'; // Fallback gdy brak cennika
    }

    // Pobierz wszystkie ceny z cennika
    const prices = Object.values(this.pricelist.items)
      .filter(price => typeof price === 'number' && price > 0);

    if (prices.length === 0) {
      return '$$'; // Fallback gdy brak cen
    }

    // Znajdź minimalną i maksymalną cenę
    const minPrice = Math.min(...prices);
    const maxPrice = Math.max(...prices);

    // ✅ Zwróć konkretny zakres cenowy z walutą
    // Format akceptowany przez Schema.org: "PLN 50-300"
    return `PLN ${Math.round(minPrice)}-${Math.round(maxPrice)}`;
  }

  /**
   * Cleanup przy niszczeniu komponentu
   */
  ngOnDestroy(): void {
    // Usuń JSON-LD structured data przy przechodzeniu do innej strony
    this.seoService.removeStructuredData();
    console.log('[ServiceProfile] ✅ Component destroyed, structured data removed');
  }
}