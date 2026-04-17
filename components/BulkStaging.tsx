"use client";

import { useEffect, useMemo, useRef, useState } from "react";

/**
 * BULK STAGING
 *
 * After the user drops multiple photos we lay them out as a chain.
 * Each photo is a card; between every pair of adjacent cards there
 * is a CHAIN LINK toggle:
 *
 *    [card 1]  ●  [card 2]  ○  [card 3]  ●  [card 4]
 *      └ workout 1 ─────────┘    └ workout 2 ─────┘
 *
 *  ● = linked  (cards belong to the SAME workout — multi-page)
 *  ○ = broken (next card starts a new workout)
 *
 * HEIC files don't render natively in browsers, so for those we POST
 * the file to /api/preview and use the returned JPEG as the thumbnail
 * — while it's converting, we show a "converting…" placeholder.
 */

export type StagedFile = {
  id: string;
  file: File;
  previewUrl: string | null; // null while a HEIC preview is converting
  isHeic: boolean;
  previewError?: boolean;
};

type Props = {
  files: StagedFile[];
  links: boolean[]; // length = files.length - 1; true = linked to next
  onLinksChange: (links: boolean[]) => void;
  onRemove: (id: string) => void;
  onClear: () => void;
  onAddFiles: (more: File[]) => void;
  onParseAll: () => void;
  isParsing?: boolean;
};

export function BulkStaging({
  files,
  links,
  onLinksChange,
  onRemove,
  onClear,
  onAddFiles,
  onParseAll,
  isParsing,
}: Props) {
  const groups = useMemo(() => buildGroups(files.length, links), [files.length, links]);

  return (
    <div>
      <div
        style={{
          display: "flex",
          alignItems: "baseline",
          justifyContent: "space-between",
          marginBottom: 12,
        }}
      >
        <div className="marginalia">
          <span className="numerals" style={{ fontStyle: "normal", color: "var(--ink)" }}>
            {files.length}
          </span>{" "}
          photos &middot;{" "}
          <span className="numerals" style={{ fontStyle: "normal", color: "var(--rubric)" }}>
            {groups.length}
          </span>{" "}
          {groups.length === 1 ? "workout" : "workouts"}
        </div>
        <div style={{ display: "flex", gap: 12, alignItems: "baseline" }}>
          <AddMoreButton onAddFiles={onAddFiles} />
          <button
            type="button"
            onClick={onClear}
            disabled={isParsing}
            style={{
              fontFamily: "var(--display)",
              fontVariant: "small-caps",
              fontSize: ".62rem",
              letterSpacing: ".14em",
              color: "var(--ash)",
              background: "transparent",
              border: "none",
              cursor: "pointer",
              padding: 4,
            }}
            onMouseEnter={(e) => (e.currentTarget.style.color = "var(--rubric)")}
            onMouseLeave={(e) => (e.currentTarget.style.color = "var(--ash)")}
          >
            clear all
          </button>
        </div>
      </div>

      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          gap: 0,
          alignItems: "flex-start",
          padding: 18,
          background: "var(--paper-warm)",
          border: "1px solid var(--rule)",
          minHeight: 240,
        }}
      >
        {files.length === 0 && (
          <div
            style={{
              flex: 1,
              textAlign: "center",
              alignSelf: "center",
              fontFamily: "var(--italic)",
              fontStyle: "italic",
              color: "var(--ash)",
            }}
          >
            no photos staged — drop more above
          </div>
        )}

        {files.map((f, i) => {
          const groupIndex = groupIndexOf(i, groups);
          const isLast = i === files.length - 1;
          const linked = links[i] ?? false;

          return (
            <div key={f.id} style={{ display: "flex", alignItems: "center" }}>
              <Thumb
                file={f}
                groupIndex={groupIndex + 1}
                onRemove={() => onRemove(f.id)}
                disabled={isParsing}
              />
              {!isLast && (
                <ChainLink
                  linked={linked}
                  onToggle={() => {
                    const next = [...links];
                    next[i] = !next[i];
                    onLinksChange(next);
                  }}
                  disabled={isParsing}
                />
              )}
            </div>
          );
        })}
      </div>

      <div
        style={{
          marginTop: 14,
          display: "flex",
          alignItems: "baseline",
          justifyContent: "space-between",
          gap: 16,
        }}
      >
        <div className="marginalia" style={{ flex: 1, lineHeight: 1.55 }}>
          adjacent photos can be <em>linked</em> (●) when they&rsquo;re different pages
          of the same workout, or kept <em>separate</em> (○). Click the link between any
          two cards to toggle. Each linked group becomes one workout.
        </div>
        <button
          type="button"
          onClick={onParseAll}
          disabled={isParsing || files.length === 0}
          className="btn btn-rubric btn-quill"
        >
          {isParsing
            ? "parsing…"
            : `parse ${groups.length} ${groups.length === 1 ? "workout" : "workouts"}`}
        </button>
      </div>
    </div>
  );
}

/* ─── thumbnail ─────────────────────────────────────────────── */

