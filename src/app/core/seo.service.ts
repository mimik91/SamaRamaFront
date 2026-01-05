import { Injectable, Inject } from '@angular/core';
import { DOCUMENT } from '@angular/common';
import { Title, Meta } from '@angular/platform-browser';
import { environment } from '../environments/environments';

@Injectable({
  providedIn: 'root'
})
export class SeoService {
  constructor(
    @Inject(DOCUMENT) private dom: any,
    private titleService: Title,
    private metaService: Meta
  ) {}

  updateSeoTags(path: string, customTitle?: string, description?: string) {
    // 1. Aktualizacja Canonical URL
    const cleanPath = path.split('?')[0];
    const url = `${environment.siteUrl}${cleanPath === '/' ? '' : cleanPath}`;
    this.setCanonicalUrl(url);

    // 2. Aktualizacja Meta Description
    const metaDesc = description || "Znajdź najlepszy serwis rowerowy w swojej okolicy dzięki CycloPick. Sprawdź mapę, opinie i umów się na naprawę online.";
    this.metaService.updateTag({ name: 'description', content: metaDesc });

    // 3. Obsługa NOINDEX dla paneli administracyjnych/prywatnych
    if (path.includes('admin') || path.includes('panel') || path.includes('account')) {
      this.metaService.updateTag({ name: 'robots', content: 'noindex, nofollow' });
    } else {
      this.metaService.updateTag({ name: 'robots', content: 'index, follow' });
    }
  }

  private setCanonicalUrl(url: string) {
    let link: HTMLLinkElement = this.dom.querySelector('link[rel="canonical"]');
    if (!link) {
      link = this.dom.createElement('link');
      link.setAttribute('rel', 'canonical');
      this.dom.head.appendChild(link);
    }
    link.setAttribute('href', url);
  }
}