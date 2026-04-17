import { GhostCode } from "./GhostCode";

/**
 * The folio. Paper that floats on a scholar's desk, with a ghost-code
 * underlay scrolling slowly behind every page of the codex.
 */
export function Folio({ children }: { children: React.ReactNode }) {
  return (
    <div className="folio">
      <GhostCode />
      {children}
    </div>
  );
}
