import { Component, OnInit, OnDestroy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { SeoService } from '../../../core/seo.service';
import { SchemaOrgHelper } from '../../../core/schema-org.helper';
import { PoradnikArticleCardComponent } from '../poradnik-article-card/poradnik-article-card.component';
import { PORADNIK_ARTICLES } from '../poradnik-articles.data';
import { BreadcrumbComponent } from '../../../shared/components/breadcrumb/breadcrumb.component';

@Component({
  selector: 'app-poradnik-list-page',
  standalone: true,
  imports: [CommonModule, RouterLink, PoradnikArticleCardComponent, BreadcrumbComponent],
  templateUrl: './poradnik-list-page.component.html',
  styleUrls: ['./poradnik-list-page.component.css']
})
export class PoradnikListPageComponent implements OnInit, OnDestroy {
  private seoService = inject(SeoService);

  readonly articles = PORADNIK_ARTICLES;

  ngOnInit(): void {
    this.seoService.updateFullSeoTags(
      {
        title: 'Poradnik rowerowy — porady i wskazówki dla rowerzystów | CycloPick',
        description: 'Praktyczne porady o serwisowaniu, przeglądach i transporcie roweru. Dowiedz się, jak wybrać dobry serwis rowerowy i ile powinien kosztować przegląd.',
        type: 'website'
      },
      '/poradnik'
    );

    this.seoService.addStructuredData(
      SchemaOrgHelper.generateBreadcrumb([
        { name: 'Strona główna', url: 'https://www.cyclopick.pl/' },
        { name: 'Poradnik rowerowy', url: 'https://www.cyclopick.pl/poradnik' }
      ])
    );
  }

  ngOnDestroy(): void {
    this.seoService.removeStructuredData();
  }
}
