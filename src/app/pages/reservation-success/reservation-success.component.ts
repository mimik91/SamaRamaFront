import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, ActivatedRoute } from '@angular/router';
import { environment } from '../../environments/environments';

@Component({
  selector: 'app-reservation-success',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './reservation-success.component.html',
  styleUrls: ['./reservation-success.component.css']
})
export class ReservationSuccessComponent implements OnInit {
  private router = inject(Router);
  private route = inject(ActivatedRoute);

  serviceSuffix: string | null = null;

  ngOnInit(): void {
    this.serviceSuffix = this.route.snapshot.paramMap.get('suffix');
  }

  goToHomepage(): void {
    this.router.navigate([environment.links.homepage]);
  }

  goToServiceProfile(): void {
    if (this.serviceSuffix) {
      this.router.navigate(['/', this.serviceSuffix]);
    }
  }
}