function Thumb({
  file,
  groupIndex,
  onRemove,
  disabled,
}: {
  file: StagedFile;
  groupIndex: number;
  onRemove: () => void;
  disabled?: boolean;
}) {
  return (
    <div
      style={{
        position: "relative",
        width: 116,
        margin: "6px 0",
      }}
    >
      <div
        style={{
          padding: 6,
          background: "var(--paper)",
          border: "1px solid var(--rule)",
          boxShadow: "0 4px 12px -8px rgba(0,0,0,.25)",
        }}
      >
        {file.previewUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={file.previewUrl}
            alt={file.file.name}
            style={{
              display: "block",
              width: "100%",
              height: 144,
              objectFit: "cover",
              opacity: disabled ? 0.6 : 1,
            }}
          />
        ) : (
          <PreviewPlaceholder
            isHeic={file.isHeic}
            error={file.previewError}
            filename={file.file.name}
            disabled={disabled}
          />
        )}
      </div>
      <span
        style={{
          position: "absolute",
          top: -8,
          left: -6,
          background: "var(--rubric)",
          color: "var(--paper)",
          fontFamily: "var(--mono)",
          fontSize: ".58rem",
          padding: "2px 6px",
          letterSpacing: ".05em",
          fontVariantNumeric: "oldstyle-nums",
        }}
      >
        w·{groupIndex}
      </span>
      {file.isHeic && file.previewUrl && (
        <span
          style={{
            position: "absolute",
            bottom: 8,
            left: 8,
            background: "var(--paper)",
            border: "1px solid var(--rule)",
            color: "var(--ash)",
            fontFamily: "var(--mono)",
            fontSize: ".5rem",
            padding: "1px 4px",
            letterSpacing: ".06em",
          }}
        >
          heic
        </span>
      )}
      {!disabled && (
        <button
          type="button"
          onClick={onRemove}
          style={{
            position: "absolute",
            top: -6,
            right: -6,
            width: 18,
            height: 18,
            background: "var(--paper)",
            border: "1px solid var(--rule)",
            color: "var(--ash)",
            cursor: "pointer",
            fontSize: 11,
            lineHeight: 1,
            padding: 0,
          }}
          onMouseEnter={(e) => (e.currentTarget.style.color = "var(--rubric)")}
          onMouseLeave={(e) => (e.currentTarget.style.color = "var(--ash)")}
          aria-label="Remove"
        >
          ×
        </button>
      )}
    </div>
  );
}

function PreviewPlaceholder({
  isHeic,
  error,
  filename,
  disabled,
}: {
  isHeic: boolean;
  error?: boolean;
  filename: string;
  disabled?: boolean;
}) {
  return (
    <div
      style={{
        height: 144,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        background: "var(--paper-warm)",
        gap: 6,
        opacity: disabled ? 0.6 : 1,
      }}
    >
      {!error && (
        <svg viewBox="0 0 40 40" width="32" height="32" aria-hidden="true">
          <g style={{ animation: "spin 6s linear infinite", transformOrigin: "20px 20px" }}>
            <circle cx="20" cy="20" r="14" fill="none" stroke="var(--rubric)" strokeWidth=".7" opacity=".6" strokeDasharray="3,4" />
          </g>
        </svg>
      )}
      <div
        style={{
          fontFamily: "var(--mono)",
          fontSize: ".58rem",
          letterSpacing: ".08em",
          color: error ? "var(--rubric)" : "var(--ash)",
          textTransform: "uppercase",
        }}
      >
        {error ? "preview failed" : isHeic ? "converting…" : "loading…"}
      </div>
      <div
        style={{
          fontFamily: "var(--italic)",
          fontStyle: "italic",
          fontSize: ".62rem",
          color: "var(--ash-light)",
          padding: "0 8px",
          textAlign: "center",
          maxWidth: "100%",
          overflow: "hidden",
          textOverflow: "ellipsis",
          whiteSpace: "nowrap",
        }}
        title={filename}
      >
        {filename.length > 16 ? filename.slice(0, 13) + "…" : filename}
      </div>
    </div>
  );
}

/* ─── chain link ────────────────────────────────────────────── */

function ChainLink({
  linked,
  onToggle,
  disabled,
}: {
  linked: boolean;
  onToggle: () => void;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onToggle}
      disabled={disabled}
      title={linked ? "Linked — same workout. Click to break." : "Separate workouts. Click to link."}
      style={{
        background: "transparent",
        border: "none",
        cursor: disabled ? "default" : "pointer",
        padding: "0 8px",
        height: 156,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        position: "relative",
      }}
    >
      <svg viewBox="0 0 24 60" width="24" height="60" aria-hidden="true">
        <line
          x1="0"
          y1="30"
          x2="24"
          y2="30"
          stroke={linked ? "var(--rubric)" : "var(--ash-light)"}
          strokeWidth={linked ? 1.4 : 0.6}
          strokeDasharray={linked ? undefined : "2,3"}
          opacity={linked ? 0.85 : 0.55}
        />
        {linked ? (
          <>
            <circle cx="12" cy="30" r="5" fill="var(--rubric)" opacity=".95" />
            <circle cx="12" cy="30" r="2.4" fill="var(--paper-warm)" />
          </>
        ) : (
          <circle
            cx="12"
            cy="30"
            r="5"
            fill="var(--paper-warm)"
            stroke="var(--ash-light)"
            strokeWidth="1"
            opacity=".9"
          />
        )}
      </svg>
    </button>
  );
}

