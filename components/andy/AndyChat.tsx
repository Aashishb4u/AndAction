"use client";

import { useEffect, useRef, useState } from "react";
import ArtistCard from "@/components/ui/ArtistCard";
import AndyAvatar from "./AndyAvatar";
import AndyMascot from "./AndyMascot";
import { ANDY_GREETING, ANDY_GREETINGS, ANDY_STARTERS, useAndy } from "./AndyProvider";

type Props = {
  /** Show starter chips above the first message (widget). The page shows them in a side panel. */
  showStarters?: boolean;
  autoFocus?: boolean;
  /** Big waving mascot above the greeting until the first message (full page). */
  showMascot?: boolean;
  /** Size of the waving mascot, e.g. a smaller one inside the widget. */
  mascotClass?: string;
  className?: string;
};

export default function AndyChat({ showStarters = false, autoFocus = false, showMascot = false, mascotClass = "h-36 w-auto sm:h-44", className = "" }: Props) {
  const { messages, isLoading, send } = useAndy();
  const [draft, setDraft] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);
  // Answer buttons for Andy's latest question replace the starters, so the row never shows both.
  const lastOptions = messages[messages.length - 1]?.options;
  const chips = lastOptions?.length ? lastOptions : showStarters ? ANDY_STARTERS : [];

  useEffect(() => {
    if (messages.length === 0) return; // keep the greeting and mascot in view
    bottomRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages, isLoading]);

  const submit = (event?: React.FormEvent) => {
    event?.preventDefault();
    if (!draft.trim() || isLoading) return;
    const text = draft;
    setDraft("");
    void send(text);
  };

  return (
    <div className={`flex min-h-0 flex-col ${className}`}>
      <div className="min-h-0 flex-1 space-y-4 overflow-y-auto px-4 py-4" aria-live="polite">
        {showMascot && messages.length === 0 && (
          <div className="flex flex-col items-center pb-2 pt-4 text-center">
            <AndyMascot waving className={mascotClass} />
            <p className="mt-2 font-[family-name:var(--font-raleway)] text-2xl font-bold text-white">
              Hey! I&apos;m Andy <span aria-hidden="true">👋</span>
            </p>
            <p className="text-base text-[#9A9A9A]">Pick a suggestion or type what you need.</p>
          </div>
        )}
        {messages.length === 0 ? (
          <RotatingGreeting />
        ) : (
          <div className="flex items-start gap-2.5">
            <AndyAvatar />
            <p id="andy_greetings" className="max-w-[85%] rounded-2xl rounded-tl-sm bg-white/[0.07] px-4 py-3 text-base leading-relaxed text-white">
              {ANDY_GREETING}
            </p>
          </div>
        )}

        {messages.map((message) =>
          message.role === "user" ? (
            <div key={message.id} className="flex justify-end">
              <p className="max-w-[85%] whitespace-pre-wrap break-words rounded-2xl rounded-tr-sm bg-[linear-gradient(135deg,#ED4B22,#E8047E)] px-4 py-3 text-base leading-relaxed text-white">
                {message.content}
              </p>
            </div>
          ) : (
            <div key={message.id} className="flex items-start gap-2.5">
              <AndyAvatar />
              <div className="min-w-0 flex-1 space-y-3">
                <p
                  className={`max-w-[85%] whitespace-pre-wrap break-words rounded-2xl rounded-tl-sm px-4 py-3 text-base leading-relaxed ${
                    message.error ? "bg-red-500/15 text-red-200" : "bg-white/[0.07] text-white"
                  }`}
                >
                  {message.content}
                </p>

                {message.artists && (
                  <div className="-mr-4 flex gap-3 overflow-x-auto pb-2 pr-4 [scrollbar-width:thin]">
                    {message.artists.map((artist, i) => (
                      <ArtistCard
                        key={artist.id}
                        id={artist.id}
                        name={artist.name}
                        location={artist.location}
                        thumbnail={artist.image}
                        videoUrl=""
                        optimizeImage
                        eager={i < 3}
                        priceLabel={artist.startingPrice ? `From ₹${artist.startingPrice.toLocaleString("en-IN")}` : "Price on Request"}
                      />
                    ))}
                  </div>
                )}
              </div>
            </div>
          ),
        )}

        {isLoading && (
          <div className="flex items-center gap-2.5">
            <AndyAvatar />
            <span className="flex gap-1 rounded-2xl bg-white/[0.07] px-3.5 py-3" role="status" aria-label="Andy is typing">
              {[0, 1, 2].map((i) => (
                <span
                  key={i}
                  className="h-1.5 w-1.5 animate-bounce rounded-full bg-[#9A9A9A]"
                  style={{ animationDelay: `${i * 0.15}s` }}
                />
              ))}
            </span>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      <form onSubmit={submit} className="flex items-center gap-2 border-t border-white/10 p-3">
        <input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          maxLength={500}
          autoFocus={autoFocus}
          placeholder="e.g. Mata Ki Chowki, budget ₹20,000"
          aria-label="Message Andy"
          className="min-w-0 flex-1 rounded-full border border-white/10 bg-white/[0.05] px-4 py-3 text-base text-white outline-none placeholder:text-[#7F7F7F] focus:border-primary-pink"
        />
        <button
          type="submit"
          disabled={!draft.trim() || isLoading}
          aria-label="Send"
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[linear-gradient(135deg,#ED4B22,#E8047E)] text-white transition-opacity disabled:opacity-40"
        >
          <svg viewBox="0 0 24 24" fill="currentColor" className="h-5 w-5">
            <path d="M3.4 20.4l17.4-7.5a1 1 0 000-1.8L3.4 3.6a1 1 0 00-1.4 1.2L4 11l9 1-9 1-2 6.2a1 1 0 001.4 1.2z" />
          </svg>
        </button>
      </form>

      {chips.length > 0 && (
        <div
          aria-label="Suggestions"
          className="flex gap-2 overflow-x-auto px-3 pb-3 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        >
          {chips.map((chip) => (
            <button
              key={chip}
              type="button"
              disabled={isLoading}
              onClick={() => void send(chip)}
              className="shrink-0 whitespace-nowrap rounded-full border border-white/15 bg-white/[0.04] px-4 py-2 text-sm text-[#D0D0D0] transition-colors hover:border-primary-pink hover:text-white disabled:opacity-50"
            >
              {chip}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

const TYPE_MS = 30;
/** Typing dots shown before each greeting. */
const DOTS_MS = 900;
/** How long a fully typed greeting stays before the next one. */
const GREETING_HOLD_MS = 10_000;

/**
 * Before the first message: Andy's greeting (#andy_greetings) changes on its own. Each one starts
 * with typing dots, types itself out, then stays for 10 seconds. No chips under it.
 */
function RotatingGreeting() {
  const [index, setIndex] = useState(0);
  // -1 = typing dots; otherwise number of characters shown.
  const [shown, setShown] = useState(-1);
  const text = ANDY_GREETINGS[index];

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setShown(text.length);
      return; // no animation, no rotation
    }
    const delay = shown < 0 ? DOTS_MS : shown < text.length ? TYPE_MS : GREETING_HOLD_MS;
    const timer = window.setTimeout(() => {
      if (shown < text.length) {
        setShown(shown + 1);
      } else {
        setIndex((i) => (i + 1) % ANDY_GREETINGS.length);
        setShown(-1);
      }
    }, delay);
    return () => window.clearTimeout(timer);
  }, [shown, text]);

  return (
    <div className="flex items-start gap-2.5">
      <AndyAvatar />
      {shown < 0 ? (
        <span className="flex gap-1 rounded-2xl rounded-tl-sm bg-white/[0.07] px-3.5 py-3" aria-hidden="true">
          {[0, 1, 2].map((i) => (
            <span
              key={i}
              className="h-1.5 w-1.5 animate-bounce rounded-full bg-[#9A9A9A]"
              style={{ animationDelay: `${i * 0.15}s` }}
            />
          ))}
        </span>
      ) : (
        <p
          id="andy_greetings"
          className="max-w-[85%] rounded-2xl rounded-tl-sm bg-white/[0.07] px-4 py-3 text-base leading-relaxed text-white"
        >
          {/* Screen readers get the whole greeting once, not every typed letter. */}
          <span className="sr-only">{text}</span>
          <span aria-hidden="true">
            {text.slice(0, shown)}
            {shown < text.length && (
              <span className="ml-px inline-block h-4 w-px translate-y-0.5 animate-pulse bg-white" />
            )}
          </span>
        </p>
      )}
    </div>
  );
}
