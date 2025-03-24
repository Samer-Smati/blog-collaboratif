import { Component, OnInit, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ArticleService } from '../../core/services/article.service';
import { debounceTime, distinctUntilChanged, Subject } from 'rxjs';

@Component({
  selector: 'app-article-search',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './article-search.component.html',
  styleUrls: ['./article-search.component.scss'],
})
export class ArticleSearchComponent implements OnInit {
  @Output() searchResults = new EventEmitter<any>();
  @Output() resetSearch = new EventEmitter<void>();

  searchTerm = '';
  searchTerms = new Subject<string>();
  tags: string[] = [];
  selectedTags: string[] = [];
  isLoading = false;

  constructor(private articleService: ArticleService) {}

  ngOnInit(): void {
    this.loadTags();

    // Set up search with debounce
    this.searchTerms
      .pipe(debounceTime(300), distinctUntilChanged())
      .subscribe((term) => {
        this.searchTerm = term;
        this.search();
      });
  }

  loadTags(): void {
    // Temporarily disable tag loading until backend is fixed
    this.tags = []; // Just use an empty array for now

    // Comment out the API call that's causing errors
    /*
    this.articleService.getAllTags().subscribe({
      next: (tags) => {
        this.tags = tags;
      },
      error: (err) => {
        console.error('Error loading tags', err);
      }
    });
    */
  }

  onSearch(term: string): void {
    this.searchTerms.next(term);
  }

  toggleTag(tag: string): void {
    const index = this.selectedTags.indexOf(tag);
    if (index === -1) {
      this.selectedTags.push(tag);
    } else {
      this.selectedTags.splice(index, 1);
    }
    this.search();
  }

  search(): void {
    if (!this.searchTerm && this.selectedTags.length === 0) {
      this.resetSearch.emit();
      return;
    }

    this.isLoading = true;

    this.articleService
      .searchArticles(this.searchTerm, this.selectedTags)
      .subscribe({
        next: (data) => {
          this.searchResults.emit(data);
          this.isLoading = false;
        },
        error: (err) => {
          console.error('Error searching articles', err);
          this.isLoading = false;
        },
      });
  }

  clearSearch(): void {
    this.searchTerm = '';
    this.selectedTags = [];
    this.resetSearch.emit();
  }
}
