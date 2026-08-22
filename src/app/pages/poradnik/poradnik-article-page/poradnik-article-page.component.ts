import { Component, OnInit, OnDestroy, inject, PLATFORM_ID } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { SeoService } from '../../../core/seo.service';
import { SchemaOrgHelper } from '../../../core/schema-org.helper';
import { PoradnikArticleCardComponent } from '../poradnik-article-card/poradnik-article-card.component';
import { BreadcrumbComponent } from '../../../shared/components/breadcrumb/breadcrumb.component';
import { PoradnikArticle } from '../../../shared/models/poradnik-article.model';
import { PORADNIK_ARTICLES, getPoradnikArticleBySlug } from '../poradnik-articles.data';

interface TocItem {
  id: string;
  text: string;
}

const TOC_HEADING_PATTERN = /<h2 id="([^"]+)">([^<]*)<\/h2>/g;

@Component({
  selector: 'app-poradnik-article-page',
  standalone: true,
  imports: [CommonModule, PoradnikArticleCardComponent, BreadcrumbComponent],
  templateUrl: './poradnik-article-page.component.html',
  styleUrls: ['./poradnik-article-page.component.css']
})
export class PoradnikArticlePageComponent implements OnInit, OnDestroy {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private seoService = inject(SeoService);
  private platformId = inject(PLATFORM_ID);
  private sanitizer = inject(DomSanitizer);

  article!: PoradnikArticle;
  safeContentHtml!: SafeHtml;
  relatedArticles: PoradnikArticle[] = [];
  tocItems: TocItem[] = [];

  ngOnInit(): void {
    const slug = this.route.snapshot.paramMap.get('slug') ?? '';
    const found = getPoradnikArticleBySlug(slug);

    if (!found) {
      this.router.navigate(['/poradnik']);
      return;
    }

    this.article = found;
    // contentHtml jest w całości autorstwa CycloPick (nie dane od użytkownika) — bypass sanitizera
    // jest tu bezpieczny i konieczny, bo domyślny sanitizer Angulara wycina atrybuty id z <h2>,
    // psując kotwice spisu treści
    this.safeContentHtml = this.sanitizer.bypassSecurityTrustHtml(found.contentHtml);
    this.relatedArticles = PORADNIK_ARTICLES.filter(a => a.slug !== found.slug).slice(0, 3);
    this.tocItems = this.extractTocItems(found.contentHtml);

    this.seoService.updateFullSeoTags(
      {
        title: `${found.title} | CycloPick`,
        description: found.excerpt,
        image: `https://www.cyclopick.pl/${found.coverImage}`,
        type: 'article'
      },
      `/poradnik/${found.slug}`
    );

    this.seoService.addMultipleStructuredData([
      SchemaOrgHelper.generateBlogPosting(found),
      SchemaOrgHelper.generateBreadcrumb([
        { name: 'Strona główna', url: 'https://www.cyclopick.pl/' },
        { name: 'Poradnik rowerowy', url: 'https://www.cyclopick.pl/poradnik' },
        { name: found.title, url: `https://www.cyclopick.pl/poradnik/${found.slug}` }
      ])
    ]);
  }

  ngOnDestroy(): void {
    this.seoService.removeStructuredData();
  }

  // Zwykły href="#id" nawigowałby do "/" + hash (Angular <base href="/"> rozstrzyga bare fragment
  // względem base, nie bieżącej ścieżki) — dlatego scrollujemy ręcznie zamiast polegać na hrefie
  onTocLinkClick(event: Event, id: string): void {
    event.preventDefault();
    if (!isPlatformBrowser(this.platformId)) return;
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
  }

  // Spis treści wyprowadzony wprost z treści (nie osobna, ręcznie utrzymywana tablica) —
  // działa identycznie na serwerze i kliencie, bez dotykania DOM (bezpieczne dla hydration)
  private extractTocItems(contentHtml: string): TocItem[] {
    return Array.from(contentHtml.matchAll(TOC_HEADING_PATTERN)).map(match => ({
      id: match[1],
      text: match[2]
    }));
  }
}
