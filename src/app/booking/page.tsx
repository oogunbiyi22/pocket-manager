"use client";

import { useState, useEffect } from "react";
import {
  Plus, MapPin, Mail, ExternalLink, ChevronRight,
  Filter, Search, Calendar, DollarSign, Clock,
  CheckCircle2, XCircle, AlertCircle,
} from "lucide-react";
import { AppShell } from "@/components/app-shell";

// ─── Types ────────────────────────────────────────────────────────────────────

type BookingStatus = "inquired" | "negotiating" | "confirmed" | "completed" | "declined";

type Booking = {
  id: string;
  venueName: string;
  city: string;
  state: string;
  date: string;
  guarantee: number | null;
  status: BookingStatus;
  capacity: number;
  contact: string;
  contactEmail: string;
  notes: string;
};

// ─── Persistence ──────────────────────────────────────────────────────────────

const STORAGE_KEY = "pocket-bookings";

function loadBookings(): Booking[] {
  if (typeof window === "undefined") return [];
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "[]");
  } catch {
    return [];
  }
}

function saveBookings(bookings: Booking[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(bookings));
}

// ─── Status config ─────────────────────────────────────────────────────────────

const STATUS_CONFIG: Record<BookingStatus, { label: string; color: string; bg: string; icon: React.ReactNode }> = {
  inquired:    { label: "Inquired",    color: "text-[#ef9f27]", bg: "bg-[#ef9f27]/10", icon: <AlertCircle size={12} /> },
  negotiating: { label: "Negotiating", color: "text-blue-400",  bg: "bg-blue-400/10",  icon: <Clock size={12} /> },
  confirmed:   { label: "Confirmed",   color: "text-[#97c459]", bg: "bg-[#97c459]/10", icon: <CheckCircle2 size={12} /> },
  completed:   { label: "Completed",   color: "text-white/40",  bg: "bg-white/5",       icon: <CheckCircle2 size={12} /> },
  declined:    { label: "Declined",    color: "text-red-400",   bg: "bg-red-400/10",   icon: <XCircle size={12} /> },
};

// ─── Add Booking Modal ─────────────────────────────────────────────────────────

function AddBookingModal({ onClose, onAdd }: { onClose: () => void; onAdd: (b: Booking) => void }) {
  const [form, setForm] = useState({
    venueName: "", city: "", state: "", date: "",
    guarantee: "", contact: "", contactEmail: "", notes: "",
  });

  function handleSubmit() {
    if (!form.venueName || !form.city || !form.date) return;
    onAdd({
      id: Date.now().toString(),
      venueName: form.venueName,
      city: form.city,
      state: form.state,
      date: form.date,
      guarantee: form.guarantee ? parseInt(form.guarantee) : null,
      status: "inquired",
      capacity: 0,
      contact: form.contact,
      contactEmail: form.contactEmail,
      notes: form.notes,
    });
    onClose();
  }

  const inputClass = "w-full rounded-lg px-3 py-2 text-sm text-white placeholder-white/25 border border-white/10 focus:border-white/30 outline-none transition-colors bg-white/5";

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center p-4 sm:items-center"
      style={{ background: "rgba(0,0,0,0.7)" }}
      onClick={onClose}
    >
      <div
        className="w-full max-w-lg space-y-4 overflow-hidden rounded-2xl border border-white/10 p-6"
        style={{ background: "#111110" }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between">
          <h2 className="font-semibold text-white">Add Show</h2>
          <button onClick={onClose} className="text-sm text-white/35 transition hover:text-white">Cancel</button>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="col-span-2">
            <label className="mb-1 block text-xs text-white/40">Venue Name *</label>
            <input value={form.venueName} onChange={e => setForm(f => ({ ...f, venueName: e.target.value }))} placeholder="The Basement East" className={inputClass} />
          </div>
          <div>
            <label className="mb-1 block text-xs text-white/40">City *</label>
            <input value={form.city} onChange={e => setForm(f => ({ ...f, city: e.target.value }))} placeholder="Nashville" className={inputClass} />
          </div>
          <div>
            <label className="mb-1 block text-xs text-white/40">State</label>
            <input value={form.state} onChange={e => setForm(f => ({ ...f, state: e.target.value }))} placeholder="TN" className={inputClass} />
          </div>
          <div>
            <label className="mb-1 block text-xs text-white/40">Show Date *</label>
            <input type="date" value={form.date} onChange={e => setForm(f => ({ ...f, date: e.target.value }))} className={inputClass} style={{ colorScheme: "dark" }} />
          </div>
          <div>
            <label className="mb-1 block text-xs text-white/40">Guarantee ($)</label>
            <input type="number" value={form.guarantee} onChange={e => setForm(f => ({ ...f, guarantee: e.target.value }))} placeholder="800" className={inputClass} />
          </div>
          <div>
            <label className="mb-1 block text-xs text-white/40">Contact Name</label>
            <input value={form.contact} onChange={e => setForm(f => ({ ...f, contact: e.target.value }))} placeholder="Jamie Cole" className={inputClass} />
          </div>
          <div>
            <label className="mb-1 block text-xs text-white/40">Contact Email</label>
            <input type="email" value={form.contactEmail} onChange={e => setForm(f => ({ ...f, contactEmail: e.target.value }))} placeholder="booking@venue.com" className={inputClass} />
          </div>
          <div className="col-span-2">
            <label className="mb-1 block text-xs text-white/40">Notes</label>
            <textarea value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} placeholder="Load in time, deal notes, etc." rows={3} className={`${inputClass} resize-none`} />
          </div>
        </div>

        <button
          onClick={handleSubmit}
          disabled={!form.venueName || !form.city || !form.date}
          className="w-full rounded-xl py-2.5 text-sm font-semibold text-[#0d0d0b] transition hover:opacity-90 disabled:opacity-40 bg-[#97c459]"
        >
          Add Show
        </button>
      </div>
    </div>
  );
}

