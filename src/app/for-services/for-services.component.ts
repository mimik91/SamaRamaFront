// for-services.component.ts

import { Component, OnInit, Inject } from '@angular/core';
import { CommonModule, DOCUMENT } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { DomSanitizer, SafeHtml, Meta, Title } from '@angular/platform-browser';

@Component({
  selector: 'app-for-services',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './for-services.component.html',
  styleUrls: ['./for-services.component.css']
})
export class ForServicesComponent implements OnInit {

  // Powrót do logo CycloPick
  heroImage = {
    src: '\\assets\\images\\logo-cyclopick.png',
    alt: 'Logo CycloPick - Usługi dla serwisów rowerowych'
  };

  // Nowe kreatywne hasło CTA
  mainCtaText: string = 'Zacznij zyskiwać klientów';

  // FAQ - Często zadawane pytania
  faqCategories = [
    {
      title: 'Widoczność i Marketing',
      icon: 'visibility',
      items: [
        {
          question: 'Jak CycloPick realnie pomaga zdobywać nowych klientów?',
          answer: 'CycloPick zwiększa widoczność Twojego serwisu rowerowego w Google, Google Maps i lokalnym wyszukiwaniu. Gdy ktoś w Twojej okolicy szuka „serwis rowerowy" lub „naprawa roweru blisko mnie", Twój profil może pojawić się wyżej i szybciej niż konkurencja.',
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
        },
        {
          question: 'Czy profil CycloPick może zastąpić stronę internetową?',
          answer: 'Tak. Twój profil działa jak gotowa wizytówka online: opis usług, cennik, zdjęcia, dane kontaktowe. Jeśli masz własną stronę, możesz ją podlinkować i wzmocnić jej pozycjonowanie.',
          expanded: false
        }
      ]
    },
    {
      title: 'Zarządzanie Profilem',
      icon: 'settings',
      items: [
        {
          question: 'Jakie informacje mogę dodać do profilu?',
          answer: 'Możesz dodać: zakres usług i specjalizacje (MTB, szosa, e-bike), cennik i pakiety, godziny pracy, dane kontaktowe, zdjęcia warsztatu oraz linki do strony i social mediów. Im więcej danych, tym lepsza widoczność.',
          expanded: false
        },
        {
          question: 'Czy mogę samodzielnie edytować dane?',
          answer: 'Tak. Wszystkie zmiany (ceny, godziny, zdjęcia) wykonasz w prostym panelu. Efekt widać od razu.',
          expanded: false
        },
        {
          question: 'Czy mogę dodać zdjęcia i cennik usług?',
          answer: 'Tak. Zdjęcia warsztatu i szczegółowy cennik budują zaufanie klientów i zmniejszają liczbę telefonów z podstawowymi pytaniami.',
          expanded: false
        }
      ]
    },
    {
      title: 'Koszty i Zasady Współpracy',
      icon: 'payments',
      items: [
        {
          question: 'Ile kosztuje korzystanie z CycloPick?',
          answer: 'Rejestracja i prowadzenie profilu są całkowicie darmowe. Nie pobieramy prowizji ani ukrytych opłat.',
          expanded: false
        },
        {
          question: 'Czy muszę podpisywać umowę lub zobowiązywać się na stałe?',
          answer: 'Nie. Nie ma żadnych umów długoterminowych. Możesz korzystać z CycloPick tak długo, jak chcesz.',
          expanded: false
        },
        {
          question: 'Jak szybko mój profil stanie się aktywny?',
          answer: 'Rejestracja zajmuje około 5 minut. Każdy profil jest ręcznie weryfikowany. Zazwyczaj staje się publiczny w ciągu 24 godzin (maksymalnie do 3 dni roboczych).',
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
          answer: 'Bezpośrednio. Klienci dzwonią, piszą e-mail lub korzystają z linków do social mediów. CycloPick nie pobiera prowizji ani nie pośredniczy w płatnościach.',
          expanded: false
        },
        {
          question: 'Czy mój serwis znajdą osoby korzystające z AI i chatbotów?',
          answer: 'Tak. Przygotowujemy dane Twojego serwisu rowerowego tak, aby były czytelne dla nowoczesnych wyszukiwarek, chatbotów i asystentów AI. Dzięki temu, gdy ktoś zapyta np. „Gdzie w Krakowie naprawię rower cargo?", CycloPick może wskazać Twój warsztat – bez dodatkowych kosztów.',
          expanded: false
        },
        {
          question: 'Czy planujecie rezerwacje wizyt online?',
          answer: 'Tak. W przyszłości wprowadzimy możliwość rezerwacji online, dzięki której klienci będą mogli umawiać wizyty bezpośrednio w Twoim serwisie.',
          expanded: false
        },
        {
          question: 'Czy mogę usunąć swój profil i dane?',
          answer: 'Tak. Wystarczy wiadomość e-mail – profil i wszystkie dane zostaną usunięte bez formalności.',
          expanded: false
        }
      ]
    }
  ];

