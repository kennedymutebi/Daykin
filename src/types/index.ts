export interface Writer {
  id: string;
  name: string;
  initials: string;
  role: string;
  followers: string;
  color: string;
  verified?: boolean;
}

export interface Article {
  id: string;
  title: string;
  excerpt: string;
  author: Writer;
  date: string;
  readTime: string;
  category: "Football" | "Basketball" | "Athletics" | "Cricket" | "Tennis" | "Music" | "Love" | "Birthday";
  reads: string;
  isAdminPick?: boolean;
  imageUrl?: string;
}

export interface HelpRequest {
  id: string;
  title: string;
  author: string;
  date: string;
  status: "Active" | "Verified";
  supporters: number;
}

export type NavSection = "Home" | "Birthdays" | "Love Stories" | "Sports" | "Charity";