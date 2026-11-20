"use client";

import { useEffect, useState } from "react";

export type AndyNudgeMessage = { text: string; query: string };

export const ANDY_NUDGES: AndyNudgeMessage[] = [
  { text: "Hey, are you looking for any Mata Ki Chowki artists?", query: "Mata Ki Chowki artists" },
  { text: "और भाई, क्या चाहिए? बताओ, मैं हूँ यहाँ पर 😄", query: "I need an artist for my event" },
  { text: "Hey buddy, want to arrange a Jagrata?", query: "Bhagwati Jagran artists" },
  { text: "Wedding season? Let me find your perfect singer 🎤", query: "Singer for a wedding" },
  { text: "Psst... I know every bhajan singer in town. Ask me!", query: "Bhajan singers" },
  { text: "Sunderkand Path at home? I can help with that 🙏", query: "Sunderkand Path at home" },
  { text: "Birthday, sangeet or office party? Tell me, I'll find the act! 🎉", query: "DJ for a birthday party" },
  { text: "Tight budget? No tension, I'll find artists that fit.", query: "Artists under ₹25,000" },
];

const OFF_KEY = "andy-nudge-off";
const FIRST_DELAY_MS = 2000;
const VISIBLE_MS = 6000;
const GAP_MS = 4000;

type Props = {
  active: boolean;
  onAccept: (query: string) => void;
  onVisibleChange?: (visible: boolean) => void;
};

function readSession(key: string): string | null {
  try {
    return sessionStorage.getItem(key);
  } catch {
    return null;
  }
}

function writeSession(key: string, value: string) {
  try {
    sessionStorage.setItem(key, value);
  } catch {}
}

/** Comic speech bubble that pops out of the Andy button every few seconds. */
export default function AndyNudge({ active, onAccept, onVisibleChange }: Props) {
  const [index, setIndex] = useState<number | null>(null);

  useEffect(() => {
    onVisibleChange?.(index !== null);
  }, [index, onVisibleChange]);

  useEffect(() => {
    if (!active) {
      setIndex(null);
      return;
    }
    if (readSession(OFF_KEY) === "1") return;

    let cancelled = false;
    let timer: number | undefined;
    let next = Math.floor(Math.random() * ANDY_NUDGES.length);

    const show = () => {
      if (cancelled) return;
      if (document.hidden) {
        timer = window.setTimeout(show, GAP_MS);
        return;
      }
      setIndex(next);
      next = (next + 1) % ANDY_NUDGES.length;
      timer = window.setTimeout(hide, VISIBLE_MS);
    };

    const hide = () => {
      if (cancelled) return;
      setIndex(null);
      timer = window.setTimeout(show, GAP_MS);
    };

    timer = window.setTimeout(show, FIRST_DELAY_MS);
    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [active]);

  if (!active || index === null) return null;
  const nudge = ANDY_NUDGES[index];

  const turnOff = () => {
    writeSession(OFF_KEY, "1");
    setIndex(null);
  };

  return (
    <div className="andy-bubble-in absolute bottom-full mb-3 right-0 w-max max-w-[min(15rem,calc(100vw-2rem))]">
      <button
        type="button"
        onClick={() => {
          setIndex(null);
          onAccept(nudge.query);
        }}
        aria-label={`Andy says: ${nudge.text}. Tap to chat.`}
        className="relative block rounded-[22px] border-2 border-[#000000] bg-[#FFFFFF] px-4 py-3 text-left text-[13px] font-semibold leading-snug text-[#000000] shadow-[4px_4px_0_#000000] transition-transform hover:-translate-y-0.5"
      >
        {nudge.text}
        <span
          aria-hidden="true"
          className="absolute -bottom-[9px] right-6 h-4 w-4 rotate-45 border-b-2 border-r-2 border-[#000000] bg-[#FFFFFF]"
        />
      </button>
      <button
        type="button"
        onClick={turnOff}
        aria-label="Stop these messages"
        className="absolute -left-2 -top-2 flex h-6 w-6 items-center justify-center rounded-full border-2 border-[#000000] bg-[#FFFFFF] text-[#000000] shadow-[2px_2px_0_#000000]"
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" className="h-3 w-3">
          <path strokeLinecap="round" d="M6 6l12 12M18 6L6 18" />
        </svg>
      </button>
    </div>
  );
}
