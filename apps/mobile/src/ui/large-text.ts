/**
 * The system text scale from which label/value rows stack instead of sharing a line: the iOS accessibility sizes
 * (AX1 is about 1.6x the default body size; the largest standard size, xxxLarge, is about 1.35x) and Android font
 * scales of 1.5 and up.
 */
const STACK_FROM_FONT_SCALE = 1.5;

/** Whether a row that pairs a label with an amount should stack them at this system font scale. */
export function shouldStackRows(fontScale: number): boolean {
  return fontScale >= STACK_FROM_FONT_SCALE;
}