function AddMoreButton({ onAddFiles }: { onAddFiles: (files: File[]) => void }) {
  const ref = useRef<HTMLInputElement>(null);
  return (
    <>
      <button
        type="button"
        onClick={() => ref.current?.click()}
        style={{
          fontFamily: "var(--display)",
          fontVariant: "small-caps",
          fontSize: ".62rem",
          letterSpacing: ".14em",
          color: "var(--ash)",
          background: "transparent",
          border: "none",
          cursor: "pointer",
          padding: 4,
        }}
        onMouseEnter={(e) => (e.currentTarget.style.color = "var(--ink)")}
        onMouseLeave={(e) => (e.currentTarget.style.color = "var(--ash)")}
      >
        + add more
      </button>
      <input
        ref={ref}
        type="file"
        multiple
        accept="image/*"
        style={{ display: "none" }}
        onChange={(e) => {
          if (e.target.files) {
            const arr = Array.from(e.target.files).filter((f) => f.type.startsWith("image/") || /\.(heic|heif)$/i.test(f.name));
            onAddFiles(arr);
            if (ref.current) ref.current.value = "";
          }
        }}
      />
    </>
  );
}

/* ─── grouping helper ───────────────────────────────────────── */

export function buildGroups(n: number, links: boolean[]): number[][] {
  if (n === 0) return [];
  const groups: number[][] = [];
  let current: number[] = [0];
  for (let i = 1; i < n; i++) {
    if (links[i - 1]) {
      current.push(i);
    } else {
      groups.push(current);
      current = [i];
    }
  }
  groups.push(current);
  return groups;
}

function groupIndexOf(fileIndex: number, groups: number[][]): number {
  for (let g = 0; g < groups.length; g++) {
    if (groups[g].includes(fileIndex)) return g;
  }
  return 0;
}

function isHeicFile(f: File): boolean {
  return (
    /heic|heif/i.test(f.type) ||
    /\.(heic|heif)$/i.test(f.name)
  );
}

/* ─── stateful hook for the upload page ──────────────────────── */

export function useStagedFiles() {
  const [files, setFiles] = useState<StagedFile[]>([]);
  const [links, setLinks] = useState<boolean[]>([]);

  // Cleanup all blob URLs we created on unmount.
  useEffect(() => {
    return () => {
      // eslint-disable-next-line react-hooks/exhaustive-deps
      // we deliberately read the latest from state via setFiles below
    };
  }, []);

  const generatePreview = (f: File, id: string) => {
    if (!isHeicFile(f)) {
      const url = URL.createObjectURL(f);
      setFiles((prev) =>
        prev.map((p) => (p.id === id ? { ...p, previewUrl: url } : p)),
      );
      return;
    }
    // HEIC — round-trip through /api/preview to get a JPEG we can render.
    const formData = new FormData();
    formData.append("image", f);
    fetch("/api/preview", { method: "POST", body: formData })
      .then((res) => {
        if (!res.ok) throw new Error("preview failed");
        return res.blob();
      })
      .then((blob) => {
        const url = URL.createObjectURL(blob);
        setFiles((prev) =>
          prev.map((p) => (p.id === id ? { ...p, previewUrl: url } : p)),
        );
      })
      .catch(() => {
        setFiles((prev) =>
          prev.map((p) => (p.id === id ? { ...p, previewError: true } : p)),
        );
      });
  };

  const add = (newFiles: File[]) => {
    const stagedNew: StagedFile[] = newFiles.map((f) => ({
      id: cryptoId(),
      file: f,
      previewUrl: null,
      isHeic: isHeicFile(f),
    }));
    setFiles((prev) => {
      const next = [...prev, ...stagedNew];
      setLinks((prevLinks) => {
        const result = [...prevLinks];
        while (result.length < next.length - 1) result.push(false);
        return result.slice(0, Math.max(0, next.length - 1));
      });
      return next;
    });
    // kick off preview generation for each
    stagedNew.forEach((s) => generatePreview(s.file, s.id));
  };

  const remove = (id: string) => {
    setFiles((prev) => {
      const idx = prev.findIndex((p) => p.id === id);
      if (idx === -1) return prev;
      const removed = prev[idx];
      if (removed.previewUrl) URL.revokeObjectURL(removed.previewUrl);
      const next = prev.filter((p) => p.id !== id);
      setLinks((prevLinks) => {
        const result = [...prevLinks];
        if (idx < result.length) result.splice(idx, 1);
        else result.length = Math.max(0, next.length - 1);
        return result;
      });
      return next;
    });
  };

  const clear = () => {
    setFiles((prev) => {
      for (const f of prev) {
        if (f.previewUrl) URL.revokeObjectURL(f.previewUrl);
      }
      return [];
    });
    setLinks([]);
  };

  return { files, links, setLinks, add, remove, clear };
}

function cryptoId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return Math.random().toString(36).slice(2);
}
