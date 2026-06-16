"use client";

import { useState } from "react";
import {
  Ticket, DollarSign, Calendar, Plus, ChevronRight,
  MapPin, Clock, CheckCircle2, AlertCircle, ExternalLink,
} from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { useSessionState, clearSessionState } from "@/lib/use-session-state";

// ─── Types ────────────────────────────────────────────────────────────────────

type EventStatus = "upcoming" | "on_sale" | "sold_out" | "completed" | "cancelled";

type ShowEvent = {
  id: string;
  title: string;
  venue: string;
  city: string;
  date: string;
  time: string;
  ticketPrice: number;
  capacity: number;
  sold: number;
  status: EventStatus;
  ticketLink?: string;
  payoutStatus: "pending" | "processing" | "paid";
  payoutAmount?: number;
  payoutDate?: string;
};

// ─── Persistence ──────────────────────────────────────────────────────────────

const STORAGE_KEY = "pocket-events";

function loadEvents(): ShowEvent[] {
  if (typeof window === "undefined") return [];
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "[]");
  } catch {
    return [];
  }
}

function saveEvents(events: ShowEvent[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(events));
}

// ─── Status config ─────────────────────────────────────────────────────────────

const STATUS_CONFIG: Record<EventStatus, { label: string; color: string; bg: string; icon: React.ReactNode }> = {
  upcoming:  { label: "Upcoming",  color: "text-white/40",  bg: "bg-white/5",        icon: <Clock size={11} /> },
  on_sale:   { label: "On Sale",   color: "text-[#97c459]", bg: "bg-[#97c459]/10",   icon: <Ticket size={11} /> },
  sold_out:  { label: "Sold Out",  color: "text-blue-400",  bg: "bg-blue-400/10",    icon: <CheckCircle2 size={11} /> },
  completed: { label: "Completed", color: "text-white/30",  bg: "bg-white/5",        icon: <CheckCircle2 size={11} /> },
  cancelled: { label: "Cancelled", color: "text-red-400",   bg: "bg-red-400/10",     icon: <AlertCircle size={11} /> },
};

// ─── Add Event Modal ──────────────────────────────────────────────────────────

function AddEventModal({ onClose, onAdd }: { onClose: () => void; onAdd: (e: ShowEvent) => void }) {
  const [form, setForm] = useSessionState("pm-events-form", {
    title: "", venue: "", city: "", date: "", time: "",
    ticketPrice: "", capacity: "", ticketLink: "",
  });

  function handleSubmit() {
    if (!form.title || !form.date) return;
    onAdd({
      id: Date.now().toString(),
      title: form.title,
      venue: form.venue,
      city: form.city,
      date: form.date,
      time: form.time || "8:00 PM",
      ticketPrice: parseFloat(form.ticketPrice) || 0,
      capacity: parseInt(form.capacity) || 0,
      sold: 0,
      status: "upcoming",
      ticketLink: form.ticketLink || undefined,
      payoutStatus: "pending",
    });
    clearSessionState("pm-events-form");
    onClose();
  }

  const inputClass = "w-full rounded-lg border border-white/10 px-3 py-2 text-sm text-white placeholder-white/25 outline-none transition focus:border-white/30 bg-white/5";

  const fields: { label: string; key: keyof typeof form; placeholder: string; type?: string; span?: number }[] = [
    { label: "Event Title *", key: "title",       placeholder: "Late Nights Release Show", span: 2 },
    { label: "Venue",         key: "venue",       placeholder: "The Basement East" },
    { label: "City",          key: "city",        placeholder: "Nashville, TN" },
    { label: "Date *",        key: "date",        placeholder: "", type: "date" },
    { label: "Time",          key: "time",        placeholder: "8:00 PM" },
    { label: "Ticket Price ($)", key: "ticketPrice", placeholder: "15", type: "number" },
    { label: "Capacity",      key: "capacity",    placeholder: "500", type: "number" },
    { label: "Ticket Link",   key: "ticketLink",  placeholder: "https://ticketmaster.com", span: 2 },
  ];

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center p-4 sm:items-center"
      style={{ background: "rgba(0,0,0,0.75)" }}
      onClick={onClose}
    >
      <div
        className="w-full max-w-lg space-y-4 overflow-hidden rounded-2xl border border-white/10 p-6"
        style={{ background: "#111110" }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between">
          <h2 className="font-bold text-white">Add Event</h2>
          <button onClick={onClose} className="text-sm text-white/35 transition hover:text-white">Cancel</button>
        </div>

        <div className="grid grid-cols-2 gap-3">
          {fields.map(field => (
            <div key={field.key} className={field.span === 2 ? "col-span-2" : ""}>
              <label className="mb-1 block text-xs text-white/40">{field.label}</label>
              <input
                type={field.type ?? "text"}
                value={form[field.key]}
                onChange={e => setForm(f => ({ ...f, [field.key]: e.target.value }))}
                placeholder={field.placeholder}
                className={inputClass}
                style={{ colorScheme: "dark" }}
              />
            </div>
          ))}
        </div>

        <button
          onClick={handleSubmit}
          disabled={!form.title || !form.date}
          className="w-full rounded-xl py-2.5 text-sm font-semibold text-[#0d0d0b] transition hover:opacity-90 disabled:opacity-40 bg-[#97c459]"
        >
          Add Event
        </button>
      </div>
    </div>
  );
}

