import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { ArticleService } from '../../core/services/article.service';
import { AuthService } from '../../core/services/auth.service';
import { Article } from '../../models/article.model';
import { ArticleSearchComponent } from '../article-search/article-search.component';

@Component({
  selector: 'app-article-list',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule, ArticleSearchComponent],
  templateUrl: './article-list.component.html',
  styleUrls: ['./article-list.component.scss'],
})
export class ArticleListComponent implements OnInit {
  articles: Article[] = [];
  filteredArticles: Article[] = [];
  tags: any[] = [];
  isLoading = true;
  error = '';
  currentPage = 1;
  totalPages = 1;
  totalArticles = 0;
  pageSize = 10;
  sortBy = 'createdAt';
  sortDirection = 'desc';
  isFiltering = false;
  selectedTag: string | null = null;

  // Add Math property to make it available in the template
  Math = Math;

  constructor(
    private articleService: ArticleService,
    public authService: AuthService
  ) {}

  ngOnInit(): void {
    this.loadArticles();
  }

  loadArticles(): void {
    this.isLoading = true;

    this.articleService
      .getArticles(
        this.currentPage,
        this.pageSize,
        this.sortBy,
        this.sortDirection
      )
      .subscribe({
        next: (data) => {
          this.articles = data.items;
          this.tags = [
            ...new Set(this.articles.flatMap((article) => article.tags || [])),
          ];
          this.filteredArticles = [...this.articles];
          this.totalArticles = data.total;
          this.totalPages = Math.ceil(this.totalArticles / this.pageSize);
          this.isLoading = false;
        },
        error: (err) => {
          this.error = 'Failed to load articles';
          this.isLoading = false;
          console.error(err);
        },
      });
  }

  changePage(newPage: number): void {
    if (newPage < 1 || newPage > this.totalPages) {
      return;
    }

    this.currentPage = newPage;

    if (this.isFiltering) {
      // If filtering, just apply the filter again
      return;
    }

    this.loadArticles();
  }

  changeSort(sortField: string): void {
    if (this.sortBy === sortField) {
      // Toggle sort direction
      this.sortDirection = this.sortDirection === 'asc' ? 'desc' : 'asc';
    } else {
      // New sort field
      this.sortBy = sortField;
      this.sortDirection = 'desc'; // Default to descending
    }

    if (this.isFiltering) {
      this.sortFilteredArticles();
    } else {
      this.loadArticles();
    }
  }

  getSortIcon(field: string): string {
    if (this.sortBy !== field) {
      return 'bi-chevron-expand';
    }

    return this.sortDirection === 'asc' ? 'bi-chevron-up' : 'bi-chevron-down';
  }

  handleSearchResults(data: any): void {
    this.filteredArticles = data.items || data;
    this.isFiltering = true;

    // When filtering, we manage pagination on the client side
    this.totalArticles = this.filteredArticles.length;
    this.totalPages = Math.ceil(this.totalArticles / this.pageSize);
    this.currentPage = 1;

    // Apply client-side sorting
    this.sortFilteredArticles();
  }

  resetFilter(): void {
    this.isFiltering = false;
    this.selectedTag = null;
    this.loadArticles();
  }

  filterByTag(tag: string): void {
    this.selectedTag = tag;
    this.isFiltering = true;

    this.articleService.getArticlesByTag(tag).subscribe({
      next: (data) => {
        this.filteredArticles = data.items;
        this.totalArticles = this.filteredArticles.length;
        this.totalPages = Math.ceil(this.totalArticles / this.pageSize);
        this.currentPage = 1;
        this.sortFilteredArticles();
      },
      error: (err) => {
        console.error('Failed to filter by tag:', err);
      },
    });
  }

  private sortFilteredArticles(): void {
    // Client-side sorting of filtered articles
    this.filteredArticles.sort((a, b) => {
      let valA = a[this.sortBy as keyof Article];
      let valB = b[this.sortBy as keyof Article];

      // Handle date strings
      if (
        typeof valA === 'string' &&
        (this.sortBy === 'createdAt' || this.sortBy === 'updatedAt')
      ) {
        valA = new Date(valA).getTime();
        valB = new Date(valB as string).getTime();
      }

      // Handle undefined values to ensure safe comparison
      if (valA === undefined && valB === undefined) {
        return 0;
      }

      if (valA === undefined) {
        return this.sortDirection === 'asc' ? 1 : -1; // Undefined values go last in asc, first in desc
      }

      if (valB === undefined) {
        return this.sortDirection === 'asc' ? -1 : 1; // Undefined values go last in asc, first in desc
      }

      // Now we can safely compare the values
      if (valA < valB) {
        return this.sortDirection === 'asc' ? -1 : 1;
      }
      if (valA > valB) {
        return this.sortDirection === 'asc' ? 1 : -1;
      }
      return 0;
    });
  }

  getDisplayedArticles(): Article[] {
    const start = (this.currentPage - 1) * this.pageSize;
    const end = Math.min(start + this.pageSize, this.totalArticles);

    if (this.isFiltering) {
      return this.filteredArticles.slice(start, end);
    }

    return this.articles;
  }

  trackByArticleId(index: number, article: Article): string {
    return article._id || String(index);
  }
}
