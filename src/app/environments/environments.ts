export const environment = {
  production: false,
  
  // API Configuration
  siteUrl: 'https://www.cyclopick.pl',
  apiUrl: 'https://samarama-a5cba73df1da.herokuapp.com/api',
  
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
    },

    // SEO cities configuration - all cities for routing
    seoCities: [
      // Top 5 cities
      { slug: 'warszawa', name: 'Warszawa', latitude: 52.2297, longitude: 21.0122 },
      { slug: 'krakow', name: 'Kraków', latitude: 50.0647, longitude: 19.9450 },
      { slug: 'wroclaw', name: 'Wrocław', latitude: 51.1079, longitude: 17.0385 },
      { slug: 'lodz', name: 'Łódź', latitude: 51.7592, longitude: 19.4560 },
      { slug: 'poznan', name: 'Poznań', latitude: 52.4064, longitude: 16.9252 },
      // Additional cities for footer
      { slug: 'gdansk', name: 'Gdańsk', latitude: 54.3520, longitude: 18.6466 },
      { slug: 'szczecin', name: 'Szczecin', latitude: 53.4285, longitude: 14.5528 },
      { slug: 'lublin', name: 'Lublin', latitude: 51.2465, longitude: 22.5684 },
      { slug: 'bydgoszcz', name: 'Bydgoszcz', latitude: 53.1235, longitude: 18.0084 },
      { slug: 'bialystok', name: 'Białystok', latitude: 53.1325, longitude: 23.1688 },
      { slug: 'katowice', name: 'Katowice', latitude: 50.2649, longitude: 19.0238 },
      { slug: 'rzeszow', name: 'Rzeszów', latitude: 50.0412, longitude: 21.9991 },
      { slug: 'kielce', name: 'Kielce', latitude: 50.8661, longitude: 20.6286 },
      { slug: 'olsztyn', name: 'Olsztyn', latitude: 53.7784, longitude: 20.4801 },
      { slug: 'bielsko-biala', name: 'Bielsko-Biała', latitude: 49.8224, longitude: 19.0444 },
      { slug: 'opole', name: 'Opole', latitude: 50.6751, longitude: 17.9213 },
      // Rest of cities
      { slug: 'gdynia', name: 'Gdynia', latitude: 54.5189, longitude: 18.5305 },
      { slug: 'czestochowa', name: 'Częstochowa', latitude: 50.8118, longitude: 19.1203 },
      { slug: 'radom', name: 'Radom', latitude: 51.4027, longitude: 21.1471 },
      { slug: 'torun', name: 'Toruń', latitude: 53.0138, longitude: 18.5984 },
      { slug: 'sosnowiec', name: 'Sosnowiec', latitude: 50.2863, longitude: 19.1041 },
      { slug: 'gliwice', name: 'Gliwice', latitude: 50.2945, longitude: 18.6714 },
      { slug: 'zabrze', name: 'Zabrze', latitude: 50.3249, longitude: 18.7857 },
      { slug: 'bytom', name: 'Bytom', latitude: 50.3483, longitude: 18.9157 },
      { slug: 'zielona-gora', name: 'Zielona Góra', latitude: 51.9356, longitude: 15.5062 },
      { slug: 'rybnik', name: 'Rybnik', latitude: 50.1022, longitude: 18.5463 },
      { slug: 'ruda-slaska', name: 'Ruda Śląska', latitude: 50.2558, longitude: 18.8555 },
      { slug: 'tychy', name: 'Tychy', latitude: 50.1369, longitude: 18.9998 },
      { slug: 'gorzow-wielkopolski', name: 'Gorzów Wielkopolski', latitude: 52.7368, longitude: 15.2288 },
      { slug: 'dabrowa-gornicza', name: 'Dąbrowa Górnicza', latitude: 50.3217, longitude: 19.1949 },
      { slug: 'elblag', name: 'Elbląg', latitude: 54.1561, longitude: 19.4044 },
      { slug: 'plock', name: 'Płock', latitude: 52.5463, longitude: 19.7065 },
      { slug: 'koszalin', name: 'Koszalin', latitude: 54.1943, longitude: 16.1715 },
      { slug: 'tarnow', name: 'Tarnów', latitude: 50.0121, longitude: 20.9858 },
      { slug: 'wloclawek', name: 'Włocławek', latitude: 52.6483, longitude: 19.0677 },
      { slug: 'chorzow', name: 'Chorzów', latitude: 50.2974, longitude: 18.9545 },
      { slug: 'legnica', name: 'Legnica', latitude: 51.2100, longitude: 16.1619 },
      { slug: 'walbrzych', name: 'Wałbrzych', latitude: 50.7714, longitude: 16.2843 },
      { slug: 'grudziadz', name: 'Grudziądz', latitude: 53.4837, longitude: 18.7536 },
      { slug: 'slupsk', name: 'Słupsk', latitude: 54.4641, longitude: 17.0285 },
      { slug: 'jaworzno', name: 'Jaworzno', latitude: 50.2056, longitude: 19.2749 },
      { slug: 'jastrzebie-zdroj', name: 'Jastrzębie-Zdrój', latitude: 49.9502, longitude: 18.5781 },
      { slug: 'nowy-sacz', name: 'Nowy Sącz', latitude: 49.6249, longitude: 20.6916 },
      { slug: 'jelenia-gora', name: 'Jelenia Góra', latitude: 50.9044, longitude: 15.7197 },
      { slug: 'konin', name: 'Konin', latitude: 52.2230, longitude: 18.2511 },
      { slug: 'piotrkow-trybunalski', name: 'Piotrków Trybunalski', latitude: 51.4053, longitude: 19.7030 },
      { slug: 'inowroclaw', name: 'Inowrocław', latitude: 52.7936, longitude: 18.2608 },
      { slug: 'lubin', name: 'Lubin', latitude: 51.4010, longitude: 16.2015 },
      { slug: 'ostrowiec-swietokrzyski', name: 'Ostrowiec Świętokrzyski', latitude: 50.9294, longitude: 21.3856 },
      { slug: 'suwalki', name: 'Suwałki', latitude: 54.1118, longitude: 22.9307 }
    ],

    // Cities to show in footer (subset of seoCities)
    seoFooterCities: [
      'warszawa', 'krakow', 'wroclaw', 'lodz', 'poznan',
      'gdansk', 'szczecin', 'lublin', 'bydgoszcz', 'bialystok',
      'katowice', 'rzeszow', 'kielce', 'olsztyn', 'bielsko-biala', 'opole'
    ]
  }
};

// Production environment
export const environmentProduction = {
  ...environment,
  production: true,
  siteUrl: 'https://cyclopick.pl',
  apiUrl: 'https://cyclopick.pl/api'
};