"use client";

import { useEffect, useRef, useState } from "react";
import { ChevronRight } from "lucide-react";
import Tooltip from "@/components/ui/Tooltip";

type AudienceSplit = { platform: number; visitors: number };

type Counts = {
  profileViews: number;
  whatsappClicks: number;
  callClicks: number;
  platformUsers: number;
  visitors: number;
  breakdown: {
    PROFILE_VIEW: AudienceSplit;
    WHATSAPP_CLICK: AudienceSplit;
    CALL_CLICK: AudienceSplit;
  };
};

type EventRow = {
  id: string;
  type: string;
  createdAt: string;
  userName: string;
  phone: string | null;
};

type Selection =
  | { kind: "type"; value: "PROFILE_VIEW" | "WHATSAPP_CLICK" | "CALL_CLICK"; label: string; key: keyof Counts }
  | { kind: "audience"; value: "platform" | "visitor"; label: string; key: keyof Counts };

const METRIC_CARDS: Selection[] = [
  { kind: "type", value: "PROFILE_VIEW", label: "Profile Views", key: "profileViews" },
  { kind: "type", value: "WHATSAPP_CLICK", label: "WhatsApp Clicks", key: "whatsappClicks" },
  { kind: "type", value: "CALL_CLICK", label: "Call Clicks", key: "callClicks" },
];

const EMPTY_SPLIT: AudienceSplit = { platform: 0, visitors: 0 };

const EMPTY_COUNTS: Counts = {
  profileViews: 0,
  whatsappClicks: 0,
  callClicks: 0,
  platformUsers: 0,
  visitors: 0,
  breakdown: {
    PROFILE_VIEW: EMPTY_SPLIT,
    WHATSAPP_CLICK: EMPTY_SPLIT,
    CALL_CLICK: EMPTY_SPLIT,
  },
};

function formatWhen(iso: string) {
  const date = new Date(iso);
  return {
    day: new Intl.DateTimeFormat("en-GB", { day: "2-digit", month: "short" }).format(date),
    time: new Intl.DateTimeFormat("en-US", { hour: "numeric", minute: "2-digit" }).format(date),
  };
}

function sameSelection(a: Selection | null, b: Selection) {
  return a?.kind === b.kind && a.value === b.value;
}

