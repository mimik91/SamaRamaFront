// src/app/service-orders/service-order.model.ts
import { Bicycle } from '../bicycles/bicycle.model';
import { BikeService } from '../service-panel/bike-service.model';

export enum ServicePackage {
  BASIC = 'BASIC',
  EXTENDED = 'EXTENDED',
  FULL = 'FULL'
}

export enum OrderStatus {
  PENDING = 'PENDING',
  CONFIRMED = 'CONFIRMED',
  PICKED_UP = 'PICKED_UP',
  IN_SERVICE = 'IN_SERVICE',
  COMPLETED = 'COMPLETED',
  DELIVERED = 'DELIVERED',
  CANCELLED = 'CANCELLED'
}

export interface ServiceOrder {
  id: number;
  bicycle: Bicycle;
  servicePackage: ServicePackage;
  pickupDate: string;
  pickupAddress: string;
  pickupLatitude?: number;
  pickupLongitude?: number;
  price: number;
  orderDate: string;
  additionalNotes?: string;
  status: OrderStatus;
  serviceNotes?: string;
  service?: BikeService;
}

export interface CreateServiceOrderRequest {
  bicycleId: number;
  servicePackage: ServicePackage;
  pickupDate: string;
  pickupAddress: string;
  pickupLatitude?: number;
  pickupLongitude?: number;
  additionalNotes?: string;
}

export interface ServicePackageInfo {
  name: string;
  price: number;
  description: string;
  features: string[];
}

export const SERVICE_PACKAGES: Record<ServicePackage, ServicePackageInfo> = {
  [ServicePackage.BASIC]: {
    name: 'Przegląd podstawowy',
    price: 200,
    description: 'Podstawowe sprawdzenie stanu roweru i regulacje',
    features: [
      'Ocena stanu technicznego roweru',
      'Regulacja hamulców',
      'Regulacja przerzutek',
      'Smarowanie łańcucha',
      'Sprawdzenie ciśnienia w ogumieniu',
      'Sprawdzenie poprawności skręcenia roweru',
      'Kontrola luzu sterów',
      'Kontrola połączeń śrubowych',
      'Sprawdzenie linek, pancerzy',
      'Sprawdzenie stanu opon',
      'Kasowanie luzów i regulacja elementów ruchomych'
    ]
  },
  [ServicePackage.EXTENDED]: {
    name: 'Przegląd rozszerzony',
    price: 350,
    description: 'Rozszerzony przegląd z czyszczeniem i wymianą podstawowych części',
    features: [
      'Wszystkie elementy przeglądu podstawowego',
      'Czyszczenie i smarowanie łańcucha, kasety',
      'Wymiana smaru w sterach, piastach, suporcie',
      'Kontrola kół',
      'Kontrola działania amortyzatora',
      'W cenie wymiana klocków, linek, pancerzy, dętek, opon, łańcucha, kasety lub wolnobiegu. Do ceny należy doliczyć koszt części, które wymagają wymiany.'
    ]
  },
  [ServicePackage.FULL]: {
    name: 'Przegląd pełny',
    price: 600,
    description: 'Kompleksowy przegląd i konserwacja całego roweru',
    features: [
      'Wszystkie elementy przeglądu rozszerzonego',
      'Mycie roweru',
      'Czyszczenie i konserwacja przerzutek',
      'Czyszczenie i smarowanie łańcucha, kasety, korby',
      'Wymiana smaru w sterach, piastach, suporcie',
      'Wymiana linek i pancerzy',
      'Kontrola luzu łożysk suportu, steru, piast',
      'Sprawdzenie połączeń gwintowych',
      'Zewnętrzna konserwacja goleni amortyzatora',
      'Centrowanie kół',
      'Linki i pancerze oraz mycie roweru są wliczone w cenę przeglądu'
    ]
  }
};