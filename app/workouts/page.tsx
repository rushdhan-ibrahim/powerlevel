/**
 * `/workouts` is the historical address of the training history; it
 * was renamed to `/history` in the Pilgrimage scaffold so the page
 * can grow to hold both paper-workouts and runs on one timeline.
 *
 * Workout detail pages (`/workouts/[id]`, `/workouts/[id]/edit`,
 * `/workouts/new`) keep their existing routes — they are still
 * paper-workout-specific.
 */
import { redirect, permanentRedirect } from "next/navigation";

export default function WorkoutsListRedirect() {
  permanentRedirect("/history");
  // unreachable, satisfies the type checker
  redirect("/history");
}
