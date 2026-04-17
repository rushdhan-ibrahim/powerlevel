/**
 * Rubric-bordered statement. Small-caps label sits above the body.
 * Used to mark commandments, not decorations.
 */
export function Principle({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="principle">
      <div className="principle-l">{label}</div>
      <div className="principle-t">{children}</div>
    </div>
  );
}
