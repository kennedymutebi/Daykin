/**
 * SPORTS_ARTICLES — dummy data
 * Follows the exact same shape as LOVE_STORIES
 */

import type { Article } from "../types/article";

export const SPORTS_ARTICLES: Article[] = [
  // ── Football ──────────────────────────────────────────────────────────────
  {
    id: 1,
    title: "The Night Mbappe Silenced the Bernabéu",
    excerpt:
      "A breathtaking solo run in the 88th minute sealed one of the most dramatic Champions League reversals in recent memory. From the tunnel walk to the final whistle, here is the full inside story.",
    author: "Carlos Mendez",
    authorInitials: "CM",
    authorColor: "#F59E0B",
    date: "Apr 14, 2026",
    readTime: "7 min read",
    img: "https://images.unsplash.com/photo-1614632537423-1e6c2e7e0aab?w=800&auto=format&fit=crop",
    category: "Football",
    verified: true,
    engagement: { likes: 14320, comments: 892, shares: 430, views: 68000 },
  },
  {
    id: 2,
    title: "How Napoli Rebuilt Their Midfield in 90 Days",
    excerpt:
      "After losing three key players to injury before Christmas, the Italian giants executed one of the most creative January windows in Serie A history — signing four players across three continents.",
    author: "Giulia Ferrara",
    authorInitials: "GF",
    authorColor: "#F59E0B",
    date: "Apr 10, 2026",
    readTime: "5 min read",
    img: "https://images.unsplash.com/photo-1508098682722-e99c43a406b2?w=800&auto=format&fit=crop",
    category: "Football",
    verified: false,
    engagement: { likes: 7890, comments: 445, shares: 210, views: 32000 },
  },
  {
    id: 3,
    title: "VAR Controversy: Is Technology Killing the Beautiful Game?",
    excerpt:
      "Three disallowed goals in one weekend reignited the VAR debate across Europe. Managers, fans, and ex-referees share their verdicts on whether the technology is improving football or destroying its soul.",
    author: "James Okafor",
    authorInitials: "JO",
    authorColor: "#F59E0B",
    date: "Apr 8, 2026",
    readTime: "6 min read",
    img: "https://images.unsplash.com/photo-1575361204480-aadea25e6e68?w=800&auto=format&fit=crop",
    category: "Football",
    verified: true,
    engagement: { likes: 21500, comments: 2103, shares: 980, views: 95000 },
  },

  // ── Basketball ────────────────────────────────────────────────────────────
  {
    id: 4,
    title: "LeBron at 41: The Science Behind His Longevity",
    excerpt:
      "Sleep pods, cryotherapy, an $1.5M annual body-maintenance budget. We spoke with his trainers, nutritionists, and sleep specialists to understand how the King defies aging night after night.",
    author: "Aaliyah Brooks",
    authorInitials: "AB",
    authorColor: "#8B5CF6",
    date: "Apr 13, 2026",
    readTime: "8 min read",
    img: "https://images.unsplash.com/photo-1546519638-68e109498ffc?w=800&auto=format&fit=crop",
    category: "Basketball",
    verified: true,
    engagement: { likes: 31200, comments: 1567, shares: 720, views: 128000 },
  },
  {
    id: 5,
    title: "The Golden State Rebuild: Year One Report Card",
    excerpt:
      "After a painful roster teardown, the Warriors' new front office bet on two unproven draft picks and a coach nobody had heard of. Seven months later, the basketball world is paying attention.",
    author: "Derek Hsu",
    authorInitials: "DH",
    authorColor: "#F59E0B",
    date: "Apr 7, 2026",
    readTime: "5 min read",
    img: "https://images.unsplash.com/photo-1504450758481-7338eba7524a?w=800&auto=format&fit=crop",
    category: "Basketball",
    verified: false,
    engagement: { likes: 9870, comments: 634, shares: 290, views: 44000 },
  },

  // ── Tennis ────────────────────────────────────────────────────────────────
  {
    id: 6,
    title: "Alcaraz vs Sinner: A Rivalry for the Ages",
    excerpt:
      "They have now met 14 times across four Grand Slam finals. Every match redefines what modern tennis looks like. We break down the tactical chess match that has the sport buzzing.",
    author: "Sofia Larsson",
    authorInitials: "SL",
    authorColor: "#F59E0B",
    date: "Apr 12, 2026",
    readTime: "6 min read",
    img: "https://images.unsplash.com/photo-1622163642998-1ea32b0bbc67?w=800&auto=format&fit=crop",
    category: "Tennis",
    verified: true,
    engagement: { likes: 17600, comments: 1102, shares: 530, views: 74000 },
  },
  {
    id: 7,
    title: "Behind the Serve: How Iga Świątek Trains at 5AM",
    excerpt:
      "Access-all-areas inside the Polish world No.1's pre-tournament camp in the Canary Islands. Ice baths, serve clinics, and mental-conditioning sessions before sunrise.",
    author: "Marek Nowak",
    authorInitials: "MN",
    authorColor: "#F59E0B",
    date: "Apr 5, 2026",
    readTime: "4 min read",
    img: "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800&auto=format&fit=crop",
    category: "Tennis",
    verified: false,
    engagement: { likes: 11300, comments: 782, shares: 360, views: 52000 },
  },

  // ── Athletics ─────────────────────────────────────────────────────────────
  {
    id: 8,
    title: "The 9.58 Wall: Will Anyone Ever Break Bolt's Record?",
    excerpt:
      "Sixteen years after Usain Bolt's Berlin sprint, biomechanics experts and the next generation of sprinters debate whether a sub-9.5 second 100m is physically possible for a human being.",
    author: "Kwame Asante",
    authorInitials: "KA",
    authorColor: "#F59E0B",
    date: "Apr 11, 2026",
    readTime: "7 min read",
    img: "https://images.unsplash.com/photo-1552674605-db6ffd4facb5?w=800&auto=format&fit=crop",
    category: "Athletics",
    verified: true,
    engagement: { likes: 25400, comments: 1890, shares: 870, views: 112000 },
  },
  {
    id: 9,
    title: "Running on Empty: Africa's Marathon Domination Explained",
    excerpt:
      "Ethiopia and Kenya have combined for 28 of the last 30 major marathon titles. Altitude, culture, biomechanics, or something deeper? Sports scientists offer their most honest answers yet.",
    author: "Amara Diallo",
    authorInitials: "AD",
    authorColor: "#F59E0B",
    date: "Apr 3, 2026",
    readTime: "6 min read",
    img: "https://images.unsplash.com/photo-1571008887538-b36bb32f4571?w=800&auto=format&fit=crop",
    category: "Athletics",
    verified: true,
    engagement: { likes: 13700, comments: 945, shares: 490, views: 61000 },
  },

  // ── Cricket ───────────────────────────────────────────────────────────────
  {
    id: 10,
    title: "India's T20 Youth Revolution: The Class of 2026",
    excerpt:
      "Five players under 22 who debuted this IPL season have already forced their way into World Cup squad conversations. A deep dive into the talent pipeline reshaping Indian cricket.",
    author: "Priya Sharma",
    authorInitials: "PS",
    authorColor: "#F59E0B",
    date: "Apr 9, 2026",
    readTime: "5 min read",
    img: "https://images.unsplash.com/photo-1540747913346-19e32dc3e97e?w=800&auto=format&fit=crop",
    category: "Cricket",
    verified: false,
    engagement: { likes: 18900, comments: 1340, shares: 620, views: 83000 },
  },

  // ── Swimming ──────────────────────────────────────────────────────────────
  {
    id: 11,
    title: "Katie Ledecky and the Loneliness of Distance Swimming",
    excerpt:
      "She trains 80,000 meters a week, mostly alone. A rare long-form interview about sacrifice, silence, and what drives the most decorated female swimmer in Olympic history.",
    author: "Claire Dupont",
    authorInitials: "CD",
    authorColor: "#F59E0B",
    date: "Apr 6, 2026",
    readTime: "9 min read",
    img: "https://images.unsplash.com/photo-1530549387789-4c1017266635?w=800&auto=format&fit=crop",
    category: "Swimming",
    verified: true,
    engagement: { likes: 22100, comments: 1670, shares: 750, views: 96000 },
  },

  // ── Rugby ─────────────────────────────────────────────────────────────────
  {
    id: 12,
    title: "South Africa's Scrum: The Most Feared 8 Metres in Rugby",
    excerpt:
      "Two World Cup campaigns, zero retreats. We embedded with the Springboks' front row for a week to understand the culture, the pain, and the obsessive science behind the world's most dominant set piece.",
    author: "Thabo Nkosi",
    authorInitials: "TN",
    authorColor: "#F59E0B",
    date: "Apr 2, 2026",
    readTime: "7 min read",
    img: "https://images.unsplash.com/photo-1544551763-46a013bb70d5?w=800&auto=format&fit=crop",
    category: "Rugby",
    verified: false,
    engagement: { likes: 8450, comments: 590, shares: 270, views: 37000 },
  },
];