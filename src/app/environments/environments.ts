export const environment = {
  production: false,
  
  // API Configuration
  siteUrl: 'https://www.cyclopick.pl',
  apiUrl: 'https://www.cyclopick.pl/api',
  
  // External Links
  links: {
    termsOfService: '/terms-of-service',
    privacyPolicy: '/privacy-policy',
    homepage: '/',
    servicesMap: '/services-map',
    orderSummary: '/ordersummary'
  },
  
  // API Endpoints
  endpoints: {
    guestOrders: {
      transport: '/guest-orders/transport',
      discounts: '/guest-orders/discounts',
    },
    serviceSlots: {
      checkAvailability: '/service-slots/check-availability'
    },
    enumerations: {
      base: '/enumerations',
      cities: '/cities'
    },
    bikeServices: {
      base: '/bike-services',
      coverages: '/bike-services/coverages',
      bikeTypes: '/bike-services/coverages/bikeTypes'
    },
    bikeServicesRegistered: {
      base: '/bike-services-registered',
      myService: '/bike-services-registered/my-service',
      pricelist: '/bike-services-registered/my-service/pricelist',
      pricelistCategories: '/bike-services-registered/pricelist/categories',
      pricelistAvailableItems: '/bike-services-registered/pricelist/available-items',
      packages: '/bike-services-registered/my-service/packages',
      packagesConfig: '/bike-services-registered/my-service/packages-config'
    }
  },
  
  // Application Settings
  settings: {
    // Date constraints for transport orders
    transport: {
      minDaysInAdvance: 1,
      maxDaysInAdvance: 30,
      allowedDays: [0, 1, 2, 3, 4], // Sunday to Thursday
      pickupTimeFrom: '18:00',
      pickupTimeTo: '22:00'
    },
    
    // Validation rules
    validation: {
      phoneNumberLength: 9,
      minModelLength: 2,
      postalCodePattern: /^\d{2}-\d{3}$/,
      emailPattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    },
    
    // Pricelist & Packages settings
    pricelist: {
      maxDescriptionLength: 500,
      maxGeneralDescriptionLength: 1000,
      maxPackageDescriptionLength: 2000,
      maxCustomNameLength: 100,
      priceDecimalPlaces: 2,
      maxPriceDigits: 8
    },
    
    // Redirect settings
    redirects: {
      orderSummaryCountdown: 30 // seconds
    },
    
    // Fallback data
    fallback: {
      brands: ['Trek', 'Specialized', 'Giant', 'Cannondale', 'Scott', 'Merida', 'Kona', 'Cube', 'Inna'],
      cities: ['Kraków', 'Warszawa', 'Gdańsk', 'Poznań', 'Wrocław', 'Łódź']
    }
  }
};

// Production environment
export const environmentProduction = {
  ...environment,
  production: true,
  siteUrl: 'https://cyclopick.pl',
  apiUrl: 'https://cyclopick.pl/api'
};