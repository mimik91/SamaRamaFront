import { Component, OnInit, OnDestroy, Inject, inject } from '@angular/core';
import { CommonModule, DOCUMENT } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { DomSanitizer, SafeHtml, Meta, Title } from '@angular/platform-browser';
import { SeoService } from '../core/seo.service';
import { SchemaOrgHelper } from '../core/schema-org.helper';

@Component({
  selector: 'app-for-services',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './for-services.component.html',
  styleUrls: ['./for-services.component.css']
})
export class ForServicesComponent implements OnInit, OnDestroy {
  private seoService = inject(SeoService);

  featureSections = [
    {
      title: 'Mapa lokalnych serwisów rowerowych – znajdź najlepszy warsztat rowerowy w Twojej okolicy',
      summary: 'Twój warsztat zostanie wyróżniony na naszej <span class="feature-highlight">mapie serwisów rowerowych</span> unikalną niebieską pinezką, która rzuca się w oczy bardziej niż standardowe punkty. Zapewnij sobie wyższą pozycję w wynikach i spraw, by lokalni klienci błyskawicznie Cię odnaleźli.',
      image: '/assets/images/for-services/panel-rezerwacji.webp',
      imageAlt: 'Panel rezerwacji online CycloPick',
    },
    {
      title: 'Wizytówka Twojego serwisu',
      summary: 'Zyskaj profesjonalną stronę-wizytówkę z galerią zdjęć i ofertą, bez kosztów własnej domeny. Nasza technologia optymalizuje Twoje dane pod <span class="feature-highlight">chatboty AI (ChatGPT, Copilot)</span>, budując nowoczesny wizerunek Twojego serwisu rowerowego w sieci.',
      image: '/assets/images/for-services/kanban.webp',
      imageAlt: 'System zarządzania zleceniami CycloPick',
    },
    {
      title: 'My karmimy algorytmy, Ty zbierasz klientów',
      summary: 'Automatycznie promuj swój serwis w Google Maps i wynikach wyszukiwania dzięki ustrukturyzowanym danym. <span class="feature-highlight">„Karmimy" algorytmy precyzyjnymi informacjami</span>, dzięki czemu chatboty i wyszukiwarki <span class="feature-highlight">rekomendują właśnie Twój warsztat</span>. Na 6 serwisów rowerowych na Salwatorze w Krakowie — <span class="feature-highlight">4 pierwsze miejsca w Google zajmują 2 serwisy zarejestrowane w CycloPick</span>.',
      image: '/assets/images/for-services/seo.webp',
      imageAlt: 'Widoczność serwisu rowerowego w Google i AI',
    },
    {
      title: 'Pełny zakres usług w zasięgu jednego kliknięcia',
      summary: 'Wykorzystaj zaawansowane <span class="feature-highlight">filtry usług</span>, aby docierać do klientów szukających konkretnych napraw. Prezentuj pełną ofertę, <span class="feature-highlight">ogranicz przypadkowe zapytania</span> i pozyskuj tylko zdecydowanych klientów, którzy szukają Twojej wiedzy.',
      image: '/assets/images/for-services/filtrowanie-po-uslugach.webp',
      imageAlt: 'Filtry usług serwisów rowerowych w CycloPick',
    }
  ];

  getSafeHtml(html: string): SafeHtml {
    return this.sanitizer.bypassSecurityTrustHtml(html);
  }

