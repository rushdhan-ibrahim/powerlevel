import { PlateCalculator } from "@/components/PlateCalculator";
import { PageIncipit } from "@/components/manuscript/PageIncipit";
import { Initial } from "@/components/manuscript/Initial";
import { Ornament } from "@/components/manuscript/Ornament";
import { ColophonSeal } from "@/components/manuscript/Seal";

export const metadata = { title: "Plate calculator · Powerlevel" };

export default function PlateCalculatorPage() {
  return (
    <div>
      <PageIncipit
        eyebrow="Tools"
        title="Plate calculator"
        meta="what to load on each side of the bar"
      />

      <p className="body-prose">
        <Initial letter="E" />
        nter your target weight; the calculator picks plates greedily — heaviest first
        — until each side of the bar is filled. Defaults assume an Olympic bar (20 kg
        / 45 lb). Switch units, change the bar weight, or aim at any number; if your
        plate set can&rsquo;t hit it exactly, the remainder is shown so you know to
        round.
      </p>

      <Ornament variant="diamond" />

      <PlateCalculator />

      <Ornament variant="trinity" />

      <div style={{ textAlign: "center", marginTop: 28 }}>
        <ColophonSeal />
        <div className="marginalia" style={{ marginTop: 4 }}>
          standard Olympic plates · adjust if your gym&rsquo;s set is different
        </div>
      </div>
    </div>
  );
}
