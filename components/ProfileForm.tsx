"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { format } from "date-fns";

type Initial = {
  displayName: string | null;
  heightCm: number | null;
  bodyweightKg: number | null;
  birthYear: number | null;
  sex: string | null;
  goal: string | null;
  units: string | null;
} | null;

type Props = {
  initial: Initial;
  latestBW: number | null;
  latestBWDate: string | null;
};

export function ProfileForm({ initial, latestBW, latestBWDate }: Props) {
  const router = useRouter();
  const [displayName, setDisplayName] = useState<string>(initial?.displayName ?? "");
  const [heightCm, setHeightCm] = useState<string>(initial?.heightCm?.toString() ?? "");
  const [bodyweightKg, setBodyweightKg] = useState<string>(initial?.bodyweightKg?.toString() ?? "");
  const [birthYear, setBirthYear] = useState<string>(initial?.birthYear?.toString() ?? "");
  const [sex, setSex] = useState<string>(initial?.sex ?? "");
  const [goal, setGoal] = useState<string>(initial?.goal ?? "");
  const [units, setUnits] = useState<string>(initial?.units ?? "kg");
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const save = async () => {
    setSaving(true);
    setMessage(null);
    const payload = {
      displayName: displayName.trim() || null,
      heightCm: heightCm ? Number(heightCm) : null,
      bodyweightKg: bodyweightKg ? Number(bodyweightKg) : null,
      birthYear: birthYear ? Number(birthYear) : null,
      sex: sex || null,
      goal: goal || null,
      units: units || "kg",
    };
    const res = await fetch("/api/profile", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (res.ok) {
      setMessage("saved.");
      router.refresh();
    } else {
      const body = await res.json().catch(() => ({}));
      setMessage(body.error ?? "save failed");
    }
    setSaving(false);
  };

  return (
    <div
      className="plate"
      style={{
        padding: "32px 36px",
        display: "grid",
        gap: 24,
      }}
    >
      <span className="plate-n">i</span>
      <span className="plate-t">your figure</span>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
          gap: 20,
          marginTop: 6,
        }}
      >
        <Field label="display name · optional">
          <input
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            className="input"
            placeholder="what should the codex call you?"
          />
        </Field>

        <Field label="units for display">
          <select value={units} onChange={(e) => setUnits(e.target.value)} className="input">
            <option value="kg">kg</option>
            <option value="lb">lb</option>
          </select>
        </Field>

        <Field label="height · cm">
          <input
            type="number"
            step="0.5"
            value={heightCm}
            onChange={(e) => setHeightCm(e.target.value)}
            className="input numerals"
            placeholder="—"
          />
        </Field>

        <Field
          label="bodyweight · kg"
          hint={
            latestBW && latestBWDate
              ? `latest workout recorded ${latestBW} kg on ${format(new Date(latestBWDate), "MMM d")}`
              : "pulled from your latest workout if left blank"
          }
        >
          <input
            type="number"
            step="0.1"
            value={bodyweightKg}
            onChange={(e) => setBodyweightKg(e.target.value)}
            className="input numerals"
            placeholder={latestBW ? `${latestBW}` : "—"}
          />
        </Field>

        <Field label="birth year · for age">
          <input
            type="number"
            min="1900"
            max={new Date().getFullYear()}
            value={birthYear}
            onChange={(e) => setBirthYear(e.target.value)}
            className="input numerals"
            placeholder="—"
          />
        </Field>

        <Field label="sex · for strength standards">
          <select value={sex} onChange={(e) => setSex(e.target.value)} className="input">
            <option value="">—</option>
            <option value="male">male</option>
            <option value="female">female</option>
          </select>
        </Field>

        <Field
          label="primary goal"
          hint="shapes which insights the ledger emphasises"
        >
          <select value={goal} onChange={(e) => setGoal(e.target.value)} className="input">
            <option value="">—</option>
            <option value="strength">strength · raw 1RM focus</option>
            <option value="hypertrophy">hypertrophy · muscle growth</option>
            <option value="recovery">recovery · rehab or deload</option>
            <option value="general">general fitness · balanced</option>
          </select>
        </Field>
      </div>

      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "baseline",
          gap: 16,
          marginTop: 10,
          paddingTop: 18,
          borderTop: "1px solid var(--rule-soft)",
        }}
      >
        <div className="marginalia">
          {message ?? "changes update every analysis that depends on them"}
        </div>
        <button onClick={save} disabled={saving} className="btn btn-rubric btn-quill">
          {saving ? "inscribing…" : "save profile"}
        </button>
      </div>
    </div>
  );
}

function Field({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <label style={{ display: "block" }}>
      <span className="input-label">{label}</span>
      {children}
      {hint && (
        <span
          style={{
            display: "block",
            marginTop: 5,
            fontFamily: "var(--italic)",
            fontStyle: "italic",
            fontSize: ".74rem",
            color: "var(--ash)",
          }}
        >
          {hint}
        </span>
      )}
    </label>
  );
}