  faqCategories = [
    {
      title: 'Rezerwacje i System',
      icon: 'settings',
      items: [
        {
          question: 'Jak działa panel rezerwacji online?',
          answer: 'Po rejestracji i aktywacji rezerwacji klienci mogą umawiać wizyty bezpośrednio na Twojej stronie profilu — o każdej porze dnia i nocy. Dostajesz powiadomienie, możesz potwierdzić lub zaproponować inny termin. Wszystko bez telefonów.',
          expanded: false
        },
        {
          question: 'Czy mogę zarządzać zleceniami i historią klientów?',
          answer: 'Tak. System pozwala prowadzić zlecenia od przyjęcia roweru do wydania — z przypisanymi statusami, notatkami i pełną historią klienta. Jednym kliknięciem wysyłasz SMS "rower gotowy".',
          expanded: false
        },
        {
          question: 'Czy muszę używać wszystkich funkcji od razu?',
          answer: 'Nie. Możesz zacząć od samej wizytówki i mapy, a rezerwacje czy system zarządzania włączyć kiedy będziesz gotowy. Każda funkcja działa niezależnie.',
          expanded: false
        }
      ]
    },
    {
      title: 'Widoczność i Marketing',
      icon: 'visibility',
      items: [
        {
          question: 'Jak CycloPick realnie pomaga zdobywać nowych klientów?',
          answer: 'CycloPick zwiększa widoczność Twojego serwisu w Google, Google Maps i lokalnym wyszukiwaniu. Twój profil jest zoptymalizowany pod chatboty AI (ChatGPT, Copilot) — gdy ktoś pyta asystenta o serwis rowerowy w okolicy, Twój warsztat może być wskazany jako odpowiedź.',
          expanded: false
        },
        {
          question: 'Czy mój serwis będzie widoczny w Google i na mapach?',
          answer: 'Tak. Twój publiczny profil jest indeksowany przez Google. Dokładne dane lokalne (adres, usługi, godziny) pomagają klientom szybko znaleźć Twój warsztat w Google Maps.',
          expanded: false
        },
        {
          question: 'Czy to ma sens dla małych, jednoosobowych warsztatów?',
          answer: 'Tak. Większość serwisów w CycloPick to małe, lokalne punkty. Dzięki naszej platformie mogą konkurować z większymi warsztatami bez płatnych reklam.',
          expanded: false
        }
      ]
    },
    {
      title: 'Koszty i Zasady',
      icon: 'payments',
      items: [
        {
          question: 'Ile kosztuje korzystanie z CycloPick?',
          answer: 'Szczegóły znajdziesz na stronie cennika. Nie pobieramy prowizji od napraw ani ukrytych opłat transakcyjnych.',
          expanded: false
        },
        {
          question: 'Czy muszę podpisywać umowę lub zobowiązywać się na stałe?',
          answer: 'Nie. Nie ma żadnych umów długoterminowych. Możesz korzystać z CycloPick tak długo, jak chcesz, i zrezygnować w każdej chwili.',
          expanded: false
        },
        {
          question: 'Jak szybko mój profil stanie się aktywny?',
          answer: 'Rejestracja zajmuje około 5 minut. Każdy profil jest ręcznie weryfikowany — zazwyczaj staje się publiczny w ciągu 24 godzin (maksymalnie 3 dni robocze).',
          expanded: false
        }
      ]
    },
    {
      title: 'Kontakt i Rozwój',
      icon: 'rocket',
      items: [
        {
          question: 'W jaki sposób klienci będą się ze mną kontaktować?',
          answer: 'Przez rezerwację online, telefon, e-mail lub social media — zależnie od tego, co udostępniasz. CycloPick nie pobiera prowizji ani nie pośredniczy w płatnościach za naprawy.',
          expanded: false
        },
        {
          question: 'Czy mój serwis znajdą osoby korzystające z AI i chatbotów?',
          answer: 'Tak. Przygotowujemy dane Twojego serwisu tak, aby były czytelne dla nowoczesnych wyszukiwarek, chatbotów i asystentów AI. Gdy ktoś zapyta np. „Gdzie w Krakowie naprawię rower cargo?", CycloPick może wskazać Twój warsztat.',
          expanded: false
        },
        {
          question: 'Czy mogę usunąć swój profil i dane?',
          answer: 'Tak. Wystarczy wiadomość e-mail — profil i wszystkie dane zostaną usunięte bez formalności.',
          expanded: false
        }
      ]
    }
  ];

