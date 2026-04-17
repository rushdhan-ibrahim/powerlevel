/**
 * Inline rubric span — for marking key values (PRs, dates, milestones)
 * within prose. Use sparingly. The rubric is the skeleton.
 */
export function Rubric({ children }: { children: React.ReactNode }) {
  return <span className="rubric">{children}</span>;
}
