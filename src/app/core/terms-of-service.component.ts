import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';

@Component({
  selector: 'app-terms-of-service',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="terms-container">
      <div class="terms-header">
        <h1>Regulamin Transportu</h1>
        <button class="back-btn" (click)="goBack()">← Powrót</button>
      </div>
      <div class="terms-content">
        <div class="terms-text">
          <h2>1. Postanowienia ogólne</h2>
          <p>1.1. Niniejszy regulamin („Regulamin”) określa zasady i warunki świadczenia usług transportu i serwisu rowerowego przez Cyclopick.pl, prowadzony przez osobę fizyczną z siedzibą w Krakowie („Usługodawca”).</p>
          <p>1.2. Kontakt z Usługodawcą:</p>
          <ul>
            <li>e-mail: <a href="mailto:cyclopick@gmail.com">cyclopick{{'@'}}gmail.com</a></li>
            <li>tel.: 667 757 920</li>
          </ul>
          <p>1.3. Regulamin obowiązuje od 7 lipca 2025 r. i jest dostępny nieodpłatnie na stronie <a href="https://www.cyclopick.pl">cyclopick.pl</a>.</p>

          <h2>2. Definicje</h2>
          <ul>
            <li><strong>Zlecenie</strong> – umowa na świadczenie usługi transportowej lub serwisowej między Klientem a Usługodawcą.</li>
            <li><strong>Klient</strong> – osoba fizyczna, prawna lub jednostka organizacyjna korzystająca z usług.</li>
            <li><strong>Usługa transportowa</strong> – przewóz roweru do wskazanego serwisu i z powrotem.</li>
            <li><strong>Usługa serwisowa</strong> – naprawa roweru w autoryzowanym serwisie ze zorganizowanym transportem (odbiór, naprawa, dostawa).</li>
            <li><strong>Magazynowanie</strong> – przechowywanie roweru w magazynie Usługodawcy w razie nieodebrania go przez Klienta.</li>
            <li><strong>Dzień roboczy</strong> – dzień od poniedziałku do piątku z wyłączeniem dni ustawowo wolnych od pracy.</li>
          </ul>

          <h2>3. Zakładanie i realizacja Zleceń</h2>
          <p>3.1. Zlecenia przyjmowane są przez formularz na stronie, e-mail lub telefon.</p>
          <p>3.2. Każde Zlecenie powinno zawierać:</p>
          <ul>
            <li>dane Klienta (imię, nazwisko, adres, telefon, e-mail),</li>
            <li>adres odbioru i dostawy roweru,</li>
            <li>datę i godzinę odbioru (dzień roboczy, 18:00–22:00),</li>
            <li>informacje o rowerze (marka, model, wartość, rodzaj ramy i obręczy).</li>
          </ul>
          <p>3.3. Potwierdzenie przyjęcia Zlecenia następuje mailowo lub telefonicznie w ciągu 24 h roboczych od zgłoszenia.</p>

          <h2>4. Terminy i przebieg usługi</h2>
          <h3>4.1. Usługa transportowa</h3>
          <ul>
            <li>Odbiór roweru: dzień roboczy, 18:00–22:00 pod wskazanym adresem.</li>
            <li>Dostawa do serwisu: tak, aby rower był gotowy następnego dnia roboczego.</li>
            <li>Odbiór z serwisu po potwierdzeniu gotowości i dostarczenie do Klienta w oknie 18:00–22:00.</li>
          </ul>

          <h2>5. Obowiązki i odpowiedzialność Klienta</h2>
          <ul>
            <li>Zapewnienie dostępu do roweru w ustalonym terminie i oknie czasowym.</li>
            <li>Przygotowanie roweru do transportu (zabezpieczenie luzem elementów).</li>
            <li>Przekazanie prawdziwych informacji o rodzaju i wartości roweru.</li>
          </ul>
          <p>Usługodawca odpowiada do wysokości 8000 zł. Rowery o wyższej wartości i z karbonową ramą/obręczami przewożone są na ryzyko Klienta. Usługodawca nie odpowiada za ukryte wady roweru ani opóźnienia z winy serwisu.</p>

          <h2>6. Cennik i warunki płatności</h2>
          <ul>
            <li>Transport do serwisu: wg wyceny przy składaniu Zlecenia.</li>
            <li>Magazynowanie: 10 zł za każdy rozpoczęty dzień (od kolejnego dnia po pierwszej próbie dostawy).</li>
          </ul>
          <p>Płatności: BLIK lub gotówka przy odbiorze. Faktury/paragony wystawiane na żądanie.</p>

          <h2>7. Zmiana i odstąpienie od Zlecenia</h2>
          <ul>
            <li>Zmiana lub anulowanie Zlecenia bez opłat możliwe do momentu pierwszego odbioru roweru.</li>
            <li>Konsument może odstąpić w ciągu 14 dni od zawarcia umowy, jeżeli usługa nie została rozpoczęta (mail: <a href="mailto:cyclopick@gmail.com">cyclopick{{'@'}}gmail.com</a>).</li>
            <li>Jeśli usługa już się rozpoczęła, Klient ponosi koszty dojazdu zgodnie z cennikiem.</li>
          </ul>

          <h2>8. Reklamacje i procedura rozpatrywania</h2>
          <ul>
            <li>Reklamacje do 14 dni od wykonania usługi na <a href="mailto:cyclopick@gmail.com">cyclopick{{'@'}}gmail.com</a>.</li>
            <li>Powinny zawierać dane Klienta, numer Zlecenia, opis niezgodności i zdjęcia.</li>
          </ul>
          <p>Potwierdzenie przyjęcia w 3 dni robocze, rozpatrzenie w 14 dni roboczych.</p>

          <h2>9. Siła wyższa</h2>
          <p>Strony nie odpowiadają za niewykonanie lub opóźnienie z przyczyn niezależnych (klęski żywiołowe, pandemie, strajki, awarie dróg). Terminy wydłużają się o czas trwania przyczyny.</p>

          <h2>10. Rozstrzyganie sporów</h2>
          <p>Spory polubownie, a gdy to niemożliwe – przez sąd właściwy dla siedziby Usługodawcy. Konsumenci mogą skorzystać z mediacji lub platformy ODR Komisji Europejskiej.</p>

          <h2>11. Ochrona danych osobowych</h2>
          <p>Administratorem danych jest Usługodawca. Dane przetwarzane są wyłącznie w celu realizacji Zlecenia, obsługi płatności i kontaktu. Klient ma prawo dostępu, poprawiania i usunięcia danych. Szczegóły w Polityce Prywatności.</p>

          <h2>12. Postanowienia końcowe</h2>
          <ul>
            <li>Usługodawca zastrzega sobie prawo do zmiany Regulaminu; zmiany wchodzą w życie po publikacji na stronie.</li>
            <li>W sprawach nieuregulowanych stosuje się przepisy Kodeksu cywilnego oraz ustawy o prawach konsumenta.</li>
          </ul>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .terms-container {
      max-width: 800px;
      margin: 0 auto;
      padding: 30px 20px;
      min-height: 100vh;
      background-color: #f8f9fa;
    }
    .terms-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 30px;
      padding-bottom: 20px;
      border-bottom: 2px solid #007bff;
    }
    h1 {
      color: #333;
      margin: 0;
      font-size: 2rem;
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
    .terms-content {
      background-color: white;
      padding: 40px;
      border-radius: 8px;
      box-shadow: 0 2px 10px rgba(0,0,0,0.1);
    }
    .terms-text {
      font-size: 1rem;
      color: #333;
      line-height: 1.6;
    }
    .terms-text h2 {
      margin-top: 30px;
      font-size: 1.4rem;
      color: #007bff;
    }
    .terms-text h3 {
      margin-top: 20px;
      font-size: 1.2rem;
      color: #0056b3;
    }
    .terms-text ul {
      padding-left: 20px;
      margin-top: 10px;
    }
    .terms-text li {
      margin-bottom: 8px;
    }
    .terms-text a {
      color: #007bff;
      text-decoration: none;
    }
    .terms-text a:hover {
      text-decoration: underline;
    }
    @media (max-width: 768px) {
      .terms-header {
        flex-direction: column;
        gap: 15px;
        text-align: center;
      }
      h1 {
        font-size: 1.5rem;
      }
      .terms-content {
        padding: 20px;
      }
    }
  `]
})
export class TermsOfServiceComponent {
  constructor(private router: Router) {}

  goBack(): void {
    window.history.back();
  }
}