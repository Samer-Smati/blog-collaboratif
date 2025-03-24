export interface Comment {
  _id: string;
  articleId: string;
  content: string;
  author: {
    _id: string;
    username: string;
    avatar?: string;
  };
  createdAt: string;
  updatedAt: string;
  replies?: Reply[];
  isEditing?: boolean;
  replyContent?: string;
}

export interface Reply {
  _id: string;
  content: string;
  author: {
    _id: string;
    username: string;
    avatar?: string;
  };
  createdAt: string;
  updatedAt: string;
  isEditing?: boolean;
}
