export interface TikTokAccount {
  id: string;
  username: string;
  niche: string;
  followers: number;
  followerHistory: { date: string; count: number }[];
  videos: TikTokVideo[];
  lastUpdated: string;
}

export interface TikTokVideo {
  id: string;
  title: string;
  hook: string;
  views: number;
  likes: number;
  comments: number;
  shares: number;
  date: string;
  commentInsights?: string;
}

export interface Task {
  id: string;
  text: string;
  done: boolean;
  priority: "high" | "medium" | "low";
  createdAt: string;
}

export interface Transaction {
  id: string;
  type: "income" | "expense";
  amount: number;
  description: string;
  date: string;
  category: string;
}

export interface Note {
  id: string;
  content: string;
  createdAt: string;
  tags: string[];
}

export interface SocialAccount {
  id: string;
  platform: "instagram" | "youtube" | "twitter" | "facebook" | "other";
  username: string;
  followers: number;
  notes: string;
}

export interface FayData {
  tiktokAccounts: TikTokAccount[];
  tasks: Task[];
  transactions: Transaction[];
  notes: Note[];
  socialAccounts: SocialAccount[];
  contentIdeas: ContentIdea[];
}

export interface ContentIdea {
  id: string;
  accountId: string;
  idea: string;
  hook: string;
  source: "viral-trend" | "comment-analysis" | "fay-suggestion";
  createdAt: string;
  used: boolean;
}

export interface Message {
  id: string;
  role: "user" | "fay";
  text: string;
  timestamp: string;
}
