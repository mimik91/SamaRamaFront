import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { Bicycle } from './bicycle.model';

@Injectable({
  providedIn: 'root'
})
export class BicycleSelectionService {
  private selectedBicyclesSubject = new BehaviorSubject<Bicycle[]>([]);
  
  // Observable for components to subscribe to
  selectedBicycles$ = this.selectedBicyclesSubject.asObservable();
  
  constructor() {}

  /**
   * Select bicycles for servicing
   * @param bicycles - Array of bicycles to select
   */
  selectBicycles(bicycles: Bicycle[]): void {
    this.selectedBicyclesSubject.next(bicycles);
  }

  /**
   * Add a single bicycle to selection
   * @param bicycle - Bicycle to add to selection
   */
  addBicycle(bicycle: Bicycle): void {
    const currentBicycles = this.selectedBicyclesSubject.getValue();
    
    // Check if bicycle already exists in the selection
    if (!currentBicycles.some(b => b.id === bicycle.id)) {
      this.selectedBicyclesSubject.next([...currentBicycles, bicycle]);
    }
  }

  /**
   * Remove a bicycle from selection
   * @param bicycleId - ID of the bicycle to remove
   */
  removeBicycle(bicycleId: number): void {
    const currentBicycles = this.selectedBicyclesSubject.getValue();
    this.selectedBicyclesSubject.next(
      currentBicycles.filter(b => b.id !== bicycleId)
    );
  }

  /**
   * Clear all selected bicycles
   */
  clearSelection(): void {
    this.selectedBicyclesSubject.next([]);
  }

  /**
   * Get the currently selected bicycles
   */
  getSelectedBicycles(): Bicycle[] {
    return this.selectedBicyclesSubject.getValue();
  }

  /**
   * Check if any bicycles are selected
   */
  hasSelectedBicycles(): boolean {
    return this.selectedBicyclesSubject.getValue().length > 0;
  }
}