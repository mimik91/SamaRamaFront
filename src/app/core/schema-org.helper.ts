/**
 * Helper do generowania Schema.org JSON-LD structured data
 * https://schema.org/
 *
 * @description Bezstanowa klasa pomocnicza do generowania danych strukturalnych
 * zgodnych ze standardem Schema.org dla lepszego SEO i Rich Snippets w Google
 */

/**
 * Dni tygodnia dla Schema.org OpeningHoursSpecification
 */
export enum SchemaDayOfWeek {
  Monday = 'Monday',
  Tuesday = 'Tuesday',
  Wednesday = 'Wednesday',
  Thursday = 'Thursday',
  Friday = 'Friday',
  Saturday = 'Saturday',
  Sunday = 'Sunday'
}

/**
 * Pojedynczy przedział godzin otwarcia
 */
export interface SchemaOpeningHours {
  /** Dzień tygodnia (Monday, Tuesday, etc.) */
  dayOfWeek: SchemaDayOfWeek | SchemaDayOfWeek[];
  /** Godzina otwarcia w formacie HH:mm (np. "09:00") */
  opens: string;
  /** Godzina zamknięcia w formacie HH:mm (np. "17:00") */
  closes: string;
}

/**
 * Ocena agregowana (średnia ocen)
 */
export interface SchemaAggregateRating {
  /** Średnia ocena (np. 4.5) */
  ratingValue: number;
  /** Liczba ocen */
  reviewCount: number;
  /** Najlepsza możliwa ocena (domyślnie 5) */
  bestRating?: number;
  /** Najgorsza możliwa ocena (domyślnie 1) */
  worstRating?: number;
}

/**
 * Dane adresu
 */
export interface SchemaAddress {
  /** Ulica z numerem budynku */
  street: string;
  /** Miasto */
  city: string;
  /** Kod pocztowy */
  postalCode: string;
  /** Kod kraju (domyślnie 'PL') */
  country?: string;
}

/**
 * Współrzędne geograficzne
 */
export interface SchemaGeoCoordinates {
  /** Szerokość geograficzna */
  latitude: number;
  /** Długość geograficzna */
  longitude: number;
}

/**
 * Dane dla BikeRepairShop (LocalBusiness)
 */
export interface BikeRepairShopData {
  /** Nazwa serwisu */
  name: string;
  /** Opis działalności */
  description?: string;
  /** URL do zdjęcia/logo (pełny URL) */
  image?: string;
  /** Adres pocztowy */
  address: SchemaAddress;
  /** Współrzędne geograficzne */
  geo?: SchemaGeoCoordinates;
  /** Numer telefonu (format: "+48 123 456 789" lub "123456789") */
  telephone?: string;
  /** Email kontaktowy */
  email?: string;
  /** URL strony profilu */
  url: string;
  /** Godziny otwarcia */
  openingHours?: SchemaOpeningHours[];
  /** Zakres cenowy ("$", "$$", "$$$", "$$$$" lub "PLN 50-200") */
  priceRange?: string;
  /** Ocena agregowana */
  aggregateRating?: SchemaAggregateRating;
}

