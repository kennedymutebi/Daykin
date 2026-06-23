export interface Engagement {
  likes: number;
  shares: number;
  comments: number;
  reposts?: number;
  views?: number;
}

export interface ArticleAuthor {
  name: string;
  initials: string;
  role: string;
  verified: boolean;
  color?: string;
  avatarUrl?: string;
}

export interface Article {
  id: number;
  title: string;
  excerpt: string;
  content: string;
  authorId?:     number;
  category: string;
  categoryColor?: string;
  img: string;
  audio?: string;
  readTime: string;
  createdAt: string;
  date?: string;
  author: ArticleAuthor;
  engagement: Engagement;
  isEditorsPick?: boolean;
  body?: string[];
  verified?: boolean;
  creatorImg?: string;
  apiId?: number;
}