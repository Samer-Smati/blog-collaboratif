import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { ArticleService } from '../../core/services/article.service';
import { AuthService } from '../../core/services/auth.service';
import { Article } from '../../models/article.model';

@Component({
  selector: 'app-article-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule],
  templateUrl: './article-form.component.html',
  styleUrls: ['./article-form.component.scss'],
})
export class ArticleFormComponent implements OnInit {
  articleForm: FormGroup;
  isSubmitting = false;
  error = '';
  articleId: string | null = null;
  isEditing = false;

  constructor(
    private fb: FormBuilder,
    private articleService: ArticleService,
    private authService: AuthService,
    private router: Router,
    private route: ActivatedRoute
  ) {
    this.articleForm = this.fb.group({
      title: [
        '',
        [
          Validators.required,
          Validators.minLength(5),
          Validators.maxLength(100),
        ],
      ],
      content: ['', [Validators.required, Validators.minLength(20)]],
      tags: [''],
    });
  }

  ngOnInit(): void {
    this.articleId = this.route.snapshot.paramMap.get('id');
    this.isEditing = !!this.articleId;

    if (this.isEditing && this.articleId) {
      this.loadArticle(this.articleId);
    }
  }
  changeStatus(): void {
    if (!this.articleId) {
      this.error = 'Article ID is missing';
      return;
    }
    this.articleService.changeStatus(this.articleId, 'published').subscribe({
      next: () => {
        this.router.navigate(['/articles']);
      },
      error: (err) => {
        this.error = err.error?.message || 'Failed to change status';
        console.error(err);
      },
    });
  }
  loadArticle(id: string): void {
    this.articleService.getArticleById(id).subscribe({
      next: (article) => {
        this.articleForm.patchValue({
          title: article.title,
          content: article.content,
          tags: article.tags ? article.tags.join(', ') : '',
        });
      },
      error: (err) => {
        this.error = 'Failed to load article';
        console.error(err);
      },
    });
  }

  onSubmit(): void {
    if (this.articleForm.invalid) {
      return;
    }

    this.isSubmitting = true;
    this.error = '';

    // Process tags
    const tagsString = this.articleForm.value.tags;
    const tags = tagsString
      ? tagsString
          .split(',')
          .map((tag: string) => tag.trim())
          .filter((tag: string) => tag)
      : [];

    const articleData: Article = {
      title: this.articleForm.value.title,
      content: this.articleForm.value.content,
      tags: tags,
      author: undefined, // Will be set by the backend based on the authenticated user
    };

    const request =
      this.isEditing && this.articleId
        ? this.articleService.updateArticle(this.articleId, articleData)
        : this.articleService.createArticle(articleData);

    request.subscribe({
      next: () => {
        this.router.navigate(['/articles']);
      },
      error: (err) => {
        this.isSubmitting = false;
        this.error = err.error?.message || 'Failed to save article';
        console.error(err);
      },
    });
  }
}
