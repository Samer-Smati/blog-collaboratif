import { Component, OnInit, Output, EventEmitter, Input } from '@angular/core';
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
  @Input() tags: string[] = [];

  searchTerm = '';
  searchTerms = new Subject<string>();
  selectedTags: string[] = [];
  isLoading = false;

  constructor(private articleService: ArticleService) {}

  ngOnInit(): void {
    // Set up search with debounce
    this.searchTerms
      .pipe(debounceTime(300), distinctUntilChanged())
      .subscribe((term) => {
        console.log('term ===>', term);
        this.searchTerm = term;
        this.search();
      });
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
