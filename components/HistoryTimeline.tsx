"use client";

/**
 * UNIFIED HISTORY TIMELINE — paper workouts and runs on one
 * chronological page. Visual lineage: same monthly grouping, same
 * catalog/card layout vocabulary as WorkoutsHistory. The only thing
 * that distinguishes a run row from a workout row is a small glyph
 * before the date and the metric column it carries (kg vs km).
 *
 * Search matches title for both kinds, plus exercise names for
 * paper workouts. A small filter-chip lets you scope to either kind.
 */

import Link from "next/link";
import { format, formatDistanceToNow } from "date-fns";
import { useMemo, useState } from "react";
import { Ornament } from "@/components/manuscript/Ornament";
import { IlluminatedDayBadge } from "@/components/manuscript/IlluminatedDayBadge";
import { roman } from "@/lib/manuscript";

export type WorkoutItem = {
  kind: "workout";
  id: string;
  date: string;             // ISO
  title: string | null;
  exerciseNames: string[];
  exerciseCount: number;
  setCount: number;
  tonnage: number;
};

export type RunItem = {
  kind: "run";
  id: string;
  date: string;             // ISO
  title: string | null;
  distanceKm: number;
  durationS: number;
  avgPaceSecPerKm: number | null;
  avgHr: number | null;
};

export type HistoryItem = WorkoutItem | RunItem;

type Scope = "all" | "workout" | "run";

export function HistoryTimeline({ items }: { items: HistoryItem[] }) {
  const [query, setQuery] = useState("");
  const [scope, setScope] = useState<Scope>("all");

  const q = query.trim().toLowerCase();
  const filtered = useMemo(() => {
    return items.filter((it) => {
      if (scope !== "all" && it.kind !== scope) return false;
      if (!q) return true;
      if ((it.title ?? "").toLowerCase().includes(q)) return true;
      if (it.kind === "workout") {
        return it.exerciseNames.some((n) => n.toLowerCase().includes(q));
      }
      return false;
    });
  }, [items, q, scope]);

  // group by year-month, preserve newest-first order
  const grouped = useMemo(() => {
    const m = new Map<string, HistoryItem[]>();
    for (const it of filtered) {
      const key = format(new Date(it.date), "yyyy-MM");
      const arr = m.get(key) ?? [];
      arr.push(it);
      m.set(key, arr);
    }
    return m;
  }, [filtered]);

  const counts = useMemo(() => {
    return items.reduce((a, it) => ({ ...a, [it.kind]: (a[it.kind] ?? 0) + 1 }), {} as Record<string, number>);
  }, [items]);

  return (
    <div>
      <SearchAndScope
        query={query} onQueryChange={setQuery}
        scope={scope} onScopeChange={setScope}
        totalCount={items.length}
        filteredCount={filtered.length}
        counts={{ workout: counts.workout ?? 0, run: counts.run ?? 0 }}
      />

      {filtered.length === 0 ? (
        <p className="marginalia" style={{ textAlign: "center", padding: "60px 0" }}>
          {q ? <>no entries match &ldquo;{query}&rdquo;</> : "nothing in this slice yet."}
        </p>
      ) : (
        Array.from(grouped.entries()).map(([month, monthItems], gi) => (
          <div key={month} className="history-month">
            <MonthChapter month={month} />

            {/* Desktop catalog rows */}
            <div className="catalog desktop-only">
              {monthItems.map((it, i) => {
                const idx = monthItems.length - i;
                return it.kind === "workout"
                  ? <DesktopWorkoutRow key={`w-${it.id}`} w={it} num={idx} />
                  : <DesktopRunRow     key={`r-${it.id}`} r={it} num={idx} />;
              })}
            </div>

            {/* Mobile expandable cards */}
            <div className="mobile-only history-card-list">
              {monthItems.map((it) =>
                it.kind === "workout"
                  ? <WorkoutCard key={`w-${it.id}`} w={it} />
                  : <RunCard     key={`r-${it.id}`} r={it} />
              )}
            </div>

            {gi < grouped.size - 1 && <Ornament variant="hollow" />}
          </div>
        ))
      )}
    </div>
  );
}

/* ─── search + scope chips ─────────────────────────────── */
function SearchAndScope({
  query, onQueryChange, scope, onScopeChange, totalCount, filteredCount, counts,
}: {
  query: string; onQueryChange: (q: string) => void;
  scope: Scope; onScopeChange: (s: Scope) => void;
  totalCount: number; filteredCount: number;
  counts: { workout: number; run: number };
}) {
  return (
    <div className="history-search" style={{ flexWrap: "wrap", gap: 12 }}>
      <span className="history-search-label">search</span>
      <input
        type="search"
        value={query}
        onChange={(e) => onQueryChange(e.target.value)}
        className="input history-search-input"
        placeholder="by title, exercise name…"
        autoCapitalize="off" autoComplete="off" autoCorrect="off"
      />
      {query && (
        <span className="history-search-count">
          {filteredCount} of {totalCount}
        </span>
      )}
      <div role="tablist" aria-label="filter by kind" style={{ display: "flex", gap: 4, marginLeft: "auto" }}>
        <ScopeChip active={scope === "all"}     onClick={() => onScopeChange("all")}     label={`all · ${totalCount}`} />
        <ScopeChip active={scope === "workout"} onClick={() => onScopeChange("workout")} label={`paper · ${counts.workout}`} />
        <ScopeChip active={scope === "run"}     onClick={() => onScopeChange("run")}     label={`runs · ${counts.run}`} />
      </div>
    </div>
  );
}