  toggleFaq(categoryIndex: number, itemIndex: number): void {
    this.faqCategories[categoryIndex].items[itemIndex].expanded =
      !this.faqCategories[categoryIndex].items[itemIndex].expanded;
  }

  constructor(
    private router: Router,
    private sanitizer: DomSanitizer,
    private meta: Meta,
    private title: Title,
    @Inject(DOCUMENT) private document: Document
  ) { }

  ngOnInit(): void {
    this.setMetaTags();
    this.setCanonicalUrl();
    this.addStructuredData();
  }

  ngOnDestroy(): void {
    this.seoService.removeStructuredData();
  }

  private addStructuredData(): void {
    const allFaqItems = this.faqCategories.flatMap(cat =>
      cat.items.map(item => ({ question: item.question, answer: item.answer }))
    );

    const howTo = SchemaOrgHelper.generateHowTo(
      'Jak dołączyć do CycloPick jako serwis rowerowy',
      'Rejestracja serwisu rowerowego na platformie CycloPick w 4 krokach — od rejestracji do spotkania onboardingowego.',
      [
        {
          name: 'Wypełnij formularz rejestracyjny',
          text: 'Podaj podstawowe dane, zakres usług i lokalizację — zajmie Ci to mniej niż 5 minut.'
        },
        {
          name: 'Czekaj na weryfikację',
          text: 'Sprawdzamy każdy profil ręcznie. Zazwyczaj do 24 godzin, maksymalnie 3 dni robocze.'
        },
        {
          name: 'Uzupełnij profil i zbieraj klientów',
          text: 'Dodaj zdjęcia, cennik i specjalizacje. Każde uzupełnienie zwiększa widoczność w Google.'
        }
      ]
    );

    this.seoService.addMultipleStructuredData([
      SchemaOrgHelper.generateOrganization(),
      SchemaOrgHelper.generateFAQPage(allFaqItems),
      howTo
    ]);
  }

  private setMetaTags(): void {
    this.title.setTitle('Dla serwisów rowerowych – rezerwacje online i system zarządzania | CycloPick');

    this.meta.updateTag({
      name: 'description',
      content: 'Zarejestruj swój serwis rowerowy w CycloPick. Panel rezerwacji online, system zarządzania zleceniami, wizytówka i widoczność w Google.'
    });

    this.meta.updateTag({
      name: 'keywords',
      content: 'serwis rowerowy, panel rezerwacji online, system zarządzania serwisem, warsztat rowerowy, mapa serwisów, CycloPick'
    });

    this.meta.updateTag({ property: 'og:title', content: 'Dla serwisów rowerowych | CycloPick' });
    this.meta.updateTag({ property: 'og:description', content: 'Rezerwacje online, system zarządzania zleceniami i widoczność w Google dla Twojego warsztatu rowerowego.' });
    this.meta.updateTag({ property: 'og:type', content: 'website' });
    this.meta.updateTag({ property: 'og:url', content: 'https://www.cyclopick.pl/dla-serwisow' });
    this.meta.updateTag({ property: 'og:image', content: 'https://www.cyclopick.pl/assets/images/for-services/widocznosc-na-mapie-serwisow.webp' });
    this.meta.updateTag({ property: 'og:locale', content: 'pl_PL' });

    this.meta.updateTag({ name: 'twitter:card', content: 'summary_large_image' });
    this.meta.updateTag({ name: 'twitter:title', content: 'Dla serwisów rowerowych | CycloPick' });
    this.meta.updateTag({ name: 'twitter:description', content: 'Rezerwacje online i system zarządzania dla serwisów rowerowych. Sprawdź cennik i dołącz.' });

    this.meta.updateTag({ name: 'robots', content: 'index, follow' });
  }

  private setCanonicalUrl(): void {
    const canonicalUrl = 'https://www.cyclopick.pl/dla-serwisow';
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

  navigateToRegisterService(): void {
    this.router.navigate(['/register-service']);
  }
}
