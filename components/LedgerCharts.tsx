"use client";

/**
 * LEDGER CHARTS — the interactive, traditional-chart section of the
 * ledger. A lift picker switches the displayed progression chart
 * between the Big Lifts. A second panel shows weekly tonnage as
 * a line (alongside the pendulum choir in the surrounding plate).
 */

import { useMemo, useState } from "react";
import { format, parseISO } from "date-fns";
import { InkLineChart } from "@/components/manuscript/charts/InkLineChart";
import { LiftPicker } from "@/components/manuscript/charts/LiftPicker";
import { StackedBand } from "@/components/manuscript/charts/StackedBand";
import { Plate } from "@/components/manuscript/Plate";
import type { KeyLiftRow } from "@/lib/training";

type SerializedSession = {
  date: string;
  e1RM: number;
  isPR: boolean;
};

type SerializedLift = {
  key: string;
  label: string;
  sessions: SerializedSession[];
  peakE1RM: number;
};

type WeeklyDatum = {
  week: string;
  tonnage: number;
  sessions: number;
};

type RepRangeDatum = {
  week: string;
  strength: number;
  hypertrophy: number;
  metabolic: number;
};

type Props = {
  lifts: SerializedLift[];
  // selectedInitial: whichever lift has the most sessions, to avoid
  // defaulting to a "not yet logged" tab
  initialKey: string;
  weeklyTonnage: WeeklyDatum[];
  repRangeWeekly: RepRangeDatum[];
  keyLiftRows: Pick<KeyLiftRow, "key" | "label" | "found">[];
};

export function LedgerCharts({
  lifts,
  initialKey,
  weeklyTonnage,
  repRangeWeekly,
  keyLiftRows,
}: Props) {
  const [selected, setSelected] = useState<string>(initialKey);

  const active = lifts.find((l) => l.key === selected);

  const chartPoints = useMemo(() => {
    if (!active) return [];
    return active.sessions.map((s) => ({
      x: s.date,
      y: s.e1RM,
      isPR: s.isPR,
    }));
  }, [active]);

  const tonnagePoints = useMemo(() => {
    return weeklyTonnage
      .filter((w) => w.tonnage > 0)
      .map((w, i, arr) => ({
        x: parseISO(w.week),
        y: w.tonnage,
        isPR: w.tonnage === Math.max(...arr.map((x) => x.tonnage)),
      }));
  }, [weeklyTonnage]);

  const liftOptions = keyLiftRows.map((l) => ({
    key: l.key,
    label: l.label,
    disabled: !l.found,
  }));

  return (
    <div>
      <Plate
        numeral="ii"
        title="Progression"
        caption={active ? `estimated 1RM over time · ${active.label}` : "no lifts to chart"}
        expandable
      >
        <LiftPicker
          lifts={liftOptions}
          selected={selected}
          onSelect={setSelected}
        />
        <InkLineChart
          series={chartPoints}
          yLabel="est. 1RM (kg)"
          yUnit="kg"
          height={280}
          emptyLabel={
            active
              ? `${active.label.toLowerCase()} hasn't been logged yet`
              : "select a lift to chart its progression"
          }
        />
      </Plate>

      <div
        className="plate-grid"
        style={{ gridTemplateColumns: "minmax(0, 1fr) minmax(0, 1fr)", marginTop: 16 }}
      >
        <Plate
          numeral="iii"
          title="Weekly tonnage"
          caption="total kg moved per week · last 12 weeks"
          expandable
        >
          <InkLineChart
            series={tonnagePoints}
            yLabel="kg per week"
            yUnit="kg"
            height={220}
            xFormat={(d) => format(d, "M/d")}
            emptyLabel="not enough weekly data yet"
          />
        </Plate>

        <Plate
          numeral="iv"
          title="Rep-range rhythm"
          caption="working sets by rep range · last 12 weeks · rubric = current"
          expandable
        >
          <StackedBand data={repRangeWeekly} height={220} />
        </Plate>
      </div>
    </div>
  );
}
