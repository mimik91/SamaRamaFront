import { Component, Input, OnInit, OnDestroy, AfterViewInit, ViewChild, ElementRef, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { forkJoin } from 'rxjs';
import { Chart, registerables } from 'chart.js';
import { ServiceStatsService } from './service-stats.service';
import { MonthlyOrderStatsDto, TechnicianStatsDto } from '../../../shared/models/service-stats.models';

Chart.register(...registerables);

const MONTH_LABELS = [
  'sty', 'lut', 'mar', 'kwi', 'maj', 'cze', 'lip', 'sie', 'wrz', 'paź', 'lis', 'gru'
];

/**
 * Statystyki serwisu: wykres słupkowy zleceń/miesiąc (rollujące okno 13 miesięcy) + tabela
 * wykonanych zleceń/przychodu per serwisant. Dane przeliczane nocnym jobem po stronie backendu —
 * mogą być puste, dopóki job się nie uruchomi po raz pierwszy (patrz PLANNED_CHANGES.md, wpis nr 3).
 */
@Component({
  selector: 'app-service-admin-stats',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './service-admin-stats.component.html',
  styleUrls: ['./service-admin-stats.component.css']
})
export class ServiceAdminStatsComponent implements OnInit, AfterViewInit, OnDestroy {
  private statsService = inject(ServiceStatsService);

  @Input() serviceId!: number;
  @ViewChild('chartCanvas') chartCanvas?: ElementRef<HTMLCanvasElement>;

  loading = true;
  loadError = false;

  monthlyStats: MonthlyOrderStatsDto[] = [];
  technicianStats: TechnicianStatsDto[] = [];

  private chart: Chart | null = null;
  private viewReady = false;

  get totalCompletedOrders(): number {
    return this.technicianStats.reduce((sum, t) => sum + t.completedOrdersCount, 0);
  }

  get totalRevenue(): number {
    return this.technicianStats.reduce((sum, t) => sum + t.totalRevenue, 0);
  }

  ngOnInit(): void {
    forkJoin({
      monthly: this.statsService.getMonthlyOrderStats(this.serviceId),
      technicians: this.statsService.getTechnicianStats(this.serviceId)
    }).subscribe({
      next: ({ monthly, technicians }) => {
        this.monthlyStats = monthly;
        this.technicianStats = technicians.sort((a, b) => b.completedOrdersCount - a.completedOrdersCount);
        this.loading = false;
        this.renderChartWhenReady();
      },
      error: () => {
        this.loading = false;
        this.loadError = true;
      }
    });
  }

  ngAfterViewInit(): void {
    this.viewReady = true;
    this.renderChartWhenReady();
  }

  private renderChartWhenReady(): void {
    if (!this.viewReady || this.loading || this.loadError || !this.chartCanvas) return;

    this.chart?.destroy();

    this.chart = new Chart(this.chartCanvas.nativeElement, {
      type: 'bar',
      data: {
        labels: this.monthlyStats.map(m => `${MONTH_LABELS[m.month - 1]} ${m.year}`),
        datasets: [{
          label: 'Zlecenia',
          data: this.monthlyStats.map(m => m.orderCount),
          backgroundColor: '#1B5E20',
          borderRadius: 4
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false }
        },
        scales: {
          y: {
            beginAtZero: true,
            ticks: { precision: 0 }
          }
        }
      }
    });
  }

  ngOnDestroy(): void {
    this.chart?.destroy();
  }
}
