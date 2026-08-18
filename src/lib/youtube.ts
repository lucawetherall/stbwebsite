// src/lib/youtube.ts
// Accepts watch?v=, youtu.be/, /embed/ and /shorts/ forms; returns the 11-char id.
const ID_RE = /(?:youtu\.be\/|youtube(?:-nocookie)?\.com\/(?:watch\?v=|embed\/|shorts\/))([A-Za-z0-9_-]{11})/;

export function youtubeId(url: string): string {
  const match = ID_RE.exec(url);
  if (!match) throw new Error(`Not a recognised YouTube URL: ${url}`);
  return match[1];
}

/** Privacy-preserving embed URL — youtube-nocookie sets no cookies until playback. */
export function youtubeEmbedUrl(url: string): string {
  return `https://www.youtube-nocookie.com/embed/${youtubeId(url)}`;
}
