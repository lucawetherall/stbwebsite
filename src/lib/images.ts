/**
 * The house responsive-image convention, in one place.
 *
 * The image prep scripts (`scripts/fetch-images.mjs`, `scripts/generate-image-variants.mjs`
 * and friends) write each optimised WebP with smaller siblings alongside it —
 * `foo.webp` → `foo-800.webp`, `foo-1200.webp` — and the components offer those to the
 * browser as a srcset.
 *
 * Two rules keep the srcsets honest, both enforced here rather than trusted:
 *
 *  1. **A candidate is only offered if its file exists.** A CMS-uploaded hero has no
 *     siblings (only the prep scripts make them), and advertising a file that is not
 *     there hands narrow viewports a 404 instead of a photograph.
 *  2. **Width descriptors are measured, not assumed.** The descriptor is read from the
 *     WebP header of the actual file, so a source photo narrower than the nominal size
 *     (an old 1080px exterior shot, say) can never claim to be 1600w and trick the
 *     browser into serving a too-small candidate to a high-density screen.
 *
 * Everything here runs at build time only (Astro components are rendered once, in Node),
 * so the filesystem reads are safe and cached for the life of the build.
 */
import { closeSync, existsSync, openSync, readSync } from 'node:fs';
import path from 'node:path';

const PUBLIC_DIR = path.resolve(process.cwd(), 'public');

/** The sibling widths the prep scripts may have produced, narrowest first. */
const SIBLING_WIDTHS = [256, 800, 1200, 1280] as const;

/** A site-absolute `/images/…` path within the house `.webp` convention, or nothing. */
function fsPathOf(sitePath: string): string | undefined {
  if (!sitePath.startsWith('/') || !sitePath.endsWith('.webp')) return undefined;
  return path.join(PUBLIC_DIR, sitePath.slice(1));
}

/**
 * The pixel width of a WebP file, read straight from its header (VP8, VP8L and VP8X
 * containers). Returns undefined for anything unreadable — the caller then omits the
 * candidate rather than guessing.
 */
export function webpWidth(file: string): number | undefined {
  let fd: number;
  try {
    fd = openSync(file, 'r');
  } catch {
    return undefined;
  }
  try {
    const buf = Buffer.alloc(30);
    if (readSync(fd, buf, 0, 30, 0) < 30) return undefined;
    if (buf.toString('ascii', 0, 4) !== 'RIFF' || buf.toString('ascii', 8, 12) !== 'WEBP') {
      return undefined;
    }
    const chunk = buf.toString('ascii', 12, 16);
    if (chunk === 'VP8X') return buf.readUIntLE(24, 3) + 1; // extended: canvas width − 1
    if (chunk === 'VP8 ') {
      // lossy: 3-byte frame tag, then the 9D 01 2A start code, then 14-bit width
      if (buf[23] !== 0x9d || buf[24] !== 0x01 || buf[25] !== 0x2a) return undefined;
      return buf.readUInt16LE(26) & 0x3fff;
    }
    if (chunk === 'VP8L') {
      if (buf[20] !== 0x2f) return undefined; // lossless signature byte
      return (buf.readUInt32LE(21) & 0x3fff) + 1; // 14-bit width − 1
    }
    return undefined;
  } finally {
    closeSync(fd);
  }
}

const widthCache = new Map<string, number | undefined>();

/** `webpWidth` for a site-absolute path, cached for the build. */
function measuredWidth(sitePath: string): number | undefined {
  if (!widthCache.has(sitePath)) {
    const file = fsPathOf(sitePath);
    widthCache.set(sitePath, file && existsSync(file) ? webpWidth(file) : undefined);
  }
  return widthCache.get(sitePath);
}

/**
 * The `-<width>` sibling of a house WebP — only when the sibling actually exists on disk.
 * Returns undefined outside the convention or for a sibling nobody has generated, so a
 * caller can always fall back to the original with `?? src`.
 */
export function imageSibling(src: string, width: number): string | undefined {
  const file = fsPathOf(src);
  if (!file) return undefined;
  const sibling = src.replace(/\.webp$/, `-${width}.webp`);
  return existsSync(path.join(PUBLIC_DIR, sibling.slice(1))) ? sibling : undefined;
}

/**
 * A srcset of every sibling that exists plus the original, each carrying its **measured**
 * width. Returns undefined — the attribute is omitted and plain `src` serves — when the
 * image is outside the convention or no sibling exists to make a srcset worth having.
 */
export function imageSrcset(src: string): string | undefined {
  if (!fsPathOf(src)) return undefined;

  const candidates = new Map<number, string>();
  for (const nominal of SIBLING_WIDTHS) {
    const sibling = imageSibling(src, nominal);
    const w = sibling && measuredWidth(sibling);
    if (sibling && w && !candidates.has(w)) candidates.set(w, sibling);
  }
  const fullWidth = measuredWidth(src);
  if (fullWidth && !candidates.has(fullWidth)) candidates.set(fullWidth, src);

  if (candidates.size < 2) return undefined;
  return [...candidates.entries()]
    .sort((a, b) => a[0] - b[0])
    .map(([w, url]) => `${url} ${w}w`)
    .join(', ');
}
