"use client";

/**
 * LIFT PICKER — a row of small-caps tabs for selecting which lift
 * to plot. Active tab gets a rubric underline and rubric colour;
 * disabled entries (lifts not yet logged) are rendered in ash with
 * a struck-through italic.
 */

type Lift = {
  key: string;
  label: string;
  disabled?: boolean;
};

type Props = {
  lifts: Lift[];
  selected: string;
  onSelect: (key: string) => void;
};

export function LiftPicker({ lifts, selected, onSelect }: Props) {
  return (
    <div className="lift-picker">
      {lifts.map((l, i) => {
        const isActive = l.key === selected;
        return (
          <span key={l.key} className="lift-picker-bay">
            {i > 0 && <span className="lift-picker-sep" aria-hidden="true">·</span>}
            <button
              type="button"
              onClick={() => !l.disabled && onSelect(l.key)}
              disabled={l.disabled}
              className={`lift-picker-tab ${isActive ? "is-active" : ""} ${l.disabled ? "is-disabled" : ""}`}
            >
              {l.label}
            </button>
          </span>
        );
      })}
    </div>
  );
}
