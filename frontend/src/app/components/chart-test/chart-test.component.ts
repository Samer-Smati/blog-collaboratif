import { Component, OnInit, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import Chart from 'chart.js/auto';

@Component({
  selector: 'app-chart-test',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="container mt-5">
      <div class="row">
        <div class="col-md-6">
          <div class="card">
            <div class="card-header">Test Chart</div>
            <div class="card-body">
              <canvas id="testChart"></canvas>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [
    `
      .container {
        max-width: 800px;
      }
    `,
  ],
})
export class ChartTestComponent implements AfterViewInit {
  constructor() {}

  ngAfterViewInit(): void {
    console.log('ChartTest component initialized');
    this.createTestChart();
  }

  private createTestChart(): void {
    try {
      const canvas = document.getElementById('testChart') as HTMLCanvasElement;
      if (!canvas) {
        console.error('Test chart canvas not found');
        return;
      }

      console.log('Test canvas found, creating chart');

      const chart = new Chart(canvas, {
        type: 'bar',
        data: {
          labels: ['Red', 'Blue', 'Yellow', 'Green', 'Purple', 'Orange'],
          datasets: [
            {
              label: '# of Votes',
              data: [12, 19, 3, 5, 2, 3],
              backgroundColor: [
                'rgba(255, 99, 132, 0.5)',
                'rgba(54, 162, 235, 0.5)',
                'rgba(255, 206, 86, 0.5)',
                'rgba(75, 192, 192, 0.5)',
                'rgba(153, 102, 255, 0.5)',
                'rgba(255, 159, 64, 0.5)',
              ],
              borderColor: [
                'rgba(255, 99, 132, 1)',
                'rgba(54, 162, 235, 1)',
                'rgba(255, 206, 86, 1)',
                'rgba(75, 192, 192, 1)',
                'rgba(153, 102, 255, 1)',
                'rgba(255, 159, 64, 1)',
              ],
              borderWidth: 1,
            },
          ],
        },
        options: {
          responsive: true,
          scales: {
            y: {
              beginAtZero: true,
            },
          },
        },
      });

      console.log('Test chart created successfully');
    } catch (error) {
      console.error('Error creating test chart:', error);
    }
  }
}