  toggleFaq(categoryIndex: number, itemIndex: number): void {
    this.faqCategories[categoryIndex].items[itemIndex].expanded =
      !this.faqCategories[categoryIndex].items[itemIndex].expanded;
  }

  // 4 sekcje z obrazkami i rozwijalnym tekstem
  featureSections = [
    {
      title: 'Mapa lokalnych serwisów rowerowych – znajdź najlepszy warsztat rowerowy w Twojej okolicy',
      summary: 'Twój warsztat zostanie wyróżniony na naszej <span class="feature-highlight">mapie serwisów rowerowych</span> unikalną niebieską pinezką, która rzuca się w oczy bardziej niż standardowe punkty. Zapewnij sobie wyższą pozycję w wynikach i spraw, by lokalni klienci błyskawicznie Cię odnaleźli.',
      fullText: 'Twój warsztat trafi na interaktywną mapę z wyróżniającą się, niebieską pinezką, która jest znacznie lepiej widoczna od zielonych punktów. Dodatkowo Twój serwis będzie promowany na górze listy, co ułatwi klientom szybki kontakt właśnie z Tobą.',
      buttonText: 'Sprawdź opcje widoczności na mapie',
      image: '/assets/images/for-services/widocznosc-na-mapie-serwisow.webp',
      imageAlt: 'Interaktywna mapa serwisów rowerowych CycloPick',
      expanded: false
    },
    {
      title: 'Wizytówka Twojego serwisu',
      summary: 'Zyskaj profesjonalną stronę-wizytówkę z galerią zdjęć i ofertą, bez kosztów własnej domeny. Nasza technologia optymalizuje Twoje dane pod <span class="feature-highlight">chatboty AI (ChatGPT, Copilot)</span>, budując nowoczesny wizerunek Twojego serwisu rowerowego w sieci.',
      fullText: `Zyskaj profesjonalną wizytówkę w ramach CycloPick, która w pełni zastępuje potrzebę tworzenia i utrzymywania własnej strony internetowej. To Twoje centrum kontaktu z klientem, zaprojektowane tak, by pracować dla Ciebie na wielu poziomach.

Podczas gdy klienci cieszą się estetycznym wyglądem, przejrzystymi danymi i galerią zdjęć Twojego warsztatu, pod spodem dzieje się techniczna magia. Nasza platforma udostępnia Twoje dane w sposób zoptymalizowany dla wyszukiwarek oraz chatbotów AI, takich jak ChatGPT czy Copilot.

Uzupełniając szczegółowo swój profil, nie tylko budujesz zaufanie u rowerzystów, ale też realnie zwiększasz swoje szanse na pojawienie się w odpowiedziach asystentów AI, gdy ktoś zapyta: „Gdzie w mojej okolicy najlepiej naprawię rower?".`,
      buttonText: 'Zobacz funkcje wizytówki serwisu',
      image: '/assets/images/for-services/strona-wizytowka.webp',
      imageAlt: 'Wizytówka serwisu rowerowego w CycloPick',
      expanded: false
    },
    {
      title: 'My karmimy algorytmy, Ty zbierasz klientów',
      summary: 'Automatycznie promuj swój serwis w Google Maps i wynikach wyszukiwania dzięki ustrukturyzowanym danym. <span class="feature-highlight">„Karmimy" algorytmy precyzyjnymi informacjami</span>, dzięki czemu chatboty i wyszukiwarki <span class="feature-highlight">rekomendują właśnie Twój warsztat</span>.',
      fullText: `W CycloPick nie czekamy biernie, aż ktoś Cię znajdzie. Aktywnie karmimy danymi chatboty, wyszukiwarkę i mapy Google, serwując im informacje o Twoim serwisie w sposób, który te systemy po prostu uwielbiają.

Dzięki temu zyskujesz technologiczną przewagę na trzech poziomach:

Rekomendacje AI: Udostępniamy dane w formacie gotowym dla ChatGPT czy Copilota. Gdy klient zapyta sztuczną inteligencję o serwis w okolicy, Twój warsztat jest „podany na tacy" jako gotowa odpowiedź.

Wysoka pozycja w Google: Dostarczamy wyszukiwarce uporządkowane informacje, które Google premiuje wyższymi pozycjami. Twoja wizytówka jest zaprojektowana tak, by algorytmy uznawały ją za najbardziej wartościowe źródło informacji.

Wiarygodność w Mapach: Przekazujemy Google precyzyjne współrzędne wraz z danymi biznesowymi. Ta spójność buduje cyfrowy autorytet Twojego serwisu, dzięki czemu Twój punkt staje się pewnym wyborem na mapie każdego rowerzysty.

Efekt? Ty skupiasz się na naprawie rowerów, a my dbamy o to, by każda licząca się technologia na rynku wiedziała o Twoim istnieniu i polecała Twoje usługi.`,
      buttonText: 'Dowiedz się więcej o technologii AI i SEO',
      image: '/assets/images/for-services/seo-aio.webp',
      imageAlt: 'Technologia AI i SEO dla serwisów rowerowych',
      expanded: false
    },
    {
      title: 'Pełny zakres usług w zasięgu jednego kliknięcia',
      summary: 'Wykorzystaj zaawansowane filtry usług, aby docierać do klientów szukających konkretnych napraw. Prezentuj pełną ofertę, <span class="feature-highlight">ogranicz przypadkowe zapytania</span> i pozyskuj tylko zdecydowanych klientów, którzy szukają Twojej wiedzy.',
      fullText: `Nie trać czasu na zapytania o usługi, których nie świadczysz. Dzięki naszym zaawansowanym filtrom wyszukiwania, klienci znajdują Twój serwis dokładnie wtedy, gdy potrzebują Twojej specjalistycznej wiedzy.

Jak to działa na Twoją korzyść?
Widoczność Twoich specjalizacji: Klient szukający konkretnej naprawy (np. serwisu przerzutek elektronicznych czy naprawy ram tytanowych) może zaznaczyć te opcje w filtrach. Jeśli zaznaczysz je w swoim profilu, Twój warsztat pojawi się jako idealna odpowiedź na jego potrzeby.

Mniej „pustych" zapytań: Dzięki precyzyjnemu filtrowaniu trafiają do Ciebie osoby zdecydowane na konkretną usługę, co oszczędza Twój czas na wyjaśnianie zakresu prac przez telefon.

Elastyczność i rozwój: Nasza lista usług jest żywa. Jeśli oferujesz coś unikalnego, czego nie ma jeszcze w naszym systemie, możesz to bez problemu dodać. Dzięki temu budujesz wizerunek eksperta w niszowych naprawach.

Dlaczego warto zaznaczyć każdą wykonywaną usługę? Dla klienta liczy się pewność. Jeśli szuka jednocześnie regulacji przerzutek i centrowania koła, wybierze ten serwis, który na liście ma zaznaczone obie te pozycje. Pamiętaj: każda zaznaczona usługa to dodatkowa „furtka", przez którą klient może do Ciebie trafić.

Nie widzisz swojej specjalizacji na liście? Bez obaw! Możesz ją dodać samodzielnie w kilka sekund. Dzięki temu Twoja oferta zawsze będzie aktualna i dopasowana do tego, co faktycznie dzieje się w Twoim warsztacie.`,
      buttonText: 'Zobacz, jak działają filtry usług',
      image: '/assets/images/for-services/filtrowanie-po-uslugach.webp',
      imageAlt: 'Filtry usług serwisów rowerowych w CycloPick',
      expanded: false
    }
  ];

