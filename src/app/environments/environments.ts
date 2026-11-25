export const environment = {
  production: false,
  
  // API Configuration
  siteUrl: 'https://www.cyclopick.pl',
  apiUrl: 'https://api.cyclopick.pl/api',
  
  // External Links
  links: {
    termsOfService: '/terms-of-service',
    privacyPolicy: '/privacy-policy',
    homepage: '/',
    servicesMap: '/mapa-serwisow',
    orderSummary: '/ordersummary',
    paymentReturn: '/platnosc/powrot'
  },
  
  // API Endpoints
  endpoints: {
    account: '/account',
    auth: '/auth',
    bicycles: '/user/bicycles',
    password: '/password',
    verification: '/verification',
    map: '/map',
    reviews: '/reviews',
    analytics: {
      cityPageView: '/analytics/city-page-view'
    },

    admin: {
      base: '/admin',
      bikeServices: '/admin/bike-services',
      orders: '/admin/orders',
      orderById: '/admin/orders/:id',
      orderTransportStatus: '/admin/orders/transport/:id/status',
      officeAddresses: '/admin/office-addresses',
      coupons: '/admin/coupons',
      expressService: {
        config: '/admin/express-service/config',
        orders: '/admin/express-service/orders',
        assignOrder: '/admin/express-service/orders/:id/assign',
        packages: '/admin/express-service/packages',
        packagesConfig: '/admin/express-service/packages-config',
        services: '/admin/express-service/services',
        repairPlanPayments: '/admin/express-service/repair-plan-payments'
      }
    },

    orders: {
      service: '/orders/service',
      courier: '/orders/courier/orders'
    },

    guestOrders: {
      transport: '/guest-orders/transport',
      discounts: '/guest-orders/discounts',
      serviceReservation: '/guest-orders/service-reservation',
      serviceAvailability: '/guest-orders/service-reservation/:serviceId/availability',
      officeAddresses: '/guest-orders/office-addresses',
      report: '/guest-orders/report',
      sessionSync: '/guest-orders/session-sync',
      expressAvailability: '/guest-orders/express-reservation/availability',
      expressReservationQuote: '/guest-orders/express-reservation/quote',
      expressPackages: '/guest-orders/express-packages',
      access: '/guest-orders/access'

    },

    payment: {
      initiate: '/payments/initiate',
      status: '/payments/status'
    },

    serviceSlots: {
      base: '/service-slots',
      checkAvailability: '/service-slots/check-availability'
    },

    servicePackages: '/service-packages',
    serviceRecords: '/user/service-records',

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
      packages: '/bike-services/service-packages',
      logosReservationAvailable: '/bike-services/logos/reservation-available'
    },

    bikeServicesRegistered: {
      base: '/bike-services-registered',
      myService: '/bike-services-registered/my-service',
      pricelist: '/bike-services-registered/my-service/pricelist',
      pricelistCategories: '/bike-services-registered/pricelist/categories',
      pricelistAvailableItems: '/bike-services-registered/pricelist/available-items',
      packages: '/bike-services-registered/my-service/packages',
      packagesConfig: '/bike-services-registered/my-service/packages-config',
      serviceRecords: '/bike-services-registered/my-service/service-records'
    },

    services: {
      images: '/services/:id/images/:type',
      imagesBase: '/services/:id/images'
    },

    mapPins: '/map/service-pins',

    // Service Calendar endpoints
    serviceCalendar: {
      config: '/service-calendar/config',
      technicians: '/service-calendar/technicians',
      dayView: '/service-calendar/view/day',
      weekView: '/service-calendar/view/week',
      monthView: '/service-calendar/view/month',
      orders: '/service-calendar/orders',
      orderStatus: '/service-calendar/orders/:id/status',
      orderImages: '/service-orders/:id/images',
      clientLookup: '/service-calendar/clients/lookup',
      clientBikes: '/service-calendar/clients/:clientId/bikes',
      returnTransport: '/service-calendar/orders/:id/return-transport',
      stolenCheck: '/service-calendar/stolen-check',
      stolenSighting: '/service-calendar/stolen-sighting',
      transportAddress: '/service-calendar/orders/:id/transport-address',
      proposeDate: '/service-calendar/orders/:id/propose-date',
      bikes: '/service-calendar/bikes',
      notificationConfig: '/service-calendar/notification-config',
      notificationKeys: '/service-calendar/orders/notification-keys',
      sendNotification: '/service-calendar/orders/send-notification',
      repairPlan: '/service-calendar/orders/:id/repair-plan'
    },

    // Service Order Images (separate controller)
    serviceOrderImages: '/service-orders/:orderId/images',

    // Bicycle status
    bicycleStatus: {
      stolenLookup: '/bicycle-status/stolen-lookup',
      // Baza dla POST /stolen-search/{bicycleId}/contact — backendowa ścieżka kontaktu zostaje
      // pod starą nazwą "stolen-search", niezależnie od tego że sam GET wyszukiwania przeniósł się
      // pod stolen-lookup.
      stolenContactBase: '/bicycle-status/stolen-search'
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
    },

    // SEO cities configuration - all cities for routing
    seoCities: [
      // Top 5 cities
      { slug: 'warszawa', name: 'Warszawa', locative: 'w Warszawie', latitude: 52.2297, longitude: 21.0122 },
      { slug: 'krakow', name: 'Kraków', locative: 'w Krakowie', latitude: 50.0647, longitude: 19.9450 },
      { slug: 'wroclaw', name: 'Wrocław', locative: 'we Wrocławiu', latitude: 51.1079, longitude: 17.0385 },
      { slug: 'lodz', name: 'Łódź', locative: 'w Łodzi', latitude: 51.7592, longitude: 19.4560 },
      { slug: 'poznan', name: 'Poznań', locative: 'w Poznaniu', latitude: 52.4064, longitude: 16.9252 },
      // Additional cities for footer
      { slug: 'gdansk', name: 'Gdańsk', locative: 'w Gdańsku', latitude: 54.3520, longitude: 18.6466 },
      { slug: 'szczecin', name: 'Szczecin', locative: 'w Szczecinie', latitude: 53.4285, longitude: 14.5528 },
      { slug: 'lublin', name: 'Lublin', locative: 'w Lublinie', latitude: 51.2465, longitude: 22.5684 },
      { slug: 'bydgoszcz', name: 'Bydgoszcz', locative: 'w Bydgoszczy', latitude: 53.1235, longitude: 18.0084 },
      { slug: 'bialystok', name: 'Białystok', locative: 'w Białymstoku', latitude: 53.1325, longitude: 23.1688 },
      { slug: 'katowice', name: 'Katowice', locative: 'w Katowicach', latitude: 50.2649, longitude: 19.0238 },
      { slug: 'rzeszow', name: 'Rzeszów', locative: 'w Rzeszowie', latitude: 50.0412, longitude: 21.9991 },
      { slug: 'kielce', name: 'Kielce', locative: 'w Kielcach', latitude: 50.8661, longitude: 20.6286 },
      { slug: 'olsztyn', name: 'Olsztyn', locative: 'w Olsztynie', latitude: 53.7784, longitude: 20.4801 },
      { slug: 'bielsko-biala', name: 'Bielsko-Biała', locative: 'w Bielsku-Białej', latitude: 49.8224, longitude: 19.0444 },
      { slug: 'opole', name: 'Opole', locative: 'w Opolu', latitude: 50.6751, longitude: 17.9213 },
      // Rest of cities
      { slug: 'gdynia', name: 'Gdynia', locative: 'w Gdyni', latitude: 54.5189, longitude: 18.5305 },
      { slug: 'czestochowa', name: 'Częstochowa', locative: 'w Częstochowie', latitude: 50.8118, longitude: 19.1203 },
      { slug: 'radom', name: 'Radom', locative: 'w Radomiu', latitude: 51.4027, longitude: 21.1471 },
      { slug: 'torun', name: 'Toruń', locative: 'w Toruniu', latitude: 53.0138, longitude: 18.5984 },
      { slug: 'sosnowiec', name: 'Sosnowiec', locative: 'w Sosnowcu', latitude: 50.2863, longitude: 19.1041 },
      { slug: 'gliwice', name: 'Gliwice', locative: 'w Gliwicach', latitude: 50.2945, longitude: 18.6714 },
      { slug: 'zabrze', name: 'Zabrze', locative: 'w Zabrzu', latitude: 50.3249, longitude: 18.7857 },
      { slug: 'bytom', name: 'Bytom', locative: 'w Bytomiu', latitude: 50.3483, longitude: 18.9157 },
      { slug: 'zielona-gora', name: 'Zielona Góra', locative: 'w Zielonej Górze', latitude: 51.9356, longitude: 15.5062 },
      { slug: 'rybnik', name: 'Rybnik', locative: 'w Rybniku', latitude: 50.1022, longitude: 18.5463 },
      { slug: 'ruda-slaska', name: 'Ruda Śląska', locative: 'w Rudzie Śląskiej', latitude: 50.2558, longitude: 18.8555 },
      { slug: 'tychy', name: 'Tychy', locative: 'w Tychach', latitude: 50.1369, longitude: 18.9998 },
      { slug: 'gorzow-wielkopolski', name: 'Gorzów Wielkopolski', locative: 'w Gorzowie Wielkopolskim', latitude: 52.7368, longitude: 15.2288 },
      { slug: 'dabrowa-gornicza', name: 'Dąbrowa Górnicza', locative: 'w Dąbrowie Górniczej', latitude: 50.3217, longitude: 19.1949 },
      { slug: 'elblag', name: 'Elbląg', locative: 'w Elblągu', latitude: 54.1561, longitude: 19.4044 },
      { slug: 'plock', name: 'Płock', locative: 'w Płocku', latitude: 52.5463, longitude: 19.7065 },
      { slug: 'koszalin', name: 'Koszalin', locative: 'w Koszalinie', latitude: 54.1943, longitude: 16.1715 },
      { slug: 'tarnow', name: 'Tarnów', locative: 'w Tarnowie', latitude: 50.0121, longitude: 20.9858 },
      { slug: 'wloclawek', name: 'Włocławek', locative: 'we Włocławku', latitude: 52.6483, longitude: 19.0677 },
      { slug: 'chorzow', name: 'Chorzów', locative: 'w Chorzowie', latitude: 50.2974, longitude: 18.9545 },
      { slug: 'legnica', name: 'Legnica', locative: 'w Legnicy', latitude: 51.2100, longitude: 16.1619 },
      { slug: 'walbrzych', name: 'Wałbrzych', locative: 'w Wałbrzychu', latitude: 50.7714, longitude: 16.2843 },
      { slug: 'grudziadz', name: 'Grudziądz', locative: 'w Grudziądzu', latitude: 53.4837, longitude: 18.7536 },
      { slug: 'slupsk', name: 'Słupsk', locative: 'w Słupsku', latitude: 54.4641, longitude: 17.0285 },
      { slug: 'jaworzno', name: 'Jaworzno', locative: 'w Jaworznie', latitude: 50.2056, longitude: 19.2749 },
      { slug: 'jastrzebie-zdroj', name: 'Jastrzębie-Zdrój', locative: 'w Jastrzębiu-Zdroju', latitude: 49.9502, longitude: 18.5781 },
      { slug: 'nowy-sacz', name: 'Nowy Sącz', locative: 'w Nowym Sączu', latitude: 49.6249, longitude: 20.6916 },
      { slug: 'jelenia-gora', name: 'Jelenia Góra', locative: 'w Jeleniej Górze', latitude: 50.9044, longitude: 15.7197 },
      { slug: 'konin', name: 'Konin', locative: 'w Koninie', latitude: 52.2230, longitude: 18.2511 },
      { slug: 'piotrkow-trybunalski', name: 'Piotrków Trybunalski', locative: 'w Piotrkowie Trybunalskim', latitude: 51.4053, longitude: 19.7030 },
      { slug: 'inowroclaw', name: 'Inowrocław', locative: 'w Inowrocławiu', latitude: 52.7936, longitude: 18.2608 },
      { slug: 'lubin', name: 'Lubin', locative: 'w Lubinie', latitude: 51.4010, longitude: 16.2015 },
      { slug: 'ostrowiec-swietokrzyski', name: 'Ostrowiec Świętokrzyski', locative: 'w Ostrowcu Świętokrzyskim', latitude: 50.9294, longitude: 21.3856 },
      { slug: 'suwalki', name: 'Suwałki', locative: 'w Suwałkach', latitude: 54.1118, longitude: 22.9307 }
    ],

    // Cities to show in footer (subset of seoCities)
    seoFooterCities: [
      'warszawa', 'krakow', 'wroclaw', 'lodz', 'poznan',
      'gdansk', 'szczecin', 'lublin', 'bydgoszcz', 'bialystok',
      'katowice', 'rzeszow', 'kielce', 'olsztyn', 'bielsko-biala', 'opole'
    ]
  }
};
