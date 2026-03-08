import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';

@Component({
  selector: 'app-terms-of-service-workshops',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="terms-container">
      <div class="terms-header">
        <h1>REGULAMIN PLATFORMY CYCLOPICK.PL</h1>
        <button class="back-btn" (click)="goBack()">&#8592; Powr&oacute;t</button>
      </div>
      <div class="terms-content">
        <div class="terms-text">
          <h2>1. Postanowienia og&oacute;lne</h2>
          <p>1.1. Niniejszy Regulamin okre&sacute;la zasady korzystania z platformy internetowej dost&#281;pnej pod adresem CycloPick.pl (&bdquo;Platforma&rdquo;).</p>
          <p>1.2. W&lstrok;a&sacute;cicielem i administratorem Platformy jest CYCLOPICK PROSTA SP&Oacute;&Lstrok;KA AKCYJNA z siedzib&#261; w Krakowie, KRS: 0001226112, NIP: 5130309678, REGON: 544080816 (&bdquo;Us&lstrok;ugodawca&rdquo;).</p>
          <p>1.3. Us&lstrok;ugodawca &sacute;wiadczy us&lstrok;ugi drog&#261; elektroniczn&#261; polegaj&#261;ce w szczeg&oacute;lno&sacute;ci na:</p>
          <ul>
            <li>udost&#281;pnianiu Serwisom narz&#281;dzi do tworzenia wiz yt&oacute;wek online,</li>
            <li>udost&#281;pnianiu aplikacji webowej do zarz&#261;dzania naprawami,</li>
            <li>umo&zdot;liwianiu U&zdot;ytkownikom wyszukiwania Serwis&oacute;w oraz dokonywania rezerwacji wizyt,</li>
            <li>prowadzeniu historii serwisowej rower&oacute;w.</li>
          </ul>
          <p>1.4. Wymagania techniczne: Do korzystania z Platformy niezb&#281;dne jest urz&#261;dzenie z dost&#281;pem do Internetu, aktualna wersja przegl&#261;darki internetowej (np. Chrome, Firefox, Safari) oraz aktywny adres e-mail.</p>
          <p>1.5. Us&lstrok;ugodawca nie jest stron&#261; umowy o wykonanie us&lstrok;ugi serwisowej, kt&oacute;ra zawierana jest bezpo&sacute;rednio pomi&#281;dzy U&zdot;ytkownikiem a Serwisem.</p>
          <p>1.6. Korzystanie z Platformy przez U&zdot;ytkownik&oacute;w i Serwisy jest obecnie bezp&lstrok;atne. Us&lstrok;ugodawca zastrzega sobie prawo do wprowadzenia op&lstrok;at za wybrane funkcjonalno&sacute;ci w przysz&lstrok;o&sacute;ci, o czym poinformuje z 14-dniowym wyprzedzeniem.</p>

          <h2>2. Definicje</h2>
          <ul>
            <li><strong>Platforma</strong> &ndash; serwis internetowy i aplikacja webowa dost&#281;pna pod adresem CycloPick.pl.</li>
            <li><strong>Serwis</strong> &ndash; przedsi&#281;biorca lub podmiot oferuj&#261;cy us&lstrok;ugi naprawy rower&oacute;w lub podobnych pojazd&oacute;w (np. hulajnogi, rowery elektryczne).</li>
            <li><strong>U&zdot;ytkownik</strong> &ndash; osoba fizyczna korzystaj&#261;ca z Platformy w celu wyszukania Serwisu lub dokonania rezerwacji.</li>
            <li><strong>Konto</strong> &ndash; indywidualny profil u&zdot;ytkownika w Platformie.</li>
            <li><strong>Wiz yt&oacute;wka</strong> &ndash; publiczna strona Serwisu w Platformie.</li>
          </ul>

          <h2>3. Konto i korzystanie z Platformy</h2>
          <p>3.1. U&zdot;ytkownik mo&zdot;e korzysta&cacute; z Platformy po utworzeniu Konta lub bez rejestracji, poprzez formularz rezerwacji.</p>
          <p>3.2. Serwis korzysta z Platformy poprzez utworzenie Konta Serwisu.</p>
          <p>3.3. U&zdot;ytkownik oraz Serwis mog&#261; w ka&zdot;dej chwili zrezygnowa&cacute; z us&lstrok;ug i usun&#261;&cacute; Konto poprzez panel ustawie&#324; lub kontakt e-mail: <a href="mailto:cyclopick@gmail.com">cyclopick{{'@'}}gmail.com</a>.</p>
          <p>3.4. Zabronione jest publikowanie tre&sacute;ci niezgodnych z prawem, naruszanie praw autorskich oraz dzia&lstrok;ania zak&lstrok;&oacute;caj&#261;ce prac&#281; Platformy.</p>

          <h2>4. Wiz yt&oacute;wki Serwis&oacute;w</h2>
          <p>4.1. Serwis samodzielnie redaguje swoj&#261; Wiz yt&oacute;wk&#281; i o&sacute;wiadcza, &zdot;e posiada prawa do wszystkich publikowanych materia&lstrok;&oacute;w (zdj&#281;&cacute;, opis&oacute;w).</p>
          <p>4.2. Serwis udziela Us&lstrok;ugodawcy nieodp&lstrok;atnej licencji na publikacj&#281; tych materia&lstrok;&oacute;w w celach funkcjonowania i promocji Platformy.</p>
          <p>4.3. <strong>Odpowiedzialno&sacute;&cacute;:</strong> W przypadku roszcze&#324; os&oacute;b trzecich (np. za naruszenie praw autorskich do zdj&#281;&cacute;), Serwis zobowi&#261;zuje si&#281; zwolni&cacute; Us&lstrok;ugodawc&#281; z odpowiedzialno&sacute;ci i pokry&cacute; wszelkie koszty z tym zwi&#261;zane.</p>

          <h2>5. Rezerwacje wizyt</h2>
          <p>5.1. Platforma umo&zdot;liwia rezerwacj&#281; termin&oacute;w, o czym Serwis jest powiadamiany (e-mail/SMS).</p>
          <p>5.2. Serwis ma prawo zaakceptowa&cacute; lub odrzuci&cacute; rezerwacj&#281;.</p>
          <p>5.3. Us&lstrok;ugodawca nie po&sacute;redniczy w p&lstrok;atno&sacute;ciach za naprawy. Warunki cenowe ustalane s&#261; bezpo&sacute;rednio mi&#281;dzy U&zdot;ytkownikiem a Serwisem.</p>

          <h2>6. Historia serwisowa roweru</h2>
          <p>6.1. Platforma umo&zdot;liwia prowadzenie historii napraw roweru (daty, zakres prac, dane pojazdu).</p>
          <p>6.2. <strong>Dost&#281;p do danych:</strong> Serwis ma dost&#281;p do historii napraw danego roweru wykonanych wy&lstrok;&#261;cznie przez ten konkretny Serwis.</p>
          <p>6.3. Us&lstrok;ugodawca zastrzega mo&zdot;liwo&sacute;&cacute; wprowadzenia w przysz&lstrok;o&sacute;ci funkcji udost&#281;pniania pe&lstrok;nej historii serwisowej roweru mi&#281;dzy r&oacute;&zdot;nymi Serwisami za wyra&zacute;n&#261; zgod&#261; U&zdot;ytkownika (w&lstrok;a&sacute;ciciela roweru).</p>

          <h2>7. Powiadomienia</h2>
          <p>7.1. Platforma wysy&lstrok;a powiadomienia e-mail lub SMS dotycz&#261;ce rezerwacji i zmian status&oacute;w wizyt.</p>
          <p>7.2. Powiadomienia te maj&#261; charakter techniczny i informacyjny niezb&#281;dny do realizacji us&lstrok;ugi.</p>

          <h2>8. Odpowiedzialno&sacute;&cacute; i Aplikacja Webowa</h2>
          <p>8.1. Us&lstrok;ugodawca udost&#281;pnia aplikacj&#281; w modelu &bdquo;as is&rdquo; (taka, jaka jest).</p>
          <p>8.2. <strong>Ograniczenie odpowiedzialno&sacute;ci:</strong> W relacjach z Serwisami (B2B), odpowiedzialno&sacute;&cacute; Us&lstrok;ugodawcy jest ograniczona do winy umy&sacute;lnej i nie obejmuje utraconych korzy&sacute;ci Serwisu (np. w wyniku awarii infrastruktury Heroku/Salesforce).</p>
          <p>8.3. Us&lstrok;ugodawca nie ponosi odpowiedzialno&sacute;ci za nienale&zdot;yte wykonanie naprawy przez Serwis.</p>

          <h2>9. Moderacja i blokowanie kont</h2>
          <p>9.1. Us&lstrok;ugodawca ma prawo zablokowa&cacute; Konto lub Wiz yt&oacute;wk&#281; w przypadku naruszenia Regulaminu lub powtarzaj&#261;cych si&#281; skarg na rzetelno&sacute;&cacute; Serwisu.</p>

          <h2>10. Dane osobowe (RODO)</h2>
          <p>10.1. Us&lstrok;ugodawca jest administratorem danych osobowych zarejestrowanych u&zdot;ytkownik&oacute;w.</p>
          <p>10.2. W zakresie danych klient&oacute;w wprowadzanych przez Serwis do aplikacji, Administratorem jest Serwis, a Us&lstrok;ugodawca dzia&lstrok;a jako Procesor (podmiot przetwarzaj&#261;cy) na podstawie Umowy Powierzenia Przetwarzania Danych (Za&lstrok;&#261;cznik nr 1).</p>
          <p>10.3. Szczeg&oacute;&lstrok;y znajduj&#261; si&#281; w Polityce Prywatno&sacute;ci.</p>

          <h2>11. Reklamacje i prawo odst&#261;pienia</h2>
          <p>11.1. Reklamacje dotycz&#261;ce Platformy: <a href="mailto:cyclopick@gmail.com">cyclopick{{'@'}}gmail.com</a>. Czas rozpatrzenia: 14 dni.</p>
          <p>11.2. U&zdot;ytkownik b&#281;d&#261;cy Konsumentem ma prawo odst&#261;pi&cacute; od umowy o &sacute;wiadczenie us&lstrok;ug drog&#261; elektroniczn&#261; (usun&#261;&cacute; konto) w terminie 14 dni od rejestracji bez podania przyczyny.</p>

          <h2>12. Postanowienia ko&#324;cowe</h2>
          <p>12.1. O zmianach Regulaminu u&zdot;ytkownicy zostan&#261; poinformowani z 14-dniowym wyprzedzeniem.</p>
          <p>12.2. Konsument mo&zdot;e skorzysta&cacute; z unijnej platformy ODR: <a href="http://ec.europa.eu/consumers/odr/" target="_blank" rel="noopener">ec.europa.eu/consumers/odr</a>.</p>
          <p>12.3. Spory z Serwisami (B2B) rozstrzyga s&#261;d w&lstrok;a&sacute;ciwy dla siedziby Us&lstrok;ugodawcy w Krakowie.</p>

          <hr class="section-divider">

          <h2 class="annex-title">ZA&Lstrok;&#260;CZNIK NR 1: UMOWA POWIERZENIA PRZETWARZANIA DANYCH OSOBOWYCH (DPA)</h2>
          <p>Zawarta pomi&#281;dzy CYCLOPICK PROSTA SP&Oacute;&Lstrok;KA AKCYJNA (dalej: Procesor) a podmiotem rejestruj&#261;cym konto Serwisu na Platformie (dalej: Administrator).</p>

          <h3>&sect;1. Przedmiot umowy</h3>
          <p>W zwi&#261;zku z korzystaniem przez Administratora z aplikacji webowej CycloPick, Administrator powierza Procesorowi przetwarzanie danych osobowych swoich klient&oacute;w (U&zdot;ytkownik&oacute;w serwisu rowerowego) na zasadach okre&sacute;lonych w niniejszej umowie oraz art. 28 RODO.</p>
          <p>Procesor zobowi&#261;zuje si&#281; przetwarza&cacute; dane wy&lstrok;&#261;cznie w celu &sacute;wiadczenia us&lstrok;ug drog&#261; elektroniczn&#261; (utrzymanie bazy danych, obs&lstrok;uga systemu rezerwacji, historia napraw).</p>

          <h3>&sect;2. Zakres i charakter danych</h3>
          <ul>
            <li><strong>Zakres danych:</strong> imiona, nazwiska, numery telefon&oacute;w, adresy e-mail, numery VIN/seryjne rower&oacute;w oraz historia wykonanych napraw.</li>
            <li><strong>Kategorie os&oacute;b:</strong> klienci ko&#324;cowi Administratora (w&lstrok;a&sacute;ciciele rower&oacute;w).</li>
            <li><strong>Czas trwania:</strong> Umowa obowi&#261;zuje przez czas trwania &sacute;wiadczenia us&lstrok;ugi i wygasa wraz z usuni&#281;ciem Konta Serwisu, z zastrze&zdot;eniem &sect;6.</li>
          </ul>

          <h3>&sect;3. Obowi&#261;zki Procesora</h3>
          <p>Procesor zobowi&#261;zuje si&#281; do:</p>
          <ul>
            <li>Przetwarzania danych osobowych wy&lstrok;&#261;cznie na udokumentowane polecenie Administratora (za kt&oacute;re uznaje si&#281; czynno&sacute;ci wykonywane przez Administratora wewn&#261;trz aplikacji).</li>
            <li>Zapewnienia, by osoby upowa&zdot;nione do przetwarzania danych zachowa&lstrok;y je w tajemnicy.</li>
            <li>Wdro&zdot;enia odpowiednich &sacute;rodk&oacute;w technicznych i organizacyjnych (szyfrowanie, backupy), aby zapewni&cacute; stopie&#324; bezpiecze&#324;stwa odpowiadaj&#261;cy ryzyku naruszenia praw os&oacute;b, kt&oacute;rych dane dotycz&#261;.</li>
            <li>Pomocy Administratorowi w wywi&#261;zywaniu si&#281; z obowi&#261;zku odpowiadania na &zdot;&#261;dania osoby, kt&oacute;rej dane dotycz&#261; (np. prawo do wgl&#261;du w histori&#281; napraw).</li>
          </ul>

          <h3>&sect;4. Podpowierzenie danych (Sub-processing)</h3>
          <p>Administrator wyra&zdot;a og&oacute;ln&#261; zgod&#281; na podpowierzenie danych przez Procesora innym podmiotom przetwarzaj&#261;cym w celu realizacji us&lstrok;ugi.</p>
          <p>Procesor korzysta z us&lstrok;ug nast&#281;puj&#261;cych podmiot&oacute;w (Sub-procesor&oacute;w):</p>
          <ul>
            <li><strong>Salesforce.com Inc. (Heroku)</strong> &ndash; w celu przechowywania danych na serwerach chmurowych.</li>
          </ul>
          <p>Procesor zapewnia, &zdot;e Sub-procesorzy stosuj&#261; standardy ochrony danych nie ni&zdot;sze ni&zdot; okre&sacute;lone w niniejszej umowie.</p>

          <h3>&sect;5. Odpowiedzialno&sacute;&cacute;</h3>
          <p>Administrator o&sacute;wiadcza, &zdot;e posiada podstaw&#281; prawn&#261; (np. zgoda klienta lub realizacja umowy) do przetwarzania danych swoich klient&oacute;w i wprowadzania ich do aplikacji CycloPick.</p>
          <p>Procesor odpowiada za szkody spowodowane przetwarzaniem wy&lstrok;&#261;cznie wtedy, gdy nie dope&lstrok;ni&lstrok; obowi&#261;zk&oacute;w na&lstrok;o&zdot;onych bezpo&sacute;rednio na procesor&oacute;w przez RODO lub dzia&lstrok;a&lstrok; poza instrukcjami Administratora.</p>

          <h3>&sect;6. Losy danych po zako&#324;czeniu umowy</h3>
          <p>Po usuni&#281;ciu Konta przez Administratora, Procesor ma obowi&#261;zek usun&#261;&cacute; dane osobowe klient&oacute;w Administratora, chyba &zdot;e:</p>
          <ul>
            <li>Klient ko&#324;cowy posiada r&oacute;wnie&zdot; w&lstrok;asne, niezale&zdot;ne Konto U&zdot;ytkownika na Platformie CycloPick &ndash; w takim przypadku Administratorem jego danych staje si&#281; Procesor na podstawie w&lstrok;asnego Regulaminu.</li>
            <li>Prawo Unii lub prawo krajowe nakazuje przechowywanie danych.</li>
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
    .version-note {
      color: #6c757d;
      font-style: italic;
      margin-bottom: 20px;
    }
    .section-divider {
      border: none;
      border-top: 2px solid #007bff;
      margin: 40px 0;
    }
    .annex-title {
      color: #333;
    }
    .terms-text h3 {
      margin-top: 20px;
      font-size: 1.15rem;
      color: #007bff;
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
export class TermsOfServiceWorkshopsComponent {
  constructor(private router: Router) {}

  goBack(): void {
    window.history.back();
  }
}
