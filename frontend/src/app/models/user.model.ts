import { Article } from './article.model';
import { Comment } from './comment.model';

export interface User {
  _id: string;
  username: string;
  email: string;
  role: 'admin' | 'editor' | 'writer' | 'reader';
  avatar?: string;
  bio?: string;
  createdAt: string;
  updatedAt: string;
  articleCount?: number;
  commentCount?: number;
  accessToken?: string;
  location?: string;
  followers?: number;
  following?: number;
  articles?: Article[] | [];
  comments?: Comment[] | [];
}

export interface AuthResponse {
  user: User;
  accessToken: string;
  refreshToken?: string;
}

export interface RegisterUser {
  username: string;
  email: string;
  password: string;
}
