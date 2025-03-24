import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, ActivatedRoute, Router } from '@angular/router';
import {
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { ArticleService } from '../../core/services/article.service';
import { AuthService } from '../../core/services/auth.service';
import { Article } from '../../models/article.model';
import { Comment } from '../../models/comment.model';
import { SocketService } from '../../core/services/socket.service';
import { CommentService } from '../../core/services/comment.service';

@Component({
  selector: 'app-article-detail',
  standalone: true,
  imports: [CommonModule, RouterModule, ReactiveFormsModule],
  templateUrl: './article-detail.component.html',
  styleUrls: ['./article-detail.component.scss'],
})
export class ArticleDetailComponent implements OnInit, OnDestroy {
  article: Article | null = null;
  comments: Comment[] = [];
  isLoading = true;
  error = '';
  commentForm: FormGroup;
  isSubmittingComment = false;
  currentUserRole = '';
  currentUserId = '';
  replyingTo: string | null = null;
  replyForm: FormGroup;
  commentsCount = 0;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private articleService: ArticleService,
    private commentService: CommentService,
    public authService: AuthService,
    private socketService: SocketService,
    private fb: FormBuilder
  ) {
    this.commentForm = this.fb.group({
      content: ['', [Validators.required, Validators.minLength(3)]],
    });

    this.replyForm = this.fb.group({
      content: ['', [Validators.required, Validators.minLength(3)]],
    });

    this.currentUserRole = this.authService.getUserRole();
    this.currentUserId = this.authService.getUserId();
  }

  ngOnInit(): void {
    this.loadArticle();

    // Connect to socket
    this.socketService.connect();

    // Listen for real-time comment updates
    this.setupSocketListeners();
  }

  ngOnDestroy(): void {
    // Leave article room and clean up socket listeners
    if (this.article && this.article._id) {
      this.socketService.leaveArticleRoom(this.article._id);
    }
  }

  private setupSocketListeners(): void {
    // New comment received
    this.socketService.onNewComment().subscribe((comment) => {
      if (comment.articleId === this.article?._id) {
        // Add the new comment to the comments array
        this.comments.push(comment);
        this.commentsCount++;
      }
    });

    // Comment updated
    this.socketService.onCommentUpdated().subscribe((updatedComment) => {
      if (updatedComment.articleId === this.article?._id) {
        // Update the comment in the array
        const index = this.comments.findIndex(
          (c) => c._id === updatedComment._id
        );
        if (index !== -1) {
          this.comments[index] = updatedComment;
        }
      }
    });

    // Comment deleted
    this.socketService.onCommentDeleted().subscribe((data) => {
      if (data.articleId === this.article?._id) {
        // Remove the comment from the array
        this.comments = this.comments.filter((c) => c._id !== data.commentId);
        this.commentsCount--;
      }
    });
  }

  private loadArticle(): void {
    const articleId = this.route.snapshot.paramMap.get('id');
    if (!articleId) {
      this.error = 'Article ID is missing';
      return;
    }

    this.isLoading = true;
    this.articleService.getArticleById(articleId).subscribe({
      next: (data) => {
        this.article = data;
        this.isLoading = false;
        this.loadComments();

        // Join the article room to receive real-time updates
        this.socketService.joinArticleRoom(articleId);
      },
      error: (err) => {
        this.error = 'Failed to load article';
        this.isLoading = false;
        console.error(err);
      },
    });
  }

  loadComments(): void {
    if (this.article && this.article._id) {
      this.commentService.getComments(this.article._id).subscribe({
        next: (comments: Comment[]) => {
          this.comments = comments;
          this.commentsCount = comments.length;
        },
        error: (err: any) => {
          console.error('Failed to load comments:', err);
        },
      });
    }
  }

  canEdit(): boolean {
    if (!this.article || !this.authService.isAuthenticated()) {
      return false;
    }

    const isAdmin = this.currentUserRole === 'admin';
    const isEditor = this.currentUserRole === 'editor';
    const isAuthor = this.article.author?._id === this.currentUserId;

    return isAdmin || isEditor || isAuthor;
  }

  canDelete(): boolean {
    return (
      this.currentUserRole === 'admin' || this.currentUserRole === 'editor'
    );
  }

  onSubmitComment(): void {
    if (this.commentForm.invalid || !this.article?._id) {
      return;
    }

    this.isSubmittingComment = true;
    const content = this.commentForm.value.content;

    this.articleService.createComment(this.article._id, content).subscribe({
      next: (comment) => {
        // Update UI with new comment
        if (!this.article!.comments) {
          this.article!.comments = [];
        }
        this.article!.comments.push(comment);

        // Reset form
        this.commentForm.reset();
        this.isSubmittingComment = false;
      },
      error: (err) => {
        console.error('Failed to submit comment:', err);
        this.isSubmittingComment = false;
      },
    });
  }

  replyToComment(commentId: string): void {
    this.replyingTo = commentId;
    this.replyForm.reset();
  }

  cancelReply(): void {
    this.replyingTo = null;
  }

  onSubmitReply(): void {
    if (this.replyForm.invalid || !this.article?._id || !this.replyingTo) {
      return;
    }

    const content = this.replyForm.value.content;

    this.articleService
      .createReply(this.article._id, this.replyingTo, content)
      .subscribe({
        next: (reply) => {
          // Find the parent comment and add the reply
          const parentComment = this.article!.comments?.find(
            (c) => c._id === this.replyingTo
          );
          if (parentComment) {
            if (!parentComment.replies) {
              parentComment.replies = [];
            }
            parentComment.replies.push(reply);
          }

          // Reset state
          this.replyForm.reset();
          this.replyingTo = null;
        },
        error: (err) => {
          console.error('Failed to submit reply:', err);
        },
      });
  }

  deleteArticle(): void {
    if (
      !this.article?._id ||
      !confirm('Are you sure you want to delete this article?')
    ) {
      return;
    }

    this.articleService.deleteArticle(this.article._id).subscribe({
      next: () => {
        this.router.navigate(['/articles']);
      },
      error: (err) => {
        console.error('Failed to delete article:', err);
      },
    });
  }
}