// ─── Booking Row ───────────────────────────────────────────────────────────────

function BookingRow({ booking, onClick }: { booking: Booking; onClick: () => void }) {
  const cfg = STATUS_CONFIG[booking.status];
  const dateObj = new Date(booking.date + "T00:00:00");
  const isPast = dateObj < new Date();

  return (
    <button
      onClick={onClick}
      className="group flex w-full items-center gap-4 rounded-xl border border-white/5 px-4 py-3.5 text-left transition hover:border-white/15"
      style={{ background: "rgba(255,255,255,0.03)" }}
    >
      {/* Date block */}
      <div className="w-10 shrink-0 text-center">
        <div className={`text-xs font-semibold ${isPast ? "text-white/20" : "text-[#97c459]"}`}>
          {dateObj.toLocaleDateString("en-US", { month: "short" }).toUpperCase()}
        </div>
        <div className="text-lg font-bold leading-none text-white">
          {dateObj.getDate()}
        </div>
      </div>

      <div className="h-8 w-px shrink-0 bg-white/10" />

      {/* Main info */}
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <span className="truncate text-sm font-medium text-white">{booking.venueName}</span>
          <span className={`flex shrink-0 items-center gap-1 rounded-full px-2 py-0.5 text-xs ${cfg.color} ${cfg.bg}`}>
            {cfg.icon}
            {cfg.label}
          </span>
        </div>
        <div className="mt-0.5 flex items-center gap-1">
          <MapPin size={10} className="text-white/25" />
          <span className="text-xs text-white/35">{booking.city}{booking.state ? `, ${booking.state}` : ""}</span>
        </div>
      </div>

      {/* Guarantee */}
      <div className="shrink-0 text-right">
        {booking.guarantee ? (
          <span className="text-sm font-semibold text-white">${booking.guarantee.toLocaleString()}</span>
        ) : (
          <span className="text-xs text-white/25">TBD</span>
        )}
        <div className="mt-0.5 text-xs text-white/25">guarantee</div>
      </div>

      <ChevronRight size={14} className="shrink-0 text-white/20 transition-colors group-hover:text-white/50" />
    </button>
  );
}

// ─── Booking Detail ────────────────────────────────────────────────────────────

