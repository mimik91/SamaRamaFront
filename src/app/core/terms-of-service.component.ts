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
        <h1>REGULAMIN &Sacute;WIADCZENIA US&Lstrok;UG TRANSPORTOWYCH</h1>
        <button class="back-btn" (click)="goBack()">&#8592; Powr&#243;t</button>
      </header>

      <section class="terms-content">

        <h2>1. Postanowienia og&oacute;lne</h2>
        <p>1.1. Niniejszy regulamin (&bdquo;Regulamin&rdquo;) okre&sacute;la zasady &sacute;wiadczenia us&lstrok;ug transportu rowerowego przez sp&oacute;&lstrok;k&#281; CYCLOPICK PROSTA SP&Oacute;&Lstrok;KA AKCYJNA z siedzib&#261; w Krakowie, wpisan&#261; do rejestru przedsi&#281;biorc&oacute;w Krajowego Rejestru S&#261;dowego pod numerem KRS: 0001226112 (S&#261;d Rejonowy dla Krakowa-&Sacute;r&oacute;dm ie&sacute;cia w Krakowie, XI Wydzia&lstrok; Gospodarczy KRS), o kapitale akcyjnym w pe&lstrok;ni op&lstrok;aconym, posiadaj&#261;c&#261; NIP: 5130309678 oraz REGON: 544080816 (&bdquo;Us&lstrok;ugodawca&rdquo;).</p>
        <p>1.2. Kontakt z Us&lstrok;ugodawc&#261;:</p>
        <ul>
          <li>e-mail: <a href="mailto:cyclopick@gmail.com">cyclopick{{'@'}}gmail.com</a></li>
          <li>tel.: 667 757 920</li>
        </ul>
        <p>1.3. Regulamin dost&#281;pny jest nieodp&lstrok;atnie na stronie <a href="https://cyclopick.pl" target="_blank" rel="noopener">cyclopick.pl</a>.</p>
        <p>1.4. Klient o&sacute;wiadcza, &zdot;e rower przekazany do transportu jest wolny od wad prawnych, stanowi jego w&lstrok;asno&sacute;&cacute; lub Klient posiada tytu&lstrok; prawny do dysponowania nim.</p>

        <h2>2. Definicje</h2>
        <ul>
          <li><strong>Zlecenie</strong> &ndash; umowa o &sacute;wiadczenie us&lstrok;ugi transportowej zawarta mi&#281;dzy Klientem a Us&lstrok;ugodawc&#261;.</li>
          <li><strong>Klient</strong> &ndash; osoba fizyczna, osoba prawna lub jednostka organizacyjna korzystaj&#261;ca z us&lstrok;ug Us&lstrok;ugodawcy.</li>
          <li><strong>Us&lstrok;uga transportowa</strong> &ndash; prze w&oacute;z roweru od Klienta do wskazanego serwisu i/lub z powrotem.</li>
          <li><strong>Magazynowanie</strong> &ndash; przechowywanie roweru w przypadku braku mo&zdot;liwo&sacute;ci jego terminowego zwrotu Klientowi z przyczyn le&zdot;&#261;cych po stronie Klienta.</li>
        </ul>

        <h2>3. Zak&lstrok;adanie i realizacja Zlece&#324;</h2>
        <p>3.1. Zlecenia przyjmowane s&#261; za po&sacute;rednictwem formularza na stronie internetowej, poczty e-mail lub telefonicznie.</p>
        <p>3.2. Po przes&lstrok;aniu formularza Klient otrzymuje automatyczne potwierdzenie wp&lstrok;yni&#281;cia zg&lstrok;oszenia.</p>
        <p>3.3. Zlecenie uznaje si&#281; za przyj&#281;te do realizacji dopiero po wys&lstrok;aniu przez Us&lstrok;ugodawc&#281; indywidualnego, mailowego potwierdzenia terminu. Brak potwierdzenia w ci&#261;gu 24 godzin roboczych oznacza, &zdot;e Zlecenie nie zosta&lstrok;o przyj&#281;te.</p>
        <p>3.4. Us&lstrok;ugodawca mo&zdot;e odm&oacute;wi&cacute; realizacji Zlecenia w przypadku niepe&lstrok;nych danych lub braku technicznych mo&zdot;liwo&sacute;ci bezpiecznego transportu (np. nietypowa konstrukcja roweru, przekroczenie dopuszczalnej masy).</p>

        <h2>4. Terminy i przebieg us&lstrok;ugi</h2>
        <p>4.1. <strong>Transport:</strong> Odbi&oacute;r i dostawa odbywaj&#261; si&#281; w dni robocze, standardowo w godzinach 18:00&ndash;22:00, chyba &zdot;e strony ustal&#261; inaczej.</p>
        <p>4.2. <strong>Relacja z serwisem:</strong> Us&lstrok;ugodawca pe&lstrok;ni wy&lstrok;&#261;cznie rol&#281; przewo&zacute;nika. Klient samodzielnie ustala zakres i termin naprawy z serwisem oraz dokonuje bezpo&sacute;redniej p&lstrok;atno&sacute;ci za us&lstrok;ugi serwisowe na rzecz podmiotu prowadz&#261;cego serwis.</p>
        <p>4.3. <strong>Op&oacute;&zacute;nienia:</strong> Us&lstrok;ugodawca nie odpowiada za op&oacute;&zacute;nienia wynikaj&#261;ce z czasu pracy serwisu. Rower jest odwo&zdot;ony do Klienta po potwierdzeniu przez Klienta lub Serwis gotowo&sacute;ci roweru do odbioru.</p>

        <h2>5. Obowi&#261;zki i odpowiedzialno&sacute;&cacute;</h2>
        <p>5.1. <strong>Przygotowanie roweru:</strong> Klient zobowi&#261;zany jest do zdj&#281;cia z roweru akcesori&oacute;w &lstrok;atwo demontowalnych (np. liczniki, o&sacute;wietlenie, bidony, sakwy, foteliki dzieci&#281;ce). Us&lstrok;ugodawca nie ponosi odpowiedzialno&sacute;ci za te elementy, je&sacute;li nie zosta&lstrok;y one zdemontowane przed przekazaniem roweru.</p>
        <p>5.2. <strong>Czysto&sacute;&cacute;:</strong> Us&lstrok;ugodawca przyjmuje do transportu rowery zabrudzone (np. b&lstrok;otem), jednak w takim przypadku Klient akceptuje, &zdot;e dok&lstrok;adna ocena stanu wizualnego ramy w momencie odbioru mo&zdot;e by&cacute; utrudniona, co wp&lstrok;ywa na ewentualne rozpatrywanie p&oacute;&zacute;niejszych reklamacji dotycz&#261;cych zarysowa&#324; powierzchniowych.</p>
        <p>5.3. <strong>Ubezpieczenie:</strong> Us&lstrok;ugodawca posiada polis&#281; ubezpieczeniow&#261; odpowiedzialno&sacute;ci cywilnej (OC). Odpowiedzialno&sacute;&cacute; za rower ograniczona jest do kwoty 8&#160;000&#160;z&lstrok;, chyba &zdot;e przy sk&lstrok;adaniu Zlecenia zadeklarowano i zaakceptowano pisemnie wy&zdot;sz&#261; warto&sacute;&cacute; mienia.</p>
        <p>5.4. <strong>Wady ukryte:</strong> Us&lstrok;ugodawca nie odpowiada za ukryte wady techniczne roweru ani uszkodzenia wynikaj&#261;ce z wadliwego wykonania us&lstrok;ugi przez serwis.</p>

        <h2>6. Cennik i p&lstrok;atno&sacute;ci</h2>
        <p>6.1. Koszt transportu ustalany jest ka&zdot;dorazowo indywidualnie przy sk&lstrok;adaniu Zlecenia, w oparciu o aktualny cennik.</p>
        <p>6.2. <strong>Formy p&lstrok;atno&sacute;ci:</strong> Przelew na telefon (BLIK) lub got&oacute;wka przy odbiorze roweru.</p>
        <p>6.3. Us&lstrok;ugodawca nie po&sacute;redniczy w p&lstrok;atno&sacute;ciach za serwis. Klient zobowi&#261;zany jest uregulowa&cacute; nale&zdot;no&sacute;&cacute; wobec serwisu przed odbiorem roweru przez Us&lstrok;ugodawc&#281;.</p>
        <p>6.4. Us&lstrok;ugodawca wystawia faktury zgodnie z obowi&#261;zuj&#261;cymi przepisami prawa.</p>

        <h2>7. Odst&#261;pienie od Zlecenia</h2>
        <p>7.1. Klient b&#281;d&#261;cy konsumentem mo&zdot;e anulowa&cacute; Zlecenie bez op&lstrok;at do momentu podj&#281;cia przez Us&lstrok;ugodawc&#281; czynno&sacute;ci zmierzaj&#261;cych do wykonania us&lstrok;ugi (pierwszy odbi&oacute;r roweru).</p>
        <p>7.2. Je&sacute;li us&lstrok;uga transportowa zosta&lstrok;a ju&zdot; rozpocz&#281;ta (np. podjazd pod wskazany adres), Klient zobowi&#261;zany jest do pokrycia poniesionych przez Us&lstrok;ugodawc&#281; koszt&oacute;w (koszt dojazdu).</p>
        <p>7.3. Klient przyjmuje do wiadomo&sacute;ci, &zdot;e po pe&lstrok;nym wykonaniu us&lstrok;ugi transportowej traci prawo do odst&#261;pienia od umowy na podstawie art. 38 ustawy o prawach konsumenta.</p>

        <h2>8. Reklamacje</h2>
        <p>8.1. Reklamacje dotycz&#261;ce widocznych uszkodze&#324; mechanicznych powsta&lstrok;ych w transporcie nale&zdot;y zg&lstrok;osi&cacute; niezw&lstrok;ocznie w momencie odbioru roweru od Us&lstrok;ugodawcy.</p>
        <p>8.2. Pozosta&lstrok;e reklamacje nale&zdot;y kierowa&cacute; na adres e-mail: <a href="mailto:cyclopick@gmail.com">cyclopick{{'@'}}gmail.com</a> w ci&#261;gu 14 dni od daty zdarzenia.</p>
        <p>8.3. Rozpatrzenie reklamacji nast&#281;puje w ci&#261;gu 14 dni od dnia jej otrzymania.</p>

        <h2>9. Magazynowanie</h2>
        <p>9.1. W przypadku nieodebrania roweru przez Klienta w ustalonym terminie z przyczyn le&zdot;&#261;cych po stronie Klienta, od dnia nast&#281;pnego naliczana jest op&lstrok;ata za magazynowanie w wysoko&sacute;ci <strong>10&#160;z&lstrok; za ka&zdot;d&#261; rozpocz&#281;t&#261; dob&#281;</strong>.</p>
        <p>9.2. Po 60 dniach bezskutecznych pr&oacute;b kontaktu z Klientem, rower mo&zdot;e zosta&cacute; przekazany do zewn&#281;trznego magazynu na koszt i ryzyko Klienta.</p>

        <h2>10. Postanowienia ko&#324;cowe</h2>
        <p>10.1. Us&lstrok;ugodawca zastrzega sobie prawo do zmiany Regulaminu. Zmiany obowi&#261;zuj&#261; od momentu ich publikacji na stronie internetowej i nie dotycz&#261; zlece&#324; w trakcie realizacji.</p>
        <p>10.2. W sprawach nieuregulowanych niniejszym Regulaminem stosuje si&#281; przepisy Kodeksu cywilnego, ustawy o prawach konsumenta oraz inne powszechnie obowi&#261;zuj&#261;ce przepisy prawa polskiego.</p>
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
