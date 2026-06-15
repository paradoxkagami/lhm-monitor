const GENERIC_FONTS = new Set(['sans-serif', 'serif', 'monospace', 'cursive', 'fantasy', 'system-ui'])

export const formatFontFamily = (family: string): string => {
  return family
    .split(',')
    .map((f) => f.trim().replace(/^"|"$/g, ''))
    .filter(Boolean)
    .map((f) => (GENERIC_FONTS.has(f.toLowerCase()) ? f : `"${f}"`))
    .join(', ')
}