  toggleExpanded(index: number): void {
    this.featureSections[index].expanded = !this.featureSections[index].expanded;
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
  }

  private setMetaTags(): void {
    // Title
    this.title.setTitle('Usługi dla serwisów rowerowych | CycloPick - mapa warsztatów');

    // Meta description
    this.meta.updateTag({
      name: 'description',
      content: 'Zarejestruj swój serwis rowerowy w CycloPick. Zyskaj widoczność na mapie, profesjonalną wizytówkę i nowych klientów. Dołącz do najlepszej bazy serwisów rowerowych w Polsce.'
    });

    // Meta keywords
    this.meta.updateTag({
      name: 'keywords',
      content: 'serwis rowerowy, warsztat rowerowy, naprawa rowerów, mapa serwisów, usługi dla serwisów, rejestracja serwisu, CycloPick'
    });

    // Open Graph
    this.meta.updateTag({ property: 'og:title', content: 'Usługi dla serwisów rowerowych | CycloPick' });
    this.meta.updateTag({ property: 'og:description', content: 'Zarejestruj swój serwis rowerowy w CycloPick. Zyskaj widoczność na mapie, profesjonalną wizytówkę i nowych klientów.' });
    this.meta.updateTag({ property: 'og:type', content: 'website' });
    this.meta.updateTag({ property: 'og:url', content: 'https://www.cyclopick.pl/for-services' });
    this.meta.updateTag({ property: 'og:image', content: 'https://www.cyclopick.pl/assets/images/for-services/widocznosc-na-mapie-serwisow.webp' });
    this.meta.updateTag({ property: 'og:locale', content: 'pl_PL' });

    // Twitter Card
    this.meta.updateTag({ name: 'twitter:card', content: 'summary_large_image' });
    this.meta.updateTag({ name: 'twitter:title', content: 'Usługi dla serwisów rowerowych | CycloPick' });
    this.meta.updateTag({ name: 'twitter:description', content: 'Zarejestruj swój serwis rowerowy w CycloPick. Zyskaj widoczność na mapie i nowych klientów.' });

    // Robots
    this.meta.updateTag({ name: 'robots', content: 'index, follow' });
  }

  private setCanonicalUrl(): void {
    const canonicalUrl = 'https://www.cyclopick.pl/for-services';
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

  getSafeHtml(html: string): SafeHtml {
    return this.sanitizer.bypassSecurityTrustHtml(html);
  }

  navigateToRegisterService(): void {
    this.router.navigate(['/register-service']);
  }
}