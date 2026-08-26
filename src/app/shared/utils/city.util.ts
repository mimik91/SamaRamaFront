/** Trim, lowercase, strip diacritics — żeby porównania miast były odporne na "Kraków"/"krakow"/"KRAKÓW". */
export function normalizeCityName(value: string | null | undefined): string {
  return (value ?? '').trim().toLowerCase().normalize('NFD').replace(new RegExp('[\\u0300-\\u036f]', 'g'), '');
}

/** Serwis ekspresowy CycloPick działa dziś wyłącznie w Krakowie — patrz city-services-page. */
export function isKrakowCity(nameOrSlug: string | null | undefined): boolean {
  return normalizeCityName(nameOrSlug) === 'krakow';
}
