// types/article.ts

export interface Engagement {
  likes: number;
  comments: number;
  reposts?: number;
  shares: number;     // ← changed from "reposts" or added
  views?: number;
  
}

export interface Article {
  id: number;
  category: string;
  categoryColor?: string;
  title: string;
  excerpt: string;
  author: string;
  authorInitials: string;     // ← Required
  authorColor: string;        // ← Required
  readTime: string;
  date: string;
  img: string;
  engagement: Engagement;
  body?: string[];
  verified?: boolean;
  creatorImg?: string;
}