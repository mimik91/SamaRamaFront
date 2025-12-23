import { inject } from '@angular/core';
import { Router, CanActivateFn } from '@angular/router';

export const suffixValidationGuard: CanActivateFn = (route, state) => {
  const suffix = route.paramMap.get('suffix');
  
  console.log('SuffixValidationGuard: Validating suffix:', suffix);
  
  // Lista rozszerzeń plików statycznych do wykluczenia
  const staticFileExtensions = [
    '.css', '.js', '.map', '.json', '.png', '.jpg', '.jpeg', 
    '.gif', '.svg', '.ico', '.woff', '.woff2', '.ttf', '.eot'
  ];
  
  // Sprawdź czy suffix nie zawiera rozszerzenia pliku statycznego
  if (suffix && staticFileExtensions.some(ext => suffix.endsWith(ext))) {
    console.log('SuffixValidationGuard: Blocked - static file extension detected');
    return false;
  }
  
  // POPRAWIONY REGEX: Akceptuje małe i WIELKIE litery, cyfry, myślniki
  // Dodano też sprawdzenie długości (2-50 znaków)
  const suffixPattern = /^[a-zA-Z0-9-]{2,50}$/;
  
  if (suffix && !suffixPattern.test(suffix)) {
    console.log('SuffixValidationGuard: Blocked - invalid suffix format:', suffix);
    return false;
  }
  
  console.log('SuffixValidationGuard: Suffix valid, access granted');
  return true;
};