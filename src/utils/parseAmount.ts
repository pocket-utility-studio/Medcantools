/**
 * Parse a strain amount string to grams.
 * Returns null if the string can't be reliably interpreted as grams.
 * Examples: "3.5g" → 3.5, "2 grams" → 2, "1.5" → 1.5
 * Non-gram units ("quarter", "1oz") return null to avoid false positives.
 */
export function parseAmountGrams(amount?: string): number | null {
  if (!amount) return null
  const lower = amount.toLowerCase().trim()
  // Reject ounce/oz mentions
  if (/oz|ounce/.test(lower)) return null
  // Reject named quantities that aren't gram-based
  if (/quarter|half|eighth/.test(lower)) return null
  const match = lower.match(/([\d.]+)/)
  if (!match) return null
  const n = parseFloat(match[1])
  return isFinite(n) ? n : null
}
