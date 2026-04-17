"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { UploadZone } from "@/components/UploadZone";
import { WorkoutEditor } from "@/components/WorkoutEditor";
import { BulkStaging, useStagedFiles, buildGroups } from "@/components/BulkStaging";
import { ReviewQueue, type ReviewItem } from "@/components/ReviewQueue";
import { Headpiece } from "@/components/manuscript/Headpiece";
import { Ornament } from "@/components/manuscript/Ornament";
import { Initial } from "@/components/manuscript/Initial";
import { PageIncipit } from "@/components/manuscript/PageIncipit";
import type { ParsedWorkout } from "@/lib/schema";
import { parseWorkout, cleanupStorage } from "@/lib/parse_client";

type ParseResponse = {
  workout: ParsedWorkout;
  imagePaths?: string[];
  imagePath?: string;
  meta?: { model?: string; tokensIn?: number; tokensOut?: number; pageCount?: number };
};

type Mode = "idle" | "single-loading" | "single-review" | "staging" | "review-queue";

export default function UploadPage() {
  const router = useRouter();
  const [mode, setMode] = useState<Mode>("idle");
  const [singleResult, setSingleResult] = useState<ParseResponse | null>(null);
  const [singleError, setSingleError] = useState<string | null>(null);

  const staged = useStagedFiles();
  const [reviewItems, setReviewItems] = useState<ReviewItem[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);

  // Track in-flight AbortControllers per queue item id so cancellation works.
  const abortersRef = useRef<Map<string, AbortController>>(new Map());

  /* ─── single-file fast path ──────────────────────────────── */
  const parseSingle = async (file: File) => {
    setMode("single-loading");
    setSingleError(null);
    try {
      const result = await parseWorkout([file]);
      setSingleResult({
        workout: result.workout,
        imagePaths: result.imagePaths,
        imagePath: result.imagePaths[0] ?? null,
        meta: result.meta,
      });
      setMode("single-review");
    } catch (e) {
      setSingleError((e as Error).message);
      setMode("idle");
    }
  };

  /* ─── multi-file staging path ────────────────────────────── */
  const onFiles = (files: File[]) => {
    if (files.length === 1 && staged.files.length === 0) {
      parseSingle(files[0]);
      return;
    }
    staged.add(files);
    setMode("staging");
  };

  const startBulkParse = async () => {
    const groups = buildGroups(staged.files.length, staged.links);
    if (groups.length === 0) return;

    const initial: ReviewItem[] = groups.map((g) => ({
      id: cryptoId(),
      status: "pending",
      fileNames: g.map((i) => staged.files[i].file.name),
    }));
    setReviewItems(initial);
    setActiveId(initial[0]?.id ?? null);
    setMode("review-queue");

    // Snapshot the file groups before clearing staged state.
    const queue = initial.map((item, gi) => ({
      itemId: item.id,
      files: groups[gi].map((i) => staged.files[i].file),
    }));

    // Drain with concurrency 2.
    const concurrency = 2;
    let cursor = 0;
    const workers = Array.from({ length: concurrency }, async () => {
      while (cursor < queue.length) {
        const idx = cursor++;
        const { itemId, files } = queue[idx];
        await parseGroup(itemId, files);
      }
    });
    await Promise.all(workers);

    // Free preview URLs only after all parses have started; the captured
    // queue still holds the File references.
    staged.clear();
  };

  const parseGroup = async (id: string, files: File[]) => {
    // Skip if cancelled before we got here.
    setReviewItems((items) => {
      const it = items.find((x) => x.id === id);
      if (it?.status === "cancelled") return items;
      return items.map((x) => (x.id === id ? { ...x, status: "parsing" } : x));
    });

    const isCancelled = (() => {
      const it = reviewItems.find((x) => x.id === id);
      return it?.status === "cancelled";
    })();
    if (isCancelled) return;

    const controller = new AbortController();
    abortersRef.current.set(id, controller);

    try {
      const result = await parseWorkout(files, { signal: controller.signal });
      setReviewItems((items) =>
        items.map((it) =>
          it.id === id
            ? {
                ...it,
                status: "ready",
                result: {
                  workout: result.workout,
                  imagePaths: result.imagePaths,
                  meta: result.meta,
                },
              }
            : it,
        ),
      );
    } catch (err) {
      const aborted =
        (err as Error).name === "AbortError" ||
        /aborted/i.test((err as Error).message ?? "");
      if (aborted) {
        // already marked cancelled by handler; ensure that's the state
        setReviewItems((items) =>
          items.map((it) =>
            it.id === id && it.status !== "saved"
              ? { ...it, status: "cancelled" }
              : it,
          ),
        );
      } else {
        setReviewItems((items) =>
          items.map((it) =>
            it.id === id ? { ...it, status: "error", error: (err as Error).message } : it,
          ),
        );
      }
    } finally {
      abortersRef.current.delete(id);
    }
  };

  /* ─── save handlers ──────────────────────────────────────── */
  const handleQueueSaved = (queueId: string) => {
    setReviewItems((items) =>
      items.map((it) => (it.id === queueId ? { ...it, status: "saved" } : it)),
    );
    // Auto-advance to the next ready item, then to the next pending item.
    setActiveId((curr) => {
      // Recompute on next state — we need to read the updated array.
      return curr; // will recompute in useEffect below
    });
  };

  // Auto-advance after a save: pick the first non-finished item.
  useEffect(() => {
    if (mode !== "review-queue") return;
    if (!activeId) return;
    const active = reviewItems.find((i) => i.id === activeId);
    if (!active) return;
    if (active.status === "saved" || active.status === "discarded") {
      const next = reviewItems.find(
        (it) =>
          it.id !== activeId &&
          (it.status === "ready" || it.status === "parsing" || it.status === "pending"),
      );
      if (next) setActiveId(next.id);
    }
  }, [reviewItems, activeId, mode]);

  /* ─── cancel handler ─────────────────────────────────────── */
  const handleCancel = (queueId: string) => {
    const controller = abortersRef.current.get(queueId);
    if (controller) controller.abort();
    setReviewItems((items) =>
      items.map((it) =>
        it.id === queueId && (it.status === "pending" || it.status === "parsing")
          ? { ...it, status: "cancelled" }
          : it,
      ),
    );
    abortersRef.current.delete(queueId);
  };

  /* ─── discard handler — drops a parsed (or about-to-be-parsed) workout
       from the queue without saving it. Also deletes the photos from
       Storage so we don't leave orphan files. */
  const handleDiscard = (queueId: string) => {
    const controller = abortersRef.current.get(queueId);
    if (controller) controller.abort();
    setReviewItems((items) => {
      const victim = items.find((x) => x.id === queueId);
      if (victim?.result?.imagePaths?.length) {
        cleanupStorage(victim.result.imagePaths);
      }
      return items.map((it) =>
        it.id === queueId
          ? { ...it, status: "discarded", result: undefined, error: undefined }
          : it,
      );
    });
    abortersRef.current.delete(queueId);
  };

  // Cleanup on unmount: abort everything still pending/parsing.
  useEffect(() => {
    const map = abortersRef.current;
    return () => {
      for (const c of map.values()) c.abort();
      map.clear();
    };
  }, []);

  const isParsingBulk = reviewItems.some((r) => r.status === "parsing");

  /* ─── RENDER ─────────────────────────────────────────────── */

  if (mode === "single-review" && singleResult) {
    return (
      <div>
        <PageIncipit eyebrow="Review &amp; save" title="One Workout" meta="check the parse against the source before saving" />
        <p className="body-prose">
          The photo on the left is your source page. The structured catalog on the right
          is what Gemini extracted. Click any field to correct, add, or delete.
        </p>
        <Ornament variant="diamond" />
        <WorkoutEditor
          initial={singleResult.workout}
          imagePaths={singleResult.imagePaths ?? (singleResult.imagePath ? [singleResult.imagePath] : [])}
          meta={singleResult.meta}
        />
      </div>
    );
  }

  if (mode === "review-queue") {
    const allFinished =
      reviewItems.length > 0 &&
      reviewItems.every((i) => i.status === "saved" || i.status === "cancelled" || i.status === "error" || i.status === "discarded");
    return (
      <div>
        <PageIncipit
          eyebrow="Review &amp; save"
          title="Workouts Queued"
          meta={`${reviewItems.length} workouts queued · save each one in turn`}
        />
        <ReviewQueue
          items={reviewItems}
          activeId={activeId}
          onSelect={setActiveId}
          onSaved={handleQueueSaved}
          onCancel={handleCancel}
          onDiscard={handleDiscard}
        />
        {allFinished && (
          <div style={{ textAlign: "center", marginTop: 30 }}>
            <Ornament variant="diamond" />
            <button
              type="button"
              onClick={() => router.push("/workouts")}
              className="btn btn-rubric btn-quill"
            >
              done — open history
            </button>
          </div>
        )}
      </div>
    );
  }

  // idle or staging
  return (
    <div>
      <PageIncipit
        eyebrow="Compose"
        title="Add Workouts"
        meta="one page or many — Gemini reads them all"
      />

      <p className="body-prose">
        <Initial letter="O" />
        ne photo gets you straight to a review screen. Drop several at once and they go to
        the staging area below — chain adjacent photos together with the link button when
        they&rsquo;re different pages of the same workout, then parse them all in one go.
        Nothing is saved until you confirm each one.
      </p>

      <Ornament variant="hollow" />

      {staged.files.length === 0 ? (
        <UploadZone onFiles={onFiles} isLoading={mode === "single-loading"} />
      ) : (
        <BulkStaging
          files={staged.files}
          links={staged.links}
          onLinksChange={staged.setLinks}
          onRemove={staged.remove}
          onClear={() => {
            staged.clear();
            setMode("idle");
          }}
          onAddFiles={(more) => staged.add(more)}
          onParseAll={startBulkParse}
          isParsing={isParsingBulk}
        />
      )}

      {singleError && (
        <div
          className="principle"
          style={{
            borderLeftColor: "var(--rubric)",
            background: "rgba(139,45,35,.05)",
            marginTop: 18,
          }}
        >
          <div className="principle-l">parse failed</div>
          <div className="principle-t">{singleError}</div>
        </div>
      )}

      <Ornament variant="trinity" />

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(3, 1fr)",
          gap: 16,
          marginTop: 24,
        }}
      >
        <Hint
          title="legibility"
          body="A direct overhead photo works best. Flatten the page if it curls; avoid raking light that casts shadows across the writing."
        />
        <Hint
          title="multi-page workouts"
          body="If your workout spans two or three pages, drop them all and chain the cards together (●) so Gemini merges them as one session."
        />
        <Hint
          title="dates"
          body="Pages with a written date take that date; otherwise today is used and flagged. Workouts always order chronologically by their actual date, not upload order."
        />
      </div>
    </div>
  );
}

function Hint({ title, body }: { title: string; body: string }) {
  return (
    <div
      style={{
        borderTop: "1px solid var(--rule)",
        paddingTop: 10,
      }}
    >
      <div
        style={{
          fontFamily: "var(--display)",
          fontVariant: "small-caps",
          fontSize: ".7rem",
          fontWeight: 500,
          letterSpacing: ".18em",
          color: "var(--rubric)",
          marginBottom: 4,
        }}
      >
        {title}
      </div>
      <div
        style={{
          fontFamily: "var(--serif)",
          fontSize: ".88rem",
          color: "var(--ink-light)",
          lineHeight: 1.55,
        }}
      >
        {body}
      </div>
    </div>
  );
}

function cryptoId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) return crypto.randomUUID();
  return Math.random().toString(36).slice(2);
}
