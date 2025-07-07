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
        <h1>Regulamin Serwisu</h1>
        <button class="back-btn" (click)="goBack()">← Powrót</button>
      </div>

      <div class="terms-content">
        <div class="terms-text">
          <h2>1. Informacje ogólne</h2>
          <p>Niniejszy regulamin określa zasady korzystania z usług świadczonych przez osobę fizyczną wykonującą zlecenia pod nazwą Cyclopick.pl, z siedzibą w Krakowie, zwaną dalej „Usługodawcą”.</p>
          <p>Kontakt z Usługodawcą możliwy jest:</p>
          <ul>
            <li>📧 e-mail: <a href="mailto:cyclopick@gmail.com">cyclopick{{'@'}}gmail.com</a></li>
            <li>📞 telefon: 723 45 25 87</li>
          </ul>
          <p>Regulamin dostępny jest nieodpłatnie na stronie internetowej https://cyclopick.pl i może być pobrany, zapisany oraz wydrukowany przez każdego użytkownika.</p>
          <p>Regulamin obowiązuje od dnia 7 lipca 2025 roku.</p>

          <h2>2. Definicje</h2>
          <ul>
            <li><strong>Usługodawca</strong> – osoba fizyczna wykonująca zlecenia pod nazwą Cyclopick.pl.</li>
            <li><strong>Klient</strong> – każda osoba fizyczna lub prawna korzystająca z usług Usługodawcy.</li>
            <li><strong>Serwis</strong> – strona internetowa dostępna pod adresem https://cyclopick.pl.</li>
            <li><strong>Usługa transportowa</strong> – przewóz roweru do i z wybranego przez klienta serwisu rowerowego.</li>
            <li><strong>Usługa serwisowa</strong> – naprawa roweru wraz z jego odbiorem i dowozem spod wskazanego adresu.</li>
            <li><strong>Magazynowanie</strong> – przechowywanie roweru w przypadku braku możliwości jego doręczenia klientowi.</li>
          </ul>

          <h2>3. Warunki techniczne korzystania z serwisu</h2>
          <p>Aby skorzystać z usług Cyclopick.pl, klient powinien posiadać:</p>
          <ul>
            <li>urządzenie z dostępem do Internetu,</li>
            <li>aktualną przeglądarkę internetową,</li>
            <li>aktywne konto e-mail.</li>
          </ul>

          <h2>4. Zakres i warunki świadczenia usług</h2>
          <h3>🚚 Transport roweru do wybranego serwisu</h3>
          <ul>
            <li>Klient samodzielnie umawia termin wizyty w wybranym serwisie rowerowym.</li>
            <li>Następnie zamawia transport roweru przez Cyclopick.pl, wskazując datę odbioru – dzień przed umówionym terminem serwisu.</li>
            <li>Odbiór roweru odbywa się w godzinach 18:00–22:00.</li>
            <li>Rower zostaje dostarczony do serwisu tak, aby był dostępny na umówiony dzień.</li>
            <li>Po zakończeniu serwisu i otrzymaniu informacji o gotowości roweru, Cyclopick.pl odbiera rower i dostarcza go z powrotem do klienta w godzinach 18:00–22:00.</li>
            <li>W przypadku nieobecności klienta podczas dostawy, rower zostaje przewieziony do magazynu. Podejmowane są próby kontaktu z klientem w celu ustalenia nowego terminu odbioru.</li>
            <li>Za każdy dzień magazynowania naliczana jest opłata w wysokości 10 zł.</li>
          </ul>

          <h3>🔧 Usługa serwisowa z transportem</h3>
          <ul>
            <li>Rower odbierany jest w godzinach 18:00–22:00, naprawiany, a następnie odwożony do klienta w tych samych godzinach.</li>
            <li>Czas realizacji naprawy wynosi standardowo do 24 godzin. W przypadku wydłużenia naprawy powyżej 48 godzin, klient zostaje poinformowany o przyczynie opóźnienia.</li>
          </ul>

          <h2>5. Odpowiedzialność i ograniczenia</h2>
          <ul>
            <li>Usługodawca ponosi odpowiedzialność za rowery o wartości do 6000 zł.</li>
            <li>Rowery o wartości powyżej 6000 zł są przewożone wyłącznie na odpowiedzialność klienta.</li>
            <li>Rowery z ramą lub obręczami karbonowymi są przewożone wyłącznie na odpowiedzialność klienta.</li>
            <li>Usługodawca nie ponosi odpowiedzialności za uszkodzenia wynikające z ukrytych wad roweru lub niewłaściwego przygotowania roweru do transportu.</li>
          </ul>

          <h2>6. Ceny i płatności</h2>
          <ul>
            <li>Ceny usług są podawane w trakcie składania zamówienia i zawierają podatek VAT (jeśli dotyczy).</li>
            <li>Dostępne metody płatności:
              <ul>
                <li>💳 BLIK</li>
                <li>💵 Gotówka przy odbiorze</li>
              </ul>
            </li>
            <li>Opłata za magazynowanie roweru wynosi 10 zł za każdy rozpoczęty dzień.</li>
          </ul>

          <h2>7. Odstąpienie od umowy</h2>
          <ul>
            <li>Klient będący konsumentem ma prawo odstąpić od umowy zawartej na odległość w terminie 14 dni bez podania przyczyny, o ile usługa nie została jeszcze wykonana.</li>
            <li>W celu odstąpienia od umowy należy przesłać oświadczenie na adres e-mail: <a href="mailto:cyclopick@gmail.com">cyclopick{{'@'}}gmail.com</a>.</li>
            <li>W przypadku rozpoczęcia świadczenia usługi przed upływem terminu do odstąpienia, klient traci prawo do odstąpienia od umowy.</li>
          </ul>

          <h2>8. Reklamacje</h2>
          <ul>
            <li>Reklamacje dotyczące wykonanych usług można zgłaszać w terminie do 14 dni od ich wykonania.</li>
            <li>Reklamacje należy przesłać na adres e-mail: <a href="mailto:cyclopick@gmail.com">cyclopick{{'@'}}gmail.com</a>.</li>
            <li>Reklamacja powinna zawierać: imię i nazwisko klienta, numer zamówienia, opis problemu oraz ewentualne zdjęcia dokumentujące stan roweru.</li>
            <li>Usługodawca rozpatrzy reklamację w terminie 14 dni od jej otrzymania.</li>
          </ul>

          <h2>9. Dane osobowe i polityka prywatności</h2>
          <p>Administratorem danych osobowych klientów jest Usługodawca. Dane osobowe przetwarzane są wyłącznie w celu realizacji usług oraz kontaktu z klientem. Klient ma prawo dostępu do swoich danych, ich poprawiania oraz żądania ich usunięcia. Szczegółowe informacje znajdują się w Polityce Prywatności dostępnej na stronie internetowej.</p>

          <h2>10. Postanowienia końcowe</h2>
          <p>Usługodawca zastrzega sobie prawo do zmiany niniejszego regulaminu. Zmiany wchodzą w życie z dniem ich publikacji na stronie internetowej.</p>
          <p>W sprawach nieuregulowanych niniejszym regulaminem zastosowanie mają przepisy Kodeksu cywilnego oraz ustawy o prawach konsumenta.</p>
          <p>Regulamin obowiązuje od dnia 7 lipca 2025 roku.</p>
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