export class SchemaOrgHelper {
  /**
   * Generuje BikeRepairShop schema (specjalizowany LocalBusiness dla serwisów rowerowych)
   *
   * @param data Dane serwisu rowerowego
   * @returns Obiekt JSON-LD zgodny z Schema.org
   *
   * @example
   * ```typescript
   * const schema = SchemaOrgHelper.generateBikeRepairShop({
   *   name: 'Gyver Bikes',
   *   url: 'https://cyclopick.pl/gyver',
   *   address: {
   *     street: 'ul. Przykładowa 10',
   *     city: 'Kraków',
   *     postalCode: '30-001'
   *   },
   *   openingHours: [
   *     {
   *       dayOfWeek: [SchemaDayOfWeek.Monday, SchemaDayOfWeek.Tuesday],
   *       opens: '09:00',
   *       closes: '17:00'
   *     }
   *   ]
   * });
   * ```
   */
  static generateBikeRepairShop(data: BikeRepairShopData): any {
    // Walidacja wymaganych pól
    if (!data || !data.name || !data.url || !data.address) {
      console.error('[SchemaOrgHelper] Brak wymaganych danych dla BikeRepairShop');
      return null;
    }

    // Podstawowa struktura schema
    const schema: any = {
      '@context': 'https://schema.org',
      '@type': 'BikeStore', // ✅ Specjalizowany typ dla sklepów/serwisów rowerowych
      '@id': `${data.url}#business`, // ✅ Unikalny identyfikator z fragmentem
      name: data.name,
      url: data.url,
      mainEntityOfPage: {
        '@type': 'WebPage',
        '@id': data.url
      },
      description: data.description || `Profesjonalny serwis rowerowy ${data.name}`,
      address: {
        '@type': 'PostalAddress',
        streetAddress: data.address.street,
        addressLocality: data.address.city,
        postalCode: data.address.postalCode,
        addressCountry: data.address.country || 'PL'
      }
    };

    // ✅ Opcjonalne pola - dodawaj tylko jeśli istnieją

    if (data.image) {
      schema.image = Array.isArray(data.image) ? data.image : [data.image];
    }

    if (data.telephone) {
      schema.telephone = data.telephone;
    }

    if (data.email) {
      schema.email = data.email;
    }

    if (data.geo && this.isValidGeoCoordinates(data.geo)) {
      schema.geo = {
        '@type': 'GeoCoordinates',
        latitude: data.geo.latitude,
        longitude: data.geo.longitude
      };
    }

    // ✅ Godziny otwarcia - poprawiona implementacja
    if (data.openingHours && data.openingHours.length > 0) {
      schema.openingHoursSpecification = data.openingHours
        .filter(hours => this.isValidOpeningHours(hours))
        .map(hours => ({
          '@type': 'OpeningHoursSpecification',
          dayOfWeek: Array.isArray(hours.dayOfWeek) ? hours.dayOfWeek : [hours.dayOfWeek],
          opens: hours.opens,
          closes: hours.closes
        }));
    }

    if (data.priceRange) {
      schema.priceRange = data.priceRange;
    }

    // ✅ Ocena agregowana - z walidacją
    if (data.aggregateRating && this.isValidRating(data.aggregateRating)) {
      schema.aggregateRating = {
        '@type': 'AggregateRating',
        ratingValue: data.aggregateRating.ratingValue,
        reviewCount: data.aggregateRating.reviewCount,
        bestRating: data.aggregateRating.bestRating || 5,
        worstRating: data.aggregateRating.worstRating || 1
      };
    }

    return schema;
  }

  /**
   * Walidacja współrzędnych geograficznych
   */
  private static isValidGeoCoordinates(geo: SchemaGeoCoordinates): boolean {
    return (
      typeof geo.latitude === 'number' &&
      typeof geo.longitude === 'number' &&
      geo.latitude >= -90 &&
      geo.latitude <= 90 &&
      geo.longitude >= -180 &&
      geo.longitude <= 180
    );
  }

  /**
   * Walidacja godzin otwarcia
   */
  private static isValidOpeningHours(hours: SchemaOpeningHours): boolean {
    const timeRegex = /^([0-1][0-9]|2[0-3]):[0-5][0-9]$/;
    return (
      hours &&
      hours.dayOfWeek &&
      typeof hours.opens === 'string' &&
      typeof hours.closes === 'string' &&
      timeRegex.test(hours.opens) &&
      timeRegex.test(hours.closes)
    );
  }

  /**
   * Walidacja oceny
   */
  private static isValidRating(rating: SchemaAggregateRating): boolean {
    return (
      rating &&
      typeof rating.ratingValue === 'number' &&
      typeof rating.reviewCount === 'number' &&
      rating.ratingValue >= 0 &&
      rating.reviewCount >= 0
    );
  }

  /**
   * Generuje BreadcrumbList schema
   *
   * @param items Tablica elementów breadcrumb (od głównej do bieżącej)
   * @returns Obiekt JSON-LD BreadcrumbList
   *
   * @example
   * ```typescript
   * SchemaOrgHelper.generateBreadcrumb([
   *   { name: 'CycloPick', url: 'https://cyclopick.pl' },
   *   { name: 'Kraków', url: 'https://cyclopick.pl?city=krakow' },
   *   { name: 'Gyver Bikes', url: 'https://cyclopick.pl/gyver' }
   * ]);
   * ```
   */
  static generateBreadcrumb(items: Array<{ name: string; url: string }>): any {
    if (!items || items.length === 0) {
      console.warn('[SchemaOrgHelper] Pusta tablica breadcrumb');
      return null;
    }

    return {
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      itemListElement: items
        .filter(item => item && item.name && item.url)
        .map((item, index) => ({
          '@type': 'ListItem',
          position: index + 1,
          name: item.name,
          item: item.url
        }))
    };
  }

