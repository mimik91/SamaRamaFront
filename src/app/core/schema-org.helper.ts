/**
 * Helper do generowania Schema.org JSON-LD structured data
 * https://schema.org/
 */

export interface LocalBusinessData {
  name: string;
  description?: string;
  image?: string;
  address: {
    street: string;
    city: string;
    postalCode: string;
    country?: string;
  };
  geo?: {
    latitude: number;
    longitude: number;
  };
  telephone?: string;
  email?: string;
  url: string;
  openingHours?: string[]; // Format: "Mo-Fr 09:00-17:00"
  priceRange?: string; // Format: "$$" lub "50-200 PLN"
  rating?: {
    value: number;
    count: number;
  };
}

export class SchemaOrgHelper {
  /**
   * Generuje LocalBusiness schema dla serwisu rowerowego
   */
  static generateLocalBusiness(data: LocalBusinessData): any {
    const schema: any = {
      '@context': 'https://schema.org',
      '@type': 'LocalBusiness',
      '@id': data.url,
      name: data.name,
      url: data.url,
      description: data.description || `Profesjonalny serwis rowerowy ${data.name}`,
      address: {
        '@type': 'PostalAddress',
        streetAddress: data.address.street,
        addressLocality: data.address.city,
        postalCode: data.address.postalCode,
        addressCountry: data.address.country || 'PL'
      }
    };

    // Opcjonalne pola
    if (data.image) {
      schema.image = data.image;
    }

    if (data.telephone) {
      schema.telephone = data.telephone;
    }

    if (data.email) {
      schema.email = data.email;
    }

    if (data.geo) {
      schema.geo = {
        '@type': 'GeoCoordinates',
        latitude: data.geo.latitude,
        longitude: data.geo.longitude
      };
    }

    if (data.openingHours && data.openingHours.length > 0) {
      schema.openingHoursSpecification = data.openingHours.map(hours => ({
        '@type': 'OpeningHoursSpecification',
        dayOfWeek: this.parseDayOfWeek(hours),
        opens: this.parseOpenTime(hours),
        closes: this.parseCloseTime(hours)
      }));
    }

    if (data.priceRange) {
      schema.priceRange = data.priceRange;
    }

    if (data.rating) {
      schema.aggregateRating = {
        '@type': 'AggregateRating',
        ratingValue: data.rating.value,
        reviewCount: data.rating.count
      };
    }

    return schema;
  }

  /**
   * Generuje BreadcrumbList schema
   */
  static generateBreadcrumb(items: Array<{ name: string; url: string }>): any {
    return {
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      itemListElement: items.map((item, index) => ({
        '@type': 'ListItem',
        position: index + 1,
        name: item.name,
        item: item.url
      }))
    };
  }

  /**
   * Generuje Service schema dla usług serwisu
   */
  static generateService(
    serviceName: string,
    description: string,
    provider: string,
    price?: { min: number; max: number; currency?: string }
  ): any {
    const schema: any = {
      '@context': 'https://schema.org',
      '@type': 'Service',
      name: serviceName,
      description: description,
      provider: {
        '@type': 'LocalBusiness',
        name: provider
      }
    };

    if (price) {
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
   */
  static generateOrganization(): any {
    return {
      '@context': 'https://schema.org',
      '@type': 'Organization',
      name: 'CycloPick',
      url: 'https://cyclopick.pl',
      logo: 'https://cyclopick.pl/assets/images/logo.png',
      description: 'Platforma łącząca rowerzystów z profesjonalnymi serwisami rowerowymi w całej Polsce',
      contactPoint: {
        '@type': 'ContactPoint',
        contactType: 'customer service',
        email: 'kontakt@cyclopick.pl'
      },
      sameAs: [
        'https://www.facebook.com/cyclopick' // Dodaj jeśli masz
      ]
    };
  }

  // Helper methods

  private static parseDayOfWeek(hoursString: string): string[] {
    // Format: "Mo-Fr 09:00-17:00"
    const daysPart = hoursString.split(' ')[0];

    if (daysPart.includes('-')) {
      const [start, end] = daysPart.split('-');
      return this.expandDayRange(start, end);
    }

    return [this.convertDay(daysPart)];
  }

  private static expandDayRange(start: string, end: string): string[] {
    const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
    const shortDays = ['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su'];

    const startIdx = shortDays.indexOf(start);
    const endIdx = shortDays.indexOf(end);

    if (startIdx === -1 || endIdx === -1) return [];

    const result: string[] = [];
    for (let i = startIdx; i <= endIdx; i++) {
      result.push(days[i]);
    }

    return result;
  }

  private static convertDay(shortDay: string): string {
    const mapping: { [key: string]: string } = {
      Mo: 'Monday',
      Tu: 'Tuesday',
      We: 'Wednesday',
      Th: 'Thursday',
      Fr: 'Friday',
      Sa: 'Saturday',
      Su: 'Sunday'
    };

    return mapping[shortDay] || shortDay;
  }

  private static parseOpenTime(hoursString: string): string {
    // Format: "Mo-Fr 09:00-17:00"
    const timePart = hoursString.split(' ')[1];
    return timePart?.split('-')[0] || '';
  }

  private static parseCloseTime(hoursString: string): string {
    // Format: "Mo-Fr 09:00-17:00"
    const timePart = hoursString.split(' ')[1];
    return timePart?.split('-')[1] || '';
  }
}
