import * as Klaro from 'klaro/dist/klaro-no-css';
import './klaro.css';

const klaroConfig: Klaro.Config = {
  version: 1,
  elementID: 'klaro',
  storageMethod: 'localStorage',
  storageName: 'klaro',
  htmlTexts: true,
  embedded: false,
  groupByPurpose: true,
  default: false,
  mustConsent: false,
  acceptAll: true,
  hideDeclineAll: false,
  hideLearnMore: false,
  noticeAsModal: false,
  disablePoweredBy: true,

  lang: 'pl',

  translations: {
    pl: {
      consentModal: {
        title: 'Informacje o plikach cookie',
        description:
          'Używamy plików cookie, aby analizować ruch na stronie i ulepszać nasze usługi. Możesz wybrać, które pliki cookie chcesz zaakceptować.',
      },
      consentNotice: {
        title: 'Pliki cookie',
        description:
          'Używamy plików cookie do analizy ruchu i celów marketingowych. {purposes}.',
        learnMore: 'Dostosuj',
        changeDescription: 'Zmieniliśmy naszą politykę cookies. Prosimy o ponowne wyrażenie zgody.',
      },
      purposes: {
        analytics: {
          title: 'Analityka',
          description: 'Pozwalają nam analizować ruch na stronie i ulepszać nasze usługi.',
        },
        marketing: {
          title: 'Marketing',
          description: 'Pozwalają nam wyświetlać spersonalizowane reklamy.',
        },
      },
      googleAnalytics: {
        description: 'Usługa analityczna Google do śledzenia ruchu na stronie.',
      },
      facebookPixel: {
        description: 'Piksel Facebooka do śledzenia konwersji i remarketingu.',
      },
      ok: 'Akceptuję',
      save: 'Zapisz',
      decline: 'Odrzuć',
      close: 'Zamknij',
      acceptAll: 'Akceptuję wszystkie',
      acceptSelected: 'Akceptuję wybrane',
      poweredBy: '',
    },
  },

  services: [
    {
      name: 'googleAnalytics',
      title: 'Google Analytics',
      purposes: ['analytics'],
      cookies: [
        /^_ga/,
        /^_gid/,
        /^_gat/,
      ],
      required: false,
      optOut: false,
      onlyOnce: true,
    },
    {
      name: 'facebookPixel',
      title: 'Facebook Pixel',
      purposes: ['marketing'],
      cookies: [
        /^_fbp/,
        /^fr/,
      ],
      required: false,
      optOut: false,
      onlyOnce: true,
    },
  ],
};

export function initKlaro(): void {
  if (typeof window !== 'undefined') {
    (window as any).klaro = Klaro;
    (window as any).klaroConfig = klaroConfig;
    Klaro.setup(klaroConfig);
  }
}
