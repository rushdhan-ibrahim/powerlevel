/**
 * Rasterize /public/icon.svg and /public/splash.svg into every PNG
 * size the manifest and iOS needs. Re-run whenever either SVG
 * changes. Output goes to /public/icons/ and /public/splash/.
 *
 *   npx tsx scripts/generate-pwa-assets.ts
 */
import sharp from "sharp";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";

const PUBLIC = join(process.cwd(), "public");
const ICONS_DIR = join(PUBLIC, "icons");
const SPLASH_DIR = join(PUBLIC, "splash");

/** Home-screen icons used by the manifest + iOS apple-touch. */
const ICON_SIZES = [
  { name: "icon-192.png", size: 192 },
  { name: "icon-512.png", size: 512 },
  { name: "apple-touch-icon.png", size: 180 },
  // Maskable variant — same artwork, but Android's maskable layer
  // crops to the safe zone (40% inside). Our icon.svg already keeps
  // the sigil at ~40% radius, so the regular 512 is a fine maskable.
  { name: "icon-maskable-512.png", size: 512, maskable: true },
];

/** iOS splash screens. Sizes are portrait pixel dimensions that
 *  match each device's native display. Apple picks the right one
 *  by querying media features in the <link> tag. */
const SPLASHES: Array<{ w: number; h: number; label: string }> = [
  { w: 1320, h: 2868, label: "iphone-17-pro-max" },
  { w: 1290, h: 2796, label: "iphone-16-15-pro-max" },
  { w: 1179, h: 2556, label: "iphone-15-pro" },
  { w: 1170, h: 2532, label: "iphone-13-14" },
  { w: 1080, h: 2340, label: "iphone-13-mini" },
  { w: 750,  h: 1334, label: "iphone-se" },
];

async function main() {
  await mkdir(ICONS_DIR, { recursive: true });
  await mkdir(SPLASH_DIR, { recursive: true });

  const iconSvg = await readFile(join(PUBLIC, "icon.svg"));

  console.log("• icons …");
  for (const spec of ICON_SIZES) {
    const pad = spec.maskable ? Math.round(spec.size * 0.1) : 0;
    const inner = spec.size - pad * 2;
    const buf = await sharp(iconSvg, { density: 600 })
      .resize(inner, inner)
      .toBuffer();
    const out = pad
      ? await sharp({
          create: {
            width: spec.size,
            height: spec.size,
            channels: 4,
            background: { r: 235, g: 227, b: 211, alpha: 1 }, // var(--paper)
          },
        })
          .composite([{ input: buf, left: pad, top: pad }])
          .png()
          .toBuffer()
      : await sharp(buf).png().toBuffer();
    await writeFile(join(ICONS_DIR, spec.name), out);
    console.log(`  ✓ ${spec.name}`);
  }

  console.log("• iOS splash screens …");
  // Splash = the icon at ~25% of the shorter edge, centered on a
  // paper-tone background with the wordmark below it in rubric.
  for (const { w, h, label } of SPLASHES) {
    const icon = Math.round(Math.min(w, h) * 0.3);
    const iconBuf = await sharp(iconSvg, { density: 600 }).resize(icon, icon).toBuffer();

    const wmW = Math.round(w * 0.8);
    const wmH = Math.round(w * 0.14);
    const wordmarkSvg = `
<svg xmlns="http://www.w3.org/2000/svg" width="${wmW}" height="${wmH}" viewBox="0 0 ${wmW} ${wmH}">
  <text x="50%" y="60%" font-family="'Cormorant SC', Georgia, serif"
        font-size="${Math.round(w * 0.062)}" letter-spacing="0.22em"
        fill="#2a2520" text-anchor="middle" font-variant="small-caps"
        font-weight="500">powerlevel</text>
  <text x="50%" y="88%" font-family="'Cormorant Garamond', Georgia, serif"
        font-style="italic" font-size="${Math.round(w * 0.028)}"
        fill="#8b2d23" text-anchor="middle">a folio for the training body</text>
</svg>`.trim();
    const wordmarkBuf = await sharp(Buffer.from(wordmarkSvg), { density: 600 })
      .resize(wmW, wmH, { fit: "inside" })
      .png()
      .toBuffer();
    const wmMeta = await sharp(wordmarkBuf).metadata();

    const splash = await sharp({
      create: {
        width: w,
        height: h,
        channels: 4,
        background: { r: 236, g: 230, b: 220, alpha: 1 },
      },
    })
      .composite([
        { input: iconBuf, left: Math.round((w - icon) / 2), top: Math.round(h * 0.35) },
        {
          input: wordmarkBuf,
          left: Math.round((w - (wmMeta.width ?? w)) / 2),
          top: Math.round(h * 0.35 + icon + h * 0.04),
        },
      ])
      .png()
      .toBuffer();

    await writeFile(join(SPLASH_DIR, `${label}-${w}x${h}.png`), splash);
    console.log(`  ✓ ${label} (${w}×${h})`);
  }

  console.log("done");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
