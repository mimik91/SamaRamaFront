import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-pricing-cyclists',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="pricing-wrapper">
      <div class="pricing-container">

        <header class="pricing-header">
          <div class="pricing-header-icon emoji">🚲</div>
          <h1>CYCLOPICK &ndash; CENNIK I ZASADY WSPÓ&#321;PRACY<br>DLA ROWERZYSTÓW (KLIENCI INDYWIDUALNI)</h1>
          <p class="pricing-subtitle">Twoja logistyka serwisowa, przejrzysta i bez ukrytych kosztów.</p>
          <button class="back-btn" (click)="goBack()">&#8592; Powrót</button>
        </header>

        <section class="table-section">
          <h2 class="table-title">
            <span class="emoji">💰</span>
            CENNIK US&#321;UG TRANSPORTOWYCH (Kraków)
          </h2>

          <!-- Tabela desktop -->
          <div class="table-scroll">
            <table class="pricing-table">
              <thead>
                <tr>
                  <th class="col-service">Us&#322;uga</th>
                  <th class="col-promo">
                    <div class="promo-badge">OBECNA PROMOCJA<br><small class="emoji">🔥 do odwo&#322;ania</small></div>
                    <div class="col-sub">Serwisy Partnerskie (Kraków)</div>
                  </th>
                  <th class="col-standard">
                    <div>CENA STANDARDOWA</div>
                    <div class="col-sub">gdy promocja wyga&#347;a<br>Serwisy Partnerskie (Kraków)</div>
                  </th>
                  <th class="col-other">
                    <div>CENA STANDARDOWA</div>
                    <div class="col-sub">Pozosta&#322;e Serwisy<br>w Krakowie (Standard)</div>
                  </th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td class="service-name">
                    <strong>Odbiór i Zwrot Roweru</strong>
                    <span class="service-desc">Transport w obie strony</span>
                  </td>
                  <td class="price promo-price" data-label="Promocja (partnerskie)">
                    <span class="price-value">0 z&#322;</span>
                    <span class="fire-icon emoji">🔥</span>
                  </td>
                  <td class="price" data-label="Standard (partnerskie)">30 z&#322;</td>
                  <td class="price" data-label="Standard (inne)">60 z&#322;</td>
                </tr>
                <tr>
                  <td class="service-name">
                    <strong>Tylko Zwrot Roweru</strong>
                    <span class="service-desc">Gdy rower ju&#380; w serwisie</span>
                  </td>
                  <td class="price promo-price" data-label="Promocja (partnerskie)">
                    <span class="price-value">0 z&#322;</span>
                    <span class="fire-icon emoji">🔥</span>
                  </td>
                  <td class="price" data-label="Standard (partnerskie)">20 z&#322;</td>
                  <td class="price unavailable" data-label="Standard (inne)">Niedost&#281;pne</td>
                </tr>
                <tr>
                  <td class="service-name">
                    <strong>Dost&#281;p do Konta Klienta,<br>Rezerwacje &amp; Historia Serwisowa</strong>
                  </td>
                  <td class="price" data-label="Promocja (partnerskie)">0 z&#322;</td>
                  <td class="price" data-label="Standard (partnerskie)">0 z&#322;</td>
                  <td class="price" data-label="Standard (inne)">0 z&#322;</td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>

        <div class="info-grid">

          <div class="info-card guarantee-card">
            <div class="info-card-header">
              <span class="info-icon emoji">✅</span>
              <h3>Gwarancja Ceny Serwisowej</h3>
            </div>
            <p>Gwarantujemy, &#380;e ceny naprawy w aplikacji Cyclopick s&#261; identyczne z cenami stacjonarnymi w danym warsztacie.</p>
          </div>

          <div class="info-card">
            <div class="info-card-header">
              <span class="info-icon emoji">📍</span>
              <h3>Zasi&#281;g Odbioru</h3>
            </div>
            <p>Kraków, Batowice, Bibice, Bo&#322;etów, Bosutów, Dziekanowice, Micha&#322;owice, Raciborowice, W&#281;grzce, Zielonki.</p>
            <p class="info-note">Transport roweru realizowany bez wnoszenia.</p>
          </div>

          <div class="info-card">
            <div class="info-card-header">
              <span class="info-icon emoji">🕐</span>
              <h3>Godziny Realizacji</h3>
            </div>
            <p>Je&#378;dzimy od poniedzia&#322;ku do pi&#261;tku w godzinach <strong>18:00 &ndash; 22:00</strong>.</p>
          </div>

          <div class="info-card">
            <div class="info-card-header">
              <span class="info-icon emoji">🛡️</span>
              <h3>Pe&#322;ne Ubezpieczenie</h3>
            </div>
            <p>Ka&#380;dy rower ubezpieczony do kwoty <strong>20&nbsp;000 z&#322;</strong>.</p>
          </div>

          <div class="info-card">
            <div class="info-card-header">
              <span class="info-icon emoji">❌</span>
              <h3>Bezp&#322;atne Anulowanie</h3>
            </div>
            <p>Do godziny <strong>12:00</strong> w dniu transportu. Op&#322;ata nie podlega zwrotowi po tej godzinie.</p>
          </div>

        </div>

        <div class="promo-note">
          <span class="flag-icon emoji">📌</span>
          <p>
            <strong>Zasady Promocji:</strong> Cyclopick zastrzega sobie prawo do zako&#324;czenia promocji 0 z&#322; w dowolnym momencie,
            po czym obowi&#261;zywa&#263; b&#281;d&#261; ceny standardowe. Informacja o aktualnej cenie jest zawsze widoczna przed
            z&#322;o&#380;eniem zamówienia.
          </p>
        </div>

        <footer class="pricing-footer-brand">cyclopick.pl</footer>

      </div>
    </div>
  `,
  styles: [`
    /* ── EMOJI FONT FIX ── */
    .emoji {
      font-family: 'Segoe UI Emoji', 'Apple Color Emoji', 'Noto Color Emoji', 'Android Emoji', sans-serif;
    }

    .pricing-wrapper {
      min-height: 100vh;
      background: var(--color-gray-100, #f3f4f6);
      padding: 80px 16px 40px;
    }

    .pricing-container {
      max-width: 900px;
      margin: 0 auto;
    }

    /* ── HEADER ── */
    .pricing-header {
      background: var(--color-primary, #1B5E20);
      color: var(--color-white, #fff);
      border-radius: 12px 12px 0 0;
      padding: 32px 32px 24px;
      text-align: center;
      position: relative;
    }

    .pricing-header-icon {
      font-size: 2.5rem;
      margin-bottom: 8px;
    }

    .pricing-header h1 {
      font-size: 1.25rem;
      font-weight: 700;
      letter-spacing: 0.02em;
      margin: 0 0 10px;
      line-height: 1.4;
    }

    .pricing-subtitle {
      font-size: 0.95rem;
      opacity: 0.9;
      margin: 0 0 20px;
    }

    .back-btn {
      position: absolute;
      top: 20px;
      left: 20px;
      background: rgba(255,255,255,0.15);
      border: 1px solid rgba(255,255,255,0.4);
      color: var(--color-white, #fff);
      padding: 6px 14px;
      border-radius: 6px;
      cursor: pointer;
      font-size: 0.875rem;
      transition: background 0.2s;
    }

    .back-btn:hover {
      background: rgba(255,255,255,0.25);
    }

    /* ── TABLE SECTION ── */
    .table-section {
      background: var(--color-white, #fff);
      padding: 28px 28px 20px;
    }

    .table-title {
      font-size: 1rem;
      font-weight: 700;
      color: var(--color-primary, #1B5E20);
      margin: 0 0 16px;
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .table-scroll {
      overflow-x: auto;
    }

    .pricing-table {
      width: 100%;
      border-collapse: collapse;
      font-size: 0.9rem;
    }

    .pricing-table thead tr {
      background: var(--color-primary, #1B5E20);
      color: var(--color-white, #fff);
    }

    .pricing-table th {
      padding: 12px 14px;
      text-align: center;
      font-weight: 600;
      font-size: 0.8rem;
      vertical-align: top;
      border-right: 1px solid rgba(255,255,255,0.2);
    }

    .pricing-table th.col-service {
      text-align: left;
      width: 32%;
    }

    .col-sub {
      font-size: 0.72rem;
      font-weight: 400;
      opacity: 0.88;
      margin-top: 4px;
    }

    .promo-badge {
      background: var(--color-accent-orange, #D84315);
      display: inline-block;
      padding: 3px 10px;
      border-radius: 4px;
      font-size: 0.78rem;
      font-weight: 700;
      letter-spacing: 0.02em;
    }

    .pricing-table tbody tr {
      border-bottom: 1px solid var(--color-gray-200, #e5e7eb);
    }

    .pricing-table tbody tr:last-child {
      border-bottom: none;
    }

    .pricing-table tbody tr:hover {
      background: var(--color-gray-50, #f9fafb);
    }

    .service-name {
      padding: 14px;
      font-weight: 500;
      color: var(--color-gray-800, #1f2937);
      display: flex;
      flex-direction: column;
      gap: 3px;
    }

    .service-desc {
      font-size: 0.8rem;
      color: var(--color-gray-500, #6b7280);
      font-weight: 400;
    }

    .price {
      padding: 14px;
      text-align: center;
      font-weight: 600;
      color: var(--color-gray-700, #374151);
      vertical-align: middle;
    }

    .promo-price {
      background: #fff8e1;
      color: var(--color-success-dark, #229954);
    }

    .price-value {
      font-size: 1.15rem;
    }

    .fire-icon {
      font-size: 1rem;
      margin-left: 4px;
    }

    .unavailable {
      color: var(--color-gray-400, #9ca3af);
      font-weight: 400;
      font-size: 0.85rem;
    }

    /* ── INFO GRID ── */
    .info-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 16px;
      background: var(--color-gray-50, #f9fafb);
      padding: 24px 28px;
      border-top: 1px solid var(--color-gray-200, #e5e7eb);
    }

    .info-card {
      background: var(--color-white, #fff);
      border-radius: 10px;
      padding: 18px 20px;
      border: 1px solid var(--color-gray-200, #e5e7eb);
      box-shadow: var(--shadow-md, 0 2px 8px rgba(0,0,0,0.06));
    }

    .guarantee-card {
      border-color: var(--color-success-border, #c3e6cb);
      background: var(--color-success-bg, #d4edda);
    }

    .info-card-header {
      display: flex;
      align-items: center;
      gap: 10px;
      margin-bottom: 10px;
    }

    .info-icon {
      font-size: 1.3rem;
      flex-shrink: 0;
    }

    .info-card h3 {
      font-size: 0.95rem;
      font-weight: 700;
      color: var(--color-gray-800, #1f2937);
      margin: 0;
    }

    .guarantee-card h3 {
      color: var(--color-success-text, #155724);
    }

    .info-card p {
      font-size: 0.875rem;
      color: var(--color-gray-600, #4b5563);
      line-height: 1.55;
      margin: 0;
    }

    .info-note {
      margin-top: 6px !important;
      font-style: italic;
      color: var(--color-gray-500, #6b7280) !important;
    }

    /* ── PROMO NOTE ── */
    .promo-note {
      background: var(--color-white, #fff);
      border-top: 1px solid var(--color-gray-200, #e5e7eb);
      padding: 18px 28px;
      display: flex;
      gap: 12px;
      align-items: flex-start;
    }

    .flag-icon {
      font-size: 1.1rem;
      flex-shrink: 0;
      margin-top: 2px;
    }

    .promo-note p {
      font-size: 0.8rem;
      color: var(--color-gray-500, #6b7280);
      line-height: 1.6;
      margin: 0;
    }

    /* ── FOOTER BRAND ── */
    .pricing-footer-brand {
      background: var(--color-primary, #1B5E20);
      color: rgba(255,255,255,0.7);
      text-align: center;
      padding: 12px;
      font-size: 0.85rem;
      letter-spacing: 0.05em;
      border-radius: 0 0 12px 12px;
    }

    /* ── MOBILE — tabela jako karty ── */
    @media (max-width: 640px) {
      .pricing-wrapper {
        padding: 70px 8px 32px;
      }

      .pricing-header {
        padding: 60px 16px 20px;
      }

      .pricing-header h1 {
        font-size: 1rem;
      }

      .back-btn {
        top: 12px;
        left: 12px;
      }

      .table-section {
        padding: 16px 12px;
      }

      /* Ukryj nagłówek tabeli */
      .pricing-table thead {
        display: none;
      }

      /* Każdy wiersz staje się kartą */
      .pricing-table,
      .pricing-table tbody,
      .pricing-table tr {
        display: block;
        width: 100%;
      }

      .pricing-table tbody tr {
        border: 1px solid var(--color-gray-200, #e5e7eb);
        border-radius: 10px;
        margin-bottom: 12px;
        overflow: hidden;
        box-shadow: 0 1px 4px rgba(0,0,0,0.06);
      }

      /* Nazwa usługi — pełna szerokość, styl nagłówka */
      .pricing-table td.service-name {
        display: block;
        background: var(--color-primary, #1B5E20);
        color: var(--color-white, #fff);
        padding: 12px 14px;
        border-bottom: none;
      }

      .pricing-table td.service-name strong {
        color: var(--color-white, #fff);
      }

      .pricing-table td.service-name .service-desc {
        color: rgba(255,255,255,0.75);
      }

      /* Komórki cenowe — wiersz z etykietą i wartością */
      .pricing-table td.price {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 10px 14px;
        text-align: right;
        border-bottom: 1px solid var(--color-gray-100, #f3f4f6);
        font-size: 0.9rem;
      }

      .pricing-table td.price:last-child {
        border-bottom: none;
      }

      /* Etykieta z data-label */
      .pricing-table td.price::before {
        content: attr(data-label);
        font-size: 0.78rem;
        font-weight: 600;
        color: var(--color-gray-500, #6b7280);
        text-align: left;
        flex: 1;
        margin-right: 8px;
      }

      .pricing-table td.promo-price {
        background: #fff8e1;
      }

      .info-grid {
        grid-template-columns: 1fr;
        padding: 16px 12px;
        gap: 12px;
      }

      .promo-note {
        padding: 16px 12px;
      }
    }
  `]
})
export class PricingCyclistsComponent {
  goBack(): void {
    window.history.back();
  }
}
