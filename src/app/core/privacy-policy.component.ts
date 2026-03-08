import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';

@Component({
  selector: 'app-privacy-policy',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="privacy-container">
      <header class="privacy-header">
        <h1>POLITYKA PRYWATNO&Sacute;CI PLATFORMY CYCLOPICK.PL</h1>
        <button class="back-btn" (click)="goBack()">&#8592; Powr&oacute;t</button>
      </header>

      <section class="privacy-content">
        <h2>I. Postanowienia og&oacute;lne</h2>
        <p>Niniejsza Polityka Prywatno&sacute;ci okre&sacute;la zasady zbierania, przetwarzania oraz przechowywania danych osobowych w zwi&#261;zku z korzystaniem z platformy internetowej oraz aplikacji webowej dost&#281;pnej pod adresem <a href="https://www.cyclopick.pl" target="_blank" rel="noopener">www.cyclopick.pl</a> (dalej: &bdquo;Platforma&rdquo;).</p>
        <p>Dane osobowe przetwarzane s&#261; zgodnie z:</p>
        <ul>
          <li>Rozporz&#261;dzeniem Parlamentu Europejskiego i Rady (UE) 2016/679 (RODO),</li>
          <li>ustaw&#261; z dnia 10 maja 2018 r. o ochronie danych osobowych.</li>
        </ul>
        <p>Korzystanie z Platformy oznacza zapoznanie si&#281; z niniejsz&#261; Polityk&#261; Prywatno&sacute;ci.</p>

        <h2>II. Administrator danych</h2>
        <p>Administratorem danych osobowych jest:</p>
        <p>
          <strong>CYCLOPICK PROSTA SP&Oacute;&Lstrok;KA AKCYJNA</strong><br>
          z siedzib&#261; w Krakowie<br>
          KRS: 0001226112<br>
          NIP: 5130309678<br>
          REGON: 544080816
        </p>
        <p>Kontakt w sprawach danych osobowych:</p>
        <ul>
          <li>e-mail: <a href="mailto:cyclopick@gmail.com">cyclopick{{'@'}}gmail.com</a></li>
          <li>tel.: 667 757 920</li>
        </ul>
        <p>Administrator mo&zdot;e w przysz&lstrok;o&sacute;ci powo&lstrok;a&cacute; Inspektora Ochrony Danych (IOD), o czym u&zdot;ytkownicy zostan&#261; poinformowani w niniejszej Polityce.</p>

        <h2>III. Role w przetwarzaniu danych</h2>
        <h3>1. Administrator danych</h3>
        <p>W stosunku do U&zdot;ytkownik&oacute;w oraz Serwis&oacute;w posiadaj&#261;cych Konto Administrator przetwarza dane jako samodzielny administrator danych.</p>
        <p>Dotyczy to danych podanych podczas:</p>
        <ul>
          <li>rejestracji konta,</li>
          <li>korzystania z Platformy,</li>
          <li>komunikacji z Platform&#261;.</li>
        </ul>
        <h3>2. Podmiot przetwarzaj&#261;cy (procesor)</h3>
        <p>W zakresie danych klient&oacute;w wprowadzanych do systemu przez Serwisy (np. dane klienta zapisane w zleceniu serwisowym):</p>
        <ul>
          <li>administratorem danych pozostaje dany Serwis,</li>
          <li>CycloPick P.S.A. dzia&lstrok;a jako podmiot przetwarzaj&#261;cy (procesor).</li>
        </ul>
        <p>Przetwarzanie odbywa si&#281; na podstawie Umowy Powierzenia Przetwarzania Danych (DPA) zawartej pomi&#281;dzy Serwisem a CycloPick.</p>

        <h2>IV. Zakres przetwarzanych danych</h2>
        <p>Administrator mo&zdot;e przetwarza&cacute; nast&#281;puj&#261;ce dane osobowe:</p>
        <ul>
          <li><strong>dane u&zdot;ytkownik&oacute;w:</strong> imi&#281; i nazwisko, adres e-mail, numer telefonu,</li>
          <li><strong>dane klient&oacute;w Serwis&oacute;w:</strong> imi&#281;, nazwisko (opcjonalnie), numer telefonu, adres e-mail,</li>
          <li><strong>dane dotycz&#261;ce rower&oacute;w:</strong> numer ramy, marka i model, historia napraw,</li>
          <li><strong>dane Serwis&oacute;w:</strong> nazwa firmy, NIP, adres dzia&lstrok;alno&sacute;ci, dane kontaktowe,</li>
          <li><strong>dane techniczne:</strong> adres IP, logi systemowe, historia logowa&#324;, dane o aktywno&sacute;ci w systemie.</li>
        </ul>

        <h2>V. Cele i podstawy przetwarzania danych</h2>
        <p>Dane osobowe przetwarzane s&#261; w nast&#281;puj&#261;cych celach:</p>
        <ul>
          <li><strong>realizacja us&lstrok;ug Platformy</strong> (art. 6 ust. 1 lit. b RODO) &ndash; rejestracja konta, obs&lstrok;uga rezerwacji wizyt, prowadzenie historii serwisowej rower&oacute;w, komunikacja systemowa z u&zdot;ytkownikami,</li>
          <li><strong>realizacja obowi&#261;zk&oacute;w prawnych</strong> (art. 6 ust. 1 lit. c RODO) &ndash; prowadzenie dokumentacji ksi&#281;gowej, realizacja obowi&#261;zk&oacute;w podatkowych,</li>
          <li><strong>prawnie uzasadniony interes administratora</strong> (art. 6 ust. 1 lit. f RODO) &ndash; zapewnienie bezpiecze&#324;stwa systemu, analiza korzystania z Platformy, dochodzenie lub obrona przed roszczeniami,</li>
          <li><strong>obowi&#261;zek informacyjny</strong> (art. 14 RODO) &ndash; dotyczy sytuacji, gdy dane klienta zosta&lstrok;y wprowadzone do systemu przez Serwis bez bezpo&sacute;redniej rejestracji tej osoby w Platformie.</li>
        </ul>

        <h2>VI. Odbiorcy danych</h2>
        <p>Dane osobowe mog&#261; by&cacute; przekazywane podmiotom wsp&oacute;&lstrok;pracuj&#261;cym z Administratorem, w szczeg&oacute;lno&sacute;ci:</p>
        <ul>
          <li>dostawcom us&lstrok;ug IT,</li>
          <li>dostawcom infrastruktury chmurowej,</li>
          <li>biurom rachunkowym,</li>
          <li>operatorom system&oacute;w analitycznych.</li>
        </ul>
        <p>Administrator korzysta w szczeg&oacute;lno&sacute;ci z narz&#281;dzia <strong>Google Analytics</strong> &ndash; w celu analizy ruchu na Platformie.</p>

        <h2>VII. Transfer danych poza Europejski Obszar Gospodarczy</h2>
        <p>Platforma korzysta z infrastruktury chmurowej dostarczanej przez Heroku (Salesforce). W zwi&#261;zku z tym dane mog&#261; by&cacute; przetwarzane poza Europejskim Obszarem Gospodarczym, w szczeg&oacute;lno&sacute;ci w Stanach Zjednoczonych.</p>
        <p>Transfer danych odbywa si&#281; z zastosowaniem:</p>
        <ul>
          <li>Standardowych Klauzul Umownych zatwierdzonych przez Komisj&#281; Europejsk&#261;,</li>
          <li>odpowiednich &sacute;rodk&oacute;w technicznych i organizacyjnych zapewniaj&#261;cych bezpiecze&#324;stwo danych.</li>
        </ul>

        <h2>VIII. Okres przechowywania danych</h2>
        <p>Dane osobowe przechowywane s&#261; przez okres nie d&lstrok;u&zdot;szy ni&zdot; jest to konieczne do realizacji cel&oacute;w przetwarzania:</p>
        <ul>
          <li><strong>dane zwi&#261;zane z kontem</strong> &ndash; do momentu usuni&#281;cia konta oraz do czasu przedawnienia ewentualnych roszcze&#324;,</li>
          <li><strong>dane ksi&#281;gowe</strong> &ndash; przez okres wymagany przepisami prawa podatkowego,</li>
          <li><strong>dane historii serwisowej roweru</strong> &ndash; mog&#261; by&cacute; przechowywane do momentu zg&lstrok;oszenia &zdot;&#261;dania ich usuni&#281;cia przez u&zdot;ytkownika,</li>
          <li><strong>logi systemowe</strong> &ndash; przez okres niezb&#281;dny do zapewnienia bezpiecze&#324;stwa Platformy.</li>
        </ul>

        <h2>IX. Prawa os&oacute;b, kt&oacute;rych dane dotycz&#261;</h2>
        <p>Ka&zdot;da osoba, kt&oacute;rej dane dotycz&#261;, ma prawo do:</p>
        <ul>
          <li>dost&#281;pu do swoich danych,</li>
          <li>sprostowania danych,</li>
          <li>usuni&#281;cia danych (&bdquo;prawo do bycia zapomnianym&rdquo;),</li>
          <li>ograniczenia przetwarzania,</li>
          <li>przenoszenia danych,</li>
          <li>wniesienia sprzeciwu wobec przetwarzania danych.</li>
        </ul>
        <p>Osoba, kt&oacute;rej dane dotycz&#261;, ma r&oacute;wnie&zdot; prawo wniesienia skargi do <strong>Prezesa Urz&#281;du Ochrony Danych Osobowych (PUODO)</strong>.</p>

        <h2>X. Pliki cookies i analityka</h2>
        <p>Platforma wykorzystuje pliki cookies w celu:</p>
        <ul>
          <li>zapewnienia prawid&lstrok;owego dzia&lstrok;ania serwisu,</li>
          <li>utrzymania sesji u&zdot;ytkownika,</li>
          <li>prowadzenia statystyk korzystania z Platformy.</li>
        </ul>
        <p>Platforma korzysta z narz&#281;dzia <strong>Google Analytics</strong>, kt&oacute;re umo&zdot;liwia analiz&#281; ruchu na stronie. Cookies mog&#261; by&cacute; zapisywane w urz&#261;dzeniu ko&#324;cowym u&zdot;ytkownika zgodnie z ustawieniami jego przegl&#261;darki internetowej.</p>

        <h2>XI. Profilowanie</h2>
        <p>Platforma mo&zdot;e wykorzystywa&cacute; dane do prostego profilowania, np. przypomnienia o planowanym serwisie roweru, sugestii dotycz&#261;cych przegl&#261;d&oacute;w. Profilowanie to nie prowadzi do podejmowania zautomatyzowanych decyzji wywo&lstrok;uj&#261;cych skutki prawne wobec u&zdot;ytkownika.</p>

        <h2>XII. Bezpiecze&#324;stwo danych</h2>
        <p>Administrator stosuje odpowiednie &sacute;rodki techniczne i organizacyjne zapewniaj&#261;ce ochron&#281; danych osobowych, w szczeg&oacute;lno&sacute;ci:</p>
        <ul>
          <li>szyfrowanie po&lstrok;&#261;cze&#324; (HTTPS),</li>
          <li>kontrol&#281; dost&#281;pu do system&oacute;w,</li>
          <li>backupy danych,</li>
          <li>monitorowanie bezpiecze&#324;stwa systemu.</li>
        </ul>

        <h2>XIII. Zmiany polityki prywatno&sacute;ci</h2>
        <p>Administrator zastrzega sobie prawo do zmiany niniejszej Polityki Prywatno&sacute;ci. O istotnych zmianach u&zdot;ytkownicy zostan&#261; poinformowani poprzez komunikat w Platformie.</p>
      </section>
    </div>
  `,
  styles: [`
    .privacy-container {
      max-width: 800px;
      margin: 0 auto;
      padding: 30px 20px;
      min-height: 100vh;
      background-color: #f8f9fa;
    }

    .privacy-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 30px;
      padding-bottom: 20px;
      border-bottom: 2px solid #28a745;
    }

    h1 {
      color: #333;
      margin: 0;
      font-size: 2rem;
    }

    h2 {
      color: #333;
      font-size: 1.5rem;
      margin-top: 20px;
      margin-bottom: 10px;
    }

    .back-btn {
      padding: 10px 20px;
      background-color: #6c757d;
      color: white;
      border: none;
      border-radius: 4px;
      cursor: pointer;
      font-weight: 500;
      transition: background-color 0.2s;
    }

    .back-btn:hover {
      background-color: #5a6268;
    }

    .privacy-content {
      background-color: white;
      padding: 40px;
      border-radius: 8px;
      box-shadow: 0 2px 10px rgba(0,0,0,0.1);
      min-height: 400px;
    }

    .privacy-content {
      font-size: 1rem;
      color: #333;
      line-height: 1.7;
    }

    .privacy-content ul {
      padding-left: 20px;
      margin-top: 8px;
      margin-bottom: 10px;
    }

    .privacy-content li {
      margin-bottom: 6px;
    }

    .privacy-content h3 {
      font-size: 1.1rem;
      color: #333;
      margin-top: 16px;
      margin-bottom: 8px;
    }

    .privacy-content a {
      color: #28a745;
      text-decoration: none;
    }

    .privacy-content a:hover {
      text-decoration: underline;
    }

    @media (max-width: 768px) {
      .privacy-header {
        flex-direction: column;
        gap: 15px;
        text-align: center;
      }

      h1 {
        font-size: 1.5rem;
      }

      .privacy-content {
        padding: 20px;
      }
    }
  `]
})
export class PrivacyPolicyComponent {
  constructor(private router: Router) {}

  goBack(): void {
    window.history.back();
  }
}