"use client";

import Link from "next/link";
import { format, formatDistanceToNow } from "date-fns";
import { useMemo, useState } from "react";
import { Ornament } from "@/components/manuscript/Ornament";
import { IlluminatedDayBadge } from "@/components/manuscript/IlluminatedDayBadge";
import { roman } from "@/lib/manuscript";

export type WorkoutHistoryRow = {
  id: string;
  date: string; // ISO
  title: string | null;
  exerciseNames: string[];
  exerciseCount: number;
  setCount: number;
  tonnage: number;
};

export function WorkoutsHistory({ workouts }: { workouts: WorkoutHistoryRow[] }) {
  const [query, setQuery] = useState("");

  const q = query.trim().toLowerCase();
  const filtered = useMemo(() => {
    if (!q) return workouts;
    return workouts.filter((w) => {
      if ((w.title ?? "").toLowerCase().includes(q)) return true;
      return w.exerciseNames.some((n) => n.toLowerCase().includes(q));
    });
  }, [workouts, q]);

  // group by year+month, in original (newest-first) order
  const grouped = useMemo(() => {
    const m = new Map<string, WorkoutHistoryRow[]>();
    for (const w of filtered) {
      const key = format(new Date(w.date), "yyyy-MM");
      const arr = m.get(key) ?? [];
      arr.push(w);
      m.set(key, arr);
    }
    return m;
  }, [filtered]);

  return (
    <div>
      <SearchBar query={query} onChange={setQuery} totalCount={workouts.length} filteredCount={filtered.length} />

      {filtered.length === 0 ? (
        <p
          className="marginalia"
          style={{ textAlign: "center", padding: "60px 0" }}
        >
          no workouts match &ldquo;{query}&rdquo;
        </p>
      ) : (
        Array.from(grouped.entries()).map(([month, items], gi) => (
          <div key={month} className="history-month">
            <MonthChapter month={month} />
            {/* Desktop: compact horizontal catalog rows */}
            <div className="catalog desktop-only">
              {items.map((w, i) => {
                const indexNum = items.length - i;
                return (
                  <Link
                    href={`/workouts/${w.id}`}
                    key={w.id}
                    className="cat-row"
                    style={{ textDecoration: "none" }}
                  >
                    <span className="cat-num">{roman(indexNum).toLowerCase()}</span>
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
                      {format(new Date(w.date), "EEE M/d")}
                    </span>
                    <span className="cat-name">
                      {w.title ?? "untitled workout"}
                    </span>
                    <span className="cat-desc">
                      {w.exerciseCount}{" "}
                      {w.exerciseCount === 1 ? "exercise" : "exercises"} &middot;{" "}
                      {w.setCount} {w.setCount === 1 ? "set" : "sets"} &middot;{" "}
                      <span
                        className="numerals"
                        style={{ fontStyle: "normal", color: "var(--ink-light)" }}
                      >
                        {w.tonnage.toLocaleString()}
                      </span>{" "}
                      kg
                    </span>
                  </Link>
                );
              })}
            </div>

            {/* Mobile: expandable cards */}
            <div className="mobile-only history-card-list">
              {items.map((w) => (
                <WorkoutCard key={w.id} w={w} />
              ))}
            </div>

            {gi < grouped.size - 1 && <Ornament variant="hollow" />}
          </div>
        ))
      )}
    </div>
  );
}

/* ─── search bar ───────────────────────────────────────────── */

function SearchBar({
  query,
  onChange,
  totalCount,
  filteredCount,
}: {
  query: string;
  onChange: (q: string) => void;
  totalCount: number;
  filteredCount: number;
}) {
  return (
    <div className="history-search">
      <span className="history-search-label">search</span>
      <input
        type="search"
        value={query}
        onChange={(e) => onChange(e.target.value)}
        className="input history-search-input"
        placeholder="by title or exercise name…"
        autoCapitalize="off"
        autoComplete="off"
        autoCorrect="off"
      />
      {query && (
        <span className="history-search-count">
          {filteredCount} of {totalCount}
        </span>
      )}
    </div>
  );
}

/* ─── month chapter opener ────────────────────────────────── */

function MonthChapter({ month }: { month: string }) {
  const d = new Date(month + "-01");
  return (
    <h3 className="history-month-title">
      <span className="history-month-name">{format(d, "MMMM")}</span>
      <span className="history-month-year">{format(d, "yyyy")}</span>
    </h3>
  );
}

/* ─── mobile workout card (expandable) ────────────────────── */

function WorkoutCard({ w }: { w: WorkoutHistoryRow }) {
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
          <div className="history-card-title">{w.title ?? "untitled workout"}</div>
          <div className="history-card-meta">
            {w.exerciseCount} {w.exerciseCount === 1 ? "exercise" : "exercises"} · {w.setCount}{" "}
            {w.setCount === 1 ? "set" : "sets"} ·{" "}
            <span className="numerals" style={{ fontStyle: "normal", color: "var(--ink-light)" }}>
              {w.tonnage.toLocaleString()}
            </span>{" "}
            kg
          </div>
          <div className="history-card-rel">
            {formatDistanceToNow(d, { addSuffix: true })}
          </div>
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
          <Link href={`/workouts/${w.id}`} className="history-card-folio-link">
            view the full folio →
          </Link>
        </div>
      )}
    </div>
  );
}
