const commonConfig = {
  links: {
    termsOfService: '/terms-of-service',
    privacyPolicy: '/privacy-policy',
    homepage: '/',
    servicesMap: '/services-map',
    orderSummary: '/ordersummary'
  },
  endpoints: {
    guestOrders: {
      transport: '/guest-orders/transport',
      discounts: '/guest-orders/discounts',
      calculateTransportCost: '/guest-orders/calculate-transport-cost'
    },
    serviceSlots: {
      checkAvailability: '/service-slots/check-availability'
    },
    enumerations: {
      base: '/enumerations',
      cities: '/cities'
    }
  },
  settings: {
    transport: {
      minDaysInAdvance: 1,
      maxDaysInAdvance: 30,
      allowedDays: [0, 1, 2, 3, 4],
      pickupTimeFrom: '18:00',
      pickupTimeTo: '22:00'
    },
    validation: {
      phoneNumberLength: 9,
      minModelLength: 2,
      postalCodePattern: /^\d{2}-\d{3}$/,
      emailPattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    },
    redirects: {
      orderSummaryCountdown: 30
    },
    fallback: {
      brands: ['Trek', 'Specialized', 'Giant', 'Cannondale', 'Scott', 'Merida', 'Kona', 'Cube', 'Inna'],
      cities: ['Kraków', 'Warszawa', 'Gdańsk', 'Poznań', 'Wrocław', 'Łódź']
    }
  }
};

// 2. WYBÓR ŚRODOWISKA (tutaj ręcznie komentujesz/odkomentowujesz)

// --- PRODUCTION (Heroku) ---
export const environment = {
  ...commonConfig,
  production: true,
  apiUrl: 'https://samarama-a5cba73df1da.herokuapp.com/api'
};