function BookingDetail({ booking, onClose, onStatusChange }: {
  booking: Booking;
  onClose: () => void;
  onStatusChange: (id: string, status: BookingStatus) => void;
}) {
  const cfg = STATUS_CONFIG[booking.status];
  const dateObj = new Date(booking.date + "T00:00:00");
  const statuses = Object.keys(STATUS_CONFIG) as BookingStatus[];

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center p-4 sm:items-center"
      style={{ background: "rgba(0,0,0,0.7)" }}
      onClick={onClose}
    >
      <div
        className="w-full max-w-lg overflow-hidden rounded-2xl border border-white/10"
        style={{ background: "#111110" }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="border-b border-white/5 p-5">
          <div className="flex items-start justify-between">
            <div>
              <h2 className="text-lg font-bold text-white">{booking.venueName}</h2>
              <div className="mt-1 flex items-center gap-1">
                <MapPin size={12} className="text-white/35" />
                <span className="text-sm text-white/45">{booking.city}{booking.state ? `, ${booking.state}` : ""}</span>
              </div>
            </div>
            <button onClick={onClose} className="text-sm text-white/35 transition hover:text-white">Close</button>
          </div>
        </div>

        {/* Body */}
        <div className="space-y-4 p-5">
          {/* Stats row */}
          <div className="grid grid-cols-3 gap-3">
            {[
              { icon: <Calendar size={14} className="text-white/35 mb-1" />, main: dateObj.toLocaleDateString("en-US", { month: "short", day: "numeric" }), sub: String(dateObj.getFullYear()) },
              { icon: <DollarSign size={14} className="text-white/35 mb-1" />, main: booking.guarantee ? `$${booking.guarantee.toLocaleString()}` : "TBD", sub: "guarantee" },
              { icon: <div className={`flex items-center gap-1 text-xs mb-1 ${cfg.color}`}>{cfg.icon} {cfg.label}</div>, main: "Status", sub: "current" },
            ].map((stat, i) => (
              <div key={i} className="rounded-xl border border-white/5 p-3" style={{ background: "rgba(255,255,255,0.03)" }}>
                {stat.icon}
                <div className="text-sm font-semibold text-white">{stat.main}</div>
                <div className="text-xs text-white/30">{stat.sub}</div>
              </div>
            ))}
          </div>

          {/* Contact */}
          {(booking.contact || booking.contactEmail) && (
            <div className="space-y-2 rounded-xl border border-white/5 p-4" style={{ background: "rgba(255,255,255,0.03)" }}>
              <div className="text-[11px] font-medium uppercase tracking-wider text-white/35">Contact</div>
              {booking.contact && (
                <div className="text-sm text-white">{booking.contact}</div>
              )}
              {booking.contactEmail && (
                <a href={`mailto:${booking.contactEmail}`} className="flex items-center gap-2 text-sm text-blue-400 transition hover:text-blue-300">
                  <Mail size={12} />
                  {booking.contactEmail}
                  <ExternalLink size={10} />
                </a>
              )}
            </div>
          )}

          {/* Notes */}
          {booking.notes && (
            <div className="rounded-xl border border-white/5 p-4" style={{ background: "rgba(255,255,255,0.03)" }}>
              <div className="mb-2 text-[11px] font-medium uppercase tracking-wider text-white/35">Notes</div>
              <p className="text-sm leading-relaxed text-white/65">{booking.notes}</p>
            </div>
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
                    onClick={() => onStatusChange(booking.id, s)}
                    className={`flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs transition-all ${
                      booking.status === s
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

// ─── Page ──────────────────────────────────────────────────────────────────────

export default function BookingPage() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [filter, setFilter] = useState<BookingStatus | "all">("all");
  const [search, setSearch] = useState("");
  const [showAdd, setShowAdd] = useState(false);
  const [selected, setSelected] = useState<Booking | null>(null);

  // Hydrate from localStorage
  useEffect(() => {
    setBookings(loadBookings());
  }, []);

  const filtered = bookings.filter(b => {
    const matchesFilter = filter === "all" || b.status === filter;
    const matchesSearch =
      b.venueName.toLowerCase().includes(search.toLowerCase()) ||
      b.city.toLowerCase().includes(search.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  const totalGuaranteed = bookings
    .filter(b => b.status === "confirmed" || b.status === "completed")
    .reduce((sum, b) => sum + (b.guarantee ?? 0), 0);
  const upcoming = bookings.filter(b => b.status === "confirmed" && new Date(b.date + "T00:00:00") >= new Date()).length;
  const pipeline = bookings.filter(b => b.status === "inquired" || b.status === "negotiating").length;

  function handleAdd(b: Booking) {
    const next = [b, ...bookings];
    setBookings(next);
    saveBookings(next);
  }

  function handleStatusChange(id: string, status: BookingStatus) {
    const next = bookings.map(b => b.id === id ? { ...b, status } : b);
    setBookings(next);
    saveBookings(next);
    setSelected(prev => prev?.id === id ? { ...prev, status } : prev);
  }

  return (
    <AppShell title="Booking CRM" eyebrow="Signal">
      <main className="mx-auto max-w-2xl">

        {/* Stats */}
        <div className="mb-5 grid grid-cols-3 gap-3">
          {[
            { label: "Secured",  value: `$${totalGuaranteed.toLocaleString()}`, sub: "confirmed + done" },
            { label: "Upcoming", value: String(upcoming),                         sub: "confirmed shows" },
            { label: "Pipeline", value: String(pipeline),                         sub: "active deals" },
          ].map(stat => (
            <div key={stat.label} className="rounded-2xl border border-white/5 p-4" style={{ background: "rgba(255,255,255,0.03)" }}>
              <div className="mb-1 text-xs text-white/35">{stat.label}</div>
              <div className="text-xl font-bold text-white">{stat.value}</div>
              <div className="mt-0.5 text-xs text-white/25">{stat.sub}</div>
            </div>
          ))}
        </div>

        {/* Search + filter + Add */}
        <div className="mb-4 flex gap-2">
          <div className="relative flex-1">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/25" />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search venues or cities…"
              className="w-full rounded-xl border border-white/10 py-2 pl-9 pr-3 text-sm text-white placeholder-white/25 outline-none transition focus:border-white/30"
              style={{ background: "rgba(255,255,255,0.03)" }}
            />
          </div>
          <div className="relative">
            <select
              value={filter}
              onChange={e => setFilter(e.target.value as BookingStatus | "all")}
              className="appearance-none cursor-pointer rounded-xl border border-white/10 py-2 pl-8 pr-4 text-sm text-white outline-none transition focus:border-white/30"
              style={{ background: "rgba(255,255,255,0.03)" }}
            >
              <option value="all">All</option>
              {(Object.keys(STATUS_CONFIG) as BookingStatus[]).map(s => (
                <option key={s} value={s}>{STATUS_CONFIG[s].label}</option>
              ))}
            </select>
            <Filter size={12} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-white/35" />
          </div>
          <button
            onClick={() => setShowAdd(true)}
            className="flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold text-[#0d0d0b] transition hover:opacity-90 bg-[#97c459]"
          >
            <Plus size={14} />
            Add Show
          </button>
        </div>

        {/* List */}
        <div className="space-y-2">
          {filtered.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-white/10 py-16 text-center" style={{ background: "rgba(255,255,255,0.02)" }}>
              <div className="text-2xl">🎤</div>
              <div className="mt-2 text-sm text-white/40">
                {bookings.length === 0 ? "No shows yet." : "No results."}
              </div>
              {bookings.length === 0 && (
                <button
                  onClick={() => setShowAdd(true)}
                  className="mt-3 text-xs text-white/30 underline underline-offset-2 transition hover:text-white/60"
                >
                  Add your first show →
                </button>
              )}
            </div>
          ) : (
            filtered.map(b => (
              <BookingRow key={b.id} booking={b} onClick={() => setSelected(b)} />
            ))
          )}
        </div>
      </main>

      {showAdd && <AddBookingModal onClose={() => setShowAdd(false)} onAdd={handleAdd} />}
      {selected && (
        <BookingDetail
          booking={selected}
          onClose={() => setSelected(null)}
          onStatusChange={handleStatusChange}
        />
      )}
    </AppShell>
  );
}
