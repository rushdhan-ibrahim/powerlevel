"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function DeleteWorkoutButton({ id }: { id: string }) {
  const router = useRouter();
  const [confirming, setConfirming] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const doDelete = async () => {
    setDeleting(true);
    const res = await fetch(`/api/workouts/${id}`, { method: "DELETE" });
    if (res.ok) {
      router.push("/workouts");
      router.refresh();
    } else {
      setDeleting(false);
    }
  };

  if (confirming) {
    return (
      <div
        className="dialog-veil"
        onClick={() => !deleting && setConfirming(false)}
      >
        <div className="dialog" onClick={(e) => e.stopPropagation()}>
          <h3
            style={{
              fontFamily: "var(--display)",
              fontVariant: "small-caps",
              fontSize: "1rem",
              letterSpacing: ".2em",
              color: "var(--ink)",
              textAlign: "center",
              marginBottom: 4,
            }}
          >
            delete this workout?
          </h3>
          <div
            className="subtitle"
            style={{ marginBottom: 22, fontSize: ".84rem" }}
          >
            the page and its parse cannot be restored
          </div>
          <div style={{ display: "flex", gap: 10, justifyContent: "center" }}>
            <button
              onClick={() => setConfirming(false)}
              disabled={deleting}
              className="btn btn-ghost"
            >
              keep
            </button>
            <button
              onClick={doDelete}
              disabled={deleting}
              className="btn btn-rubric"
            >
              {deleting ? "deleting…" : "delete"}
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <button
      onClick={() => setConfirming(true)}
      style={{
        fontFamily: "var(--display)",
        fontVariant: "small-caps",
        fontSize: ".55rem",
        letterSpacing: ".16em",
        color: "var(--ash)",
        background: "transparent",
        border: "none",
        cursor: "pointer",
        padding: 4,
        transition: "color .15s var(--ease)",
      }}
      onMouseEnter={(e) => (e.currentTarget.style.color = "var(--rubric)")}
      onMouseLeave={(e) => (e.currentTarget.style.color = "var(--ash)")}
    >
      delete workout
    </button>
  );
}
