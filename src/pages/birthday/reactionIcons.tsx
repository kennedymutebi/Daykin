// src/pages/birthday/reactionIcons.tsx
import { Cake, Heart, PartyPopper, MapPin, Sparkles, Smile } from "lucide-react";
import type { ReactionIconName } from "./birthdayMockData";

export const reactionIconMap: Record<ReactionIconName, React.ElementType> = {
  cake: Cake,
  heart: Heart,
  partyPopper: PartyPopper,
  mapPin: MapPin,
  sparkles: Sparkles,
  smile: Smile,
};

// Usage in a component:
// const Icon = reactionIconMap[reaction.icon];
// <Icon size={16} strokeWidth={2} />