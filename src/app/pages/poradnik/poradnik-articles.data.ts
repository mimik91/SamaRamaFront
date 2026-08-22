import { PoradnikArticle } from '../../shared/models/poradnik-article.model';

export const PORADNIK_ARTICLES: PoradnikArticle[] = [
  {
    slug: 'ile-kosztuje-wymiana-hamulcow-w-rowerze',
    title: 'Ile kosztuje wymiana hamulców w rowerze?',
    excerpt: 'Cena wymiany hamulców zależy od tego, czy wymieniasz same klocki, klocki razem z tarczami, czy przechodzisz z V-brake na tarcze albo z tarczowych mechanicznych na hydrauliczne. Sprawdź, co ile realnie kosztuje.',
    coverImage: 'assets/images/pictures/rower-w-serwisie.webp',
    coverImageAlt: 'Rower szosowy na stojaku serwisowym z widocznymi hamulcami i osprzętem',
    publishedDate: '2026-07-29',
    readingTimeMinutes: 6,
    contentHtml: `
      <p>"Wymiana hamulców" to w warsztacie rowerowym kilka zupełnie różnych usług w cenie — od kilkunastominutowej wymiany klocków po pełną przebudowę układu hamulcowego. Zanim zapytasz o cenę, warto wiedzieć, o który wariant właściwie pytasz.</p>

      <h2 id="same-klocki">Wymiana samych klocków hamulcowych</h2>
      <p>To najtańszy i najczęstszy wariant — klocki są elementem eksploatacyjnym i zużywają się naturalnie z każdym hamowaniem. Wymiana obejmuje zdjęcie starych klocków, montaż nowych i ustawienie ich względem obręczy (V-brake) lub tarczy (hamulce tarczowe). Przy hamulcach tarczowych dochodzi zwykle docisk/regulacja zacisku, żeby klocki nie ocierały o tarczę.</p>
      <p>Cena zależy głównie od typu klocków (organiczne vs. metaliczne/sintered) oraz od tego, czy to hamulce obręczowe czy tarczowe — te drugie zwykle kosztują nieco więcej ze względu na precyzję regulacji.</p>

      <h2 id="klocki-i-tarcze">Wymiana klocków razem z tarczami</h2>
      <p>Tarcze hamulcowe też się zużywają — ścierają się razem z klockami, choć wolniej. Jeśli tarcza jest wyraźnie przetarta, ma rowki, jest skrzywiona (np. po upadku roweru) albo mechanik zmierzy jej grubość poniżej minimum producenta, wymiana samych klocków nic nie da — nowe klocki będą się nierówno docierać do zniszczonej tarczy i szybko się zużyją.</p>
      <p>Wymiana klocków + tarcz to zauważalnie wyższy koszt niż same klocki (dochodzi cena samych tarcz, zwykle droższych niż klocki, plus dodatkowy czas pracy), ale jeśli tarcza jest już zniszczona, to jedyne sensowne rozwiązanie — oszczędzanie na samych klockach przy zniszczonej tarczy kończy się szybkim powrotem do serwisu.</p>

      <h2 id="pozostale-elementy">Wymiana pozostałych zużytych elementów układu hamulcowego</h2>
      <p>Czasem sam problem z hamowaniem nie leży w klockach ani tarczy, tylko w linkach (hamulce mechaniczne) lub przewodach hydraulicznych, które się rozciągają, korodują albo przeciekają. W hamulcach hydraulicznych może być też potrzebne odpowietrzenie układu — to osobna usługa, niezwiązana bezpośrednio z wymianą klocków, ale często wykonywana przy okazji tej samej wizyty.</p>
      <ul>
        <li>Wymiana linek hamulcowych (hamulce mechaniczne/V-brake)</li>
        <li>Odpowietrzenie układu hydraulicznego</li>
        <li>Wymiana przewodu hydraulicznego (przy uszkodzeniu lub przycinaniu pod nowy rozmiar ramy)</li>
      </ul>

      <h2 id="v-brake-na-tarczowe">Zmiana z V-brake na hamulce tarczowe</h2>
      <p>To już nie wymiana, a przebudowa układu hamulcowego — i zdecydowanie najdroższy z opisywanych wariantów. Wymaga nie tylko zakupu zupełnie innych komponentów (tarcze, zaciski, dźwignie, adaptery), ale przede wszystkim <strong>kompatybilnej ramy i widelca</strong> — V-brake i hamulce tarczowe montuje się w zupełnie inny sposób, więc jeśli rama/widelec nie mają fabrycznych mocowań pod tarcze, taka zmiana może być w ogóle niemożliwa bez wymiany widelca (a czasem i ramy).</p>
      <p>Przed podjęciem decyzji warto zapytać mechanika, czy Twój rower w ogóle nadaje się do takiej przebudowy — to pytanie, na które trzeba odpowiedzieć przed wyceną, nie po niej.</p>

      <h2 id="mechaniczne-na-hydrauliczne">Zmiana z hamulców tarczowych mechanicznych na hydrauliczne</h2>
      <p>Mniejsza, ale wciąż kosztowna zmiana — hamulce mechaniczne używają linki (jak w V-brake), hydrauliczne przewodu z płynem hamulcowym. Zmiana wymaga wymiany dźwigni, zacisków i przewodów, plus odpowietrzenia nowo zamontowanego układu. Tarcze często można zostawić te same (jeśli są w dobrym stanie i pasują rozmiarem), co obniża koszt względem pełnej przebudowy z V-brake.</p>
      <p>Efekt: mocniejsze, bardziej precyzyjne hamowanie z mniejszą siłą na dźwigni — częsty upgrade w rowerach gravelowych i MTB, rzadziej opłacalny w zwykłym rowerze miejskim.</p>

      <h2 id="jak-poznac-cene">Jak poznać realną cenę przed wizytą</h2>
      <p>Każdy z tych wariantów to inna usługa w cenniku warsztatu — dlatego pytanie "ile kosztuje wymiana hamulców" bez doprecyzowania wariantu nie ma jednej dobrej odpowiedzi. Najpewniejszy sposób to sprawdzenie jawnego cennika konkretnego serwisu przed wizytą, zamiast wyceny "na oko" przez telefon. Przykładowo <a href="/retrower-serwis-krakow">Retrower Serwis Kraków</a> i <a href="/buzzit">Buzzit</a> mają u nas opublikowany, jawny cennik regulacji i wymiany hamulców — możesz od razu porównać ceny, zamiast dzwonić po kolei do każdego warsztatu. Pełną listę zweryfikowanych serwisów znajdziesz w <a href="/serwisy">katalogu serwisów CycloPick</a>.</p>
    `
  },
  {
    slug: 'jak-wybrac-serwis-rowerowy-krakow',
    title: 'Jak wybrać dobry serwis rowerowy w Krakowie? Kompletny poradnik',
    excerpt: 'W Krakowie działają dziesiątki warsztatów rowerowych — nie wszystkie oferują ten sam poziom jakości. Sprawdź, na co zwrócić uwagę, zanim oddasz rower w nieznane ręce.',
    coverImage: 'assets/images/pictures/vertical/serwis-rowerowy-krakow.webp',
    coverImageAlt: 'Wnętrze serwisu rowerowego w Krakowie',
    publishedDate: '2026-07-28',
    readingTimeMinutes: 5,
    contentHtml: `
      <p>Kraków ma jedną z największych sieci serwisów rowerowych w Polsce — to dobra wiadomość dla rowerzystów, ale też wyzwanie: jak spośród kilkudziesięciu warsztatów wybrać ten, który naprawi rower solidnie i nie przepłacić?</p>
      <h2 id="sprawdz-opinie">1. Sprawdź opinie, ale czytaj je uważnie</h2>
      <p>Wysoka ocena to dopiero początek. Zwróć uwagę na treść opinii — czy klienci piszą o terminowości, uczciwej wycenie i komunikacji, czy tylko o "miłej obsłudze"? Te pierwsze świadczą o realnym profesjonalizmie.</p>
      <h2 id="zakres-przegladu">2. Zapytaj o zakres przeglądu</h2>
      <p>Dobry serwis rowerowy w Krakowie powinien jasno określić, co wchodzi w skład podstawowego przeglądu: regulację przerzutek i hamulców, sprawdzenie luzów w piastach i suporcie, docisk szprych, smarowanie napędu. Jeśli warsztat nie potrafi tego wymienić — to sygnał ostrzegawczy.</p>
      <h2 id="czas-realizacji">3. Zwróć uwagę na czas realizacji</h2>
      <p>W sezonie (kwiecień–wrzesień) kolejki w krakowskich serwisach potrafią sięgać kilku dni. Warsztaty, które oferują rezerwację terminu online, zwykle lepiej zarządzają kolejką niż te działające wyłącznie "z marszu".</p>
      <ul>
        <li>Sprawdź, czy serwis podaje orientacyjny cennik przed wizytą</li>
        <li>Zapytaj, czy wymienione części są oryginalne czy zamienniki</li>
        <li>Upewnij się, że otrzymasz informację o stanie roweru przed wykonaniem droższej naprawy</li>
      </ul>
      <h2 id="najszybszy-sposob">Najszybszy sposób na znalezienie sprawdzonego serwisu</h2>
      <p>Zamiast obdzwaniać kolejne warsztaty, możesz od razu sprawdzić zweryfikowane serwisy rowerowe w Krakowie z opiniami i rezerwacją online w jednym miejscu. Dwa przykłady krakowskich warsztatów z opublikowanym u nas cennikiem: <a href="/retrower-serwis-krakow">Retrower Serwis Kraków</a> i <a href="/nartyrowerykrakow">Narty Rowery Kraków</a>. Pełną, stale aktualizowaną listę znajdziesz w <a href="/serwisy/krakow">katalogu serwisów rowerowych w Krakowie</a> — to oszczędza czas i eliminuje niemiłe niespodzianki przy odbiorze roweru.</p>
    `
  },
  {
    slug: 'przerzutka-rowerowa-regulacja-objawy',
    title: 'Przerzutka źle przerzuca? Objawy, przyczyny i regulacja krok po kroku',
    excerpt: 'Rower "skacze" między biegami, łańcuch głośno pracuje albo przerzutka w ogóle nie chce przełożyć na najmniejszą zębatkę? To najczęściej kwestia prostej regulacji.',
    coverImage: 'assets/images/pictures/vertical/przerzutka-rowerowa.webp',
    coverImageAlt: 'Zbliżenie na przerzutkę tylną roweru',
    publishedDate: '2026-07-21',
    readingTimeMinutes: 6,
    contentHtml: `
      <p>Źle działająca przerzutka to jedna z najczęstszych usterek, z którymi rowerzyści trafiają do serwisu — i jedna z najłatwiejszych do zdiagnozowania, jeśli wiesz, czego szukać.</p>
      <h2 id="najczestsze-objawy">Najczęstsze objawy</h2>
      <ul>
        <li><strong>Łańcuch "skacze" między zębatkami</strong> — zwykle rozregulowana linka lub zużyty łańcuch</li>
        <li><strong>Głośna, chrobocząca praca napędu</strong> — nieprawidłowo ustawiona przerzutka względem kasety</li>
        <li><strong>Przerzutka nie sięga najmniejszej lub największej zębatki</strong> — źle ustawione ograniczniki (śruby H/L)</li>
        <li><strong>Opóźnione przełożenie biegu</strong> — naciąg linki zmienił się po dłuższym użytkowaniu (linki się "wyciągają")</li>
      </ul>
      <h2 id="co-sprawdzic-samodzielnie">Co można sprawdzić samodzielnie</h2>
      <p>Przed wizytą w warsztacie warto sprawdzić, czy problem nie wynika z czegoś prostego: skrzywionej ramki przerzutki (np. po upadku roweru), zabrudzonego lub przesuszonego łańcucha, albo poluzowanej linki przerzutki przy manetce.</p>
      <h2 id="kiedy-regulacja-nie-wystarczy">Kiedy regulacja nie wystarczy</h2>
      <p>Jeśli ramka przerzutki jest wygięta lub hak przerzutki (tzw. "ucho") w ramie jest skrzywiony po upadku, sama regulacja linki nic nie da — potrzebna jest korekta geometrii lub wymiana haka. To już praca dla mechanika z odpowiednim narzędziem (tzw. prostownicą do haka).</p>
      <p>Zaniedbana przerzutka potrafi w krótkim czasie przyspieszyć zużycie kasety i łańcucha — regulacja co sezon lub po każdym intensywnym okresie jazdy (np. wakacyjnym) potrafi realnie wydłużyć żywotność napędu.</p>
      <h2 id="umow-regulacje-online">Umów regulację online</h2>
      <p>Jeśli objawy się powtarzają mimo domowych prób regulacji, najszybciej i najtaniej wyjdziesz na oddaniu roweru do zweryfikowanego serwisu — rezerwację wizyty możesz zrobić online, bez telefonowania i czekania w kolejce. Znajdziesz go w <a href="/serwisy">katalogu zweryfikowanych serwisów rowerowych CycloPick</a>.</p>
    `
  },
  {
    slug: 'ile-kosztuje-przeglad-roweru',
    title: 'Ile kosztuje przegląd roweru i co powinien obejmować?',
    excerpt: 'Ceny przeglądów rowerowych potrafią się różnić nawet dwukrotnie między warsztatami. Wyjaśniamy, co wchodzi w podstawowy przegląd, a za co dopłacisz osobno.',
    coverImage: 'assets/images/pictures/vertical/rower.webp',
    coverImageAlt: 'Rower przygotowany do przeglądu w warsztacie',
    publishedDate: '2026-07-10',
    readingTimeMinutes: 5,
    contentHtml: `
      <p>"Przegląd roweru" to pojęcie, które w różnych warsztatach oznacza zupełnie inny zakres prac — dlatego zanim oddasz rower, warto wiedzieć, czego się spodziewać.</p>
      <h2 id="co-obejmuje-przeglad">Co zwykle obejmuje podstawowy przegląd</h2>
      <ul>
        <li>Regulacja hamulców (klocki, linki, docisk)</li>
        <li>Regulacja przerzutek przedniej i tylnej</li>
        <li>Sprawdzenie i dokręcenie luzów (piasty, suport, sterówka, korby)</li>
        <li>Docisk i wyważenie kół (centrowanie wstępne)</li>
        <li>Smarowanie łańcucha i sprawdzenie napędu</li>
        <li>Kontrola ciśnienia i stanu opon</li>
      </ul>
      <h2 id="co-platne-dodatkowo">Co zwykle jest płatne dodatkowo</h2>
      <p>Wymiana zużytych części (klocki hamulcowe, łańcuch, kaseta, opony, linki) to zawsze osobna pozycja w cenniku — dobry warsztat poinformuje Cię o konieczności wymiany przed jej wykonaniem, a nie dopiero na paragonie.</p>
      <h2 id="od-czego-zalezy-cena">Od czego zależy cena</h2>
      <p>Na cenę przeglądu wpływa typ roweru (szosowy, MTB, elektryczny — rowery elektryczne zwykle kosztują więcej ze względu na dodatkową diagnostykę napędu elektrycznego), stan techniczny przed wizytą oraz lokalizacja warsztatu.</p>
      <h2 id="jak-nie-przeplacic">Jak nie przepłacić</h2>
      <p>Najprostszy sposób to porównanie cenników kilku zweryfikowanych serwisów przed rezerwacją. Przykładowo <a href="/avsrent">Avsrent</a> i <a href="/dobre-rowery">Dobre Rowery</a> mają u nas opublikowany, jawny cennik przeglądów — możesz od razu porównać ceny. Pełną listę znajdziesz w <a href="/serwisy">katalogu serwisów CycloPick</a> i zarezerwować termin online, bez dzwonienia do każdego z osobna.</p>
    `
  },
  {
    slug: 'najlepszy-serwis-rowerowy-warszawa',
    title: 'Najlepszy serwis rowerowy w Warszawie — na co zwrócić uwagę',
    excerpt: 'Warszawski rynek serwisów rowerowych jest ogromny i bardzo zróżnicowany cenowo. Podpowiadamy, jak w kilka minut ocenić, czy dany warsztat jest wart zaufania.',
    coverImage: 'assets/images/pictures/vertical/serwis-rowerowy-warszawa.webp',
    coverImageAlt: 'Mechanik naprawiający rower w warszawskim serwisie',
    publishedDate: '2026-06-28',
    readingTimeMinutes: 4,
    contentHtml: `
      <p>W Warszawie liczba warsztatów rowerowych rośnie razem z popularnością jazdy na rowerze po mieście — to dobrze dla konkurencji cenowej, ale utrudnia wybór, gdy szukasz serwisu po raz pierwszy.</p>
      <h2 id="lokalizacja-nie-decyduje">Lokalizacja ma znaczenie, ale nie decyduje</h2>
      <p>Serwis "najbliżej domu" bywa wygodny, ale warto sprawdzić opinie nawet o warsztacie dwie dzielnice dalej — różnica w jakości naprawy potrafi być większa niż różnica w dojeździe.</p>
      <h2 id="specjalizacja-warsztatu">Specjalizacja warsztatu</h2>
      <p>Część warszawskich serwisów specjalizuje się w rowerach szosowych i wyścigowych, inne w miejskich i elektrycznych. Jeśli masz rower elektryczny, upewnij się, że warsztat ma doświadczenie z konkretnym systemem napędowym (Bosch, Shimano Steps, Bafang) — nie każdy serwis rowerowy naprawia e-bike'i.</p>
      <h2 id="transparentnosc-wyceny">Transparentność wyceny</h2>
      <p>Solidny warsztat w Warszawie powinien podać orientacyjną wycenę przed przyjęciem roweru i poinformować o dodatkowych kosztach, zanim je poniesiesz — to podstawowy standard, którego warto wymagać.</p>
      <h2 id="rezerwacja-bez-kolejki">Rezerwacja bez kolejki</h2>
      <p>W sezonie warszawskie serwisy bywają obłożone nawet na tydzień do przodu. Warsztaty z rezerwacją online zwykle pozwalają zaplanować wizytę z wyprzedzeniem i uniknąć straconego dnia na dowiezienie roweru "na czekanie" — przykładem jest <a href="/beatbike-service-warszawa">Beatbike Service Warszawa</a>, z opublikowanym u nas cennikiem i rezerwacją online. Pełną listę znajdziesz w <a href="/serwisy/warszawa">katalogu serwisów rowerowych w Warszawie</a>.</p>
    `
  },
  {
    slug: 'transport-roweru-do-serwisu-kiedy-warto',
    title: 'Transport roweru do serwisu — kiedy warto zamówić kuriera?',
    excerpt: 'Nie zawsze da się dojechać rowerem do warsztatu — awaria hamulców, przebita opona czy brak czasu to częste powody. Sprawdź, kiedy transport door-to-door się opłaca.',
    coverImage: 'assets/images/pictures/vertical/transport-roweru-krakow.webp',
    coverImageAlt: 'Rower przygotowany do transportu kurierem',
    publishedDate: '2026-06-15',
    readingTimeMinutes: 4,
    contentHtml: `
      <p>Dojazd rowerem do serwisu bywa niemożliwy albo po prostu ryzykowny — szczególnie przy poważniejszych usterkach. Wtedy transport door-to-door okazuje się najwygodniejszą (a czasem jedyną bezpieczną) opcją.</p>
      <h2 id="kiedy-transport-ma-sens">Kiedy transport ma sens</h2>
      <ul>
        <li>Awaria hamulców lub przerzutek uniemożliwiająca bezpieczną jazdę</li>
        <li>Uszkodzone koło lub rama po wypadku</li>
        <li>Brak czasu na dwukrotny dojazd (oddanie i odbiór) w godzinach pracy</li>
        <li>Rower elektryczny — cięższy i trudniejszy do przewiezienia własnym transportem</li>
      </ul>
      <h2 id="jak-to-wyglada">Jak to zwykle wygląda</h2>
      <p>Kurier odbiera rower spod wskazanego adresu w ustalonym oknie czasowym, dostarcza go do warsztatu, a po zakończeniu naprawy przywozi z powrotem. Nie musisz brać wolnego ani planować trasy z rowerem w ręku przez pół miasta.</p>
      <h2 id="bezpieczenstwo-w-transporcie">Bezpieczeństwo w transporcie</h2>
      <p>Przy wyborze usługi transportu warto sprawdzić, czy rower jest ubezpieczony na czas przewozu i czy kurier odpowiednio zabezpiecza go przed uszkodzeniem (owinięcie ramy, mocowanie w dedykowanym pojeździe) — to standard, którego należy oczekiwać, nie dodatek premium.</p>
      <p>W Krakowie transport door-to-door do zweryfikowanych serwisów CycloPick, np. <a href="/retrower-serwis-krakow">Retrower Serwis Kraków</a>, można zamówić razem z rezerwacją wizyty — jedno zgłoszenie załatwia i naprawę, i dowóz roweru. Pełną listę krakowskich warsztatów znajdziesz w <a href="/serwisy/krakow">katalogu serwisów w Krakowie</a>.</p>
    `
  },
  {
    slug: 'serwis-rowerowy-wroclaw-cennik-przegladu',
    title: 'Ile kosztuje przegląd roweru we Wrocławiu? Cennik i zakres usług',
    excerpt: 'Wrocław to jedno z najbardziej rowerowych miast w Polsce — i jedno z tych, gdzie różnice cenowe między serwisami bywają zaskakująco duże. Sprawdź, ile realnie zapłacisz.',
    coverImage: 'assets/images/pictures/vertical/serwis-rowerowy-wroclaw.webp',
    coverImageAlt: 'Warsztat rowerowy we Wrocławiu',
    publishedDate: '2026-05-30',
    readingTimeMinutes: 4,
    contentHtml: `
      <p>Dzięki dużej liczbie rowerzystów Wrocław ma jeden z najbardziej rozwiniętych rynków serwisów rowerowych w Polsce. To oznacza więcej wyboru, ale też potrzebę porównania ofert przed oddaniem roweru.</p>
      <h2 id="podstawowy-przeglad">Podstawowy przegląd</h2>
      <p>Standardowy przegląd (regulacja hamulców i przerzutek, sprawdzenie luzów, smarowanie napędu) to najczęściej zamawiana usługa. Cena zależy od typu roweru i stanu technicznego — im dłużej rower nie był serwisowany, tym więcej regulacji może być potrzebnych.</p>
      <h2 id="sezonowy-vs-naprawa">Przegląd sezonowy vs. bieżąca naprawa</h2>
      <p>Warto rozróżnić dwie sytuacje: przegląd sezonowy (np. wiosenny, przed sezonem) obejmuje pełną kontrolę roweru, natomiast bieżąca naprawa dotyczy konkretnej usterki (np. przebita dętka, urwany łańcuch) i zwykle kosztuje mniej, bo obejmuje węższy zakres prac.</p>
      <h2 id="jak-porownac-oferty">Jak porównać oferty wrocławskich serwisów</h2>
      <ul>
        <li>Sprawdź, czy cennik jest publicznie dostępny przed wizytą</li>
        <li>Zapytaj, czy w cenę wliczona jest robocizna, czy trzeba doliczyć osobno</li>
        <li>Zwróć uwagę, czy serwis specjalizuje się w Twoim typie roweru (miejski, MTB, elektryczny)</li>
      </ul>
      <h2 id="rezerwacja-online">Rezerwacja online oszczędza czas</h2>
      <p>Zamiast obdzwaniać wrocławskie warsztaty jeden po drugim, możesz porównać zweryfikowane serwisy z orientacyjnym cennikiem i od razu zarezerwować dogodny termin online — np. u <a href="/topbikeserwis">Topbikeserwis</a>, wrocławskiego warsztatu z opublikowanym u nas cennikiem. Pełną listę znajdziesz w <a href="/serwisy/wroclaw">katalogu serwisów rowerowych we Wrocławiu</a>.</p>
    `
  }
];

export function getPoradnikArticleBySlug(slug: string): PoradnikArticle | undefined {
  return PORADNIK_ARTICLES.find(article => article.slug === slug);
}
