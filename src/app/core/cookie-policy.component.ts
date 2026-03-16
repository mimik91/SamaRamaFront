import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';

@Component({
  selector: 'app-cookie-policy',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <div class="privacy-container">
      <header class="privacy-header">
        <h1>POLITYKA COOKIES PLATFORMY CYCLOPICK.PL</h1>
        <button class="back-btn" (click)="goBack()">&#8592; Powr&oacute;t</button>
      </header>

      <section class="privacy-content">

        <h2>1. O co chodzi z cookies?</h2>
        <p>Cookies (czyli &bdquo;ciasteczka&rdquo;) to ma&lstrok;e pliki zapisywane na Twoim urz&#261;dzeniu, kiedy korzystasz z naszej strony.</p>
        <p>Dzi&#281;ki nim strona:</p>
        <ul>
          <li>dzia&lstrok;a poprawnie,</li>
          <li>szybciej si&#281; &lstrok;aduje,</li>
          <li>zapami&#281;tuje niekt&oacute;re Twoje ustawienia.</li>
        </ul>
        <p>Niekt&oacute;re cookies s&#261; niezb&#281;dne do dzia&lstrok;ania Platformy, a inne pomagaj&#261; nam zrozumie&cacute;, jak korzystasz z CycloPick, &zdot;eby&sacute;my mogli j&#261; ulepsza&cacute;.</p>

        <h2>2. Kto odpowiada za cookies?</h2>
        <p>Administratorem danych zwi&#261;zanych z korzystaniem z cookies jest:</p>
        <p>
          <strong>CycloPick Prosta Sp&oacute;&lstrok;ka Akcyjna</strong><br>
          ul. Krakowska 13<br>
          32-086 Bosu t&oacute;w<br>
          Polska
        </p>
        <p>
          KRS: 0001226112<br>
          NIP: 5130309678<br>
          REGON: 544080816
        </p>
        <p>Wi&#281;cej informacji o przetwarzaniu danych osobowych znajdziesz w naszej <a routerLink="/privacy-policy">Polityce Prywatno&sacute;ci</a>.</p>

        <h2>3. Jakich cookies u&zdot;ywamy?</h2>

        <h3>a) Cookies niezb&#281;dne</h3>
        <p>To pliki, bez kt&oacute;rych strona nie mog&lstrok;aby dzia&lstrok;a&cacute; prawid&lstrok;owo.</p>
        <p>Pozwalaj&#261; m.in.:</p>
        <ul>
          <li>zalogowa&cacute; si&#281; do konta,</li>
          <li>korzysta&cacute; z funkcji Platformy,</li>
          <li>zapisa&cacute; zlecenia lub ustawienia.</li>
        </ul>
        <p>Tych cookies nie mo&zdot;na wy&lstrok;&#261;czy&cacute;, poniewa&zdot; s&#261; konieczne do dzia&lstrok;ania serwisu.</p>

        <h3>b) Cookies analityczne (np. Google Analytics)</h3>
        <p>Te cookies pomagaj&#261; nam zrozumie&cacute;:</p>
        <ul>
          <li>ile os&oacute;b korzysta z Platformy,</li>
          <li>kt&oacute;re funkcje s&#261; najcz&#281;&sacute;ciej u&zdot;ywane,</li>
          <li>jak u&zdot;ytkownicy poruszaj&#261; si&#281; po stronie.</li>
        </ul>
        <p>Dzi&#281;ki temu mo&zdot;emy rozwija&cacute; CycloPick w spos&oacute;b bardziej dopasowany do potrzeb u&zdot;ytkownik&oacute;w.</p>
        <p>Cookies analityczne uruchamiane s&#261; tylko po wyra&zdot;eniu przez Ciebie zgody.</p>

        <h2>4. Dlaczego u&zdot;ywamy Google Analytics?</h2>
        <p>Korzystamy z narz&#281;dzia Google Analytics, kt&oacute;re pomaga analizowa&cacute; ruch na stronie i spos&oacute;b korzystania z Platformy.</p>
        <p>Google Analytics jest us&lstrok;ug&#261; firmy Google LLC.</p>
        <p>Dane mog&#261; by&cacute; przetwarzane poza Europejskim Obszarem Gospodarczym (np. w USA). W takich przypadkach stosowane s&#261; odpowiednie zabezpieczenia, takie jak Standardowe Klauzule Umowne zatwierdzone przez Komisj&#281; Europejsk&#261;.</p>
        <p>W ramach analizy ruchu stosujemy r&oacute;wnie&zdot; anonimizacj&#281; adres&oacute;w IP, aby dodatkowo zwi&#281;kszy&cacute; ochron&#281; prywatno&sacute;ci u&zdot;ytkownik&oacute;w.</p>

        <h2>5. Jak mo&zdot;esz zarz&#261;dza&cacute; cookies?</h2>
        <p>Masz pe&lstrok;n&#261; kontrol&#281; nad tym, jakie cookies akceptujesz.</p>
        <p>Podczas pierwszej wizyty na stronie mo&zdot;esz:</p>
        <ul>
          <li>zaakceptowa&cacute; wszystkie cookies,</li>
          <li>odrzuci&cacute; wszystkie poza niezb&#281;dnymi,</li>
          <li>wybra&cacute; tylko wybrane kategorie.</li>
        </ul>
        <p>Zrobisz to w banerze cookies, kt&oacute;ry pojawia si&#281; przy pierwszym wej&sacute;ciu na stron&#281;.</p>
        <p>Mo&zdot;esz r&oacute;wnie&zdot; w ka&zdot;dej chwili zmieni&cacute; lub wycofa&cacute; swoj&#261; zgod&#281; poprzez zmian&#281; ustawie&#324; cookies.</p>
        <p>Dodatkowo ustawienia cookies mo&zdot;na kontrolowa&cacute; w swojej przegl&#261;darce &mdash; tam tak&zdot;e mo&zdot;na blokowa&cacute; lub usuwa&cacute; zapisane pliki.</p>

        <h2>6. Jak d&lstrok;ugo przechowujemy cookies?</h2>
        <p>Czas przechowywania zale&zdot;y od rodzaju cookies:</p>
        <ul>
          <li><strong>cookies sesyjne</strong> &ndash; s&#261; usuwane po zamkni&#281;ciu przegl&#261;darki,</li>
          <li><strong>cookies trwa&lstrok;e</strong> &ndash; pozostaj&#261; na urz&#261;dzeniu przez okre&sacute;lony czas lub do momentu ich usuni&#281;cia.</li>
        </ul>
        <p>Nie przechowujemy cookies d&lstrok;u&zdot;ej, ni&zdot; jest to konieczne do realizacji ich celu.</p>

        <h2>7. Czy cookies s&#261; bezpieczne?</h2>
        <p>Tak.</p>
        <p>Cookies nie pozwalaj&#261; nam na dost&#281;p do Twojego urz&#261;dzenia ani nie instaluj&#261; &zdot;adnego oprogramowania.</p>
        <p>S&lstrok;u&zdot;&#261; wy&lstrok;&#261;cznie do:</p>
        <ul>
          <li>poprawnego dzia&lstrok;ania Platformy,</li>
          <li>zapami&#281;tywania ustawie&#324;,</li>
          <li>analizy ruchu na stronie.</li>
        </ul>

        <h2>8. Zmiany w polityce cookies</h2>
        <p>Je&sacute;li zmienimy spos&oacute;b korzystania z cookies, poinformujemy o tym na stronie poprzez aktualizacj&#281; niniejszej polityki.</p>
        <p><em>Ostatnia aktualizacja: marzec 2026</em></p>

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
export class CookiePolicyComponent {
  constructor(private router: Router) {}

  goBack(): void {
    window.history.back();
  }
}
