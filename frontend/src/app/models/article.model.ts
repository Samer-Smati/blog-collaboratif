export interface Article {
  _id?: string;
  title: string;
  content: string;
  author?: {
    _id: string;
    username: string;
  };
  tags?: string[];
  createdAt?: string;
  updatedAt?: string;
  viewCount?: number;
  comments?: any[];
}

export interface ArticleResponse {
  items: Article[];
  total: number;
  page: number;
  pages: number;
}
