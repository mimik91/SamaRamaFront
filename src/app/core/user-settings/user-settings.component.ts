import { Component, ElementRef, HostListener, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../../auth/auth.service';
import { NotificationService } from '../notification.service';

@Component({
  selector: 'app-user-settings',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './user-settings.component.html',
  styleUrls: ['./user-settings.component.css']
})
export class UserSettingsComponent implements OnInit {
  private authService = inject(AuthService);
  private router = inject(Router);
  private notificationService = inject(NotificationService);
  private elementRef = inject(ElementRef);

  isOpen: boolean = false;
  userEmail: string = '';
  userName: string = '';
  userRole: string = '';

  ngOnInit(): void {
    this.getUserInfo();
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    // Close the dropdown if clicked outside
    if (!this.elementRef.nativeElement.contains(event.target)) {
      this.isOpen = false;
    }
  }

  toggleDropdown(event: Event): void {
    console.log('Toggle dropdown clicked');
    event.stopPropagation();
    this.isOpen = !this.isOpen;
  }

  logout(event: Event): void {
    event.preventDefault();
    this.isOpen = false;
    this.authService.logout();
    this.notificationService.success('Zostałeś wylogowany');
    this.router.navigate(['/login']);
  }

  navigateToAccount(event: Event): void {
    event.preventDefault();
    this.isOpen = false;
    // Navigate to the account page
    this.router.navigate(['/account']);
  }

  private getUserInfo(): void {
    const email = this.authService.getCurrentUserEmail();
    if (email) {
      this.userEmail = email;
    }

    const name = this.authService.getCurrentUserName();
    if (name) {
      this.userName = name;
    }
    
    const role = this.authService.getUserRole();
    if (role) {
      this.userRole = role;
    }
  }
}