export type AndyArtist = {
  id: string;
  name: string;
  location: string;
  image: string;
  category: string;
  startingPrice: number | null;
  /** Straight-line km from the user, when their location is known. Not shown on the card. */
  distanceKm?: number | null;
};

export type AndyMessage = {
  id: string;
  role: "user" | "assistant";
  content: string;
  artists?: AndyArtist[];
  options?: string[];
  error?: boolean;
};

export type AndyChatResponse = {
  reply: string;
  artists: AndyArtist[];
  options: string[];
};

export type AndySearchFilters = {
  service?: string;
  artist_type?: string;
  sub_category?: string;
  budget_min?: number;
  budget_max?: number;
  place?: string;
  language?: string;
  event_type?: string;
};