function ScopeChip({ active, onClick, label }: { active: boolean; onClick: () => void; label: string }) {
  return (
    <button
      type="button"
      role="tab"
      aria-selected={active}
      onClick={onClick}
      style={{
        background: active ? "var(--paper-warm)" : "transparent",
        color: active ? "var(--rubric)" : "var(--ash)",
        border: `1px solid ${active ? "var(--rubric)" : "var(--rule)"}`,
        fontFamily: "var(--display)",
        fontVariant: "small-caps",
        fontSize: ".62rem",
        letterSpacing: ".14em",
        padding: "4px 10px",
        borderRadius: 1,
        cursor: "pointer",
        transition: "color .2s var(--ease), border-color .2s var(--ease)",
      }}
    >
      {label}
    </button>
  );
}

function MonthChapter({ month }: { month: string }) {
  const d = new Date(month + "-01");
  return (
    <h3 className="history-month-title">
      <span className="history-month-name">{format(d, "MMMM")}</span>
      <span className="history-month-year">{format(d, "yyyy")}</span>
    </h3>
  );
}

/* ─── desktop rows ─────────────────────────────────────── */

function DesktopWorkoutRow({ w, num }: { w: WorkoutItem; num: number }) {
  return (
    <Link href={`/workouts/${w.id}`} className="cat-row" style={{ textDecoration: "none" }}>
      <span className="cat-num">{roman(num).toLowerCase()}</span>
      <KindGlyph kind="workout" />
      <DateCell iso={w.date} />
      <span className="cat-name">{w.title ?? "untitled workout"}</span>
      <span className="cat-desc">
        {w.exerciseCount} {w.exerciseCount === 1 ? "exercise" : "exercises"} &middot;{" "}
        {w.setCount} {w.setCount === 1 ? "set" : "sets"} &middot;{" "}
        <span className="numerals" style={{ fontStyle: "normal", color: "var(--ink-light)" }}>
          {w.tonnage.toLocaleString()}
        </span>{" "}
        kg
      </span>
    </Link>
  );
}

function DesktopRunRow({ r, num }: { r: RunItem; num: number }) {
  return (
    <Link href={`/runs/${r.id}`} className="cat-row" style={{ textDecoration: "none" }}>
      <span className="cat-num">{roman(num).toLowerCase()}</span>
      <KindGlyph kind="run" />
      <DateCell iso={r.date} />
      <span className="cat-name">{r.title ?? "untitled run"}</span>
      <span className="cat-desc">
        <span className="numerals" style={{ fontStyle: "normal", color: "var(--ink-light)" }}>
          {r.distanceKm.toFixed(2)}
        </span>{" "}
        km &middot; {fmtDur(r.durationS)}
        {r.avgPaceSecPerKm && <> &middot; {fmtPace(r.avgPaceSecPerKm)}</>}
        {r.avgHr && <> &middot; hr {r.avgHr.toFixed(0)}</>}
      </span>
    </Link>
  );
}

function DateCell({ iso }: { iso: string }) {
  return (
    <span
      style={{
        width: 88,
        flexShrink: 0,
        fontFamily: "var(--mono)",
        fontSize: ".75rem",
        color: "var(--rubric)",
        letterSpacing: ".05em",
        fontVariantNumeric: "oldstyle-nums tabular-nums",
      }}
    >
      {format(new Date(iso), "EEE M/d")}
    </span>
  );
}

/** A tiny glyph that distinguishes the row's kind at a glance.
 *  Workouts get a small open square (the paper folio); runs get a
 *  hairline four-point star (the wayfarer's mark). Both ink-coloured;
 *  the rubric remains reserved for actively-meaningful information. */
function KindGlyph({ kind }: { kind: "workout" | "run" }) {
  return (
    <span aria-hidden="true" style={{ width: 16, flexShrink: 0, display: "inline-flex", alignItems: "center", justifyContent: "center" }}>
      {kind === "workout" ? (
        <svg viewBox="0 0 12 12" width="10" height="10">
          <rect x="1.5" y="1.5" width="9" height="9" fill="none" stroke="var(--ash)" strokeWidth=".7" opacity=".7" />
        </svg>
      ) : (
        <svg viewBox="0 0 12 12" width="11" height="11">
          <path
            d="M 6 1 L 6.7 5.3 L 11 6 L 6.7 6.7 L 6 11 L 5.3 6.7 L 1 6 L 5.3 5.3 Z"
            fill="none"
            stroke="var(--ash)"
            strokeWidth=".55"
            strokeLinejoin="round"
            opacity=".8"
          />
        </svg>
      )}
    </span>
  );
}

