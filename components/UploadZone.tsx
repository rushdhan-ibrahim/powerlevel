"use client";

import { useCallback, useRef, useState } from "react";

type Props = {
  onFiles: (files: File[]) => void;
  isLoading?: boolean;
  multiple?: boolean;
};

export function UploadZone({ onFiles, isLoading, multiple = true }: Props) {
  const [isDragging, setIsDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const cameraRef = useRef<HTMLInputElement>(null);

  const handleFiles = useCallback(
    (fileList: FileList | File[]) => {
      const files = Array.from(fileList).filter((f) => f.type.startsWith("image/"));
      if (files.length > 0) onFiles(files);
    },
    [onFiles],
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);
      handleFiles(e.dataTransfer.files);
    },
    [handleFiles],
  );

  const handlePaste = useCallback(
    (e: React.ClipboardEvent) => {
      const files = Array.from(e.clipboardData.files).filter((f) => f.type.startsWith("image/"));
      if (files.length > 0) handleFiles(files);
    },
    [handleFiles],
  );

  return (
    <div
      onDragOver={(e) => {
        e.preventDefault();
        setIsDragging(true);
      }}
      onDragLeave={() => setIsDragging(false)}
      onDrop={handleDrop}
      onPaste={handlePaste}
      tabIndex={-1}
      style={{
        position: "relative",
        background: "var(--paper-warm)",
        border: `1px ${isDragging ? "solid" : "dashed"} ${isDragging ? "var(--rubric)" : "var(--rule)"}`,
        padding: 24,
        minHeight: 380,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        textAlign: "center",
        transition: "border-color .2s var(--ease)",
      }}
    >
      {isLoading ? (
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 16,
          }}
        >
          <ScribesLoadingMark />
          <div
            style={{
              fontFamily: "var(--italic)",
              fontStyle: "italic",
              fontSize: ".95rem",
              color: "var(--ink)",
              letterSpacing: ".02em",
            }}
          >
            reading your page&hellip;
          </div>
          <div
            style={{
              fontFamily: "var(--mono)",
              fontSize: ".68rem",
              color: "var(--ash)",
              letterSpacing: ".06em",
            }}
          >
            gemini-3.1-pro &middot; thinking on
          </div>
        </div>
      ) : (
        <div>
          <ScribesIdleMark />
          <div
            style={{
              fontFamily: "var(--display)",
              fontVariant: "small-caps",
              fontSize: "1rem",
              letterSpacing: ".18em",
              color: "var(--ink)",
              marginTop: 20,
            }}
          >
            drop your photos
          </div>
          <div className="marginalia" style={{ marginTop: 8, fontSize: ".82rem" }}>
            {multiple
              ? "one page or a stack — drag, drop, paste, or take a photo"
              : "drag, drop, paste, or take a photo"}
          </div>

          <div
            style={{
              display: "flex",
              gap: 12,
              justifyContent: "center",
              marginTop: 28,
            }}
          >
            <button
              type="button"
              onClick={() => inputRef.current?.click()}
              className="btn btn-ghost"
            >
              choose files
            </button>
            <button
              type="button"
              onClick={() => cameraRef.current?.click()}
              className="btn btn-ghost"
            >
              take a photo
            </button>
          </div>

          <div className="code-meta" style={{ marginTop: 28, opacity: 0.6 }}>
            jpg &middot; png &middot; webp &middot; heic
          </div>
        </div>
      )}

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        multiple={multiple}
        style={{ display: "none" }}
        onChange={(e) => {
          if (e.target.files) handleFiles(e.target.files);
        }}
      />
      <input
        ref={cameraRef}
        type="file"
        accept="image/*"
        capture="environment"
        style={{ display: "none" }}
        onChange={(e) => {
          if (e.target.files) handleFiles(e.target.files);
        }}
      />
    </div>
  );
}

function ScribesIdleMark() {
  return (
    <svg viewBox="0 0 100 100" width="68" height="68" aria-hidden="true">
      <g style={{ animation: "spin 80s linear infinite", transformOrigin: "50px 50px" }}>
        <circle cx="50" cy="50" r="44" fill="none" stroke="var(--ink)" strokeWidth=".3" opacity=".25" />
        <circle cx="50" cy="50" r="38" fill="none" stroke="var(--ink)" strokeWidth=".18" opacity=".18" strokeDasharray="2,4" />
      </g>
      <g style={{ animation: "breathe 8s ease-in-out infinite", transformOrigin: "50px 50px" }}>
        <polygon
          points="50,28 53,47 72,50 53,53 50,72 47,53 28,50 47,47"
          fill="var(--rubric)"
          opacity=".75"
        />
      </g>
    </svg>
  );
}

function ScribesLoadingMark() {
  return (
    <svg viewBox="0 0 100 100" width="56" height="56" aria-hidden="true">
      <g style={{ animation: "spin 6s linear infinite", transformOrigin: "50px 50px" }}>
        <circle
          cx="50"
          cy="50"
          r="40"
          fill="none"
          stroke="var(--rubric)"
          strokeWidth=".7"
          opacity=".4"
          strokeDasharray="6,12"
        />
      </g>
      <g style={{ animation: "spinR 11s linear infinite", transformOrigin: "50px 50px" }}>
        <circle
          cx="50"
          cy="50"
          r="28"
          fill="none"
          stroke="var(--ink)"
          strokeWidth=".4"
          opacity=".35"
          strokeDasharray="2,6"
        />
      </g>
      <polygon
        points="50,40 54,50 50,60 46,50"
        fill="var(--rubric)"
        opacity=".88"
        style={{ animation: "pulse 2.4s ease-in-out infinite" }}
      />
    </svg>
  );
}
