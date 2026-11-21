"use client";

import AndyMascot from "./AndyMascot";

type Props = {
  onStart: () => void;
  /** Shown as a close button in the corner (teaser only). */
  onDismiss?: () => void;
  compact?: boolean;
  className?: string;
};

export default function AndyIntroCard({ onStart, onDismiss, compact = false, className = "" }: Props) {
  return (
    <div
      className={`relative overflow-hidden rounded-2xl bg-[linear-gradient(135deg,rgba(237,75,34,0.7),rgba(232,4,126,0.7))] p-px shadow-2xl shadow-primary-pink/20 ${className}`}
    >
      <div className="relative flex items-center gap-3 overflow-hidden rounded-[15px] bg-[#121214] p-4 sm:gap-4">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -bottom-16 -left-16 h-48 w-48 rounded-full bg-primary-pink/25 blur-3xl"
        />

        {onDismiss && (
          <button
            type="button"
            onClick={onDismiss}
            aria-label="Dismiss"
            className="absolute right-2 top-2 z-10 rounded-full p-1 text-[#7F7F7F] hover:text-white"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-4 w-4">
              <path strokeLinecap="round" d="M6 6l12 12M18 6L6 18" />
            </svg>
          </button>
        )}

        <AndyMascot waving className={`relative shrink-0 ${compact ? "h-20" : "h-24 sm:h-28"} w-auto`} />

        <div className="relative min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1 pr-5">
            <p className={`font-[family-name:var(--font-raleway)] font-bold text-white ${compact ? "text-lg" : "text-xl"}`}>
              Hey! I&apos;m Andy <span aria-hidden="true">👋</span>
            </p>
            <span className="inline-flex items-center gap-1 rounded-full border border-emerald-400/50 px-2 py-0.5 text-xs font-medium text-emerald-400">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
              Online
            </span>
          </div>
          <p className="mt-1 text-sm leading-snug text-[#BDBDBD]">
            Tell me your event, budget and city. I&apos;ll find matching artists for you.
          </p>
          <button
            type="button"
            onClick={onStart}
            className="mt-3 flex w-full items-center justify-center gap-2 rounded-full bg-[linear-gradient(135deg,#ED4B22,#E8047E)] px-4 py-3 font-[family-name:var(--font-raleway)] text-base font-bold text-white transition-transform hover:scale-[1.02]"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-4 w-4" aria-hidden="true">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M21 12a8 8 0 01-11.6 7.1L4 20l1-4.6A8 8 0 1121 12z"
              />
              <path strokeLinecap="round" d="M8.5 12h.01M12 12h.01M15.5 12h.01" strokeWidth="2.6" />
            </svg>
            Start a conversation
          </button>
          <p className="mt-2 flex items-center justify-center gap-1 text-xs text-[#9A9A9A]">
            <svg viewBox="0 0 24 24" className="h-3 w-3 text-primary-orange" fill="currentColor" aria-hidden="true">
              <path d="M13 2L4 14h7l-1 8 9-12h-7l1-8z" />
            </svg>
            Usually replies instantly
          </p>
        </div>
      </div>
    </div>
  );
}