/* ─── mobile cards ─────────────────────────────────────── */

function WorkoutCard({ w }: { w: WorkoutItem }) {
  const [expanded, setExpanded] = useState(false);
  const d = new Date(w.date);
  return (
    <div className={`history-card ${expanded ? "is-expanded" : ""}`}>
      <button
        type="button"
        onClick={() => setExpanded((e) => !e)}
        className="history-card-head"
        aria-expanded={expanded}
        aria-label={`${w.title ?? "untitled workout"} — tap to ${expanded ? "collapse" : "expand"}`}
      >
        <div className="history-card-date">
          <IlluminatedDayBadge
            weekday={format(d, "EEE").toLowerCase()}
            day={format(d, "d")}
            month={format(d, "MMM").toLowerCase()}
            illuminated={expanded}
          />
        </div>
        <div className="history-card-body">
          <div className="history-card-title">
            <KindGlyph kind="workout" />
            <span style={{ marginLeft: 4 }}>{w.title ?? "untitled workout"}</span>
          </div>
          <div className="history-card-meta">
            {w.exerciseCount} {w.exerciseCount === 1 ? "exercise" : "exercises"} · {w.setCount}{" "}
            {w.setCount === 1 ? "set" : "sets"} ·{" "}
            <span className="numerals" style={{ fontStyle: "normal", color: "var(--ink-light)" }}>
              {w.tonnage.toLocaleString()}
            </span>{" "}
            kg
          </div>
          <div className="history-card-rel">{formatDistanceToNow(d, { addSuffix: true })}</div>
        </div>
        <div className="history-card-chev" aria-hidden="true">
          {expanded ? "▾" : "▸"}
        </div>
      </button>
      {expanded && (
        <div className="history-card-body-expanded">
          <div className="history-card-exercises">
            {w.exerciseNames.map((name, i) => (
              <div key={i} className="history-card-exercise">
                <span className="history-card-exercise-num">{roman(i + 1).toLowerCase()}</span>
                <span className="history-card-exercise-name">{name}</span>
              </div>
            ))}
          </div>
          <div className="history-card-folio-flourish" aria-hidden="true">
            <span className="history-card-folio-flourish-mark">◆</span>
          </div>
          <div className="history-card-folio-link-row">
            <Link href={`/workouts/${w.id}`} className="history-card-folio-link">
              <span>view the full folio</span>
              <span>→</span>
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}

function RunCard({ r }: { r: RunItem }) {
  const d = new Date(r.date);
  return (
    <Link
      href={`/runs/${r.id}`}
      className="history-card"
      style={{ textDecoration: "none", color: "inherit", display: "block" }}
    >
      <div className="history-card-head">
        <div className="history-card-date">
          <IlluminatedDayBadge
            weekday={format(d, "EEE").toLowerCase()}
            day={format(d, "d")}
            month={format(d, "MMM").toLowerCase()}
          />
        </div>
        <div className="history-card-body">
          <div className="history-card-title">
            <KindGlyph kind="run" />
            <span style={{ marginLeft: 4 }}>{r.title ?? "untitled run"}</span>
          </div>
          <div className="history-card-meta">
            <span className="numerals" style={{ fontStyle: "normal", color: "var(--ink-light)" }}>
              {r.distanceKm.toFixed(2)}
            </span>{" "}
            km · {fmtDur(r.durationS)}
            {r.avgPaceSecPerKm && <> · {fmtPace(r.avgPaceSecPerKm)}</>}
            {r.avgHr && <> · hr {r.avgHr.toFixed(0)}</>}
          </div>
          <div className="history-card-rel">{formatDistanceToNow(d, { addSuffix: true })}</div>
        </div>
        <div className="history-card-chev" aria-hidden="true">→</div>
      </div>
    </Link>
  );
}

/* ─── helpers ──────────────────────────────────────────── */

function fmtPace(s: number | null): string {
  if (s == null || !isFinite(s)) return "—";
  const m = Math.floor(s / 60);
  const r = Math.round(s - m * 60);
  return `${m}:${String(r).padStart(2, "0")}/km`;
}

function fmtDur(s: number): string {
  const sec = Math.round(s);
  const h = Math.floor(sec / 3600);
  const m = Math.floor((sec % 3600) / 60);
  const r = sec % 60;
  return h ? `${h}:${String(m).padStart(2, "0")}:${String(r).padStart(2, "0")}` : `${m}:${String(r).padStart(2, "0")}`;
}