// ─── Event Detail Modal ───────────────────────────────────────────────────────

function EventDetail({ event, onClose, onStatusChange }: {
  event: ShowEvent;
  onClose: () => void;
  onStatusChange: (id: string, status: EventStatus) => void;
}) {
  const cfg = STATUS_CONFIG[event.status];
  const dateObj = new Date(event.date + "T00:00:00");
  const sellThrough = event.capacity > 0 ? Math.round((event.sold / event.capacity) * 100) : 0;
  const revenue = event.sold * event.ticketPrice;
  const statuses = Object.keys(STATUS_CONFIG) as EventStatus[];

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center p-4 sm:items-center"
      style={{ background: "rgba(0,0,0,0.75)" }}
      onClick={onClose}
    >
      <div
        className="w-full max-w-lg overflow-hidden rounded-2xl border border-white/10"
        style={{ background: "#111110" }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="border-b border-white/5 p-5">
          <div className="flex items-start justify-between">
            <div>
              <h2 className="text-lg font-bold text-white">{event.title}</h2>
              <div className="mt-1 flex flex-wrap items-center gap-3">
                {event.venue && (
                  <span className="flex items-center gap-1 text-xs text-white/35">
                    <MapPin size={10} />{event.venue}{event.city ? `, ${event.city}` : ""}
                  </span>
                )}
                <span className="flex items-center gap-1 text-xs text-white/35">
                  <Calendar size={10} />
                  {dateObj.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })} · {event.time}
                </span>
              </div>
            </div>
            <button onClick={onClose} className="shrink-0 text-sm text-white/35 transition hover:text-white">Close</button>
          </div>
        </div>

        <div className="space-y-4 p-5">
          {/* Stats */}
          <div className="grid grid-cols-3 gap-3">
            <div className="rounded-xl border border-white/5 p-3" style={{ background: "rgba(255,255,255,0.03)" }}>
              <DollarSign size={14} className="mb-1 text-white/35" />
              <div className="text-sm font-semibold text-white">${event.ticketPrice}</div>
              <div className="text-xs text-white/30">per ticket</div>
            </div>
            <div className="rounded-xl border border-white/5 p-3" style={{ background: "rgba(255,255,255,0.03)" }}>
              <Ticket size={14} className="mb-1 text-white/35" />
              <div className="text-sm font-semibold text-white">{event.sold} / {event.capacity || "—"}</div>
              <div className="text-xs text-white/30">sold</div>
            </div>
            <div className="rounded-xl border border-white/5 p-3" style={{ background: "rgba(255,255,255,0.03)" }}>
              <div className={`mb-1 flex items-center gap-1 text-xs ${cfg.color}`}>{cfg.icon} {cfg.label}</div>
              <div className="text-sm font-semibold text-white">${revenue.toLocaleString()}</div>
              <div className="text-xs text-white/30">revenue</div>
            </div>
          </div>

          {/* Sell-through bar */}
          {event.capacity > 0 && (
            <div>
              <div className="mb-1 flex items-center justify-between">
                <span className="text-xs text-white/35">Sell-through</span>
                <span className={`text-xs font-medium ${sellThrough >= 80 ? "text-[#97c459]" : "text-white/40"}`}>{sellThrough}%</span>
              </div>
              <div className="h-1.5 overflow-hidden rounded-full bg-white/5">
                <div
                  className="h-full rounded-full transition-all"
                  style={{ width: `${sellThrough}%`, background: sellThrough >= 80 ? "#97c459" : "rgba(255,255,255,0.2)" }}
                />
              </div>
            </div>
          )}

          {/* Payout */}
          <div className="rounded-xl border border-white/5 p-4" style={{ background: "rgba(255,255,255,0.03)" }}>
            <div className="mb-2 text-[11px] font-medium uppercase tracking-wider text-white/35">Payout</div>
            <div className="flex items-center justify-between">
              <span className={`text-sm font-semibold ${event.payoutStatus === "paid" ? "text-[#97c459]" : "text-[#ef9f27]"}`}>
                {event.payoutStatus === "paid"
                  ? `$${(event.payoutAmount ?? revenue).toLocaleString()} paid`
                  : event.payoutStatus === "processing"
                  ? "Processing…"
                  : `$${revenue.toLocaleString()} pending`}
              </span>
              {event.payoutDate && (
                <span className="text-xs text-white/30">
                  {new Date(event.payoutDate).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                </span>
              )}
            </div>
          </div>

          {/* Ticket link */}
          {event.ticketLink && (
            <a
              href={event.ticketLink}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 text-sm text-blue-400 transition hover:text-blue-300"
            >
              <ExternalLink size={13} />
              View ticket page
            </a>
          )}

          {/* Status update */}
          <div>
            <div className="mb-2 text-[11px] font-medium uppercase tracking-wider text-white/35">Update Status</div>
            <div className="flex flex-wrap gap-2">
              {statuses.map(s => {
                const c = STATUS_CONFIG[s];
                return (
                  <button
                    key={s}
                    onClick={() => onStatusChange(event.id, s)}
                    className={`flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs transition-all ${
                      event.status === s
                        ? `${c.color} ${c.bg} border-current`
                        : "border-white/10 text-white/35 hover:border-white/30 hover:text-white/60"
                    }`}
                  >
                    {c.icon}
                    {c.label}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Event Card ────────────────────────────────────────────────────────────────

function EventCard({ event, onClick }: { event: ShowEvent; onClick: () => void }) {
  const cfg = STATUS_CONFIG[event.status];
  const dateObj = new Date(event.date + "T00:00:00");
  const sellThrough = event.capacity > 0 ? Math.round((event.sold / event.capacity) * 100) : 0;
  const revenue = event.sold * event.ticketPrice;

  return (
    <button
      onClick={onClick}
      className="group w-full overflow-hidden rounded-xl border border-white/5 text-left transition hover:border-white/15"
      style={{ background: "rgba(255,255,255,0.03)" }}
    >
      <div className="p-4">
        <div className="mb-3 flex items-start justify-between">
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <span className="truncate text-sm font-semibold text-white">{event.title}</span>
              <span className={`flex shrink-0 items-center gap-1 rounded-full px-2 py-0.5 text-xs ${cfg.color} ${cfg.bg}`}>
                {cfg.icon}{cfg.label}
              </span>
            </div>
            <div className="mt-1 flex flex-wrap items-center gap-3">
              {event.city && (
                <span className="flex items-center gap-1 text-xs text-white/30">
                  <MapPin size={10} />{event.venue ? `${event.venue}, ` : ""}{event.city}
                </span>
              )}
              <span className="flex items-center gap-1 text-xs text-white/30">
                <Calendar size={10} />
                {dateObj.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })} · {event.time}
              </span>
            </div>
          </div>
          <ChevronRight size={14} className="ml-2 mt-0.5 shrink-0 text-white/20 transition-colors group-hover:text-white/50" />
        </div>

        {/* Ticket progress bar */}
        {event.capacity > 0 && (
          <div className="mb-3">
            <div className="mb-1 flex items-center justify-between">
              <span className="text-xs text-white/30">{event.sold} / {event.capacity} tickets</span>
              <span className={`text-xs font-medium ${sellThrough >= 80 ? "text-[#97c459]" : "text-white/30"}`}>{sellThrough}%</span>
            </div>
            <div className="h-1 overflow-hidden rounded-full bg-white/5">
              <div
                className="h-full rounded-full transition-all"
                style={{ width: `${sellThrough}%`, background: sellThrough >= 80 ? "#97c459" : "rgba(255,255,255,0.15)" }}
              />
            </div>
          </div>
        )}

        {/* Revenue row */}
        <div className="flex items-center gap-4">
          {event.capacity > 0 && (
            <span className="text-xs text-white/30">
              <span className="font-medium text-white">${revenue.toLocaleString()}</span> ticket revenue
            </span>
          )}
          {event.payoutStatus === "paid" && event.payoutAmount && (
            <span className="flex items-center gap-1 text-xs text-[#97c459]">
              <CheckCircle2 size={10} />${event.payoutAmount.toLocaleString()} paid out
            </span>
          )}
          {event.ticketLink && (
            <a
              href={event.ticketLink}
              target="_blank"
              rel="noopener noreferrer"
              onClick={e => e.stopPropagation()}
              className="ml-auto flex items-center gap-1 text-xs text-white/30 transition hover:text-white"
            >
              <Ticket size={10} />Tickets<ExternalLink size={9} />
            </a>
          )}
        </div>
      </div>
    </button>
  );
}

// ─── Page ──────────────────────────────────────────────────────────────────────

export default function EventsPage() {
  const [events, setEvents] = useState<ShowEvent[]>(() => loadEvents());
  const [tab, setTab] = useState<"upcoming" | "past" | "payouts">("upcoming");
  const [showAdd, setShowAdd] = useState(false);
  const [selected, setSelected] = useState<ShowEvent | null>(null);


  const now = new Date();
  const upcoming = events.filter(e => new Date(e.date + "T00:00:00") >= now && e.status !== "cancelled");
  const past = events.filter(e => new Date(e.date + "T00:00:00") < now || e.status === "completed");
  const totalPaidOut = past.filter(e => e.payoutStatus === "paid").reduce((s, e) => s + (e.payoutAmount ?? 0), 0);
  const totalPending = past.filter(e => e.payoutStatus !== "paid").reduce((s, e) => s + (e.sold * e.ticketPrice), 0);

  const displayed = tab === "upcoming" ? upcoming : past;

  function handleAdd(e: ShowEvent) {
    const next = [e, ...events];
    setEvents(next);
    saveEvents(next);
  }

  function handleStatusChange(id: string, status: EventStatus) {
    const next = events.map(e => e.id === id ? { ...e, status } : e);
    setEvents(next);
    saveEvents(next);
    setSelected(prev => prev?.id === id ? { ...prev, status } : prev);
  }

  return (
    <AppShell title="Events & Tickets" eyebrow="Signal">
      <main className="mx-auto max-w-2xl">

        {/* Stats */}
        <div className="mb-5 grid grid-cols-3 gap-3">
          {[
            { label: "Upcoming",       value: String(upcoming.length),         icon: <Calendar size={14} className="mb-1 text-white/35" /> },
            { label: "Paid Out",       value: `$${totalPaidOut.toLocaleString()}`, icon: <DollarSign size={14} className="mb-1 text-white/35" /> },
            { label: "Pending Payout", value: `$${totalPending.toLocaleString()}`, icon: <Clock size={14} className="mb-1 text-white/35" /> },
          ].map(s => (
            <div key={s.label} className="rounded-2xl border border-white/5 p-4" style={{ background: "rgba(255,255,255,0.03)" }}>
              {s.icon}
              <div className="text-xl font-bold text-white">{s.value}</div>
              <div className="mt-0.5 text-xs text-white/30">{s.label}</div>
            </div>
          ))}
        </div>

        {/* Tabs + Add button */}
        <div className="mb-4 flex items-center gap-2">
          <div className="flex flex-1 gap-1 rounded-xl border border-white/5 p-1" style={{ background: "rgba(255,255,255,0.03)" }}>
            {([
              { key: "upcoming", label: `Upcoming (${upcoming.length})` },
              { key: "past",     label: `Past (${past.length})` },
              { key: "payouts",  label: "Payouts" },
            ] as const).map(t => (
              <button
                key={t.key}
                onClick={() => setTab(t.key)}
                className="flex-1 rounded-lg py-1.5 text-xs font-medium transition-all"
                style={{
                  background: tab === t.key ? "#97c459" : "transparent",
                  color: tab === t.key ? "#0d0d0b" : "rgba(255,255,255,0.35)",
                }}
              >
                {t.label}
              </button>
            ))}
          </div>
          <button
            onClick={() => setShowAdd(true)}
            className="flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold text-[#0d0d0b] transition hover:opacity-90 bg-[#97c459]"
          >
            <Plus size={14} />
            Add
          </button>
        </div>

        {/* Payouts tab */}
        {tab === "payouts" ? (
          <div className="space-y-3">
            {past.filter(e => e.sold > 0 || e.payoutStatus === "paid").length === 0 ? (
              <div className="rounded-2xl border border-dashed border-white/10 py-16 text-center text-sm text-white/30" style={{ background: "rgba(255,255,255,0.02)" }}>
                No payout history yet
              </div>
            ) : (
              past.filter(e => e.sold > 0 || e.payoutStatus === "paid").map(e => (
                <div key={e.id} className="rounded-xl border border-white/5 p-4" style={{ background: "rgba(255,255,255,0.03)" }}>
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="text-sm font-medium text-white">{e.title}</div>
                      <div className="mt-0.5 text-xs text-white/30">
                        {new Date(e.date + "T00:00:00").toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-bold text-white">${(e.payoutAmount ?? e.sold * e.ticketPrice).toLocaleString()}</div>
                      <div className={`mt-0.5 text-xs ${e.payoutStatus === "paid" ? "text-[#97c459]" : "text-[#ef9f27]"}`}>
                        {e.payoutStatus === "paid"
                          ? `Paid${e.payoutDate ? " " + new Date(e.payoutDate).toLocaleDateString("en-US", { month: "short", day: "numeric" }) : ""}`
                          : "Pending"}
                      </div>
                    </div>
                  </div>
                  <div className="mt-3 flex items-center gap-4 border-t border-white/5 pt-3">
                    <span className="text-xs text-white/30">{e.sold} tickets × ${e.ticketPrice}</span>
                    {e.venue && <span className="text-xs text-white/30">{e.venue}</span>}
                  </div>
                </div>
              ))
            )}
          </div>
        ) : (
          <div className="space-y-3">
            {displayed.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-white/10 py-16 text-center" style={{ background: "rgba(255,255,255,0.02)" }}>
                <div className="text-2xl">🎤</div>
                <div className="mt-2 text-sm text-white/30">
                  {events.length === 0 ? "No events yet." : `No ${tab} events.`}
                </div>
                {events.length === 0 && (
                  <button
                    onClick={() => setShowAdd(true)}
                    className="mt-3 text-xs text-white/30 underline underline-offset-2 transition hover:text-white/60"
                  >
                    Add your first event →
                  </button>
                )}
              </div>
            ) : (
              displayed.map(e => <EventCard key={e.id} event={e} onClick={() => setSelected(e)} />)
            )}
          </div>
        )}
      </main>

      {showAdd && <AddEventModal onClose={() => setShowAdd(false)} onAdd={handleAdd} />}
      {selected && (
        <EventDetail
          event={selected}
          onClose={() => setSelected(null)}
          onStatusChange={handleStatusChange}
        />
      )}
    </AppShell>
  );
}
