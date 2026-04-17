"use client";

import Link from "next/link";
import { format } from "date-fns";
import { useMemo, useState } from "react";
import { Rubric } from "@/components/manuscript/Rubric";
import { roman } from "@/lib/manuscript";

export type SessionRow = {
  date: string; // ISO
  workoutId: string;
  e1RM: number;
  topSet: { weight: number; reps: number } | null;
  totalVolume: number;
};

type SortKey = "date" | "topSet" | "e1RM" | "volume";
type SortDir = "desc" | "asc";

export function SortableSessionTable({ sessions }: { sessions: SessionRow[] }) {
  const [sortKey, setSortKey] = useState<SortKey>("date");
  const [sortDir, setSortDir] = useState<SortDir>("desc");

  const sorted = useMemo(() => {
    const copy = [...sessions];
    copy.sort((a, b) => {
      const v = (() => {
        switch (sortKey) {
          case "date":
            return new Date(a.date).getTime() - new Date(b.date).getTime();
          case "topSet":
            return (a.topSet?.weight ?? 0) - (b.topSet?.weight ?? 0);
          case "e1RM":
            return a.e1RM - b.e1RM;
          case "volume":
            return a.totalVolume - b.totalVolume;
        }
      })();
      return sortDir === "desc" ? -v : v;
    });
    return copy;
  }, [sessions, sortKey, sortDir]);

  const onSort = (k: SortKey) => {
    if (k === sortKey) {
      setSortDir((d) => (d === "desc" ? "asc" : "desc"));
    } else {
      setSortKey(k);
      // sensible defaults: date defaults to newest first; metrics to highest first
      setSortDir("desc");
    }
  };

  return (
    <table className="set-table" style={{ marginTop: 22, width: "100%" }}>
      <thead>
        <tr>
          <th>n</th>
          <SortHeader k="date" current={sortKey} dir={sortDir} onClick={onSort}>
            date
          </SortHeader>
          <SortHeader k="topSet" current={sortKey} dir={sortDir} onClick={onSort} align="right">
            top set
          </SortHeader>
          <SortHeader k="e1RM" current={sortKey} dir={sortDir} onClick={onSort} align="right">
            e1rm
          </SortHeader>
          <SortHeader k="volume" current={sortKey} dir={sortDir} onClick={onSort} align="right">
            volume
          </SortHeader>
          <th></th>
        </tr>
      </thead>
      <tbody>
        {sorted.map((s, i) => {
          const num = sorted.length - i;
          return (
            <tr key={s.workoutId + i}>
              <td className="col-num">{roman(num).toLowerCase()}</td>
              <td>{format(new Date(s.date), "EEE MMM d, yyyy")}</td>
              <td style={{ textAlign: "right" }}>
                {s.topSet ? `${s.topSet.weight} × ${s.topSet.reps}` : "—"}
              </td>
              <td style={{ textAlign: "right" }}>
                <Rubric>{s.e1RM || "—"}</Rubric>
              </td>
              <td style={{ textAlign: "right" }}>
                {s.totalVolume.toLocaleString()}
              </td>
              <td style={{ textAlign: "right" }}>
                <Link
                  href={`/workouts/${s.workoutId}`}
                  style={{
                    fontFamily: "var(--display)",
                    fontVariant: "small-caps",
                    fontSize: ".6rem",
                    letterSpacing: ".14em",
                    color: "var(--ash)",
                    textDecoration: "none",
                  }}
                >
                  folio →
                </Link>
              </td>
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}

function SortHeader({
  k,
  current,
  dir,
  onClick,
  align,
  children,
}: {
  k: SortKey;
  current: SortKey;
  dir: SortDir;
  onClick: (k: SortKey) => void;
  align?: "left" | "right";
  children: React.ReactNode;
}) {
  const active = k === current;
  return (
    <th
      onClick={() => onClick(k)}
      style={{
        cursor: "pointer",
        textAlign: align ?? "left",
        userSelect: "none",
        color: active ? "var(--rubric)" : undefined,
        whiteSpace: "nowrap",
      }}
    >
      {children}
      <span
        style={{
          marginLeft: 4,
          opacity: active ? 0.85 : 0.25,
          fontSize: ".7em",
        }}
      >
        {active ? (dir === "desc" ? "↓" : "↑") : "↕"}
      </span>
    </th>
  );
}
