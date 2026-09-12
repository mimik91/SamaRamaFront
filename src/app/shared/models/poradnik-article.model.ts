export interface PoradnikArticle {
  slug: string;
  title: string;
  /** Opcjonalny podtytuł pod H1 na stronie artykułu — dla kontekstu, który nie musi wchodzić
   * w krótki, SEO-owy H1/title tag (np. szczegóły, daty). Nieużywany na karcie listy. */
  subtitle?: string;
  excerpt: string;
  coverImage: string;
  coverImageAlt: string;
  /** Opcjonalne osobne zdjęcie do miniaturki na liście /poradnik — gdy pominięte, karta używa coverImage. */
  thumbnailImage?: string;
  thumbnailImageAlt?: string;
  publishedDate: string;
  readingTimeMinutes: number;
  contentHtml: string;
}
