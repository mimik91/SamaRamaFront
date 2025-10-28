import { Component, OnInit, inject, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { NotificationService } from '../../../core/notification.service';
import { environment } from '../../../core/api-config';
import { firstValueFrom } from 'rxjs';

interface BikeRepairCoverageCategory {
  id: number;
  name: string;
  displayOrder?: number;
}

interface BikeRepairCoverage {
  id: number;
  name: string;
  categoryId: number;
}

interface BikeRepairCoverageMapDto {
  coveragesByCategory: { [key: string]: BikeRepairCoverage[] };
}

interface ServiceCoverageAssignmentDto {
  existingCoverageIds: number[];
  newCategories: { name: string; displayOrder?: number }[];
  customCoverages: { categoryName: string; coverageName: string }[];
}

@Component({
  selector: 'app-service-admin-coverages',
  standalone: true,
  imports: [
    CommonModule, 
    FormsModule,
  ],
  templateUrl: './service-admin-coverages.component.html',
  styleUrls: ['./service-admin-coverages.component.css']
})
export class ServiceAdminCoveragesComponent implements OnInit {
  private http = inject(HttpClient);
  private notificationService = inject(NotificationService);

  @Input() serviceId!: number;

  // Stan ładowania
  isLoadingCoverages = false;
  isLoadingAssignedCoverages = false;
  isSaving = false;

  // Dane coverage
  availableCoverages: BikeRepairCoverageMapDto | null = null;
  categories: BikeRepairCoverageCategory[] = [];
  assignedCoverageIds: Set<number> = new Set();
  
  // Stan formularza
  selectedCoverages: { [categoryId: number]: number[] } = {};
  customCoverages: { [categoryId: number]: string[] } = {};
  customCategories: { name: string; coverages: string[] }[] = [];
  
  // Flaga zmian
  hasChanges = false;
  
  // Początkowy stan do porównania
  private initialState: string = '';

  ngOnInit(): void {
    if (!this.serviceId) {
      console.error('Service ID is required');
      this.notificationService.error('Brak ID serwisu');
      return;
    }
    
    this.loadData();
  }

  private async loadData(): Promise<void> {
    try {
      // Równoległe ładowanie danych
      await this.loadAvailableCoverages();
      await this.loadAssignedCoverages();
      
      // Zapisz początkowy stan po załadowaniu danych
      this.saveInitialState();
    } catch (error) {
      console.error('Error loading data:', error);
      this.notificationService.error('Błąd podczas ładowania danych');
    }
  }

  private async loadAvailableCoverages(): Promise<void> {
    this.isLoadingCoverages = true;
    
    try {
      const data = await firstValueFrom(
        this.http.get<BikeRepairCoverageMapDto>(
          `${environment.apiUrl}/bike-services/repair-coverage/all`
        )
      );
      
      this.availableCoverages = data;
      this.setupCoverageStructure(data);
      
    } catch (error) {
      console.error('Error loading available coverages:', error);
      throw error;
    } finally {
      this.isLoadingCoverages = false;
    }
  }

  private async loadAssignedCoverages(): Promise<void> {
    this.isLoadingAssignedCoverages = true;
    
    try {
      const coverageIds = await firstValueFrom(
        this.http.get<number[]>(
          `${environment.apiUrl}/bike-services-registered/my-service/repair-coverages`,
          { params: { serviceId: this.serviceId.toString() } }
        )
      );
      
      this.assignedCoverageIds = new Set(coverageIds);
      this.preselectCoverages();
      
    } catch (error) {
      console.error('Error loading assigned coverages:', error);
      throw error;
    } finally {
      this.isLoadingAssignedCoverages = false;
    }
  }

  private setupCoverageStructure(data: BikeRepairCoverageMapDto): void {
    // Przekonwertuj mapę na tablicę kategorii
    this.categories = Object.keys(data.coveragesByCategory).map((categoryKey) => {
      const idMatch = categoryKey.match(/id=(\d+)/);
      const nameMatch = categoryKey.match(/name=([^,)]+)/);
      const displayOrderMatch = categoryKey.match(/displayOrder=(\d+)/);
      
      return {
        id: idMatch ? parseInt(idMatch[1]) : 0,
        name: nameMatch ? nameMatch[1] : '',
        displayOrder: displayOrderMatch ? parseInt(displayOrderMatch[1]) : 0
      };
    }).sort((a, b) => (a.displayOrder || 0) - (b.displayOrder || 0));

    // Zainicjalizuj struktury dla każdej kategorii
    this.categories.forEach(category => {
      this.selectedCoverages[category.id] = [];
      this.customCoverages[category.id] = [''];
    });
  }

  private preselectCoverages(): void {
    // Zaznacz coverage'y, które są przypisane do serwisu
    this.categories.forEach(category => {
      const coveragesForCategory = this.getCoveragesForCategory(category.id);
      
      coveragesForCategory.forEach(coverage => {
        if (this.assignedCoverageIds.has(coverage.id)) {
          if (!this.selectedCoverages[category.id]) {
            this.selectedCoverages[category.id] = [];
          }
          this.selectedCoverages[category.id].push(coverage.id);
        }
      });
    });
  }

  private saveInitialState(): void {
    this.initialState = this.getCurrentState();
    this.hasChanges = false;
  }

  private getCurrentState(): string {
    return JSON.stringify({
      selectedCoverages: this.selectedCoverages,
      customCoverages: this.customCoverages,
      customCategories: this.customCategories
    });
  }

  private checkForChanges(): void {
    const currentState = this.getCurrentState();
    this.hasChanges = currentState !== this.initialState;
  }

  getCoveragesForCategory(categoryId: number): BikeRepairCoverage[] {
    if (!this.availableCoverages) return [];
    
    for (const [categoryKey, coverages] of Object.entries(this.availableCoverages.coveragesByCategory)) {
      const idMatch = categoryKey.match(/id=(\d+)/);
      if (idMatch && parseInt(idMatch[1]) === categoryId) {
        return coverages;
      }
    }
    return [];
  }

  toggleCoverage(categoryId: number, coverageId: number): void {
    if (!this.selectedCoverages[categoryId]) {
      this.selectedCoverages[categoryId] = [];
    }

    const index = this.selectedCoverages[categoryId].indexOf(coverageId);
    if (index > -1) {
      this.selectedCoverages[categoryId].splice(index, 1);
    } else {
      this.selectedCoverages[categoryId].push(coverageId);
    }
    
    this.checkForChanges();
  }

  isCoverageSelected(categoryId: number, coverageId: number): boolean {
    return this.selectedCoverages[categoryId]?.includes(coverageId) || false;
  }

  updateCustomCoverage(categoryId: number, index: number, value: string): void {
    if (this.customCoverages[categoryId]) {
      this.customCoverages[categoryId][index] = value;
      
      // Jeśli to ostatnie pole i nie jest puste, dodaj nowe
      if (index === this.customCoverages[categoryId].length - 1 && value.trim()) {
        this.addCustomCoverage(categoryId);
      }
      
      this.checkForChanges();
    }
  }

  addCustomCoverage(categoryId: number): void {
    if (!this.customCoverages[categoryId]) {
      this.customCoverages[categoryId] = [];
    }
    this.customCoverages[categoryId].push('');
    this.checkForChanges();
  }

  removeCustomCoverage(categoryId: number, index: number): void {
    if (this.customCoverages[categoryId]) {
      this.customCoverages[categoryId].splice(index, 1);
      this.checkForChanges();
    }
  }

  addCustomCategory(): void {
    this.customCategories.push({ name: '', coverages: [''] });
    this.checkForChanges();
  }

  removeCustomCategory(index: number): void {
    this.customCategories.splice(index, 1);
    this.checkForChanges();
  }

  updateCustomCategoryName(index: number, name: string): void {
    this.customCategories[index].name = name;
    this.checkForChanges();
  }

  addCustomCategoryItem(categoryIndex: number): void {
    this.customCategories[categoryIndex].coverages.push('');
    this.checkForChanges();
  }

  removeCustomCategoryItem(categoryIndex: number, itemIndex: number): void {
    this.customCategories[categoryIndex].coverages.splice(itemIndex, 1);
    this.checkForChanges();
  }

  updateCustomCategoryItem(categoryIndex: number, itemIndex: number, value: string): void {
    this.customCategories[categoryIndex].coverages[itemIndex] = value;
    
    const coverages = this.customCategories[categoryIndex].coverages;
    if (itemIndex === coverages.length - 1 && value.trim()) {
      this.addCustomCategoryItem(categoryIndex);
    }
    
    this.checkForChanges();
  }

  trackByFn(index: number): number {
    return index;
  }

  async saveChanges(): Promise<void> {
    if (!this.hasChanges) {
      this.notificationService.info('Brak zmian do zapisania');
      return;
    }

    this.isSaving = true;

    try {
      const coverageData = this.buildCoverageData();
      
      await firstValueFrom(
        this.http.put(
          `${environment.apiUrl}/bike-services-registered/my-service/repair-coverages`,
          coverageData,
          { 
            params: { serviceId: this.serviceId.toString() },
            headers: { 'Content-Type': 'application/json' }
          }
        )
      );

      this.notificationService.success('Zmiany zostały zapisane pomyślnie');
      
      // Odśwież dane i zapisz nowy stan początkowy
      await this.loadAssignedCoverages();
      this.saveInitialState();
      
    } catch (error: any) {
      console.error('Error saving changes:', error);
      
      if (error?.error?.message) {
        this.notificationService.error(`Błąd: ${error.error.message}`);
      } else {
        this.notificationService.error('Wystąpił błąd podczas zapisywania zmian');
      }
    } finally {
      this.isSaving = false;
    }
  }

  cancelChanges(): void {
    // Przeładuj dane aby przywrócić oryginalny stan
    this.loadData();
  }

  private buildCoverageData(): ServiceCoverageAssignmentDto {
    const data: ServiceCoverageAssignmentDto = {
      existingCoverageIds: [],
      newCategories: [],
      customCoverages: []
    };

    // 1. Zbierz wybrane istniejące coverage'y
    this.categories.forEach(category => {
      const selectedIds = this.selectedCoverages[category.id] || [];
      data.existingCoverageIds.push(...selectedIds);

      // 2. Dodaj niestandardowe coverage'y do istniejących kategorii
      const customCoveragesForCategory = this.customCoverages[category.id] || [];
      customCoveragesForCategory.forEach(coverageName => {
        if (coverageName.trim()) {
          data.customCoverages.push({
            categoryName: category.name,
            coverageName: coverageName.trim()
          });
        }
      });
    });

    // 3. Dodaj nowe kategorie
    const uniqueCategoryNames = new Set<string>();
    
    this.customCategories.forEach(customCategory => {
      if (customCategory.name.trim()) {
        const categoryName = customCategory.name.trim();
        
        if (!uniqueCategoryNames.has(categoryName)) {
          data.newCategories.push({
            name: categoryName
          });
          uniqueCategoryNames.add(categoryName);
        }

        // 4. Dodaj coverage'y dla nowych kategorii
        customCategory.coverages.forEach(coverageName => {
          if (coverageName.trim()) {
            data.customCoverages.push({
              categoryName: categoryName,
              coverageName: coverageName.trim()
            });
          }
        });
      }
    });

    return data;
  }
}