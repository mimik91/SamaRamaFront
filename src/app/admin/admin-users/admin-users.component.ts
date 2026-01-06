import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup } from '@angular/forms';
import { Router } from '@angular/router';
import { AdminService } from '../admin-service';
import { AdminUser } from '../../shared/models/admin.models';
import { NotificationService } from '../../core/notification.service';

@Component({
  selector: 'app-admin-users',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './admin-users.component.html',
  styleUrls: ['./admin-users.component.css']
})
export class AdminUsersComponent implements OnInit {
  private adminService = inject(AdminService);
  private notificationService = inject(NotificationService);
  private fb = inject(FormBuilder);
  private router = inject(Router);

  // Data
  users: AdminUser[] = [];
  filteredUsers: AdminUser[] = [];
  selectedUser: AdminUser | null = null;
  
  // UI State
  loading = true;
  error: string | null = null;
  isEditingRoles = false;
  saving = false;
  
  // Search and filters
  searchForm: FormGroup;
  
  // Pagination
  currentPage = 0;
  pageSize = 20;
  totalElements = 0;
  totalPages = 0;
  
  constructor() {
    this.searchForm = this.fb.group({
      searchTerm: [''],
      role: [''],
      verified: ['']
    });
  }

  ngOnInit(): void {
    this.loadUsers();
  }
  
  loadUsers(): void {
    this.loading = true;
    this.error = null;
    
    this.adminService.getAllUsers().subscribe({
      next: (users) => {
        console.log('Raw users data:', users);
        this.users = Array.isArray(users) ? users : [];
        this.applyFilters();
        this.loading = false;
        console.log('Users loaded:', this.users);
        
        // Setup form changes listener AFTER data is loaded
        this.searchForm.valueChanges.subscribe(() => {
          this.applyFilters();
        });
      },
      error: (err) => {
        console.error('Error loading users:', err);
        this.error = 'Nie udało się załadować użytkowników';
        this.loading = false;
        this.users = [];
        this.filteredUsers = [];
        this.notificationService.error(this.error);
      }
    });
  }
  
  applyFilters(): void {
    // Safety check - ensure users is an array
    if (!Array.isArray(this.users)) {
      console.warn('Users is not an array, initializing as empty array');
      this.users = [];
    }
    
    const searchTerm = this.searchForm.get('searchTerm')?.value?.toLowerCase() || '';
    const role = this.searchForm.get('role')?.value || '';
    const verified = this.searchForm.get('verified')?.value;
    
    console.log('Applying filters:', { searchTerm, role, verified });
    console.log('Users to filter:', this.users);
    
    this.filteredUsers = this.users.filter(user => {
      // Safety check for user object
      if (!user || typeof user !== 'object') {
        console.warn('Invalid user object:', user);
        return false;
      }
      
      const matchesSearch = !searchTerm || 
        (user.email && user.email.toLowerCase().includes(searchTerm)) ||
        (user.firstName && user.firstName.toLowerCase().includes(searchTerm)) ||
        (user.lastName && user.lastName.toLowerCase().includes(searchTerm));
      
      const matchesRole = !role || (Array.isArray(user.roles) && user.roles.includes(role));
      
      const matchesVerified = verified === '' || user.verified === (verified === 'true');
      
      return matchesSearch && matchesRole && matchesVerified;
    });
    
    console.log('Filtered users:', this.filteredUsers);
    
    this.totalElements = this.filteredUsers.length;
    this.totalPages = Math.ceil(this.totalElements / this.pageSize);
    this.currentPage = 0;
  }
  
  get paginatedUsers(): AdminUser[] {
    const start = this.currentPage * this.pageSize;
    const end = start + this.pageSize;
    return this.filteredUsers.slice(start, end);
  }
  
  selectUser(user: AdminUser): void {
    this.selectedUser = user;
    this.isEditingRoles = false;
    console.log('Selected user:', user);
  }
  
  startEditingRoles(): void {
    this.isEditingRoles = true;
  }
  
  cancelEditingRoles(): void {
    this.isEditingRoles = false;
  }
  
  updateUserRoles(userId: number, newRoles: string[]): void {
    this.saving = true;
    console.log('Updating user roles:', { userId, newRoles });
    
    this.adminService.updateUserRoles(userId, new Set(newRoles)).subscribe({
      next: (response) => {
        console.log('Roles updated successfully:', response);
        this.notificationService.success('Role użytkownika zostały zaktualizowane');
        this.isEditingRoles = false;
        this.saving = false;
        
        // Update local user data
        if (this.selectedUser && this.selectedUser.id === userId) {
          this.selectedUser.roles = newRoles;
        }
        
        // Update in main list
        const userIndex = this.users.findIndex(u => u.id === userId);
        if (userIndex !== -1) {
          this.users[userIndex].roles = newRoles;
        }
        
        this.applyFilters();
      },
      error: (err) => {
        console.error('Error updating user roles:', err);
        this.saving = false;
        this.notificationService.error(err.error?.message || 'Nie udało się zaktualizować ról użytkownika');
      }
    });
  }
  
  toggleRole(role: string): void {
    if (!this.selectedUser) {
      console.warn('No user selected');
      return;
    }
    
    const currentRoles = Array.isArray(this.selectedUser.roles) ? [...this.selectedUser.roles] : [];
    const hasRole = currentRoles.includes(role);
    
    console.log('Toggling role:', { role, hasRole, currentRoles });
    
    let newRoles: string[];
    if (hasRole) {
      // Remove role
      newRoles = currentRoles.filter(r => r !== role);
    } else {
      // Add role
      newRoles = [...currentRoles, role];
    }
    
    this.updateUserRoles(this.selectedUser.id, newRoles);
  }
  
  hasRole(role: string): boolean {
    if (!this.selectedUser || !Array.isArray(this.selectedUser.roles)) {
      return false;
    }
    return this.selectedUser.roles.includes(role);
  }
  
  getUserRoleDisplay(roles: string[]): string {
    if (!Array.isArray(roles)) {
      return 'Brak ról';
    }
    
    const roleMap: Record<string, string> = {
      'ROLE_ADMIN': 'Administrator',
      'ROLE_MODERATOR': 'Moderator',
      'ROLE_CLIENT': 'Klient',
      'ROLE_SERVICE': 'Serwisant'
    };
    
    return roles.map(role => roleMap[role] || role).join(', ');
  }
  
  nextPage(): void {
    if (this.currentPage < this.totalPages - 1) {
      this.currentPage++;
    }
  }
  
  previousPage(): void {
    if (this.currentPage > 0) {
      this.currentPage--;
    }
  }
  
  goToPage(page: number): void {
    if (page >= 0 && page < this.totalPages) {
      this.currentPage = page;
    }
  }
  
  clearSearch(): void {
    this.searchForm.reset({
      searchTerm: '',
      role: '',
      verified: ''
    });
  }
  
  goBack(): void {
    this.router.navigate(['/admin-dashboard']);
  }
}