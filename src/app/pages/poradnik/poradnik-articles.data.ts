import { PoradnikArticle } from '../../shared/models/poradnik-article.model';
import { TRANSPORT_PRICING } from '../../shared/constants/transport-pricing.constants';

// Reszta artykułów wycofana z publikacji (2026-08-22) — pełna treść (7 artykułów) zachowana w
// plany-marketingowe/poradnik-do-dopracowania.md do czasu dopracowania od A do Z.
export const PORADNIK_ARTICLES: PoradnikArticle[] = [
  {
    slug: 'mobilny-serwis-rowerowy-krakow',
    title: 'Mobilny serwis rowerowy Kraków: kiedy warto wezwać mechanika z dojazdem?',
    subtitle: 'Co da się naprawić pod domem, ile to kosztuje i które krakowskie serwisy naprawdę jeżdżą do klienta',
    excerpt: 'Mobilny serwis rowerowy w Krakowie: kiedy się opłaca, co mechanik naprawi pod domem, czego nie zrobi w terenie i ile to kosztuje.',
    coverImage: '/assets/images/poradnik/serwis-mobilny/serwis mobilny w mieście.webp',
    coverImageAlt: 'Mechanik mobilnego serwisu rowerowego naprawia rower na ulicy obok busa z napisem Mobilny Serwis Rowerowy',
    thumbnailImage: '/assets/images/poradnik/serwis-mobilny/serwis mobilny w lesie.webp',
    thumbnailImageAlt: 'Mechanik mobilnego serwisu rowerowego naprawia rower górski na leśnym szlaku',
    publishedDate: '2026-09-10',
    readingTimeMinutes: 6,
    contentHtml: `
      <p>Mobilny serwis rowerowy to mechanik, który przyjeżdża z narzędziami pod Twój dom, blok albo biuro i naprawia rower na miejscu. Nie trzeba jechać do warsztatu, stać w kolejce ani nosić roweru po schodach. Brzmi jak idealne rozwiązanie, ale ma granice: nie każdą usterkę da się usunąć na parkingu, nie każdy <strong>serwis rowerowy z dojazdem do klienta</strong> utrzymuje tę usługę na stałe, a sama wizyta bywa towarzysko niejasna. Zostawić mechanika samego czy stać obok?</p>

      <div class="poradnik-tldr">
        <h2 id="w-skrocie">W skrócie</h2>
        <ul>
          <li><strong><a href="#kiedy-sie-oplaca">Kiedy się opłaca</a>:</strong> gdy rower nie nadaje się do jazdy, jest ciężki (e-bike, cargo) albo do naprawy idzie kilka rowerów naraz.</li>
          <li><strong><a href="#co-naprawisz-na-miejscu">Co naprawisz pod domem</a>:</strong> regulacje, klocki, dętki, opony, łańcuch, podstawowy przegląd.</li>
          <li><strong><a href="#co-naprawisz-na-miejscu">Czego nie</a>:</strong> serwisu zawieszenia, budowy koła, łożysk, elektroniki e-bike. Tu wygrywa warsztat.</li>
          <li><strong><a href="#savoir-vivre-wizyty">Czy trzeba stać nad mechanikiem</a>:</strong> nie, to wizyta fachowca jak u hydraulika.</li>
          <li><strong><a href="#ile-kosztuje">Ile kosztuje</a>:</strong> zależy od naprawy i od tego, czy dojazd jest w cenie. O to warto zapytać przed wizytą.</li>
          <li><strong><a href="#serwisy-mobilne-w-krakowie">Kto jeździ w Krakowie</a>:</strong> od dłuższego czasu m.in. <a href="/dr-albin-radziwillowska">dr Albin</a> i <a href="/przerzutka">Przerzutka z Zielonek</a>.</li>
          <li><strong><a href="#mobilny-serwis-czy-transport">Gdy mechanik nie może przyjechać</a>:</strong> odbierzemy rower i zawieziemy do dowolnego serwisu w Krakowie.</li>
        </ul>
      </div>

      <h2 id="kiedy-sie-oplaca">Kiedy mobilny serwis jest najwygodniejszy</h2>
      <p>Największa zaleta to brak logistyki. Nie znosisz roweru z czwartego piętra bez windy, nie pakujesz go do samochodu, nie bierzesz wolnego, żeby zdążyć do warsztatu przed zamknięciem. Mechanik przyjeżdża w umówionym oknie i naprawia rower tam, gdzie stoi: pod blokiem, w garażu, na parkingu biurowca.</p>
      <p>Najbardziej docenisz to w trzech sytuacjach: gdy rower nie nadaje się do jazdy, gdy jest ciężki (cargo, elektryczny) i nie da się go zarzucić na bagażnik, i gdy do naprawy idą naraz rowery całej rodziny.</p>

      <h2 id="co-naprawisz-na-miejscu">Co mechanik naprawi na miejscu, a co lepiej zostawić warsztatowi</h2>
      <p>Nie każda naprawa wygląda tak samo pod chmurką i przy stole warsztatowym. Z grubsza dzielą się na trzy grupy.</p>
      <p><strong>Bez problemu na miejscu.</strong> To większość zleceń mobilnego serwisu:</p>
      <ul>
        <li>regulacja hamulców i przerzutek,</li>
        <li>wymiana klocków, dętki, opony i łańcucha,</li>
        <li>wymiana linek i pancerzy prowadzonych na zewnątrz ramy,</li>
        <li>czyszczenie i smarowanie napędu,</li>
        <li>montaż akcesoriów i podstawowy przegląd przed sezonem.</li>
      </ul>
      <p><strong>Da się, ale wymaga więcej czasu:</strong> regulacja luzów w sterach czy piaście, docieranie nowych klocków w hamulcach hydraulicznych albo wymiana linki prowadzonej wewnątrz ramy. Bez stołu warsztatowego i stałego oświetlenia każda z tych prac trwa dłużej, a margines błędu jest mniejszy.</p>
      <p><strong>Lepiej zabrać do warsztatu:</strong></p>
      <ul>
        <li>pełny serwis zawieszenia (olej, uszczelnienia),</li>
        <li>zaplatanie i budowa koła od zera,</li>
        <li>wymiana łożysk, suportu czy sterów,</li>
        <li>diagnostyka silnika i elektroniki w e-bike,</li>
        <li>naprawy gwarancyjne, bo zwykle muszą przejść przez autoryzowany warsztat producenta,</li>
        <li>prostowanie ramy, lakierowanie, klejenie karbonu.</li>
      </ul>
      <p>W tych przypadkach warsztat stacjonarny daje po prostu więcej: pracę przy dobrym świetle i na stole, komplet narzędzi i części pod ręką zamiast dojeżdżania po brakujący element.</p>

      <h2 id="rower-elektryczny">Mobilny serwis roweru elektrycznego</h2>
      <p>Właściciele e-bike'ów szukają mobilnego mechanika z prostego powodu: roweru ważącego ponad 20 kg nie wniesiesz do tramwaju ani nie wrzucisz na zwykły bagażnik. Mechanicznie e-bike serwisuje się jak każdy inny rower: hamulce, przerzutki, klocki, opony, łańcuch. Problem zaczyna się przy baterii, sterowniku albo silniku. Tu zwykle potrzebne jest oprogramowanie producenta podpięte do komputera, którego nikt nie wozi w bagażniku. Opisując usterkę przy umawianiu wizyty, powiedz wprost, czy chodzi o mechanikę, czy o „prąd". Mechanik od razu oceni, czy przyjazd ma sens.</p>

      <h2 id="savoir-vivre-wizyty">Savoir-vivre wizyty: stać nad mechanikiem czy zaproponować kawę?</h2>
      <p>To pytanie zadaje sobie prawie każdy przy pierwszej wizycie: zostawić mechanika samego z rowerem czy stać obok i patrzeć? Potraktuj to jak wizytę hydraulika albo elektryka. Nie musisz stać nad ręką przez całą naprawę. Wystarczy być w zasięgu, gdyby mechanik zauważył dodatkową usterkę albo potrzebował dostępu do bramy czy piwnicy.</p>
      <p>Kawa czy woda to miły gest, nie obowiązek. Mechanicy przyjeżdżają przygotowani na pracę w terenie, niezależnie od pogody. Jeśli chcesz zostać i popatrzeć, zapytaj, czy to nie przeszkadza: jedni chętnie tłumaczą na bieżąco, co robią, inni wolą pracować bez rozpraszania.</p>

      <figure>
        <img src="/assets/images/poradnik/serwis-mobilny/serwis mobilny w lesie.webp" alt="Mechanik mobilnego serwisu rowerowego naprawia rower górski na leśnym szlaku, klientka czeka obok" loading="lazy">
        <figcaption>Zdjęcie poglądowe: mobilny serwis sprawdza się też w terenie, np. przy awarii na szlaku.</figcaption>
      </figure>

      <h2 id="ile-kosztuje">Ile kosztuje mobilny serwis rowerowy</h2>
      <p>Cena zależy od zakresu naprawy, rodzaju roweru i zasad konkretnego serwisu. Jedni wliczają dojazd w cenę w granicach miasta, inni doliczają stawkę za kilometr poza określony promień. Zanim mechanik wyruszy, ustal:</p>
      <ul>
        <li>czy dojazd jest w cenie, a jeśli nie, ile kosztuje i od jakiej odległości,</li>
        <li>ile kosztuje robocizna i czy części rozliczane są osobno,</li>
        <li>czy diagnoza na miejscu jest płatna, jeśli naprawa okaże się niemożliwa w terenie,</li>
        <li>co dzieje się z rowerem, gdy trzeba go jednak zabrać do warsztatu.</li>
      </ul>
      <p>O ten ostatni punkt prawie nikt nie pyta przy umawianiu, a to on decyduje, czy za tydzień będziesz sam szukać transportu do warsztatu.</p>

      <h2 id="dlaczego-serwisy-przestaja-jezdzic">Dlaczego wiele serwisów mobilnych z czasem przestaje jeździć do klientów</h2>
      <p>Model mobilny to popularny sposób na start. Bez wynajmu lokalu próg wejścia jest niższy niż przy otwarciu warsztatu. Z czasem drogi rozchodzą się w dwie strony. Część serwisów mobilnych kończy działalność: model bywa trudny do utrzymania finansowo, zwłaszcza zimą. Inne zdobywają na tyle dużą rozpoznawalność, że jazda przez pół miasta do jednego klienta przestaje się opłacać. W tym samym czasie w jednym miejscu obsłużą kilku. Taki serwis otwiera stały punkt i przechodzi na model, w którym to klient przyjeżdża do niego.</p>
      <p>Dla kogoś, kto przez lata korzystał z jednego mobilnego mechanika, to realny problem: nie zawsze jest czas i możliwość, żeby samemu dowieźć rower, a nowy warsztat bywa po drugiej stronie Krakowa.</p>

      <h2 id="serwisy-mobilne-w-krakowie">Serwisy w Krakowie, które od dawna trzymają się modelu mobilnego</h2>
      <p>Mimo tej tendencji kilka krakowskich serwisów utrzymuje dojazd do klienta od dłuższego czasu:</p>
      <ul>
        <li><strong><a href="/dr-albin-radziwillowska">dr Albin (Radziwiłłowska)</a></strong> i <strong><a href="/dr-albin-narutowicza">dr Albin (Narutowicza)</a></strong>, dwie lokalizacje w Krakowie. Realizują też mobilne serwisy dla firm, biurowców i instytucji publicznych, przyjeżdżają na miejsce z pełnym wyposażeniem.</li>
        <li><strong><a href="/przerzutka">Przerzutka</a></strong> z podkrakowskich Zielonek: mobilny serwis działający od dłuższego czasu, obsługujący też okolice Krakowa.</li>
      </ul>

      <h2 id="mobilny-serwis-czy-transport">Mobilny serwis czy transport roweru do warsztatu</h2>
      <p>Różnica jest prosta. W serwisie mobilnym mechanik jedzie do roweru. W transporcie door-to-door rower jedzie do mechanika, ale nie Ty go wieziesz. Oba rozwiązania załatwiają to samo: nie musisz sam przewozić roweru przez miasto. Drugie działa jednak także wtedy, gdy naprawa wymaga pełnego warsztatu albo gdy Twój dotychczasowy mobilny mechanik przestał jeździć.</p>
      <p>W takiej sytuacji odbierzemy rower spod Twoich drzwi, zawieziemy do wybranego warsztatu i przywieziemy z powrotem po naprawie. Transport w Krakowie do partnerskich serwisów kosztuje od ${TRANSPORT_PRICING.partnerCost} zł w obie strony. Pełną listę warsztatów, do których dowozimy rowery, znajdziesz w <a href="/serwisy/krakow">katalogu serwisów rowerowych w Krakowie</a>. Jeśli dopiero szukasz nowego, stacjonarnego serwisu, sprawdź <a href="/poradnik/jak-wybrac-serwis-rowerowy-krakow">poradnik, jak go wybrać</a>.</p>
      <p><a href="/transport-rowerow-krakow" class="poradnik-service-btn">Zamów odbiór roweru z domu</a></p>

      <h2 id="najczestsze-pytania">Najczęściej zadawane pytania o mobilny serwis rowerowy</h2>
      <p><strong>Czy serwis rowerowy z dojazdem do klienta działa w Krakowie?</strong><br>Tak, choć oferuje go tylko część warsztatów, a nie każdy na stałe. Sprawdzone przykłady to dr Albin i Przerzutka. Przed umówieniem wizyty zapytaj o obszar dojazdu i zakres napraw wykonywanych w terenie.</p>
      <p><strong>Czy dojazd mechanika jest płatny?</strong><br>Zależy od serwisu: część nie liczy dojazdu w granicach miasta, inni doliczają stawkę za kilometr poza określony promień. Ustal to przy umawianiu, nie po fakcie.</p>
      <p><strong>Czy rower elektryczny da się naprawić mobilnie?</strong><br>Jeśli chodzi o mechanikę, tak. Baterię, sterownik i silnik zwykle diagnozuje się w warsztacie, z oprogramowaniem producenta.</p>
      <p><strong>Czy mobilny serwis obejmuje też okolice Krakowa?</strong><br>Zależy od serwisu: Przerzutka z Zielonek obsługuje okoliczne gminy. Jeśli mieszkasz na obrzeżach aglomeracji, sprawdź to przy rezerwacji.</p>
      <p><strong>Co zrobić, gdy usterki nie da się naprawić na miejscu?</strong><br>Rower musi trafić do warsztatu. Jeśli nie masz jak go przewieźć, zamów transport door-to-door: odbierzemy go spod domu i przywieziemy po naprawie.</p>

      <p>Mobilny serwis wygrywa wygodą przy typowych usterkach i regulacjach. Warsztat stacjonarny wygrywa zapleczem przy wszystkim, co wymaga stołu, prasy albo komputera. A gdy rower musi jechać do warsztatu, nie musisz wieźć go sam.</p>
      <p><em>Artykuł przygotował zespół CycloPick na podstawie doświadczeń z transportem rowerów do krakowskich serwisów.</em></p>
    `
  },
  {
    slug: 'jak-wybrac-serwis-rowerowy-krakow',
    title: 'Serwisy rowerowe Kraków — jak wybrać dobry warsztat, gdy oceny w Google mylą',
    subtitle: `Zweryfikowane opinie i transport door-to-door od ${TRANSPORT_PRICING.partnerCost} zł`,
    excerpt: `W Krakowie działają dziesiątki serwisów rowerowych, a ocena w Google nie zawsze mówi prawdę o jakości. Sprawdź, jak wybrać dobry warsztat i jak zamówić transport door-to-door za ${TRANSPORT_PRICING.partnerCost} zł.`,
    coverImage: '/assets/images/pictures/vertical/serwis-rowerowy-krakow.webp',
    coverImageAlt: 'Rower podczas przeglądu w warsztacie rowerowym w Krakowie',
    publishedDate: '2026-08-26',
    readingTimeMinutes: 5,
    contentHtml: `
      <p>Kraków ma jedną z największych sieci serwisów rowerowych w Polsce — wpisując "serwis rowerowy Kraków" czy "naprawa rowerów Kraków" w wyszukiwarkę, dostajesz dziesiątki wyników. Prawdziwym wyzwaniem nie jest więc znalezienie warsztatu, tylko wybranie takiego, który naprawi rower solidnie i nie każe za to przepłacać.</p>

      <div class="poradnik-tldr">
        <h2 id="w-skrocie">W skrócie</h2>
        <ul>
          <li><a href="#polecane-serwisy">Możesz wybrać serwis z najwyższą oceną na Google Maps</a> — odbierzemy Twój rower z dowolnego miejsca w Krakowie i zawieziemy go tam, nawet jeśli żaden nie działa akurat blisko Ciebie.</li>
          <li><a href="#oceny-do-sprostowania">Ocenę w Google Maps może wystawić każdy</a> z kontem Google, niezależnie od tego, czy faktycznie oddał tam rower — kilka solidnych warsztatów ma przez to zaniżony wynik.</li>
          <li><a href="#zweryfikowane-opinie">Uruchamiamy system zweryfikowanych opinii</a> — ocenę u nas wystawi tylko klient z faktycznie zrealizowanym zleceniem.</li>
          <li><a href="#jak-zarezerwowac">Transport door-to-door</a> do partnerskich warsztatów w Krakowie kosztuje od ${TRANSPORT_PRICING.partnerCost} zł w obie strony.</li>
          <li>Pełną listę znajdziesz w <a href="/serwisy/krakow">katalogu serwisów rowerowych w Krakowie</a>.</li>
        </ul>
      </div>

      <h2 id="polecane-serwisy">Wybierz serwis wysoko oceniany w Google</h2>
      <p>Możesz oczywiście po prostu wybrać serwis z najwyższą oceną na Google Maps. Dziś jest to jeszcze prostsze — nawet jeśli żaden warsztat z oceną 4.9 lub wyżej nie działa akurat blisko Ciebie, odbierzemy Twój rower z dowolnego miejsca w Krakowie i zawieziemy go do jednego z nich. Kilka takich serwisów masz już dostępnych u nas:</p>

      <div class="poradnik-service-rows">
        <div class="poradnik-service-row">
          <img src="/assets/images/poradnik/serwisy-krakow-logos/pitstop.png" alt="Logo Pitstop" class="poradnik-service-logo" loading="lazy">
          <div class="poradnik-service-info">
            <h3 class="poradnik-service-name">Pitstop</h3>
            <p class="poradnik-service-desc">Fiołkowa — przeglądy z ręcznym odtłuszczaniem napędu, dokręcaniem śrub kluczem dynamometrycznym zgodnie ze specyfikacją producenta.</p>
          </div>
          <a href="/pitstop-serwis" class="poradnik-service-btn">Zobacz serwis</a>
        </div>
        <div class="poradnik-service-row">
          <img src="/assets/images/poradnik/serwisy-krakow-logos/bismobike.png" alt="Logo Bismo Bike" class="poradnik-service-logo" loading="lazy">
          <div class="poradnik-service-info">
            <h3 class="poradnik-service-name">Bismo Bike</h3>
            <p class="poradnik-service-desc">Płd.-zach. Kraków — warsztat otwarty po ponad 10 latach pracy właściciela z rowerami, obsługa MTB, szosówek, gravelowców i miejskich.</p>
          </div>
          <a href="/bismobike" class="poradnik-service-btn">Zobacz serwis</a>
        </div>
        <div class="poradnik-service-row">
          <img src="/assets/images/poradnik/serwisy-krakow-logos/retrower.png" alt="Logo retRower" class="poradnik-service-logo" loading="lazy">
          <div class="poradnik-service-info">
            <h3 class="poradnik-service-name">retRower</h3>
            <p class="poradnik-service-desc">Prokocim — właściciel serwisuje i buduje rowery od ponad 25 lat, pracuje na biodegradowalnych środkach czyszczących.</p>
          </div>
          <a href="/retrower-serwis-krakow" class="poradnik-service-btn">Zobacz serwis</a>
        </div>
        <div class="poradnik-service-row">
          <img src="/assets/images/poradnik/serwisy-krakow-logos/nartyrowery.png" alt="Logo Narty Rowery Kraków" class="poradnik-service-logo" loading="lazy">
          <div class="poradnik-service-info">
            <h3 class="poradnik-service-name">Narty Rowery Kraków</h3>
            <p class="poradnik-service-desc">Obok serwisu prowadzi też wypożyczalnię rowerów, z naprawami "od ręki".</p>
          </div>
          <a href="/nartyrowerykrakow" class="poradnik-service-btn">Zobacz serwis</a>
        </div>
        <div class="poradnik-service-row">
          <img src="/assets/images/poradnik/serwisy-krakow-logos/biketrip.png" alt="Logo BikeTrip" class="poradnik-service-logo" loading="lazy">
          <div class="poradnik-service-info">
            <h3 class="poradnik-service-name">BikeTrip</h3>
            <p class="poradnik-service-desc">Stare Miasto, Zwierzyniecka — obsługuje też rowery elektryczne z silnikami Bosch i zawieszenia Fox, RockShox, Marzocchi, Manitou, Ohlins, Suntour.</p>
          </div>
          <a href="/biketrip" class="poradnik-service-btn">Zobacz serwis</a>
        </div>
        <div class="poradnik-service-row">
          <img src="/assets/images/poradnik/serwisy-krakow-logos/lelevelo.png" alt="Logo LeleVelo" class="poradnik-service-logo" loading="lazy">
          <div class="poradnik-service-info">
            <h3 class="poradnik-service-name">LeleVelo</h3>
            <p class="poradnik-service-desc">Salwator — na wyposażeniu klucz dynamometryczny i tensometr, po naprawie dostajesz zdjęcia stanu łożysk przed i po.</p>
          </div>
          <a href="/lelevelo" class="poradnik-service-btn">Zobacz serwis</a>
        </div>
        <div class="poradnik-service-row">
          <img src="/assets/images/poradnik/serwisy-krakow-logos/falarowerow.png" alt="Logo Fala Rowerów" class="poradnik-service-logo" loading="lazy">
          <div class="poradnik-service-info">
            <h3 class="poradnik-service-name">Fala Rowerów</h3>
            <p class="poradnik-service-desc">Podgórze — poza naprawami buduje rowery custom (gravel, szosa, single-speed) i renowuje rowery zabytkowe.</p>
          </div>
          <a href="/falarowerow" class="poradnik-service-btn">Zobacz serwis</a>
        </div>
        <div class="poradnik-service-row">
          <img src="/assets/images/poradnik/serwisy-krakow-logos/maksski.png" alt="Logo Maks-Ski & Bike" class="poradnik-service-logo" loading="lazy">
          <div class="poradnik-service-info">
            <h3 class="poradnik-service-name">Maks-Ski & Bike</h3>
            <p class="poradnik-service-desc">Piastów — serwisuje też e-bike'i z napędem Bosch, wieloletnia marka łącząca sprzedaż nart i rowerów.</p>
          </div>
          <a href="/maks-ski" class="poradnik-service-btn">Zobacz serwis</a>
        </div>
        <div class="poradnik-service-row">
          <div class="poradnik-service-logo poradnik-service-logo--placeholder" aria-hidden="true">
            <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><circle cx="5.5" cy="17.5" r="3.5"/><circle cx="18.5" cy="17.5" r="3.5"/><path d="M15 6a1 1 0 0 0-1 1v5.5H5.5l3-5.5m7.5 0H17m-5 0H9"/></svg>
          </div>
          <div class="poradnik-service-info">
            <h3 class="poradnik-service-name">Mobil Bike</h3>
            <p class="poradnik-service-desc">Serwis skupiony na odbiorze i dowozie roweru spod drzwi klienta.</p>
          </div>
          <a href="/mobil-bike" class="poradnik-service-btn">Zobacz serwis</a>
        </div>
        <div class="poradnik-service-row">
          <div class="poradnik-service-logo poradnik-service-logo--placeholder" aria-hidden="true">
            <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><circle cx="5.5" cy="17.5" r="3.5"/><circle cx="18.5" cy="17.5" r="3.5"/><path d="M15 6a1 1 0 0 0-1 1v5.5H5.5l3-5.5m7.5 0H17m-5 0H9"/></svg>
          </div>
          <div class="poradnik-service-info">
            <h3 class="poradnik-service-name">Miau Bike</h3>
            <p class="poradnik-service-desc">Przegląd z regulacją hamulców, przerzutek i centrowaniem kół za 220 zł.</p>
          </div>
          <a href="/miaubike" class="poradnik-service-btn">Zobacz serwis</a>
        </div>
      </div>

      <h2 id="dlaczego-gwiazdki-myla">Dlaczego oceny w Google potrafią mylić</h2>
      <p>Google Maps pozwala wystawić ocenę każdemu, kto ma konto Google, bez sprawdzania, czy dana osoba w ogóle oddała tam rower. Jedna gwiazdka może pochodzić od kogoś, kto nigdy nie przekroczył progu warsztatu — tak samo jak pięć gwiazdek od znajomego właściciela. Dla porządnie prowadzonego serwisu to często loteria, a czasem zwykła niesprawiedliwość.</p>

      <h2 id="oceny-do-sprostowania">Kilka niezasłużenie niskich ocen, które warto sprostować</h2>
      <p>Sprawdziliśmy część niskich ocen krakowskich warsztatów. W kilku przypadkach nie mają one związku z jakością wykonanej pracy:</p>
      <ul>
        <li><strong><a href="/buzzit">Buzzit</a></strong> — część negatywnych opinii pochodzi raczej od osób, które w ogóle nie były w serwisie.</li>
        <li><strong><a href="/rowpol">FHU ROW-POL Adam Flinta</a></strong> — jedna z niskich ocen to reakcja klienta na odmowę naprawy. Serwis nie obsługuje pewnej kategorii rowerów i nie stosuje zamienników — gdy zlecenie wymagało jednego i drugiego, uczciwie odmówił, zamiast iść na skróty.</li>
        <li><strong><a href="/bikesense">Bikesense — Rowery na Salwatorze</a></strong> — część negatywnych wpisów pochodzi z okresu, w którym warsztat był zamknięty na urlop. Przerwa w pracy mechanika nie mówi nic o jakości jego napraw.</li>
        <li><strong><a href="/elmar-rowery">Elmar Rowery</a></strong> — działa na rynku od lat i ma stałych, wracających klientów, ale nie zbiera aktywnie opinii w Google. Zadowolony klient rzadko sam usiądzie do wystawienia oceny, zrobi to częściej ktoś rozczarowany — co zaniża widoczny wynik bez związku z realną jakością.</li>
      </ul>

      <h2 id="zweryfikowane-opinie">Uruchamiamy system zweryfikowanych opinii</h2>
      <p>Odpowiadając na te niejasności, wprowadzamy w CycloPick system zweryfikowanych opinii: ocenę będzie mógł wystawić wyłącznie klient, który faktycznie miał zrealizowane zlecenie w danym serwisie — link do krótkiej ankiety wyślemy dopiero po zakończeniu naprawy, i tylko jemu. Nie da się ocenić serwisu, z którego się nie korzystało, ani zostawić dwóch ocen za to samo zlecenie.</p>
      <p>Opinie zbieramy sukcesywnie, w miarę realizowanych zleceń — im więcej osób rezerwuje przez CycloPick, tym pełniejszy obraz każdego serwisu. Przy każdym z nich zobaczysz też medianę realnego czasu realizacji, liczoną z faktycznie zakończonych zleceń — nie z deklaracji warsztatu.</p>

      <h2 id="jak-zarezerwowac">Jak zarezerwować serwis w Krakowie w 3 krokach</h2>
      <p>Zamiast obdzwaniać kolejne warsztaty i zgadywać, która opinia w internecie jest prawdziwa:</p>
      <ol>
        <li>Wejdź do <a href="/serwisy/krakow">katalogu serwisów rowerowych w Krakowie</a> i porównaj serwisy oraz cenniki.</li>
        <li>Wybierz warsztat i zarezerwuj termin online, bez telefonowania.</li>
        <li>Aby jak najbardziej Cię odciążyć, możemy zaproponować też <a href="/transport-rowerow-krakow">transport door-to-door w Krakowie od ${TRANSPORT_PRICING.partnerCost} zł w obie strony</a> — dzięki temu nie musisz się zastanawiać, jak dostarczyć rower do serwisu i z powrotem.</li>
      </ol>
      <p>Rower wraca do Ciebie naprawiony, bez konieczności planowania dwóch dojazdów przez miasto.</p>
    `
  },
  {
    slug: 'budzet-obywatelski-krakow-projekt-50-petla-pychowicka',
    title: 'Pętla MTB na Górce Pychowickiej',
    subtitle: 'Budżet obywatelski Kraków, projekt nr 50 — głosuj 11–28 września',
    excerpt: 'Krakowscy rowerzyści mogą zdecydować o nowej, bezpłatnej trasie MTB na Górce Pychowickiej — głosuj w budżecie obywatelskim 11–28 września. Sprawdź szczegóły.',
    coverImage: '/assets/images/poradnik/projekt-50-petla-pychowicka/single-track-mtb.webp',
    coverImageAlt: 'Poglądowe zdjęcie singletracka MTB w lesie',
    publishedDate: '2026-08-23',
    readingTimeMinutes: 4,
    contentHtml: `
      <p>Kraków ma szansę zyskać nową, bezpłatną i ogólnodostępną trasę MTB — ale decyzja należy do mieszkańców, nie do urzędu. Projekt nr 50 w budżecie obywatelskim zakłada budowę pętli rowerowej na Górce Pychowickiej, a o tym, czy powstanie, zadecyduje głosowanie 11–28 września. Poniżej wyjaśniamy, co dokładnie jest w planach i gdzie to jest.</p>

      <div class="poradnik-tldr">
        <h2 id="w-skrocie">W skrócie</h2>
        <ul>
          <li><strong>Co:</strong> głosowanie na projekt nr 50 w budżecie obywatelskim Krakowa — bezpłatna trasa MTB dla każdego na Górce Pychowickiej.</li>
          <li><strong>Gdzie:</strong> Górka Pychowicka, między Ruczajem a trasą rowerową od Krakowa w stronę Tyńca.</li>
          <li><strong>Kiedy głosować:</strong> 11–28 września.</li>
          <li><strong>Jak zagłosować:</strong> przez stronę budżetu obywatelskiego lub aplikację mKraków.</li>
          <li><strong>Co powstanie:</strong> Etap I — ok. 2,5 km pętli dla początkujących.</li>
        </ul>
      </div>

      <h2 id="co-to-za-projekt">Co dokładnie zakłada projekt</h2>
      <p>Za projektem stoi <a href="https://www.bikepark.krakow.pl/" target="_blank" rel="noopener">Fundacja Krakowski Park Rowerowy</a>. To projekt ogólnomiejski nr 50, w kategorii "Sport i infrastruktura sportowa" — czyli głosować może każdy uprawniony mieszkaniec Krakowa, niezależnie od dzielnicy.</p>
      <p>Plan zakłada dwa etapy:</p>
      <ul>
        <li><strong>Etap I</strong> — pętla dla początkujących, ok. 2,5 km, o równej nawierzchni i niewielkich przewyższeniach.</li>
        <li><strong>Etap II</strong> (planowany rozwój) — dodatkowe odcinki dla bardziej zaawansowanych, ok. 3,5 km, z bardziej zróżnicowaną nawierzchnią, przeszkodami i większym nachyleniem.</li>
      </ul>
      <p>Cała trasa ma być bezpłatna i ogólnodostępna — pomyślana jako "flow trail" dla wielu poziomów: od dzieci i rowerzystów rekreacyjnych, po amatorów MTB.</p>

      <figure>
        <img src="/assets/images/poradnik/projekt-50-petla-pychowicka/single-track-mtb.webp" alt="Poglądowe zdjęcie singletracka MTB w lesie" loading="lazy">
        <figcaption>Zdjęcie poglądowe — tak orientacyjnie może wyglądać charakter trasy (nie jest to zdjęcie z Górki Pychowickiej).</figcaption>
      </figure>

      <h2 id="gdzie-to-jest">Gdzie dokładnie w Krakowie</h2>
      <p>Górka Pychowicka leży między Ruczajem a południową częścią trasy rowerowej prowadzącej od Krakowa w stronę Tyńca — czyli praktycznie przy bulwarach wiślanych, ok. 5 minut rowerem od ścieżki nadwiślańskiej. To lokalizacja dobrze znana rowerzystom jeżdżącym w tamtą stronę, tyle że dziś bez wyznaczonej, legalnej trasy MTB.</p>

      <figure>
        <img src="/assets/images/poradnik/projekt-50-petla-pychowicka/gorka-pychowicka.webp" alt="Mapa lokalizacji Górki Pychowickiej w Krakowie" loading="lazy">
        <figcaption>Lokalizacja Górki Pychowickiej — między Ruczajem a trasą w stronę Tyńca.</figcaption>
      </figure>

      <figure>
        <img src="/assets/images/poradnik/projekt-50-petla-pychowicka/mapa-trasy-pychowickiej.webp" alt="Mapa planowanego przebiegu pętli rowerowej wraz z opcjami rozbudowy" loading="lazy">
        <figcaption>Planowany przebieg pętli wraz z opcjami rozbudowy (Etap I i Etap II).</figcaption>
      </figure>

      <h2 id="kiedy-i-jak-glosowac">Kiedy i jak zagłosować</h2>
      <p>Głosowanie w tegorocznej edycji budżetu obywatelskiego trwa <strong>od 11 do 28 września</strong>. To realne ograniczenie czasowe — jeśli projekt nie zbierze wystarczająco głosów w tym terminie, przepada, a szansa wraca dopiero przy kolejnej edycji za rok. Głosować może każdy mieszkaniec Krakowa uprawniony do udziału w budżecie obywatelskim. W tegorocznej edycji można to zrobić nie tylko przez stronę internetową budżetu obywatelskiego, ale też przez aplikację mKraków.</p>
      <p>Pełny opis projektu, w tym dokładny zasięg trasy i szczegóły techniczne, znajdziesz na stronie Fundacji Krakowski Park Rowerowy: <a href="https://www.bikepark.krakow.pl/petla" target="_blank" rel="noopener">bikepark.krakow.pl/petla</a>.</p>

      <h2 id="serwisy-ktore-sie-wlaczaja"><a href="/serwisy/krakow">Serwisy rowerowe w Krakowie</a>, które już się włączają</h2>
      <p>Do promocji projektu dołączają kolejne krakowskie serwisy rowerowe — widać, że temat porusza nie tylko rowerzystów rekreacyjnych, ale i lokalny biznes rowerowy, dla którego rozwój infrastruktury MTB w mieście to też więcej klientów z odpowiednim sprzętem do serwisowania. Wśród nich m.in.:</p>
      <ul class="poradnik-service-list">
        <li><a href="/mobil-bike">Mobil Bike</a></li>
        <li><a href="/volik">Volik</a></li>
        <li>TWR Michał Wandor</li>
        <li>Bikegaraż</li>
        <li>mbike.pl</li>
        <li>Sklep rowerowy rbike</li>
      </ul>

      <p>Niezależnie od tego, czy jeździsz MTB, czy tylko dojeżdżasz rowerem po mieście — to głosowanie to jedna z niewielu okazji, żeby realnie wpłynąć na to, jak wygląda rowerowy Kraków. Nie kosztuje nic poza kilkoma minutami między 11 a 28 września.</p>
    `
  }
];

export function getPoradnikArticleBySlug(slug: string): PoradnikArticle | undefined {
  return PORADNIK_ARTICLES.find(article => article.slug === slug);
}
