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
        <h1>Polityka Prywatności</h1>
        <button class="back-btn" (click)="goBack()">← Powrót</button>
      </header>
      
      <section class="privacy-content">
        <h2>I. Postanowienia ogólne</h2>
        <p>Polityka prywatności określa, jak zbierane, przetwarzane i przechowywane są dane osobowe Użytkowników niezbędne do świadczenia usług drogą elektroniczną za pośrednictwem serwisu internetowego www.cyclopick.pl (dalej: Serwis).</p>
        <p>Serwis zbiera wyłącznie dane osobowe niezbędne do świadczenia i rozwoju usług w nim oferowanych.</p>
        <p>Dane osobowe zbierane za pośrednictwem Serwisu są przetwarzane zgodnie z Rozporządzeniem Parlamentu Europejskiego i Rady (UE) 2016/679 z dnia 27 kwietnia 2016 r. w sprawie ochrony osób fizycznych w związku z przetwarzaniem danych osobowych i w sprawie swobodnego przepływu takich danych oraz uchylenia dyrektywy 95/46/WE (ogólne rozporządzenie o ochronie danych, dalej RODO) oraz ustawą o ochronie danych osobowych z dnia 10 maja 2018 r.</p>

        <h2>II. Administrator danych</h2>
        <p>Administratorem danych osobowych zbieranych poprzez Serwis jest Dominik Lach, adres: Bosutów ul. Krakowska 13, adres poczty elektronicznej: cyclopick{{'@'}}gmail.com (dalej: Administrator).</p>

        <h2>III. Cel zbierania danych osobowych</h2>
        <p>Dane osobowe wykorzystywane są w celu:</p>
        <ul>
          <li>Rejestracji konta i weryfikacji tożsamości Użytkownika,</li>
          <li>Umożliwienia logowania do Serwisu,</li>
          <li>Realizacji umowy dotyczącej usług i e-usług,</li>
          <li>Komunikacji z Użytkownikiem (livechat, formularz kontaktowy itp.),</li>
          <li>Wysyłki newslettera (po wyrażeniu zgody Użytkownika na jego otrzymywanie),</li>
          <li>Prowadzenia systemu komentarzy,</li>
          <li>Świadczenia usług społecznościowych,</li>
          <li>Promocji oferty Administratora,</li>
          <li>Marketingu, remarketingu, afiliacji,</li>
          <li>Personalizacji Serwisu dla Użytkowników,</li>
          <li>Działań analitycznych i statystycznych,</li>
          <li>Windykacji należności,</li>
          <li>Ustalenia i dochodzenia roszczeń albo obrony przed nimi.</li>
        </ul>
        <p>Podanie danych jest dobrowolne, ale niezbędne do zawarcia umowy albo skorzystania z innych funkcjonalności Serwisu.</p>

        <h2>IV. Rodzaj przetwarzanych danych osobowych</h2>
        <p>Administrator może przetwarzać dane osobowe Użytkownika: imię i nazwisko, data urodzenia, adres zamieszkania, adres e-mail, numer telefonu, NIP.</p>

        <h2>V. Okres przetwarzania danych osobowych</h2>
        <p>Dane osobowe Użytkowników będą przetwarzane przez okres:</p>
        <ul>
          <li>Gdy podstawą przetwarzania danych jest wykonanie umowy – do momentu przedawnienia roszczeń po jej wykonaniu,</li>
          <li>Gdy podstawą przetwarzania danych jest zgoda – do momentu jej odwołania, a po odwołaniu zgody do przedawnienia roszczeń.</li>
        </ul>
        <p>W obu przypadkach termin przedawnienia wynosi 6 lat, a dla roszczeń o świadczenia okresowe i roszczeń dotyczących prowadzenia działalności gospodarczej – 3 lata (jeśli przepis szczególny nie stanowi inaczej).</p>

        <h2>VI. Udostępnianie danych osobowych</h2>
        <p>Dane osobowe Użytkowników mogą być przekazywane: podmiotom powiązanym z Administratorem, jego podwykonawcom, podmiotom współpracującym z Administratorem np. firmom obsługującym e-płatności, firmom świadczącym usługi kurierskie/pocztowe, kancelariom prawnym.</p>
        <p>Dane osobowe Użytkowników nie będą/będą przekazywane poza teren Europejskiego Obszaru Gospodarczego (EOG).</p>

        <h2>VII. Prawa Użytkowników</h2>
        <p>Użytkownik Serwisu ma prawo do: dostępu do treści swoich danych osobowych, ich sprostowania, usunięcia, ograniczenia przetwarzania, przenoszenia, wniesienia sprzeciwu wobec przetwarzania, cofnięcia zgody w każdej chwili (co nie ma wpływu na zgodność z prawem przetwarzania dokonanego w oparciu o zgodę przed jej cofnięciem).</p>
        <p>Zgłoszenie o wystąpieniu przez Użytkownika z uprawnieniem wynikającym z wymienionych praw należy przesłać na adres cyclopick{{'@'}}gmail.com.</p>
        <p>Administrator spełnia lub odmawia spełnienia żądania niezwłocznie – maksymalnie w ciągu miesiąca od jego otrzymania.</p>
        <p>Użytkownik ma prawo złożyć skargę do Prezesa Urzędu Ochrony Danych Osobowych, jeśli uzna, że przetwarzanie narusza jego prawa i wolności (RODO).</p>

        <h2>VIII. Pliki cookies</h2>
        <p>Serwis zbiera informacje za pomocą plików cookies – sesyjnych, stałych i podmiotów zewnętrznych.</p>
        <p>Zbieranie plików cookies wspiera poprawne świadczenie usług w Serwisie i służy celom statystycznym.</p>
        <p>Użytkownik może określić zakres dostępu plików cookies do swojego urządzenia w ustawieniach przeglądarki.</p>

        <h2>IX. Zautomatyzowane podejmowanie decyzji i profilowanie</h2>
        <p>Dane Użytkowników nie mogą być przetwarzane w zautomatyzowany sposób tak, że na skutek tego mogłyby zapaść wobec nich jakiekolwiek decyzje.</p>
        <p>Dane Użytkowników mogą być profilowane celem dostosowania treści i personalizacji oferty po wyrażeniu przez nich zgody.</p>

        <h2>X. Postanowienia końcowe</h2>
        <p>Administrator ma prawo do wprowadzenia zmian w Polityce prywatności, przy czym prawa Użytkowników nie zostaną ograniczone.</p>
        <p>Informacja o wprowadzonych zmianach pojawi się w formie komunikatu dostępnego w Serwisie.</p>
        <p>W sprawach nieuregulowanych w niniejszej Polityce prywatności obowiązują przepisy RODO i przepisy prawa polskiego.</p>
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

    .placeholder-text {
      font-size: 1rem;
      color: #6c757d;
      line-height: 1.5;
      text-align: left;
      margin: 0;
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