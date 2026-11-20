"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import AndyAvatar from "./AndyAvatar";
import AndyChat from "./AndyChat";
import AndyIntroCard from "./AndyIntroCard";
import AndyMascot from "./AndyMascot";
import AndyNudge from "./AndyNudge";
import { useAndy } from "./AndyProvider";

const COLLAPSED_KEY = "andy-card-collapsed";
const HIDDEN_PREFIXES = ["/find-artist", "/auth", "/artist/", "/shorts"];

export default function AndyWidget() {
  const pathname = usePathname();
  const router = useRouter();
  const { isWidgetOpen, setWidgetOpen, reset, messages, send } = useAndy();
  const [started, setStarted] = useState(false);
  const [nudgeVisible, setNudgeVisible] = useState(false);
  const [collapsed, setCollapsed] = useState(false);

  useEffect(() => {
    try {
      setCollapsed(sessionStorage.getItem(COLLAPSED_KEY) === "1");
    } catch {}
  }, []);

  const collapse = () => {
    setCollapsed(true);
    try {
      sessionStorage.setItem(COLLAPSED_KEY, "1");
    } catch {}
  };
  const hidden = HIDDEN_PREFIXES.some((prefix) => pathname === prefix || pathname.startsWith(prefix));
  const inConversation = started || messages.length > 0;
  // Failed replies do not count: the user never got help, so nudges may continue.
  const engaged = started || messages.some((m) => m.role === "assistant" && !m.error);

  // Close the chat when the user navigates (e.g. taps an artist card), so the new page is visible.
  // The conversation is kept; the button reopens it.
  useEffect(() => {
    setWidgetOpen(false);
  }, [pathname, setWidgetOpen]);

  const acceptNudge = (query: string) => {
    setStarted(true);
    setWidgetOpen(true);
    void send(query);
  };

  const toggleWidget = () => {
    setWidgetOpen(!isWidgetOpen);
  };

  if (hidden) return null;

  const clear = () => {
    reset();
    setStarted(false);
  };

  const expand = () => {
    setWidgetOpen(false);
    router.push("/find-artist");
  };

  return (
    <div className="fixed bottom-[calc(5.75rem+env(safe-area-inset-bottom))] right-4 z-[10000] md:bottom-6 md:right-6">
      {isWidgetOpen && (
        <section
          role="dialog"
          aria-label="Chat with Andy"
          className="fixed inset-0 flex flex-col overflow-hidden bg-[#161616] pb-[env(safe-area-inset-bottom)] pt-[env(safe-area-inset-top)] md:absolute md:inset-auto md:bottom-full md:mb-3 md:right-0 md:h-[min(34rem,calc(100dvh-8rem))] md:w-[380px] md:rounded-2xl md:border md:border-white/10 md:p-0 md:shadow-2xl md:shadow-black/60"
        >
          <header className="flex items-center gap-2.5 border-b border-white/10 px-4 py-3">
            <AndyAvatar className="h-9 w-9" />
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold text-white">Andy</p>
              <p className="text-xs text-[#9A9A9A]">Find artists with AI</p>
            </div>
            {messages.length > 0 && (
              <button
                type="button"
                onClick={clear}
                className="rounded-md px-2 py-1 text-xs text-[#9A9A9A] hover:text-white"
              >
                Clear
              </button>
            )}
            <button
              type="button"
              onClick={expand}
              aria-label="Expand to full page"
              className="rounded-md p-1.5 text-[#9A9A9A] hover:text-white"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-4 w-4">
                <path strokeLinecap="round" strokeLinejoin="round" d="M14 4h6v6M10 20H4v-6M20 4l-7 7M4 20l7-7" />
              </svg>
            </button>
            <button
              type="button"
              onClick={() => setWidgetOpen(false)}
              aria-label="Close chat"
              className="rounded-md p-1.5 text-[#9A9A9A] hover:text-white"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-4 w-4">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 6l12 12M18 6L6 18" />
              </svg>
            </button>
          </header>
          {inConversation ? (
            <AndyChat showStarters showMascot mascotClass="h-24 w-auto" autoFocus className="flex-1" />
          ) : (
            <div className="flex flex-1 items-center p-4">
              <AndyIntroCard onStart={() => setStarted(true)} className="w-full" />
            </div>
          )}
        </section>
      )}

      <AndyNudge
        active={!isWidgetOpen && !engaged}
        onAccept={acceptNudge}
        onVisibleChange={setNudgeVisible}
      />

      {!isWidgetOpen && !collapsed ? (
        <div className="w-[min(16.5rem,calc(100vw-2rem))] rounded-2xl border border-white/10 bg-[#0B0B0D] p-3 shadow-2xl shadow-black/60">
          <div className="flex h-[92px] items-stretch gap-2">
            <AndyMascot className="h-full w-[88px] shrink-0" />
            <div className="flex min-w-0 flex-1 flex-col justify-between">
              <div className="flex items-start gap-1">
                <div className="min-w-0 flex-1">
                  <p className="pt-1 text-sm font-semibold leading-tight text-white">Need help?</p>
                  <p className="mt-0.5 flex items-center gap-1 text-[11px] text-[#9A9A9A]">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                    Andy is online
                  </p>
                </div>
                <button
                  type="button"
                  onClick={collapse}
                  aria-label="Minimise Andy"
                  className="rounded-full p-1 text-[#7F7F7F] hover:text-white"
                >
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-4 w-4">
                    <path strokeLinecap="round" d="M6 6l12 12M18 6L6 18" />
                  </svg>
                </button>
              </div>
              <button
                type="button"
                onClick={() => {
                  setStarted(true);
                  setWidgetOpen(true);
                }}
                className="h-10 w-full rounded-full bg-[linear-gradient(135deg,#ED4B22,#E8047E)] px-2 text-[12.5px] font-semibold text-white transition-transform hover:scale-[1.02]"
              >
                Start conversation
              </button>
            </div>
          </div>
        </div>
      ) : (
        <button
          type="button"
          onClick={toggleWidget}
          aria-label={isWidgetOpen ? "Close Andy chat" : "Chat with Andy"}
          aria-expanded={isWidgetOpen}
          className={`relative h-16 w-16 items-center justify-center rounded-full bg-[linear-gradient(135deg,#ED4B22,#E8047E)] p-[2px] shadow-xl shadow-primary-pink/30 transition-transform hover:scale-105 ${isWidgetOpen ? "hidden md:flex" : "flex"}`}
        >
          <span className="flex h-full w-full items-center justify-center overflow-hidden rounded-full bg-[#121214]">
            {isWidgetOpen ? (
              <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" className="h-6 w-6">
                <path strokeLinecap="round" d="M6 6l12 12M18 6L6 18" />
              </svg>
            ) : (
              <AndyMascot waving={nudgeVisible} className="h-11 w-11" />
            )}
          </span>
          {!isWidgetOpen && (
            <span className="absolute right-0.5 top-0.5 h-3 w-3 rounded-full border-2 border-[#121214] bg-emerald-400" />
          )}
        </button>
      )}
    </div>
  );
}
