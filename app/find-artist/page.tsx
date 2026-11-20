"use client";

import SiteLayout from "@/components/layout/SiteLayout";
import AndyMascot from "@/components/andy/AndyMascot";
import AndyChat from "@/components/andy/AndyChat";
import { ANDY_STARTERS, useAndy } from "@/components/andy/AndyProvider";

export default function FindArtistPage() {
  const { send, isLoading, messages, reset } = useAndy();

  return (
    <SiteLayout hideFooter>
      <div className="mx-auto w-full max-w-6xl px-4 pb-[calc(6rem+env(safe-area-inset-bottom))] pt-24 sm:px-6 md:pb-8 lg:px-8 lg:pt-28">
        <div className="mb-5 flex items-center gap-3">
          <AndyMascot className="h-14 w-auto shrink-0" />
          <div>
            <h1 className="text-xl font-bold text-white sm:text-2xl">Find Artist with AI</h1>
            <p className="text-sm text-[#9A9A9A]">Tell Andy what you need. He will find matching artists.</p>
          </div>
          {messages.length > 0 && (
            <button type="button" onClick={reset} className="ml-auto text-sm text-[#9A9A9A] hover:text-white">
              New chat
            </button>
          )}
        </div>

        <div className="flex flex-col gap-4 lg:flex-row">
          <aside className="lg:w-72 lg:shrink-0" aria-label="Conversation starters">
            <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-white">Try asking</p>
            <div className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 lg:mx-0 lg:flex-col lg:overflow-visible lg:px-0">
              {ANDY_STARTERS.map((starter) => (
                <button
                  key={starter}
                  type="button"
                  disabled={isLoading}
                  onClick={() => void send(starter)}
                  className="shrink-0 rounded-full border border-white/15 bg-white/[0.04] px-4 py-2 text-left text-sm text-[#D0D0D0] transition-colors hover:border-primary-pink hover:text-white disabled:opacity-50 lg:rounded-xl"
                >
                  {starter}
                </button>
              ))}
            </div>
          </aside>

          <section className="flex h-[calc(100dvh-17rem)] min-h-[26rem] flex-1 flex-col overflow-hidden rounded-2xl border border-white/10 bg-[#161616] lg:h-[calc(100dvh-14rem)]">
            <AndyChat showMascot className="flex-1" />
          </section>
        </div>
      </div>
    </SiteLayout>
  );
}
