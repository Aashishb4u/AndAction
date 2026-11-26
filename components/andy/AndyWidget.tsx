"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import AndyAvatar from "./AndyAvatar";
import AndyChat from "./AndyChat";
import AndyMascot from "./AndyMascot";
import AndyNudge from "./AndyNudge";
import { useLocation } from "@/components/providers/location-provider";
import { useAndy } from "./AndyProvider";

const COLLAPSED_KEY = "andy-card-collapsed";
const HIDDEN_PREFIXES = ["/find-artist", "/auth", "/artist/", "/artists/", "/shorts"];

export default function AndyWidget() {
  const pathname = usePathname();
  const router = useRouter();
  const { isWidgetOpen, setWidgetOpen, reset, messages, send } = useAndy();
  const { isLocationResolved } = useLocation();
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
  // Failed replies do not count: the user never got help, so nudges may continue.
  const engaged = started || messages.some((m) => m.role === "assistant" && !m.error);

  // Close the chat when the user navigates (e.g. taps an artist card), so the new page is visible.
  // The conversation is kept; the button reopens it.
  useEffect(() => {
    setWidgetOpen(false);
  }, [pathname, setWidgetOpen]);

  // Mobile: the chat is full screen, so the phone's back button should close it and go home,
  // not leave the site. A history entry is added while the chat is open to catch that back press.
  const closedByBack = useRef(false);
  useEffect(() => {
    if (!isWidgetOpen || !window.matchMedia("(max-width: 767px)").matches) return;
    window.history.pushState({ ...window.history.state, andy: true }, "");
    const onPop = () => {
      closedByBack.current = true;
      setWidgetOpen(false);
      if (window.location.pathname !== "/") router.push("/");
    };
    window.addEventListener("popstate", onPop);
    return () => {
      window.removeEventListener("popstate", onPop);
      // Closed with the X button: drop the extra entry so the next back press works normally.
      if (!closedByBack.current && window.history.state?.andy) window.history.back();
      closedByBack.current = false;
    };
  }, [isWidgetOpen, router, setWidgetOpen]);

  const acceptNudge = (query: string) => {
    setStarted(true);
    setWidgetOpen(true);
    void send(query);
  };

  const toggleWidget = () => {
    setWidgetOpen(!isWidgetOpen);
  };

  // The Enable Location popup comes first; Andy appears once the user has answered it.
  if (hidden || !isLocationResolved) return null;

  const clear = () => {
    reset();
    setStarted(false);
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
              <p className="font-[family-name:var(--font-raleway)] text-lg font-bold text-white">Andy</p>
              <p className="text-sm text-[#9A9A9A]">Find artists with AI</p>
            </div>
            {messages.length > 0 && (
              <button
                type="button"
                onClick={clear}
                className="rounded-md px-2 py-1 text-sm text-[#9A9A9A] hover:text-white"
              >
                Clear
              </button>
            )}
            <button
              type="button"
              onClick={() => {
                // Mobile: swap the chat's extra history entry for the page, so back returns where the user was.
                if (window.history.state?.andy) {
                  closedByBack.current = true;
                  router.replace("/find-artist");
                } else {
                  router.push("/find-artist");
                }
                setWidgetOpen(false);
              }}
              aria-label="Open full-screen chat"
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
          <AndyChat showStarters showMascot mascotClass="h-24 w-auto" className="flex-1" />
        </section>
      )}

      <AndyNudge
        active={!isWidgetOpen && !engaged}
        onAccept={acceptNudge}
        onVisibleChange={setNudgeVisible}
      />

      {!isWidgetOpen && !collapsed ? (
        <div className="w-[15rem] rounded-2xl border border-white/10 bg-[#0B0B0D] p-2.5 shadow-2xl shadow-black/60 md:w-[min(16.5rem,calc(100vw-2rem))] md:p-3">
          <div className="flex h-[76px] items-stretch gap-2 md:h-[92px]">
            <AndyMascot className="h-full w-[70px] shrink-0 md:w-[88px]" />
            <div className="flex min-w-0 flex-1 flex-col justify-between">
              <div className="flex items-start gap-1">
                <div className="min-w-0 flex-1">
                  <p className="pt-1 font-[family-name:var(--font-raleway)] text-sm font-bold leading-tight text-white md:text-base">Need help?</p>
                  <p className="mt-0.5 flex items-center gap-1 text-xs text-[#9A9A9A]">
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
                  // Mobile: skip the pop-up and open the full Find Artist page.
                  if (window.matchMedia("(max-width: 767px)").matches) router.push("/find-artist");
                  else setWidgetOpen(true);
                }}
                className="h-8 w-full rounded-full bg-[linear-gradient(135deg,#ED4B22,#E8047E)] whitespace-nowrap px-2 font-[family-name:var(--font-raleway)] text-xs font-bold md:h-10 md:text-sm text-white transition-transform hover:scale-[1.02]"
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
          className={`relative h-12 w-12 items-center md:h-16 md:w-16 justify-center rounded-full bg-[linear-gradient(135deg,#ED4B22,#E8047E)] p-[2px] shadow-xl shadow-primary-pink/30 transition-transform hover:scale-105 ${isWidgetOpen ? "hidden md:flex" : "flex"}`}
        >
          <span className="flex h-full w-full items-center justify-center overflow-hidden rounded-full bg-[#121214]">
            {isWidgetOpen ? (
              <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" className="h-6 w-6">
                <path strokeLinecap="round" d="M6 6l12 12M18 6L6 18" />
              </svg>
            ) : (
              <AndyMascot waving={nudgeVisible} className="h-8 w-8 md:h-11 md:w-11" />
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
