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
        <h1>Regulamin dla Serwisów Rowerowych</h1>
        <button class="back-btn" (click)="goBack()">← Powrót</button>
      </div>
      <div class="terms-content">
        <div class="terms-text">
          <h2>1. Postanowienia ogólne</h2>
          <p>1.1. Niniejszy Regulamin określa zasady korzystania z platformy <strong>CycloPick.pl</strong> umożliwiającej serwisom rowerowym prezentację oferty oraz kontakt z użytkownikami.</p>
          <p>1.2. Operatorem i administratorem platformy jest <strong>Dominik Lach</strong>, prowadzący działalność jako osoba fizyczna.</p>
          <p>1.3. Kontakt z administratorem:</p>
          <ul>
            <li>e-mail: <a href="mailto:cyclopick@gmail.com">cyclopick{{'@'}}gmail.com</a></li>
            <li>telefon: 667 757 920</li>
          </ul>
          <p>1.4. Regulamin dostępny jest nieodpłatnie na stronie <a href="https://www.cyclopick.pl">cyclopick.pl</a>.</p>

          <h2>2. Definicje</h2>
          <ul>
            <li><strong>Platforma / CycloPick.pl</strong> – serwis internetowy umożliwiający kontakt między użytkownikami a serwisami rowerowymi.</li>
            <li><strong>Administrator</strong> – Dominik Lach, właściciel platformy.</li>
            <li><strong>Serwis</strong> – przedsiębiorca lub osoba fizyczna prowadząca działalność gospodarczą, która rejestruje się na Platformie.</li>
            <li><strong>Użytkownik</strong> – osoba fizyczna korzystająca z Platformy w celu znalezienia serwisu.</li>
            <li><strong>Konto</strong> – panel Serwisu umożliwiający zarządzanie ofertami i danymi.</li>
          </ul>

          <h2>3. Rejestracja i korzystanie z Platformy</h2>
          <ul>
            <li>Serwis dokonuje rejestracji, podając prawdziwe i aktualne dane.</li>
            <li>Administrator może odmówić rejestracji bez podania przyczyny.</li>
            <li>Serwis jest zobowiązany do aktualizacji swoich danych w razie zmian.</li>
            <li>Konto Serwisu nie może być udostępniane osobom trzecim.</li>
          </ul>

          <h2>4. Zasady publikowania treści</h2>
          <ul>
            <li>Serwis może publikować opisy usług, zdjęcia i cenniki.</li>
            <li>Zabrania się publikowania treści wulgarnych, obraźliwych, niezgodnych z prawem lub naruszających prawa osób trzecich.</li>
            <li>Serwis ponosi pełną odpowiedzialność za publikowane materiały.</li>
            <li>Administrator nie ponosi odpowiedzialności za treści zamieszczone przez Serwisy.</li>
          </ul>

          <h2>5. Prawa i obowiązki Administratora</h2>
          <ul>
            <li>Administrator może moderować, edytować lub usuwać treści naruszające Regulamin lub prawo.</li>
            <li>Administrator może czasowo ograniczyć dostęp do konta lub <strong>usunąć konto bez podania przyczyny</strong>.</li>
            <li>Administrator nie odpowiada za jakość usług oferowanych przez Serwisy.</li>
            <li>Administrator dokłada starań, by Platforma działała prawidłowo, ale nie gwarantuje nieprzerwanego dostępu.</li>
          </ul>

          <h2>6. Zasady rozwiązania współpracy</h2>
          <ul>
            <li>Serwis może w dowolnym momencie usunąć swoje konto poprzez kontakt z administratorem.</li>
            <li>Administrator może usunąć konto Serwisu bez podania przyczyny.</li>
            <li>Usunięcie konta oznacza zakończenie współpracy i usunięcie danych Serwisu z Platformy.</li>
          </ul>

          <h2>7. Odpowiedzialność Serwisu</h2>
          <ul>
            <li>Serwis ponosi odpowiedzialność za prawdziwość i rzetelność danych.</li>
            <li>Serwis zobowiązuje się świadczyć swoje usługi zgodnie z prawem i zasadami uczciwej konkurencji.</li>
            <li>Serwis zobowiązuje się zwolnić Administratora z odpowiedzialności w razie roszczeń osób trzecich wynikających z jego działań.</li>
          </ul>

          <h2>8. Dane osobowe i kontakt</h2>
          <ul>
            <li>Administratorem danych jest Dominik Lach.</li>
            <li>Dane przetwarzane są w celu obsługi konta i świadczenia usług zgodnie z Polityką Prywatności.</li>
            <li>Kontakt: <a href="mailto:cyclopick@gmail.com">cyclopick{{'@'}}gmail.com</a> | tel.: 667 757 920</li>
          </ul>

          <h2>9. Zmiany Regulaminu</h2>
          <ul>
            <li>Administrator może wprowadzać zmiany w Regulaminie w dowolnym momencie.</li>
            <li>O zmianach informuje poprzez publikację nowej wersji na stronie internetowej.</li>
            <li>Dalsze korzystanie z Platformy oznacza akceptację zmian.</li>
          </ul>

          <h2>10. Postanowienia końcowe</h2>
          <ul>
            <li>W sprawach nieuregulowanych stosuje się przepisy prawa polskiego.</li>
            <li>Spory rozstrzygane będą przez sąd właściwy dla siedziby Administratora.</li>
            <li>Regulamin obowiązuje od dnia publikacji na stronie <a href="https://www.cyclopick.pl">cyclopick.pl</a>.</li>
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
