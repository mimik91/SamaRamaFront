import { PoradnikArticle } from '../../shared/models/poradnik-article.model';

// Reszta artykułów wycofana z publikacji (2026-08-22) — pełna treść (7 artykułów) zachowana w
// plany-marketingowe/poradnik-do-dopracowania.md do czasu dopracowania od A do Z.
export const PORADNIK_ARTICLES: PoradnikArticle[] = [
  {
    slug: 'budzet-obywatelski-krakow-projekt-50-petla-pychowicka',
    title: 'Pętla MTB na Górce Pychowickiej',
    subtitle: 'Budżet obywatelski Kraków, projekt nr 50 — głosuj 11–28 września',
    excerpt: 'Krakowscy rowerzyści mogą zdecydować o nowej, bezpłatnej trasie MTB na Górce Pychowickiej — głosuj w budżecie obywatelskim 11–28 września. Sprawdź szczegóły.',
    coverImage: 'assets/images/poradnik/projekt-50-petla-pychowicka/single-track-mtb.webp',
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
        <img src="assets/images/poradnik/projekt-50-petla-pychowicka/single-track-mtb.webp" alt="Poglądowe zdjęcie singletracka MTB w lesie" loading="lazy">
        <figcaption>Zdjęcie poglądowe — tak orientacyjnie może wyglądać charakter trasy (nie jest to zdjęcie z Górki Pychowickiej).</figcaption>
      </figure>

      <h2 id="gdzie-to-jest">Gdzie dokładnie w Krakowie</h2>
      <p>Górka Pychowicka leży między Ruczajem a południową częścią trasy rowerowej prowadzącej od Krakowa w stronę Tyńca — czyli praktycznie przy bulwarach wiślanych, ok. 5 minut rowerem od ścieżki nadwiślańskiej. To lokalizacja dobrze znana rowerzystom jeżdżącym w tamtą stronę, tyle że dziś bez wyznaczonej, legalnej trasy MTB.</p>

      <figure>
        <img src="assets/images/poradnik/projekt-50-petla-pychowicka/gorka-pychowicka.webp" alt="Mapa lokalizacji Górki Pychowickiej w Krakowie" loading="lazy">
        <figcaption>Lokalizacja Górki Pychowickiej — między Ruczajem a trasą w stronę Tyńca.</figcaption>
      </figure>

      <figure>
        <img src="assets/images/poradnik/projekt-50-petla-pychowicka/mapa-trasy-pychowickiej.webp" alt="Mapa planowanego przebiegu pętli rowerowej wraz z opcjami rozbudowy" loading="lazy">
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
