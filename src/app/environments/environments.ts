export const environment = {
  production: false,
  
  // API Configuration
  siteUrl: 'https://localhost:8080',
  apiUrl: 'http://localhost:8080/api',
  
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
    account: '/account',
    auth: '/auth',
    bicycles: '/bicycles',
    password: '/password',
    verification: '/verification',
    map: '/map',

    admin: {
      base: '/admin',
      bikeServices: '/admin/bike-services',
      orders: '/admin/orders',
      orderById: '/admin/orders/:id'
    },

    orders: {
      service: '/orders/service',
      courier: '/orders/courier/orders'
    },

    guestOrders: {
      transport: '/guest-orders/transport',
      discounts: '/guest-orders/discounts',
    },

    serviceSlots: {
      base: '/service-slots',
      checkAvailability: '/service-slots/check-availability'
    },

    servicePackages: '/service-packages',
    serviceRecords: '/service-records',

    enumerations: {
      base: '/enumerations',
      cities: '/cities'
    },

    bikeServices: {
      base: '/bike-services',
      coverages: '/bike-services/coverages',
      bikeTypes: '/bike-services/coverages/bikeTypes',
      bySuffix: '/bike-services/by-suffix',
      publicInfo: '/bike-services/:id/public-info',
      activeStatus: '/bike-services/:id/active-status',
      openingHours: '/bike-services/:id/opening-hours',
      pricelist: '/bike-services/:id/pricelist',
      pricelistAvailableItems: '/bike-services/pricelist/available-items',
      packagesConfig: '/bike-services/service-packages-config',
      packages: '/bike-services/service-packages'
    },

    bikeServicesRegistered: {
      base: '/bike-services-registered',
      myService: '/bike-services-registered/my-service',
      pricelist: '/bike-services-registered/my-service/pricelist',
      pricelistCategories: '/bike-services-registered/pricelist/categories',
      pricelistAvailableItems: '/bike-services-registered/pricelist/available-items',
      packages: '/bike-services-registered/my-service/packages',
      packagesConfig: '/bike-services-registered/my-service/packages-config'
    },

    services: {
      images: '/services/:id/images/:type',
      imagesBase: '/services/:id/images'
    },

    mapPins: '/map/service-pins'
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
  apiUrl: 'https://api.yourdomain.com/api'
};