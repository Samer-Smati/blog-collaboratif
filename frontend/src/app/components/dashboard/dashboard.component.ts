import { Component, OnInit, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { AnalyticsService } from '../../core/services/analytics.service';
import { ArticleService } from '../../core/services/article.service';
import { UserService } from '../../core/services/user.service';
import { Chart, registerables } from 'chart.js';

// Register Chart.js components
Chart.register(...registerables);

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss'],
})
export class DashboardComponent implements OnInit, OnChanges {
  stats = {
    totalArticles: 0,
    totalComments: 0,
    totalUsers: 0,
  };

  popularArticles: any[] = [];
  recentArticles: any[] = [];
  userStats: any[] = [];
  isLoading = true;
  error = '';

  // Add these missing properties
  articleGrowthData: any[] = [];
  tagDistributionData: any[] = [];
  userRoleData: any[] = [];

  // Chart objects
  articleGrowthChart: any;
  tagDistributionChart: any;
  userRoleChart: any;

  isExporting = false;
  exportError = '';

  constructor(
    private analyticsService: AnalyticsService,
    private articleService: ArticleService,
    private userService: UserService
  ) {}

  ngOnInit(): void {
    this.loadDashboardData();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['stats']) {
      this.renderCharts();
    }
  }

  loadDashboardData(): void {
    this.isLoading = true;

    // Get statistics
    this.analyticsService.getArticleStats().subscribe({
      next: (data) => {
        this.stats.totalArticles = data.stats.totalArticles;
        this.stats.totalComments = data.stats.totalComments;
        this.loadUserCount();
      },
      error: (err) => {
        this.error = 'Failed to load article statistics';
        this.isLoading = false;
        console.error(err);
      },
    });

    // Get popular articles
    this.analyticsService.getPopularArticles().subscribe({
      next: (data) => {
        this.popularArticles = data.popularArticles;
      },
      error: (err) => {
        console.error('Failed to load popular articles:', err);
      },
    });

    // Get recent articles
    this.articleService.getArticles(1, 5).subscribe({
      next: (data) => {
        this.recentArticles = data.items;
      },
      error: (err) => {
        console.error('Failed to load recent articles:', err);
      },
    });

    // Get tags data for chart
    this.analyticsService.getArticlesByTag().subscribe({
      next: (data) => {
        this.tagDistributionData = data.tagStats;
        this.renderTagDistributionChart(data.tagStats);
      },
      error: (err) => {
        console.error('Failed to load tag statistics:', err);
      },
    });

    // Get article growth data for chart
    this.analyticsService.getArticleGrowth().subscribe({
      next: (data) => {
        this.articleGrowthData = data.articleGrowth;
        this.renderArticleGrowthChart(data.articleGrowth);
      },
      error: (err) => {
        console.error('Failed to load article growth data:', err);
      },
    });
  }

  loadUserCount(): void {
    this.userService.getUserStats().subscribe({
      next: (data) => {
        this.stats.totalUsers = data.totalUsers;
        this.userStats = data.roleDistribution;
        this.userRoleData = data.roleDistribution;
        this.isLoading = false;
        this.renderUserRoleChart();
      },
      error: (err) => {
        this.error = 'Failed to load user statistics';
        this.isLoading = false;
        console.error(err);
      },
    });
  }

  renderTagDistributionChart(tagStats: any[]): void {
    if (this.tagDistributionChart) {
      this.tagDistributionChart.destroy();
    }

    const ctx = document.getElementById(
      'tagDistributionChart'
    ) as HTMLCanvasElement;
    if (!ctx) return;

    const labels = tagStats.map((stat) => stat.tag);
    const data = tagStats.map((stat) => stat.count);

    this.tagDistributionChart = new Chart(ctx, {
      type: 'pie',
      data: {
        labels: labels,
        datasets: [
          {
            data: data,
            backgroundColor: [
              '#4285F4',
              '#34A853',
              '#FBBC05',
              '#EA4335',
              '#8F00FF',
              '#00C6FF',
              '#FF5722',
              '#009688',
            ],
          },
        ],
      },
      options: {
        responsive: true,
        plugins: {
          legend: {
            position: 'right',
          },
          title: {
            display: true,
            text: 'Article Distribution by Tags',
          },
        },
      },
    });
  }

  renderArticleGrowthChart(growthData: any[]): void {
    if (this.articleGrowthChart) {
      this.articleGrowthChart.destroy();
    }

    const ctx = document.getElementById(
      'articleGrowthChart'
    ) as HTMLCanvasElement;
    if (!ctx) return;

    const labels = growthData.map((data) => data.month);
    const articleData = growthData.map((data) => data.count);

    this.articleGrowthChart = new Chart(ctx, {
      type: 'line',
      data: {
        labels: labels,
        datasets: [
          {
            label: 'New Articles',
            data: articleData,
            fill: false,
            borderColor: '#4285F4',
            tension: 0.1,
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
        plugins: {
          title: {
            display: true,
            text: 'Article Growth Over Time',
          },
        },
      },
    });
  }

  renderCharts(): void {
    if (this.articleGrowthData && this.articleGrowthData.length > 0) {
      this.renderArticleGrowthChart(this.articleGrowthData);
    }

    if (this.tagDistributionData && this.tagDistributionData.length > 0) {
      this.renderTagDistributionChart(this.tagDistributionData);
    }

    if (this.userRoleData && this.userRoleData.length > 0) {
      this.renderUserRoleChart();
    }
  }

  private renderUserRoleChart(): void {
    if (this.userRoleChart) {
      this.userRoleChart.destroy();
    }

    const ctx = document.getElementById('userRoleChart') as HTMLCanvasElement;
    if (!ctx || !this.userRoleData) return;

    const labels = this.userRoleData.map((item: any) => item.role);
    const data = this.userRoleData.map((item: any) => item.count);

    this.userRoleChart = new Chart(ctx, {
      type: 'doughnut',
      data: {
        labels: labels,
        datasets: [
          {
            data: data,
            backgroundColor: [
              '#4285F4', // Admin - blue
              '#EA4335', // Editor - red
              '#FBBC05', // Writer - yellow
              '#34A853', // Reader - green
            ],
          },
        ],
      },
      options: {
        responsive: true,
        plugins: {
          legend: {
            position: 'right',
          },
          title: {
            display: true,
            text: 'User Role Distribution',
          },
        },
      },
    });
  }

  exportAnalytics(format: 'csv' | 'json'): void {
    this.isExporting = true;

    this.analyticsService.exportArticleStats(format).subscribe({
      next: (data) => {
        this.isExporting = false;

        // Create a download link
        const url = window.URL.createObjectURL(data);
        const a = document.createElement('a');
        a.href = url;
        a.download = `article-stats.${format}`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        a.remove();
      },
      error: (err) => {
        this.isExporting = false;
        this.exportError = 'Failed to export analytics data';
        console.error(err);
      },
    });
  }
}
