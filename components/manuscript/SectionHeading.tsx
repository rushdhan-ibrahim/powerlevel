/**
 * H2 with a rubric §-numeral. Pass the section number; render passes the title.
 */
export function SectionHeading({
  n,
  children,
  marker = "§",
}: {
  n: string | number;
  children: React.ReactNode;
  marker?: string;
}) {
  return (
    <h2 className="h-section">
      <span className="n">
        {marker}
        {n}
      </span>
      {children}
    </h2>
  );
}

export function SubHeading({ children }: { children: React.ReactNode }) {
  return <h3 className="h-sub">{children}</h3>;
}
