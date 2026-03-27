import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-pricing-services',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <div class="pricing-wrapper">
      <div class="pricing-container">

        <header class="pricing-header">
          <div class="pricing-header-icon emoji">🛠️</div>
          <h1>OFERTA DLA SERWISÓW ROWEROWYCH<span class="b2b-badge">B2B</span></h1>
          <p class="pricing-subtitle">
            Do&#322;&#261;cz teraz &ndash; pierwsze 20 serwisów w Krakowie korzysta z Cyclopick
            <strong>bez op&#322;at przez 3 lata.</strong>
          </p>
          <button class="back-btn" (click)="goBack()">&#8592; Powrót</button>
        </header>

        <div class="early-access-banner">
          <span class="emoji">⚡</span>
          <span>
            <strong>Early Access aktywny!</strong>
            Trwa nabór pierwszych 20 partnerskich serwisów w Krakowie.
            Zostań jednym z nich i ciesz się planem 0 zł przez 3 lata &ndash; z gwarancją.
          </span>
        </div>

        <section class="table-section">
          <h2 class="table-title">
            <span class="emoji">💼</span>
            CENNIK ABONAMENTOWY
          </h2>

          <div class="table-scroll">
            <table class="pricing-table">
              <thead>
                <tr>
                  <th class="col-type">Rodzaj oferty</th>
                  <th class="col-partner">
                    <div class="partner-badge">Cena Partner</div>
                    <div class="col-sub">Serwisy Partnerskie</div>
                  </th>
                  <th class="col-standard">Cena (Pozosta&#322;e)</th>
                  <th class="col-conditions">Warunki</th>
                </tr>
              </thead>
              <tbody>
                <tr class="row-highlight">
                  <td class="offer-name">
                    <strong>Early Access (Kraków)</strong>
                    <span class="offer-tag emoji">🌟 Najlepsza oferta</span>
                  </td>
                  <td class="price partner-price" data-label="Cena Partner">
                    <span class="price-big">0 z&#322;</span>
                    <span class="price-period">/ rok</span>
                  </td>
                  <td class="price" data-label="Cena (Pozostałe)">
                    <span class="dash">&mdash;</span>
                  </td>
                  <td class="conditions" data-label="Warunki">
                    Pierwsze 20 serwisów
                    <span class="guarantee-chip emoji">✅ Gwarancja 3 lata!</span>
                  </td>
                </tr>
                <tr>
                  <td class="offer-name">
                    <strong>Marzec &ndash; Czerwiec</strong>
                  </td>
                  <td class="price partner-price" data-label="Cena Partner">
                    <span class="price-big">150 z&#322;</span>
                    <span class="price-period">/ rok</span>
                  </td>
                  <td class="price" data-label="Cena (Pozostałe)">
                    <span class="price-std">1&nbsp;200 z&#322; / rok</span>
                  </td>
                  <td class="conditions" data-label="Warunki">
                    Rejestracja w trakcie promocji
                  </td>
                </tr>
                <tr>
                  <td class="offer-name">
                    <strong>Od Lipca (Standard)</strong>
                  </td>
                  <td class="price partner-price" data-label="Cena Partner">
                    <span class="price-big">300 z&#322;</span>
                    <span class="price-period">/ rok</span>
                  </td>
                  <td class="price" data-label="Cena (Pozostałe)">
                    <span class="price-std">1&nbsp;200 z&#322; / rok</span>
                  </td>
                  <td class="conditions" data-label="Warunki">
                    Standardowa cena abonamentowa
                  </td>
                </tr>
                <tr>
                  <td class="offer-name">
                    <strong>Poza Krakowem</strong>
                  </td>
                  <td class="price partner-price" data-label="Cena Partner">
                    <span class="price-big">0 z&#322;</span>
                    <span class="price-period">/ rok</span>
                  </td>
                  <td class="price" data-label="Cena (Pozostałe)">
                    <span class="price-big free-color">0 z&#322;</span>
                    <span class="price-period">/ rok</span>
                  </td>
                  <td class="conditions" data-label="Warunki">
                    Oferta ogólnopolska (obecnie)
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>

        <section class="benefits-section">
          <h2 class="benefits-title">
            <span class="emoji">🚀</span>
            Co zyskujesz jako Partner?
          </h2>
          <div class="benefits-grid">

            <div class="benefit-card">
              <div class="benefit-icon emoji">📅</div>
              <div class="benefit-body">
                <h3>Panel rezerwacji online</h3>
                <p>Koniec z zapisywaniem terminów w zeszycie. Pe&#322;na kontrola zlece&#324; &ndash; kalendarz, kanban i historia w jednym miejscu.</p>
              </div>
            </div>

            <div class="benefit-card">
              <div class="benefit-icon emoji">🚚</div>
              <div class="benefit-body">
                <h3>Logistyka Cyclopick</h3>
                <p>My dostarczamy Ci klientów. Darmowy transport (0 z&#322;) to pot&#281;&#380;ny argument sprzeda&#380;owy &ndash; klienci chętniej wybieraj&#261; serwis z odbiorem roweru spod domu.</p>
              </div>
            </div>

            <div class="benefit-card">
              <div class="benefit-icon emoji">📍</div>
              <div class="benefit-body">
                <h3>Wyró&#380;nienie na mapie</h3>
                <p>Du&#380;a, widoczna pinezka, która przyci&#261;ga wzrok u&#380;ytkowników aplikacji szukaj&#261;cych serwisu w Twojej okolicy.</p>
              </div>
            </div>

          </div>
        </section>

        <section class="conditions-section">
          <h2 class="conditions-title">
            <span class="emoji">📋</span>
            Warunki statusu Partnera
            <span class="conditions-sub">weryfikowane rocznie</span>
          </h2>
          <ul class="conditions-list">
            <li>
              <span class="cond-icon emoji">✅</span>
              <div>
                <strong>Aktywne korzystanie z panelu rezerwacji</strong> Cyclopick.
              </div>
            </li>
            <li>
              <span class="cond-icon emoji">✅</span>
              <div>
                <strong>Kompletny profil:</strong> uzupe&#322;nione pakiety serwisowe i godziny otwarcia.
              </div>
            </li>
            <li>
              <span class="cond-icon emoji">✅</span>
              <div>
                <strong>Marketing:</strong> minimum 1 post na kwarta&#322; w social mediach z linkiem do rezerwacji
                i oznaczeniem cyclopick.pl.
                <span class="cond-note">
                  <span class="emoji">⏰</span>
                  Pierwszy post &ndash; do 1 tygodnia od w&#322;&#261;czenia panelu rezerwacji.
                </span>
              </div>
            </li>
          </ul>
        </section>

        <div class="cta-section">
          <p class="cta-text">Masz pytania? Napisz do nas lub zarejestruj swój warsztat.</p>
          <a routerLink="/register-service" class="cta-btn">
            <span class="emoji">✅</span> Zarejestruj warsztat
          </a>
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
      font-size: 1.35rem;
      font-weight: 700;
      letter-spacing: 0.02em;
      margin: 0 0 12px;
      line-height: 1.4;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 12px;
      flex-wrap: wrap;
    }

    .b2b-badge {
      background: var(--color-accent-orange, #D84315);
      font-size: 0.8rem;
      font-weight: 700;
      padding: 3px 10px;
      border-radius: 20px;
      letter-spacing: 0.05em;
      vertical-align: middle;
    }

    .pricing-subtitle {
      font-size: 0.95rem;
      opacity: 0.9;
      margin: 0 0 20px;
      line-height: 1.5;
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

    /* ── EARLY ACCESS BANNER ── */
    .early-access-banner {
      background: var(--color-accent-orange-bg, #fbe9e7);
      border: 1px solid var(--color-accent-orange-border, #ffccbc);
      border-top: none;
      padding: 14px 24px;
      display: flex;
      gap: 12px;
      align-items: flex-start;
      font-size: 0.9rem;
      color: var(--color-accent-orange-dark, #bf360c);
      line-height: 1.5;
    }

    .early-access-banner .emoji {
      font-size: 1.2rem;
      flex-shrink: 0;
      margin-top: 1px;
    }

    /* ── TABLE SECTION ── */
    .table-section {
      background: var(--color-white, #fff);
      padding: 28px 28px 20px;
      border-top: 1px solid var(--color-gray-200, #e5e7eb);
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

    .pricing-table th.col-type {
      text-align: left;
      width: 28%;
    }

    .col-sub {
      font-size: 0.72rem;
      font-weight: 400;
      opacity: 0.88;
      margin-top: 4px;
    }

    .partner-badge {
      background: var(--color-accent-orange, #D84315);
      display: inline-block;
      padding: 3px 10px;
      border-radius: 4px;
      font-size: 0.78rem;
      font-weight: 700;
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

    .row-highlight {
      background: #f0fdf4;
    }

    .row-highlight:hover {
      background: #e8faf0 !important;
    }

    .offer-name {
      padding: 14px;
      font-weight: 500;
      color: var(--color-gray-800, #1f2937);
      display: flex;
      flex-direction: column;
      gap: 5px;
    }

    .offer-tag {
      font-size: 0.75rem;
      font-weight: 400;
      color: var(--color-success-dark, #229954);
    }

    .price {
      padding: 14px;
      text-align: center;
      font-weight: 600;
      color: var(--color-gray-700, #374151);
      vertical-align: middle;
    }

    .partner-price {
      background: #f0fdf4;
      color: var(--color-success-dark, #229954);
    }

    .row-highlight .partner-price {
      background: #dcfce7;
    }

    .price-big {
      font-size: 1.2rem;
      font-weight: 700;
    }

    .price-period {
      font-size: 0.78rem;
      font-weight: 400;
      color: var(--color-gray-500, #6b7280);
      margin-left: 2px;
    }

    .price-std {
      font-size: 0.9rem;
      color: var(--color-gray-500, #6b7280);
    }

    .free-color {
      color: var(--color-success-dark, #229954);
    }

    .dash {
      color: var(--color-gray-400, #9ca3af);
      font-size: 1.1rem;
    }

    .conditions {
      padding: 14px;
      font-size: 0.83rem;
      color: var(--color-gray-600, #4b5563);
      vertical-align: middle;
      display: flex;
      flex-direction: column;
      gap: 5px;
    }

    .guarantee-chip {
      display: inline-block;
      background: var(--color-success-bg, #d4edda);
      color: var(--color-success-text, #155724);
      border-radius: 20px;
      padding: 2px 10px;
      font-size: 0.78rem;
      font-weight: 600;
      width: fit-content;
    }

    /* ── BENEFITS ── */
    .benefits-section {
      background: var(--color-white, #fff);
      border-top: 1px solid var(--color-gray-200, #e5e7eb);
      padding: 28px 28px 24px;
    }

    .benefits-title {
      font-size: 1.05rem;
      font-weight: 700;
      color: var(--color-primary, #1B5E20);
      margin: 0 0 20px;
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .benefits-grid {
      display: flex;
      flex-direction: column;
      gap: 16px;
    }

    .benefit-card {
      display: flex;
      gap: 16px;
      align-items: flex-start;
      background: var(--color-gray-50, #f9fafb);
      border: 1px solid var(--color-gray-200, #e5e7eb);
      border-radius: 10px;
      padding: 18px 20px;
    }

    .benefit-icon {
      font-size: 1.8rem;
      flex-shrink: 0;
      margin-top: 2px;
    }

    .benefit-body h3 {
      font-size: 0.95rem;
      font-weight: 700;
      color: var(--color-gray-800, #1f2937);
      margin: 0 0 6px;
    }

    .benefit-body p {
      font-size: 0.875rem;
      color: var(--color-gray-600, #4b5563);
      line-height: 1.6;
      margin: 0;
    }

    /* ── PARTNER CONDITIONS ── */
    .conditions-section {
      background: var(--color-white, #fff);
      border-top: 1px solid var(--color-gray-200, #e5e7eb);
      padding: 28px 28px 24px;
    }

    .conditions-title {
      font-size: 1.05rem;
      font-weight: 700;
      color: var(--color-primary, #1B5E20);
      margin: 0 0 20px;
      display: flex;
      align-items: center;
      gap: 8px;
      flex-wrap: wrap;
    }

    .conditions-sub {
      font-size: 0.78rem;
      font-weight: 400;
      color: var(--color-gray-500, #6b7280);
      background: var(--color-gray-100, #f3f4f6);
      border: 1px solid var(--color-gray-200, #e5e7eb);
      border-radius: 20px;
      padding: 2px 10px;
    }

    .conditions-list {
      list-style: none;
      padding: 0;
      margin: 0;
      display: flex;
      flex-direction: column;
      gap: 12px;
    }

    .conditions-list li {
      display: flex;
      gap: 12px;
      align-items: flex-start;
      background: var(--color-gray-50, #f9fafb);
      border: 1px solid var(--color-gray-200, #e5e7eb);
      border-radius: 8px;
      padding: 14px 16px;
      font-size: 0.875rem;
      color: var(--color-gray-700, #374151);
      line-height: 1.55;
    }

    .cond-icon {
      font-size: 1.1rem;
      flex-shrink: 0;
      margin-top: 1px;
    }

    .cond-note {
      display: flex;
      align-items: center;
      gap: 5px;
      margin-top: 6px;
      font-size: 0.8rem;
      color: var(--color-accent-orange-dark, #bf360c);
      background: var(--color-accent-orange-bg, #fbe9e7);
      border-radius: 6px;
      padding: 4px 10px;
      width: fit-content;
    }

    /* ── CTA ── */
    .cta-section {
      background: var(--color-primary, #1B5E20);
      padding: 24px 28px;
      text-align: center;
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 16px;
    }

    .cta-text {
      color: rgba(255,255,255,0.85);
      font-size: 0.95rem;
      margin: 0;
    }

    .cta-btn {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      background: var(--color-white, #fff);
      color: var(--color-primary, #1B5E20);
      font-weight: 700;
      font-size: 0.95rem;
      padding: 12px 28px;
      border-radius: 8px;
      text-decoration: none;
      transition: opacity 0.2s;
    }

    .cta-btn:hover {
      opacity: 0.9;
    }

    /* ── FOOTER BRAND ── */
    .pricing-footer-brand {
      background: var(--color-primary-dark, #145018);
      color: rgba(255,255,255,0.6);
      text-align: center;
      padding: 12px;
      font-size: 0.85rem;
      letter-spacing: 0.05em;
      border-radius: 0 0 12px 12px;
    }

    /* ── MOBILE ── */
    @media (max-width: 640px) {
      .pricing-wrapper {
        padding: 70px 8px 32px;
      }

      .pricing-header {
        padding: 60px 16px 20px;
      }

      .pricing-header h1 {
        font-size: 1.05rem;
        flex-direction: column;
        gap: 8px;
      }

      .back-btn {
        top: 12px;
        left: 12px;
      }

      .early-access-banner {
        padding: 12px 16px;
        font-size: 0.85rem;
      }

      .table-section,
      .benefits-section {
        padding: 16px 12px;
      }

      /* Tabela → karty */
      .pricing-table thead {
        display: none;
      }

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

      .pricing-table td.offer-name {
        display: block;
        background: var(--color-primary, #1B5E20);
        color: var(--color-white, #fff);
        padding: 12px 14px;
      }

      .pricing-table td.offer-name strong {
        color: var(--color-white, #fff);
      }

      .pricing-table td.offer-name .offer-tag {
        color: rgba(255,255,255,0.8);
      }

      .pricing-table td.price,
      .pricing-table td.conditions {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 10px 14px;
        border-bottom: 1px solid var(--color-gray-100, #f3f4f6);
        font-size: 0.88rem;
      }

      .pricing-table td.price:last-child,
      .pricing-table td.conditions:last-child {
        border-bottom: none;
      }

      .pricing-table td.price::before,
      .pricing-table td.conditions::before {
        content: attr(data-label);
        font-size: 0.78rem;
        font-weight: 600;
        color: var(--color-gray-500, #6b7280);
        text-align: left;
        flex: 1;
        margin-right: 8px;
      }

      .pricing-table td.partner-price {
        background: #f0fdf4;
      }

      .row-highlight .partner-price {
        background: #dcfce7;
      }

      .cta-section {
        padding: 20px 16px;
      }
    }
  `]
})
export class PricingServicesComponent {
  goBack(): void {
    window.history.back();
  }
}
