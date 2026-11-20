"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { useLocation } from "@/components/providers/location-provider";
import type { AndyChatResponse, AndyMessage } from "@/lib/andy/types";

const STORAGE_KEY = "andy-chat-v1";

export const ANDY_GREETING =
  "Hi, I'm Andy. Tell me what you need, like the service, your budget and the city, and I'll find artists for you.";

export const ANDY_STARTERS = [
  "Mata Ki Chowki in Delhi",
  "Singer for a wedding",
  "Bhajan Sandhya under ₹25,000",
  "Sunderkand Path at home",
  "Khatu Shyam bhajan singer",
  "Bhagwati Jagran for society",
  "DJ for a birthday party",
  "Anchor for a corporate event",
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

const makeId = () => `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;

export function AndyProvider({ children }: { children: React.ReactNode }) {
  const [messages, setMessages] = useState<AndyMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isWidgetOpen, setWidgetOpen] = useState(false);
  const { location } = useLocation();
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
    [commit],
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
