// src/app/bicycles/delete-dialog/delete-dialog.component.ts
import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-delete-dialog',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="dialog-backdrop" (click)="onCancelClick()">
      <div class="dialog-container" (click)="$event.stopPropagation()">
        <h2 class="dialog-title">Potwierdź usunięcie</h2>
        
        <div class="dialog-content">
          <p>Czy na pewno chcesz usunąć ten rower?</p>
          <p class="warning-text">Tej operacji nie można cofnąć.</p>
        </div>
        
        <div class="dialog-actions">
          <button class="cancel-btn" (click)="onCancelClick()">Anuluj</button>
          <button class="confirm-btn" (click)="onConfirmClick()">Usuń</button>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .dialog-backdrop {
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background-color: rgba(0, 0, 0, 0.5);
      display: flex;
      justify-content: center;
      align-items: center;
      z-index: 1000;
    }
    
    .dialog-container {
      background-color: white;
      border-radius: 8px;
      padding: 24px;
      width: 90%;
      max-width: 400px;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
    }
    
    .dialog-title {
      margin: 0 0 16px 0;
      color: #333;
      font-size: 1.5rem;
    }
    
    .dialog-content {
      margin-bottom: 24px;
    }
    
    .warning-text {
      color: #e74c3c;
      font-weight: 500;
    }
    
    .dialog-actions {
      display: flex;
      justify-content: flex-end;
      gap: 12px;
    }
    
    .cancel-btn, .confirm-btn {
      padding: 8px 16px;
      border-radius: 4px;
      font-weight: 500;
      cursor: pointer;
    }
    
    .cancel-btn {
      background-color: #f1f1f1;
      border: 1px solid #ddd;
      color: #333;
    }
    
    .confirm-btn {
      background-color: #e74c3c;
      border: none;
      color: white;
    }
    
    .confirm-btn:hover {
      background-color: #c0392b;
    }
  `]
})
export class DeleteDialogComponent {
  private result: boolean = false;
  private resolver: ((result: boolean) => void) | null = null;
  
  show(): Promise<boolean> {
    return new Promise<boolean>((resolve) => {
      this.resolver = resolve;
    });
  }
  
  onConfirmClick(): void {
    this.result = true;
    if (this.resolver) {
      this.resolver(true);
      this.resolver = null;
    }
  }
  
  onCancelClick(): void {
    this.result = false;
    if (this.resolver) {
      this.resolver(false);
      this.resolver = null;
    }
  }
}