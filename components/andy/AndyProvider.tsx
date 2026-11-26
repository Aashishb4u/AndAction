"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { useLocation } from "@/components/providers/location-provider";
import type { AndyChatResponse, AndyMessage } from "@/lib/andy/types";

const STORAGE_KEY = "andy-chat-v1";

export const ANDY_GREETING =
  "Hi, I'm Andy. Tell me what you need, like the service, your budget and the city, and I'll find artists for you.";

/** Greetings Andy cycles through before the first message. Each one hints at what to ask him. */
export const ANDY_GREETINGS = [
  "Namaste ji! 🙏 I'm Andy, your full-time artist-finding jugaadu. Ask me for a Mata Ki Chowki in Delhi and watch the magic!",
  "Jai Mata Di! 🔔 Jagran, chowki, Sunderkand Path... I know EVERY devotional artist in town. Go on, test me!",
  "Arre wah, a party! 🎉 Birthday, sangeet or office bash? Tell me and I'll bring the DJ, the singer, the whole show!",
  "Psst... tight budget? No tension! 😎 Say \"bhajan singer under ₹15,000\" and I'll find magic at your price.",
];

// One chip per category, mixed so neighbouring chips are never the same kind of artist.
export const ANDY_STARTERS = [
  "Live band for a wedding",
  "DJ for a birthday party",
  "Mata Ki Chowki in Delhi",
  "Anchor for a corporate event",
  "Bollywood singer for a sangeet",
  "Magician for a kids' party",
  "Dance group for a wedding",
  "Comedian for an office party",
  "Sunderkand Path at home",
  "Dhol player for a baraat",
  "Folk artist for a cultural event",
  "Motivational speaker for a seminar",
  "DJ based band for a reception",
  "Model for a fashion show",
];

type AndyContextValue = {
  messages: AndyMessage[];
  isLoading: boolean;
  isWidgetOpen: boolean;
  setWidgetOpen: (open: boolean) => void;
  send: (text: string) => Promise<void>;
  reset: () => void;
};

const AndyContext = createContext<AndyContextValue | null>(null);

const NEAR_ME = /\b(near ?(me|by)|nearby|around me|close to me|my (area|location|city))\b|आस ?पास|पास में/i;

const makeId = () => `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;

export function AndyProvider({ children }: { children: React.ReactNode }) {
  const [messages, setMessages] = useState<AndyMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isWidgetOpen, setWidgetOpen] = useState(false);
  const { location, openLocationModal } = useLocation();
  const askedLocation = useRef(false);
  const locationRef = useRef(location);
  locationRef.current = location;
  const messagesRef = useRef<AndyMessage[]>([]);
  const loadingRef = useRef(false);
  const hydrated = useRef(false);

  useEffect(() => {
    try {
      const raw = sessionStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) {
          messagesRef.current = parsed;
          setMessages(parsed);
        }
      }
    } catch {}
    hydrated.current = true;
  }, []);

  const commit = useCallback((next: AndyMessage[]) => {
    messagesRef.current = next;
    setMessages(next);
    if (!hydrated.current) return;
    try {
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify(next.slice(-40)));
    } catch {}
  }, []);

  const send = useCallback(
    async (text: string) => {
      const content = text.trim().slice(0, 500);
      if (!content || loadingRef.current) return;

      // No location yet: ask for it on a "near me" query, and once on the first query of any kind.
      if (!locationRef.current && (NEAR_ME.test(content) || !askedLocation.current)) {
        askedLocation.current = true;
        openLocationModal();
      }

      loadingRef.current = true;
      setIsLoading(true);

      // Tapped chips and old option buttons should not stay clickable.
      const cleared = messagesRef.current.map((m) => (m.options ? { ...m, options: undefined } : m));
      const withUser = [...cleared, { id: makeId(), role: "user" as const, content }];
      commit(withUser);

      try {
        const res = await fetch("/api/andy/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            messages: withUser.filter((m) => !m.error).map((m) => ({ role: m.role, content: m.content })),
            location: locationRef.current,
          }),
        });
        const data = (await res.json().catch(() => ({}))) as Partial<AndyChatResponse> & { error?: string };
        if (!res.ok || !data.reply) {
          throw new Error(data.error || "Andy could not answer. Please try again.");
        }
        commit([
          ...withUser,
          {
            id: makeId(),
            role: "assistant",
            content: data.reply,
            artists: data.artists?.length ? data.artists : undefined,
            options: data.options?.length ? data.options : undefined,
          },
        ]);
      } catch (error) {
        commit([
          ...withUser,
          {
            id: makeId(),
            role: "assistant",
            content: error instanceof Error ? error.message : "Something went wrong. Please try again.",
            error: true,
          },
        ]);
      } finally {
        loadingRef.current = false;
        setIsLoading(false);
      }
    },
    [commit, openLocationModal],
  );

  const reset = useCallback(() => commit([]), [commit]);

  const value = useMemo(
    () => ({ messages, isLoading, isWidgetOpen, setWidgetOpen, send, reset }),
    [messages, isLoading, isWidgetOpen, send, reset],
  );

  return <AndyContext.Provider value={value}>{children}</AndyContext.Provider>;
}

export function useAndy() {
  const ctx = useContext(AndyContext);
  if (!ctx) throw new Error("useAndy must be used inside AndyProvider");
  return ctx;
}
