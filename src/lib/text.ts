/**
 * The first sentence of a block of prose — up to and including the first
 * sentence-ending mark (. ! ?) that is followed by whitespace or the end of
 * the string. Naive by design (no abbreviation handling); our bios are curated,
 * and an editor can rephrase a first sentence if needed.
 */
export function firstSentence(text: string): string {
  const trimmed = text.trim();
  const match = trimmed.match(/^.*?[.!?](?=\s|$)/);
  return (match ? match[0] : trimmed).trim();
}
