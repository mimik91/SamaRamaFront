import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';

@Component({
  selector: 'app-terms-of-service',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="terms-container">
      <header class="terms-header">
        <h1>Regulamin Us&#322;ug CycloPick.pl</h1>
        <button class="back-btn" (click)="goBack()">&#8592; Powr&#243;t</button>
      </header>

      <section class="terms-content">
        <p class="effective-date">Obowi&#261;zuje od 7 lipca 2025 r.</p>

        <h2>1. Postanowienia og&#243;lne</h2>
        <p>1.1. Niniejszy regulamin (&#8222;Regulamin&#8221;) okre&#347;la zasady &#347;wiadczenia us&#322;ug transportu rowerowego przez Dominik Lach, zamieszka&#322;ego w Krakowie, prowadz&#261;cego dzia&#322;alno&#347;&#263; nierejestrowana (&#8222;Us&#322;ugodawca&#8221;).</p>
        <p>1.2. Kontakt z Us&#322;ugodawc&#261;:</p>
        <ul>
          <li>e-mail: <a href="mailto:cyclopick@gmail.com">cyclopick{{'@'}}gmail.com</a></li>
          <li>tel.: 667 757 920</li>
        </ul>
        <p>1.3. Regulamin dost&#281;pny jest nieodp&#322;atnie na stronie <a href="https://cyclopick.pl" target="_blank" rel="noopener">cyclopick.pl</a>.</p>
        <p>1.4. Klient o&#347;wiadcza, &#380;e rower przekazany do transportu jest wolny od wad prawnych, stanowi jego w&#322;asno&#347;&#263; lub Klient posiada tytu&#322; prawny do dysponowania nim.</p>

        <h2>2. Definicje</h2>
        <ul>
          <li><strong>Zlecenie</strong> &#8211; umowa o &#347;wiadczenie us&#322;ugi transportowej mi&#281;dzy Klientem a Us&#322;ugodawc&#261;.</li>
          <li><strong>Klient</strong> &#8211; osoba fizyczna, prawna lub jednostka organizacyjna korzystaj&#261;ca z us&#322;ug.</li>
          <li><strong>Us&#322;uga transportowa</strong> &#8211; prze w&#243;z roweru od Klienta do wskazanego serwisu i/lub z powrotem.</li>
          <li><strong>Magazynowanie</strong> &#8211; przechowywanie roweru w przypadku braku mo&#380;liwo&#347;ci jego zwrotu Klientowi.</li>
        </ul>

        <h2>3. Zak&#322;adanie i realizacja Zlece&#324;</h2>
        <p>3.1. Zlecenia przyjmowane s&#261; przez formularz na stronie, e-mail lub telefon.</p>
        <p>3.2. Po przes&#322;aniu formularza Klient otrzymuje automatyczne potwierdzenie wp&#322;yni&#281;cia zg&#322;oszenia.</p>
        <p>3.3. Zlecenie uznaje si&#281; za przyj&#281;te do realizacji dopiero po wys&#322;aniu przez Us&#322;ugodawc&#281; indywidualnego, mailowego potwierdzenia terminu. Brak potwierdzenia w ci&#261;gu 24 godzin roboczych oznacza, &#380;e Zlecenie nie zosta&#322;o przyj&#281;te.</p>
        <p>3.4. Us&#322;ugodawca mo&#380;e odm&#243;wi&#263; realizacji Zlecenia w przypadku nupe&#322;nych danych lub braku technicznych mo&#380;liwo&#347;ci bezpiecznego transportu (np. nietyp owa konstrukcja roweru).</p>

        <h2>4. Terminy i przebieg us&#322;ugi</h2>
        <p>4.1. <strong>Transport:</strong> Odbi&#243;r i dostawa odbywaj&#261; si&#281; w dni robocze, standardowo w godzinach 18:00&#8211;22:00.</p>
        <p>4.2. <strong>Relacja z serwisem:</strong> Us&#322;ugodawca pe&#322;ni wy&#322;&#261;cznie rol&#281; przewo&#378;nika. Klient samodzielnie ustala zakres i termin naprawy z serwisem oraz dokonuje bezpo&#347;redniej p&#322;atno&#347;ci za us&#322;ugi serwisowe.</p>
        <p>4.3. <strong>Op&#243;&#378;nienia:</strong> Us&#322;ugodawca nie odpowiada za op&#243;&#378;nienia wynikaj&#261;ce z czasu pracy serwisu. Rower jest odwo&#380;ony do Klienta po potwierdzeniu przez Klienta/Serwis gotowo&#347;ci roweru do odbioru.</p>

        <h2>5. Obowi&#261;zki i odpowiedzialno&#347;&#263;</h2>
        <p>5.1. <strong>Przygotowanie roweru:</strong> Klient zobowi&#261;zany jest do zdj&#281;cia z roweru akcesori&#243;w &#322;atwo demontowalnych (np. liczniki, o&#347;wietlenie, bidony, sakwy, foteliki). Us&#322;ugodawca nie odpowiada za te elementy, je&#347;li nie zosta&#322;y zdemontowane.</p>
        <p>5.2. <strong>Czysto&#347;&#263;:</strong> Us&#322;ugodawca przyjmuje do transportu rowery zabrudzone (np. b&#322;otem), jednak w takim przypadku Klient akceptuje, &#380;e dok&#322;adna ocena stanu wizualnego ramy w momencie odbioru mo&#380;e by&#263; utrudniona, co wp&#322;ywa na ewentualne rozpatrywanie reklamacji dotycz&#261;cych zaryso wa&#324; powierzchniowych.</p>
        <p>5.3. <strong>Ubezpieczenie:</strong> Us&#322;ugodawca posiada polis&#281; ubezpieczeniow&#261; OC. Odpowiedzialno&#347;&#263; za rower ograniczona jest do kwoty 8&#160;000&#160;z&#322;, chyba &#380;e przy sk&#322;adaniu Zlecenia zadeklarowano i zaakceptowano wy&#380;sz&#261; warto&#347;&#263;.</p>
        <p>5.4. <strong>Wady ukryte:</strong> Us&#322;ugodawca nie odpowiada za ukryte wady techniczne roweru ani uszkodzenia wynikaj&#261;ce z wadliwego serwisu.</p>

        <h2>6. Cennik i p&#322;atno&#347;ci</h2>
        <p>6.1. Koszt transportu ustalany jest indywidualnie przy sk&#322;adaniu Zlecenia.</p>
        <p>6.2. <strong>Formy p&#322;atno&#347;ci:</strong> BLIK lub got&#243;wka przy odbiorze roweru.</p>
        <p>6.3. Us&#322;ugodawca nie po&#347;redniczy w p&#322;atno&#347;ciach za serwis. Klient zobowi&#261;zany jest uregulowa&#263; nale&#380;no&#347;&#263; wobec serwisu przed odbiorem roweru przez Us&#322;ugodawc&#281;.</p>
        <p>6.4. Faktury bez VAT (rachunki) wystawiane s&#261; na &#380;yczenie Klienta.</p>

        <h2>7. Odst&#261;pienie od Zlecenia</h2>
        <p>7.1. Klient mo&#380;e anulowa&#263; Zlecenie bez op&#322;at do momentu pierwszego odbioru roweru.</p>
        <p>7.2. Je&#347;li us&#322;uga transportowa zosta&#322;a ju&#380; rozpocz&#281;ta (podjazd pod wskazany adres), Klient zobowi&#261;zany jest do pokrycia koszt&#243;w dojazdu.</p>
        <p>7.3. Klient przyjmuje do wiadomo&#347;ci, &#380;e po pe&#322;nym wykonaniu us&#322;ugi transportowej traci prawo do odst&#261;pienia od umowy.</p>

        <h2>8. Reklamacje</h2>
        <p>8.1. Reklamacje dotycz&#261;ce uszkodze&#324; mechanicznych powsta&#322;ych w transporcie nale&#380;y zg&#322;osi&#263; niezw&#322;ocznie w momencie odbioru roweru od Us&#322;ugodawcy.</p>
        <p>8.2. Pozosta&#322;e reklamacje nale&#380;y kierowa&#263; na e-mail: <a href="mailto:cyclopick@gmail.com">cyclopick{{'@'}}gmail.com</a> w ci&#261;gu 14 dni.</p>
        <p>8.3. Rozpatrzenie reklamacji nast&#281;puje w ci&#261;gu 14 dni roboczych.</p>

        <h2>9. Magazynowanie</h2>
        <p>9.1. W przypadku nieodebrania roweru w ustalonym terminie, od dnia nast&#281;pnego naliczana jest op&#322;ata <strong>10&#160;z&#322; za ka&#380;d&#261; rozpocz&#281;t&#261; dob&#281;</strong>.</p>
        <p>9.2. Po 60 dniach bezskutecznych pr&#243;b kontaktu, rower zostaje przekazany do zewn&#281;trznego magazynu na koszt i ryzyko Klienta.</p>

        <h2>10. Postanowienia ko&#324;cowe</h2>
        <p>10.1. Us&#322;ugodawca zastrzega sobie prawo do zmiany Regulaminu. Zmiany obowi&#261;zuj&#261; od momentu publikacji na stronie.</p>
        <p>10.2. W sprawach nieuregulowanych stosuje si&#281; przepisy Kodeksu cywilnego oraz ustawy o prawach konsumenta.</p>
      </section>
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
      margin-top: 30px;
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

    .terms-content {
      background-color: white;
      padding: 40px;
      border-radius: 8px;
      box-shadow: 0 2px 10px rgba(0,0,0,0.1);
      font-size: 1rem;
      color: #333;
      line-height: 1.7;
    }

    .effective-date {
      color: #6c757d;
      font-style: italic;
      margin-bottom: 20px;
    }

    ul {
      padding-left: 20px;
      margin-top: 8px;
      margin-bottom: 10px;
    }

    li {
      margin-bottom: 6px;
    }

    a {
      color: #28a745;
      text-decoration: none;
    }

    a:hover {
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
