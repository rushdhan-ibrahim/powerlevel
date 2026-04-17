"use client";

import Link from "next/link";
import { format } from "date-fns";
import { useMemo, useState } from "react";
import { Ornament } from "@/components/manuscript/Ornament";
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
      <div
        style={{
          display: "flex",
          alignItems: "baseline",
          gap: 18,
          marginBottom: 24,
          paddingBottom: 14,
          borderBottom: "1px solid var(--rule-soft)",
        }}
      >
        <span
          style={{
            fontFamily: "var(--display)",
            fontVariant: "small-caps",
            fontSize: ".62rem",
            letterSpacing: ".18em",
            color: "var(--ash)",
            flexShrink: 0,
          }}
        >
          search
        </span>
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="input"
          placeholder="filter by workout title or any exercise name…"
          style={{ flex: 1, padding: "6px 10px", fontSize: ".95rem" }}
        />
        {query && (
          <span
            style={{
              fontFamily: "var(--italic)",
              fontStyle: "italic",
              fontSize: ".82rem",
              color: "var(--ash)",
              flexShrink: 0,
            }}
          >
            {filtered.length} of {workouts.length}
          </span>
        )}
      </div>

      {filtered.length === 0 ? (
        <p
          className="marginalia"
          style={{ textAlign: "center", padding: "60px 0" }}
        >
          no workouts match &ldquo;{query}&rdquo;
        </p>
      ) : (
        Array.from(grouped.entries()).map(([month, items], gi) => (
          <div key={month} style={{ marginBottom: 32 }}>
            <h3
              style={{
                fontFamily: "var(--display)",
                fontVariant: "small-caps",
                fontSize: ".82rem",
                letterSpacing: ".22em",
                color: "var(--rubric)",
                marginBottom: 14,
                paddingBottom: 6,
                borderBottom: "1px solid var(--rule-soft)",
              }}
            >
              <span
                className="numerals"
                style={{ color: "var(--rubric)", fontVariant: "lining-nums" }}
              >
                {format(new Date(month + "-01"), "MMMM")}
              </span>{" "}
              <span
                className="numerals"
                style={{ color: "var(--ash)", fontVariant: "lining-nums" }}
              >
                {format(new Date(month + "-01"), "yyyy")}
              </span>
            </h3>
            <div className="catalog">
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
            {gi < grouped.size - 1 && <Ornament variant="hollow" />}
          </div>
        ))
      )}
    </div>
  );
}
