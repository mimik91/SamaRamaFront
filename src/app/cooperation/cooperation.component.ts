import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-cooperation',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './cooperation.component.html',
  styleUrls: ['./cooperation.component.css']
})
export class CooperationComponent implements OnInit {

  cooperationAreas = [
    {
      title: 'Rozwój aplikacji',
      image: 'assets/images/cooperation/dev.webp',
      description: 'Pomóż nam rozwijać CycloPick od strony technologicznej. Kod, UX, mobilne innowacje — Twoje pomysły mogą realnie ulepszyć nasz produkt.'
    },
    {
      title: 'Marketing i promocja',
      image: 'assets/images/cooperation/marketing.webp',
      description: 'Pomóż nam dotrzeć do tysięcy rowerzystów w całej Polsce. Jeśli potrafisz angażować ludzi, Twoje miejsce jest właśnie tutaj.'
    },
    {
      title: 'Biznes i strategia',
      image: 'assets/images/cooperation/strategy.webp',
      description: 'Współtwórz model działania CycloPick, wspieraj nas wiedzą z zakresu logistyki, partnerstw i skalowania biznesu.'
    },
    {
      title: 'Społeczność i eventy',
      image: 'assets/images/cooperation/events.webp',
      description: 'Łącz ludzi, organizuj wydarzenia i buduj społeczność miłośników rowerów. Wspólnie napędzajmy pasję do dwóch kółek.'
    },
    {
      title: 'Serwisy i warsztaty',
      image: 'assets/images/cooperation/workshop.webp',
      description: 'Dołącz do naszej sieci partnerów serwisowych. Wspólnie sprawmy, by każdy rower był w najlepszych rękach.'
    },
    {
      title: 'Inne pomysły',
      image: 'assets/images/cooperation/ideas2.webp',
      description: 'Masz coś, co nie pasuje do powyższych kategorii? Świetnie! Napisz do nas – każda świeża perspektywa ma znaczenie.'
    }
  ];

  benefits = [
    {
      title: 'Buduj przyszłość branży rowerowej',
      icon: '🚴‍♀️',
      description: 'Twórz rozwiązania, które realnie wpływają na sposób, w jaki ludzie dbają o swoje rowery.'
    },
    {
      title: 'Rozwijaj swoje umiejętności',
      icon: '💡',
      description: 'Zdobądź doświadczenie w startupie, który łączy technologię, pasję i społeczność.'
    },
    {
      title: 'Miej wpływ',
      icon: '🎯',
      description: 'Twoje pomysły nie zginą w skrzynce mailowej — u nas liczy się każdy głos.'
    },
    {
      title: 'Dołącz do ludzi z pasją',
      icon: '❤️',
      description: 'Pracuj wśród osób, które myślą podobnie, działają z sercem i cieszą się każdą przejażdżką.'
    }
  ];

  constructor() { }

  ngOnInit(): void { }

  scrollToSection(sectionId: string): void {
    const element = document.getElementById(sectionId);
    if (element) {
      const offset = 80;
      const elementPosition = element.getBoundingClientRect().top;
      const offsetPosition = elementPosition + window.pageYOffset - offset;

      window.scrollTo({
        top: offsetPosition,
        behavior: 'smooth'
      });
    }
  }
}
