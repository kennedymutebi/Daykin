// src/pages/birthday/birthdayMockData.ts
// Frontend-only mock data. Swap these arrays for real API calls once the
// backend is connected — components don't need to change, just the source.

// Reaction/UI icons are referenced by name (lucide-react) rather than emoji,
// so the data stays serializable and rendering stays in the component layer.
export type ReactionIconName =
  | "cake"
  | "heart"
  | "partyPopper"
  | "mapPin"
  | "sparkles"
  | "smile";

export interface FeedPerson {
  id: string;
  name: string;
  location: string;
  quote: string;
  image?: string;
  milestone?: string; // e.g. "MILESTONE 30TH"
}

export interface WishPost {
  id: string;
  author: string;
  isVerified?: boolean;
  timeAgo: string;
  message: string;
  reactions: { icon: ReactionIconName; count: number }[];
  tag?: string; // e.g. "HAPPY BIRTHDAY!"
  highlighted?: boolean;
}

export interface CelebArticle {
  id: string;
  category: string;
  readTime: string;
  title: string;
  description: string;
  image?: string;
}

export const featuredPerson: FeedPerson = {
  id: "p1",
  name: "Sarah Jenkins",
  location: "Chicago",
  quote:
    "Wishing for a year of bold ventures and quiet moments of joy. Let's make it count.",
  milestone: "MILESTONE 30TH",
};

export const feedPeople: FeedPerson[] = [
  {
    id: "p2",
    name: "Marcus Chen",
    location: "San Francisco, CA",
    quote:
      "Grateful for another trip around the sun with the best team in the world. Cake is in the break room!",
  },
  {
    id: "p3",
    name: "Elena Rodriguez",
    location: "Madrid, ES",
    quote:
      "Starting my birthday morning with fresh coffee and big dreams. Thank you for the love.",
  },
];

export const wishPosts: WishPost[] = [
  {
    id: "w1",
    author: "Anonymous Guest",
    timeAgo: "2 minutes ago",
    message:
      "Happy 25th Birthday to my best friend Sarah! Hope this year brings you all the travel and coffee you desire!",
    reactions: [
      { icon: "cake", count: 12 },
      { icon: "heart", count: 8 },
    ],
    tag: "HAPPY BIRTHDAY!",
  },
  {
    id: "w2",
    author: "Party Planner Pro",
    isVerified: true,
    timeAgo: "15 minutes ago",
    message:
      "Wishing everyone born in October a magical month! Don't forget to treat yourselves to an extra slice of cake",
    reactions: [
      { icon: "partyPopper", count: 45 },
      { icon: "mapPin", count: 19 },
    ],
    highlighted: true,
  },
  {
    id: "w3",
    author: "Mark R.",
    timeAgo: "1 hour ago",
    message: "Happy birthday to one of us! Happy birthday dude",
    reactions: [{ icon: "smile", count: 6 }],
  },
];

export const celebArticles: CelebArticle[] = [
  {
    id: "c1",
    category: "FILM & DRAMA",
    readTime: "4 MIN READ",
    title: "The Thespian's Journey: A Legacy of Excellence",
    description:
      "An in-depth look at the life and career of a cinematic titan who redefined character acting through meticulous research and craft.",
  },
  {
    id: "c2",
    category: "CLASSICAL ARTS",
    readTime: "6 MIN READ",
    title: "Rhythms of the Past: Harmonizing History",
    description:
      "Exploring the revolutionary compositions that changed the landscape of orchestral music. This scholarly review examines the personal life behind the work.",
  },
  {
    id: "c3",
    category: "INNOVATION",
    readTime: "5 MIN READ",
    title: "Architects of Tomorrow: Design & Impact",
    description:
      "Analyzing the aesthetic philosophy of a design pioneer whose birthday falls in the peak of Spring. A deep dive into their creative process.",
  },
];