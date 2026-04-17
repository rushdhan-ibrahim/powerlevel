import Link from "next/link";

export type CatalogEntry = {
  num: string;
  name: React.ReactNode;
  desc?: React.ReactNode;
  numerals?: React.ReactNode;
  href?: string;
};

/**
 * Numbered serif rows. Catalog entries have a rubric numeral, a serif name,
 * an italic description on the right, OR a numeric value (e.g. an e1RM).
 */
export function Catalog({ entries }: { entries: CatalogEntry[] }) {
  return (
    <div className="catalog">
      {entries.map((e, i) => {
        const inner = (
          <>
            <span className="cat-num">{e.num}</span>
            <span className="cat-name">{e.name}</span>
            {e.desc && <span className="cat-desc">{e.desc}</span>}
            {e.numerals && <span className="cat-num-display">{e.numerals}</span>}
          </>
        );
        if (e.href) {
          return (
            <Link
              key={i}
              href={e.href}
              className="cat-row"
              style={{ textDecoration: "none" }}
            >
              {inner}
            </Link>
          );
        }
        return (
          <div key={i} className="cat-row">
            {inner}
          </div>
        );
      })}
    </div>
  );
}
