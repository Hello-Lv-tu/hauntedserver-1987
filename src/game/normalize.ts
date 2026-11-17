/**
 * Clean up what the player typed before any mode sees it.
 *
 * Chinese, Japanese and Korean input methods often produce full-width
 * characters ("？", "ｌｓ", "－ａ", full-width spaces). A 1987 terminal would
 * reject them, but players can't see the difference. NFKC folds them to
 * plain ASCII; typographic quotes become straight quotes so quoting works.
 */
export function normalizeInput(text: string): string {
  return text
    .normalize('NFKC')
    .replace(/[“”„]/g, '"')
    .replace(/[‘’‚]/g, "'")
    .replace(/。/g, '.')
    .replace(/[\r\n]+/g, ' ')
}
