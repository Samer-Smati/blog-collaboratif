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
