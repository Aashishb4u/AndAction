"use client";

import { useEffect, useRef, useState } from "react";
import ArtistCard from "@/components/ui/ArtistCard";
import AndyAvatar from "./AndyAvatar";
import AndyMascot from "./AndyMascot";
import { ANDY_GREETING, ANDY_STARTERS, useAndy } from "./AndyProvider";

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
            <p className="mt-2 text-lg font-bold text-white">
              Hey! I&apos;m Andy <span aria-hidden="true">👋</span>
            </p>
            <p className="text-sm text-[#9A9A9A]">Pick a suggestion or type what you need.</p>
          </div>
        )}
        <div className="flex items-start gap-2.5">
          <AndyAvatar />
          <p className="max-w-[85%] rounded-2xl rounded-tl-sm bg-white/[0.07] px-3.5 py-2.5 text-sm leading-relaxed text-white">
            {ANDY_GREETING}
          </p>
        </div>

        {messages.length === 0 && showStarters && (
          <div className="flex flex-wrap gap-2 pl-10">
            {ANDY_STARTERS.slice(0, 5).map((starter) => (
              <button
                key={starter}
                type="button"
                onClick={() => void send(starter)}
                className="rounded-full border border-white/15 bg-white/[0.04] px-3 py-1.5 text-xs text-[#D0D0D0] transition-colors hover:border-primary-pink hover:text-white"
              >
                {starter}
              </button>
            ))}
          </div>
        )}

        {messages.map((message) =>
          message.role === "user" ? (
            <div key={message.id} className="flex justify-end">
              <p className="max-w-[85%] whitespace-pre-wrap break-words rounded-2xl rounded-tr-sm bg-[linear-gradient(135deg,#ED4B22,#E8047E)] px-3.5 py-2.5 text-sm leading-relaxed text-white">
                {message.content}
              </p>
            </div>
          ) : (
            <div key={message.id} className="flex items-start gap-2.5">
              <AndyAvatar />
              <div className="min-w-0 flex-1 space-y-3">
                <p
                  className={`max-w-[85%] whitespace-pre-wrap break-words rounded-2xl rounded-tl-sm px-3.5 py-2.5 text-sm leading-relaxed ${
                    message.error ? "bg-red-500/15 text-red-200" : "bg-white/[0.07] text-white"
                  }`}
                >
                  {message.content}
                </p>

                {message.options && (
                  <div className="flex flex-wrap gap-2">
                    {message.options.map((option) => (
                      <button
                        key={option}
                        type="button"
                        disabled={isLoading}
                        onClick={() => void send(option)}
                        className="rounded-full border border-primary-pink/60 px-3 py-1.5 text-xs text-white transition-colors hover:bg-primary-pink/20 disabled:opacity-50"
                      >
                        {option}
                      </button>
                    ))}
                  </div>
                )}

                {message.artists && (
                  <div className="-mr-4 flex gap-3 overflow-x-auto pb-2 pr-4 [scrollbar-width:thin]">
                    {message.artists.map((artist) => (
                      <ArtistCard
                        key={artist.id}
                        id={artist.id}
                        name={artist.name}
                        location={artist.location}
                        thumbnail={artist.image}
                        videoUrl=""
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
          className="min-w-0 flex-1 rounded-full border border-white/10 bg-white/[0.05] px-4 py-2.5 text-sm text-white outline-none placeholder:text-[#7F7F7F] focus:border-primary-pink"
        />
        <button
          type="submit"
          disabled={!draft.trim() || isLoading}
          aria-label="Send"
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[linear-gradient(135deg,#ED4B22,#E8047E)] text-white transition-opacity disabled:opacity-40"
        >
          <svg viewBox="0 0 24 24" fill="currentColor" className="h-5 w-5">
            <path d="M3.4 20.4l17.4-7.5a1 1 0 000-1.8L3.4 3.6a1 1 0 00-1.4 1.2L4 11l9 1-9 1-2 6.2a1 1 0 001.4 1.2z" />
          </svg>
        </button>
      </form>
    </div>
  );
}