export default function ArtistAnalyticsPanel({
  artistId,
  onActiveChange,
}: {
  artistId: string | null;
  onActiveChange?: (active: boolean) => void;
}) {
  const [range, setRange] = useState("month");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [counts, setCounts] = useState<Counts>(EMPTY_COUNTS);
  const [, setFrequency] = useState("weekly");
  const [selected, setSelected] = useState<Selection | null>(METRIC_CARDS[0]);
  const [rows, setRows] = useState<EventRow[]>([]);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const listRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    onActiveChange?.(Boolean(selected));
  }, [selected, onActiveChange]);

  useEffect(() => {
    if (!artistId) return;
    const params = new URLSearchParams({ range, page: String(page) });
    params.set("artistId", artistId);
    if (range === "custom" && from && to) {
      params.set("from", from);
      params.set("to", to);
    }
    if (selected?.kind === "type") params.set("type", selected.value);
    if (selected?.kind === "audience") params.set("audience", selected.value);

    let cancelled = false;
    fetch(`/api/artists/dashboard/analytics?${params.toString()}`)
      .then((res) => res.json())
      .then((json) => {
        if (cancelled || !json?.success) return;
        const breakdown = json.data.counts.breakdown ?? EMPTY_COUNTS.breakdown;
        setCounts({
          profileViews: json.data.counts.profileViews ?? 0,
          whatsappClicks: json.data.counts.whatsappClicks ?? 0,
          callClicks: json.data.counts.callClicks ?? 0,
          platformUsers: json.data.counts.platformUsers ?? 0,
          visitors: json.data.counts.visitors ?? 0,
          breakdown: {
            PROFILE_VIEW: breakdown.PROFILE_VIEW ?? EMPTY_SPLIT,
            WHATSAPP_CLICK: breakdown.WHATSAPP_CLICK ?? EMPTY_SPLIT,
            CALL_CLICK: breakdown.CALL_CLICK ?? EMPTY_SPLIT,
          },
        });
        setFrequency(json.data.frequency || "weekly");
        if (selected) {
          setRows(json.data.events.items);
          setTotal(json.data.events.total);
        }
      })
      .catch(() => undefined);
    return () => {
      cancelled = true;
    };
  }, [artistId, range, from, to, selected, page]);

  const activeSplit =
    selected?.kind === "type" ? counts.breakdown[selected.value] : counts.breakdown.PROFILE_VIEW;

  return (
    <div className="mb-6">
      <div className="mb-3 flex flex-wrap items-center gap-2">
        {["today", "week", "month", "custom"].map((preset) => (
          <button
            key={preset}
            type="button"
            onClick={() => {
              setPage(1);
              setRange(preset);
            }}
            className={`rounded-full border border-border-color px-3 py-1 text-sm ${
              range === preset ? "bg-white text-black" : "bg-[#262626] text-white"
            }`}
          >
            {preset === "week" ? "This Week" : preset === "month" ? "This Month" : preset === "today" ? "Today" : "Custom"}
          </button>
        ))}
        {range === "custom" && (
          <>
            <input type="date" value={from} onChange={(e) => { setPage(1); setFrom(e.target.value); }} className="rounded-md border border-border-color bg-[#262626] px-2 py-1 text-sm text-white" />
            <input type="date" value={to} onChange={(e) => { setPage(1); setTo(e.target.value); }} className="rounded-md border border-border-color bg-[#262626] px-2 py-1 text-sm text-white" />
          </>
        )}
        {/* Weekly / monthly WhatsApp report
        <select
          value={frequency}
          onChange={(event) => {
            const next = event.target.value;
            setFrequency(next);
            if (!artistId) return;
            fetch("/api/artists/dashboard/analytics", {
              method: "PATCH",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ artistId, frequency: next }),
            }).catch(() => undefined);
          }}
          className="rounded-full border border-border-color bg-[#262626] px-3 py-1 text-sm text-white"
          aria-label="WhatsApp report frequency"
        >
          <option value="weekly">Weekly report</option>
          <option value="monthly">Monthly report</option>
        </select>
        */}
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        {METRIC_CARDS.map((card) => {
          const active = sameSelection(selected, card);
          return (
            <button
              key={card.label}
              type="button"
              onClick={() => {
                setPage(1);
                setSelected(card);
                if (window.matchMedia("(max-width: 767px)").matches) {
                  requestAnimationFrame(() => {
                    listRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
                  });
                }
              }}
              className={`flex min-h-[112px] flex-col rounded-2xl border px-5 py-4 text-left shadow-[0_8px_24px_rgba(0,0,0,0.25)] transition hover:-translate-y-0.5 ${
                active
                  ? "border-white bg-white text-black"
                  : "border-border-color bg-gradient-to-b from-[#1F1F1F] to-[#141414] text-white hover:border-white/25"
              }`}
            >
              <div className={`text-sm font-medium ${active ? "text-black/60" : "text-text-gray"}`}>{card.label}</div>
              <div className="mt-auto flex items-end justify-between pt-4">
                <div className={`text-[32px] font-semibold leading-none tracking-tight ${active ? "text-black" : "text-white"}`}>
                  {counts[card.key].toLocaleString("en-IN")}
                </div>
                <span
                  className={`flex h-8 w-8 items-center justify-center rounded-full ${
                    active ? "bg-black text-white" : "bg-white/10 text-white"
                  }`}
                >
                  <ChevronRight className={`h-4 w-4 transition-transform ${active ? "rotate-90" : ""}`} />
                </span>
              </div>
            </button>
          );
        })}
      </div>

      <div className="mt-3 flex flex-wrap gap-2">
        {(
          [
            ["Platform Users", activeSplit.platform, "People who were signed in to AndAction when they did this."],
            ["Visitors", activeSplit.visitors, "People who stopped by without signing in."],
          ] as const
        ).map(([label, value, tip]) => (
          <Tooltip key={label} content={tip} position="top">
            <div className="inline-flex items-center gap-2 rounded-full border border-border-color bg-[#262626] px-3 py-1.5 text-sm text-text-gray">
              <span>{label}</span>
              <span className="font-semibold text-white">{value.toLocaleString("en-IN")}</span>
            </div>
          </Tooltip>
        ))}
      </div>

      {selected && (
        <div ref={listRef} className="mt-6 scroll-mt-4">
          <h2 className="mb-3 text-xl font-semibold text-white">{selected.label}</h2>
          <div className="space-y-2 md:hidden">
            {rows.map((row) => {
              const when = formatWhen(row.createdAt);
              return (
                <div key={row.id} className="rounded-2xl border border-border-color bg-[#1A1A1A] px-4 py-3 text-sm text-white">
                  <div className="font-medium">{row.userName}</div>
                  <div className="mt-1 flex items-start justify-between gap-3">
                    <div className="text-text-gray">{row.phone || "—"}</div>
                    <div className="shrink-0 text-right text-text-gray">{when.day} · {when.time}</div>
                  </div>
                </div>
              );
            })}
            {rows.length === 0 && (
              <div className="rounded-2xl border border-border-color bg-[#1A1A1A] px-4 py-6 text-sm text-text-gray">No activity in this range.</div>
            )}
          </div>
          <div className="hidden overflow-x-auto rounded-2xl border border-border-color bg-[#1A1A1A] md:block">
            <table className="w-full min-w-[520px] text-left text-sm text-white">
              <thead className="text-text-gray">
                <tr>
                  <th className="px-4 py-3 font-medium">Name</th>
                  <th className="px-4 py-3 font-medium">Phone / WhatsApp</th>
                  <th className="px-4 py-3 font-medium">Date</th>
                  <th className="px-4 py-3 font-medium">Time</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => {
                  const when = formatWhen(row.createdAt);
                  return (
                    <tr key={row.id} className="border-t border-border-color">
                      <td className="px-4 py-3">{row.userName}</td>
                      <td className="px-4 py-3">{row.phone || "—"}</td>
                      <td className="px-4 py-3">{when.day}</td>
                      <td className="px-4 py-3">{when.time}</td>
                    </tr>
                  );
                })}
                {rows.length === 0 && (
                  <tr>
                    <td colSpan={4} className="px-4 py-6 text-text-gray">No activity in this range.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          {total > 20 && (
            <div className="mt-3 flex justify-end gap-3 text-sm text-white">
              <button type="button" disabled={page <= 1} onClick={() => setPage((current) => Math.max(1, current - 1))}>Previous</button>
              <button type="button" disabled={page * 20 >= total} onClick={() => setPage((current) => current + 1)}>Next</button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