  /**
   * Generuje Service schema dla konkretnej usługi serwisu
   *
   * @param serviceName Nazwa usługi (np. "Przegląd podstawowy roweru")
   * @param description Opis usługi
   * @param provider Nazwa dostawcy (serwisu)
   * @param price Opcjonalny zakres cenowy
   */
  static generateService(
    serviceName: string,
    description: string,
    provider: string,
    price?: { min: number; max: number; currency?: string }
  ): any {
    if (!serviceName || !description || !provider) {
      console.error('[SchemaOrgHelper] Brak wymaganych danych dla Service');
      return null;
    }

    const schema: any = {
      '@context': 'https://schema.org',
      '@type': 'Service',
      serviceType: 'BikeRepair', // ✅ Typ usługi
      name: serviceName,
      description: description,
      provider: {
        '@type': 'BikeStore',
        name: provider
      }
    };

    if (price && price.min >= 0 && price.max >= price.min) {
      schema.offers = {
        '@type': 'Offer',
        priceSpecification: {
          '@type': 'PriceSpecification',
          minPrice: price.min,
          maxPrice: price.max,
          priceCurrency: price.currency || 'PLN'
        }
      };
    }

    return schema;
  }

  /**
   * Generuje Organization schema dla całego CycloPick
   * (do użycia w głównym layout aplikacji)
   */
  static generateOrganization(): any {
    return {
      '@context': 'https://schema.org',
      '@type': 'Organization',
      name: 'CycloPick',
      url: 'https://www.cyclopick.pl',
      logo: 'https://www.cyclopick.pl/assets/images/logo-cyclopick.png',
      description: 'Platforma łącząca rowerzystów z profesjonalnymi serwisami rowerowymi w całej Polsce',
      contactPoint: {
        '@type': 'ContactPoint',
        contactType: 'customer service',
        email: 'cyclopick@gmail.com',
        availableLanguage: ['pl']
      },
      sameAs: [

        'https://www.facebook.com/cyclopick'
        // 'https://www.instagram.com/cyclopick'
      ].filter(Boolean)
    };
  }

  /**
   * Helper: Konwertuje skrót dnia (Mo, Tu, etc.) na pełną nazwę Schema.org
   *
   * @deprecated Użyj enum SchemaDayOfWeek zamiast stringów
   */
  static convertShortDayToSchema(shortDay: string): SchemaDayOfWeek | null {
    const mapping: { [key: string]: SchemaDayOfWeek } = {
      Mo: SchemaDayOfWeek.Monday,
      Tu: SchemaDayOfWeek.Tuesday,
      We: SchemaDayOfWeek.Wednesday,
      Th: SchemaDayOfWeek.Thursday,
      Fr: SchemaDayOfWeek.Friday,
      Sa: SchemaDayOfWeek.Saturday,
      Su: SchemaDayOfWeek.Sunday,
      Mon: SchemaDayOfWeek.Monday,
      Tue: SchemaDayOfWeek.Tuesday,
      Wed: SchemaDayOfWeek.Wednesday,
      Thu: SchemaDayOfWeek.Thursday,
      Fri: SchemaDayOfWeek.Friday,
      Sat: SchemaDayOfWeek.Saturday,
      Sun: SchemaDayOfWeek.Sunday
    };

    return mapping[shortDay] || null;
  }

  /**
   * Helper: Rozszerza zakres dni (np. Mo-Fr) na tablicę dni
   *
   * @example
   * expandDayRange('Mo', 'Fr') => [Monday, Tuesday, Wednesday, Thursday, Friday]
   */
  static expandDayRange(start: string, end: string): SchemaDayOfWeek[] {
    const days = [
      SchemaDayOfWeek.Monday,
      SchemaDayOfWeek.Tuesday,
      SchemaDayOfWeek.Wednesday,
      SchemaDayOfWeek.Thursday,
      SchemaDayOfWeek.Friday,
      SchemaDayOfWeek.Saturday,
      SchemaDayOfWeek.Sunday
    ];
    const shortDays = ['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su'];

    const startIdx = shortDays.indexOf(start);
    const endIdx = shortDays.indexOf(end);

    if (startIdx === -1 || endIdx === -1) {
      console.warn(`[SchemaOrgHelper] Nieprawidłowy zakres dni: ${start}-${end}`);
      return [];
    }

    const result: SchemaDayOfWeek[] = [];
    for (let i = startIdx; i <= endIdx; i++) {
      result.push(days[i]);
    }

    return result;
  }
}
