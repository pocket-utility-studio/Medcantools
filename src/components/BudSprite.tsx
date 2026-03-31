/**
 * BudSprite — 13 pixel-art bud variants ported from Smokedex.
 * Variant chosen deterministically from strain name + type + any descriptive text.
 */

function budImageUrl(n: number): string {
  return n === 1 ? '/Medcantools/Bud1.png' : `/Medcantools/bud${n}.png`
}

const DESIGN_TO_IMAGE: Record<string, number> = {
  sativa_green:    1,
  indica_sage:     2,
  og_kush:         3,
  hindu_afghani:   3,
  orange_clusters: 3,
  orange_dense:    3,
  fire_og:         3,
  purple_indica:   4,
  blueberry:       5,
  teal_hybrid:     5,
  crystal_white:   6,
  sativa_powder:   6,
  dark_navy:       7,
  midnight_hybrid: 7,
  lavender_pink:   8,
  lemon_green:     9,
  cheese:          9,
  golden_haze:     9,
  purple_rock:     10,
  gelato:          11,
  sativa_autumn:   12,
  long_pistil:     12,
  fluffy_landrace: 12,
  popcorn_bud:     13,
}

const DESIGN_KEYWORDS: Record<string, string[]> = {
  crystal_white:   ['crystal', 'frost', 'frosty', 'trichome', 'icy', 'white', 'snow', 'sugar coat', 'sugary', 'frozen', 'sparkl', 'glitter'],
  lemon_green:     ['lemon', 'lime', 'citrus', 'zest', 'tangy', 'yellow', 'sour', 'tart', 'limonene'],
  purple_rock:     ['deep purple', 'very purple', 'dark purple', 'dense purple', 'plum', 'dark grape', 'almost black'],
  purple_indica:   ['purple', 'grape', 'violet', 'amethyst', 'anthocyanin'],
  dark_navy:       ['black', 'coal', 'jet ', 'very dark', 'extremely dark', 'blacken', 'jet black'],
  blueberry:       ['blueberry', 'cobalt', 'indigo', 'ocean blue', 'blue hue', 'blue tint', 'blue'],
  lavender_pink:   ['pink', 'lavender', 'rose', 'floral', 'jasmine', 'blossom', 'petal', 'floral aroma'],
  orange_clusters: ['orange', 'tangerine', 'apricot', 'peach', 'mandarin', 'mango', 'myrcene'],
  orange_dense:    ['dense orange', 'deep orange', 'burnt orange', 'dark amber', 'rich amber'],
  fire_og:         ['fire', 'fiery', 'hot', 'pepper', 'spicy', 'sharp', 'chili', 'caryophyllene', 'red hair'],
  gelato:          ['gelato', 'dessert', 'candy', 'cookie', 'vanilla', 'sherbet', 'ice cream', 'sweet cream', 'waffle'],
  cheese:          ['cheese', 'cheesy', 'funky', 'dairy', 'savory', 'sharp cheese'],
  teal_hybrid:     ['teal', 'mint', 'menthol', 'aqua', 'minty', 'cool', 'refreshing', 'pinene', 'terpinolene'],
  golden_haze:     ['haze', 'golden', 'soaring', 'cerebral', 'uplifting', 'euphoric', 'gold', 'amber glow', 'heady'],
  og_kush:         ['kush', 'pine', 'piney', 'earthy', 'woody', 'forest', 'resin', 'og ', 'resinous', 'humulene'],
  hindu_afghani:   ['afghan', 'hash', 'hashish', 'ancient', 'pungent', 'incense', 'heavy resin', 'old world'],
  fluffy_landrace: ['fluffy', 'airy', 'wispy', 'landrace', 'heritage', 'traditional', 'loose structure'],
  sativa_powder:   ['powdery', 'cloud', 'delicate', 'feathery', 'linalool', 'light bud'],
  popcorn_bud:     ['popcorn', 'small bud', 'nugget', 'mini bud', 'larfy'],
  long_pistil:     ['pistil', 'orange hair', 'red pistil', 'hairy', 'long pist', 'prominent hair'],
  sativa_autumn:   ['autumn', 'fall color', 'two-tone', 'mixed color', 'warm spice', 'spiced'],
  sativa_green:    ['bright green', 'vibrant green', 'lime green', 'kelly green', 'vivid green'],
  midnight_hybrid: ['midnight', 'deep blue', 'dark blue', 'oceanic', 'abyss', 'dark teal'],
  indica_sage:     ['sage', 'muted green', 'grey green', 'forest green', 'olive', 'moss'],
}

const TYPE_FALLBACK: Record<string, string[]> = {
  sativa:  ['sativa_green', 'sativa_powder', 'sativa_autumn', 'lemon_green', 'long_pistil', 'fluffy_landrace', 'crystal_white', 'golden_haze'],
  indica:  ['indica_sage', 'purple_indica', 'purple_rock', 'dark_navy', 'og_kush', 'blueberry', 'cheese', 'hindu_afghani'],
  hybrid:  ['orange_clusters', 'orange_dense', 'teal_hybrid', 'midnight_hybrid', 'lavender_pink', 'gelato', 'popcorn_bud', 'fire_og'],
}

function nameHash(name: string): number {
  return [...name].reduce((h, c) => ((h * 31 + c.charCodeAt(0)) >>> 0) & 0xffff, 0)
}

function selectDesignFromContext(text: string, nameH: number): string | null {
  const lower = text.toLowerCase()
  const scores = Object.entries(DESIGN_KEYWORDS).map(([design, keywords]) => [
    design,
    keywords.reduce((n, kw) => n + (lower.includes(kw) ? 1 : 0), 0),
  ] as [string, number])
  const max = Math.max(...scores.map(([, s]) => s))
  if (max === 0) return null
  const top = scores.filter(([, s]) => s === max).map(([d]) => d)
  return top[nameH % top.length]
}

export function getBudDesign(name: string, type?: string, contextText?: string): string {
  const h = nameHash(name)
  if (contextText?.trim()) {
    const d = selectDesignFromContext(contextText, h)
    if (d) return d
  }
  const variants = TYPE_FALLBACK[type ?? ''] ?? TYPE_FALLBACK['hybrid']
  return variants[h % variants.length]
}

export function getBudImageUrl(name: string, type?: string, contextText?: string): string {
  const design = getBudDesign(name, type, contextText)
  return budImageUrl(DESIGN_TO_IMAGE[design] ?? 1)
}

export default function BudSprite({
  name,
  type,
  contextText,
  size = 40,
}: {
  name: string
  type?: string
  contextText?: string
  size?: number
}) {
  return (
    <img
      src={getBudImageUrl(name, type, contextText)}
      alt=""
      style={{ width: size, height: size, objectFit: 'contain', display: 'block', flexShrink: 0 }}
    />
  )
}
