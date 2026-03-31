import { Component, Input, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { forkJoin } from 'rxjs';
import { ServiceProfileService } from './service-profile.service';
import {
  BikeServicePublicInfo,
  ServiceActiveStatus
} from '../../shared/models/bike-service-common.models';

@Component({
  selector: 'app-service-nav',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './service-nav.component.html',
  styleUrls: ['./service-nav.component.css']
})
export class ServiceNavComponent implements OnInit {
  @Input() suffix!: string;
  @Input() publicInfo: BikeServicePublicInfo | null = null;
  @Input() activeStatus: ServiceActiveStatus | null = null;

  private profileService = inject(ServiceProfileService);

  ngOnInit(): void {
    if (!this.suffix) return;
    if (!this.publicInfo || !this.activeStatus) {
      this.loadNavData();
    }
  }

  private loadNavData(): void {
    this.profileService.getServiceIdBySuffix(this.suffix).subscribe({
      next: (res) => {
        forkJoin({
          publicInfo: this.profileService.getPublicInfo(res.id),
          activeStatus: this.profileService.getActiveStatus(res.id)
        }).subscribe({
          next: ({ publicInfo, activeStatus }) => {
            this.publicInfo = publicInfo;
            this.activeStatus = activeStatus;
          },
          error: () => {}
        });
      },
      error: () => {}
    });
  }
}
