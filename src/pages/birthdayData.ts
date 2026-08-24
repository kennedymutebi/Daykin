// src/pages/birthdayData.ts
// Static birthday data, shared types and keyframe animations. Kept out of
// BirthdayHero.tsx so that file only exports components (Vite Fast Refresh
// requirement).
import { keyframes } from "@emotion/react";

// ── Static data ────────────────────────────────────────────────────────────
export const MONTHS = [
  "January","February","March","April","May","June",
  "July","August","September","October","November","December",
];
export const DAYS = Array.from({ length: 31 }, (_, i) => String(i + 1).padStart(2, "0"));

export interface BirthdayPerson {
  id: number;
  name: string;
  location: string;
  photo: string;
  wishMessage: string;
  birthMonth?: string;
  birthDay?: string;
  addedBy?: string; // "self" | "friend" | "admin"
}

export interface WishEntry {
  id: string;
  fromName: string;
  message: string;
  timestamp: Date;
  recipientId: number;
}

export const TODAY_BIRTHDAYS: BirthdayPerson[] = [
  { id: 1, name: "Kennedy Mutebi",  location: "Kampala, Uganda", photo: "/birthday.jpg", wishMessage: "Wishing you a day as bright as your smile!",                          birthMonth: "June",    birthDay: "07", addedBy: "admin"  },
  { id: 2, name: "Grace Nakato",    location: "Entebbe, Uganda", photo: "/person1.jpg",  wishMessage: "May this birthday be the start of something wonderful!",              birthMonth: "June",    birthDay: "07", addedBy: "self"   },
  { id: 3, name: "Brian Ssebuliba", location: "Jinja, Uganda",   photo: "/person2.jpg",  wishMessage: "Another year of greatness ahead — happy birthday!",                  birthMonth: "March",   birthDay: "15", addedBy: "friend" },
  { id: 4, name: "Amara Diallo",    location: "Nairobi, Kenya",  photo: "/person3.jpg",  wishMessage: "Celebrate big today!",                                               birthMonth: "January", birthDay: "20", addedBy: "self"   },
  { id: 5, name: "Priya Sharma",    location: "Nairobi, Kenya",  photo: "/person2.jpg",  wishMessage: "Here's to everything this new year brings — happy birthday!",        birthMonth: "August",  birthDay: "03", addedBy: "friend" },
];

export const FAMOUS_MATCHES = [
  { id: 1, name: "Beyoncé",         born: "Sep 4",  category: "Music",  image: "/beyonce.jpg",   fact: "Singer, songwriter, actress — one of the best-selling music artists of all time." },
  { id: 2, name: "Michael Jackson", born: "Aug 29", category: "Music",  image: "/mj.png",        fact: "King of Pop, sold over 400 million records worldwide." },
  { id: 3, name: "Selena Gomez",    born: "Jul 22", category: "Music",  image: "/gomez.jpg",     fact: "Pop star, actress, and one of the most-followed people on Instagram." },
  { id: 4, name: "LeBron James",    born: "Dec 30", category: "Sports", image: "/lebron.jpg",    fact: "4× NBA champion, widely regarded as the greatest basketball player of his era." },
  { id: 5, name: "Adele",           born: "May 5",  category: "Music",  image: "/adele.jpg",     fact: "Grammy-winning British singer whose albums have broken multiple world records." },
  { id: 6, name: "Elon Musk",       born: "Jun 28", category: "Tech",   image: "/elonemask.jpg", fact: "CEO of Tesla and SpaceX, has fundamentally changed electric vehicles and space travel." },
];

// ── Animations ─────────────────────────────────────────────────────────────
export const fadeSlideUp   = keyframes`from{opacity:0;transform:translateY(24px)} to{opacity:1;transform:translateY(0)}`;
export const fadeSlideDown = keyframes`from{opacity:0;transform:translateY(-16px)} to{opacity:1;transform:translateY(0)}`;
