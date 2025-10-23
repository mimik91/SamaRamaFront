import { inject } from '@angular/core';
import { Router, CanActivateFn } from '@angular/router';

export const suffixValidationGuard: CanActivateFn = (route, state) => {
  const suffix = route.paramMap.get('suffix');
  
  // Lista rozszerzeń plików statycznych do wykluczenia
  const staticFileExtensions = [
    '.css', '.js', '.map', '.json', '.png', '.jpg', '.jpeg', 
    '.gif', '.svg', '.ico', '.woff', '.woff2', '.ttf', '.eot'
  ];
  
  // Sprawdź czy suffix nie zawiera rozszerzenia pliku statycznego
  if (suffix && staticFileExtensions.some(ext => suffix.endsWith(ext))) {
    return false; // Blokuj routing dla plików statycznych
  }
  
  // Opcjonalnie: Waliduj format suffixu (tylko małe litery, cyfry, myślniki)
  const suffixPattern = /^[a-z0-9-]+$/;
  if (suffix && !suffixPattern.test(suffix)) {
    return false;
  }
  
  return true;
};