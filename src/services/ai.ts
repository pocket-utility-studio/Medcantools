/**
 * ai.ts
 * AI services powered by Google Gemini.
 * Requires VITE_GEMINI_API_KEY in .env.local
 */

import { GoogleGenerativeAI } from '@google/generative-ai'
import type { StrainEntry } from '../context/StashContext'

export interface StrainLookupResult {
  thc?: number
  cbd?: number
  type?: 'sativa' | 'indica' | 'hybrid'
  terpenes?: string
  effects?: string
  history?: string
  modelUsed?: string
}

function getClient(): GoogleGenerativeAI {
  const key = localStorage.getItem('gemini_api_key') || import.meta.env.VITE_GEMINI_API_KEY
  if (!key) throw new Error('NO_KEY')
  return new GoogleGenerativeAI(key)
}

const PRO   = 'gemini-2.5-pro'
const FLASH = 'gemini-2.5-flash'

async function tryProThenFlash<T>(
  client: GoogleGenerativeAI,
  config: Omit<Parameters<GoogleGenerativeAI['getGenerativeModel']>[0], 'model'>,
  fn: (model: ReturnType<GoogleGenerativeAI['getGenerativeModel']>) => Promise<T>,
): Promise<{ result: T; modelUsed: string }> {
  try {
    const model = client.getGenerativeModel({ ...config, model: PRO })
    const result = await fn(model)
    return { result, modelUsed: PRO }
  } catch {
    const model = client.getGenerativeModel({ ...config, model: FLASH })
    const result = await fn(model)
    return { result, modelUsed: FLASH }
  }
}

// ── Strain recommender ─────────────────────────────────────────────────────────

export interface EnrichedStrain {
  name: string
  type?: string
  thc?: number
  cbd?: number
  terpenes?: string
  effects?: string
  medical?: string
  notes?: string
}

const RECOMMENDER_SYSTEM = `You are a concise cannabis advisor. Recommend one strain from the user's stash. Be direct — no filler, no repetition between sections. Never repeat the strain name or any fact already stated.

The user's time of day will be provided. Let it shape your recommendation — avoid high-THC strains in the morning, favour lighter/sativa-leaning options early in the day, and lean towards indica/relaxing strains in the evening and night.

Symptom severity is provided as low, medium, or high. At low severity follow time-of-day guidance strictly. At medium severity apply time-of-day guidance but consider stronger options if they clearly suit the need. At high severity all strength options are on the table regardless of time of day — prioritise symptom relief. Do not mention severity levels in your response.

Use exactly these section headers, each followed immediately by content:

RECOMMENDATION
One sentence: name the strain and the single most important reason it fits. Include THC% only if relevant to the request.

TERPENES
Name the 2-3 dominant terpenes. One short sentence each: what it smells like and what it does. No intro sentence.

TEMPERATURE
One temperature in Celsius. One sentence on what it activates and why it suits the request.

HISTORY
One sentence maximum: origin and one standout fact.

EXPECT
One sentence: onset time and peak character. Flag any caution in the same sentence if needed.`

export interface ConsultationFeedback {
  strainName: string
  rating: 'up' | 'down'
  note: string
  date: string
}

function buildRecommendationPrompt(
  desiredEffect: string,
  party: EnrichedStrain[],
  timeOfDay: 'morning' | 'afternoon' | 'evening' | 'night',
  severity: 'low' | 'medium' | 'high',
  feedbackHistory?: ConsultationFeedback[],
  patientNotes?: string,
): string {
  const partyList = party
    .map((s) => {
      let line = `- ${s.name} (${s.type ?? 'unknown type'}`
      if (s.thc != null)  line += `, THC: ${s.thc}%`
      if (s.cbd != null)  line += `, CBD: ${s.cbd}%`
      if (s.terpenes)     line += `, terpenes: ${s.terpenes}`
      if (s.effects)      line += `, effects: ${s.effects}`
      if (s.medical)      line += `, medical uses: ${s.medical}`
      if (s.notes)        line += `, notes: "${s.notes}"`
      line += ')'
      return line
    })
    .join('\n')

  const notesBlock = patientNotes?.trim()
    ? `\n\nMy notes:\n${patientNotes.trim()}`
    : ''

  const memoryBlock = feedbackHistory && feedbackHistory.length > 0
    ? `\n\nPast sessions:\n` +
      feedbackHistory.map((f) =>
        `- ${f.strainName}: ${f.rating === 'up' ? 'POSITIVE' : 'NEGATIVE'} — "${f.note}"`
      ).join('\n') +
      `\n\nUse past session notes to personalise your recommendation.`
    : ''

  const severityBlock =
    severity === 'high'   ? '\nSeverity: HIGH — all strength options are on the table, prioritise symptom relief.' :
    severity === 'medium' ? '\nSeverity: MEDIUM — consider all options but apply time-of-day judgement.' :
                            ''

  return `Time of day: ${timeOfDay}${severityBlock}\n\nMy stash:\n${partyList}${notesBlock}${memoryBlock}\n\nWhat I want: ${desiredEffect}`
}

export async function getRecommendation(
  desiredEffect: string,
  party: EnrichedStrain[],
  timeOfDay: 'morning' | 'afternoon' | 'evening' | 'night',
  severity: 'low' | 'medium' | 'high',
  feedbackHistory?: ConsultationFeedback[],
  patientNotes?: string,
  onChunk?: (chunk: string) => void,
  onModelUsed?: (model: string) => void,
): Promise<string> {
  if (party.length === 0) throw new Error('No strains in stash')

  const client = getClient()
  const config = { systemInstruction: RECOMMENDER_SYSTEM, generationConfig: { temperature: 0.7 } }
  const prompt = buildRecommendationPrompt(desiredEffect, party, timeOfDay, severity, feedbackHistory, patientNotes)

  async function runStream(modelName: string): Promise<string> {
    const m = client.getGenerativeModel({ ...config, model: modelName })
    if (onChunk) {
      const stream = await m.generateContentStream(prompt)
      let full = ''
      for await (const chunk of stream.stream) {
        const text = chunk.text()
        if (text) { full += text; onChunk(full) }
      }
      return full.trim()
    }
    const result = await m.generateContent(prompt)
    return result.response.text().trim()
  }

  try {
    const text = await runStream(PRO)
    onModelUsed?.(PRO)
    return text
  } catch {
    // Clear any partial streamed content before retrying with Flash
    onChunk?.('')
    onModelUsed?.(FLASH)
    return runStream(FLASH)
  }
}

export async function getRecommendationFromClaude(
  desiredEffect: string,
  party: EnrichedStrain[],
  timeOfDay: 'morning' | 'afternoon' | 'evening' | 'night',
  severity: 'low' | 'medium' | 'high',
  feedbackHistory?: ConsultationFeedback[],
  patientNotes?: string,
): Promise<string> {
  const key = localStorage.getItem('claude_api_key')
  if (!key) throw new Error('NO_CLAUDE_KEY')

  const prompt = buildRecommendationPrompt(desiredEffect, party, timeOfDay, severity, feedbackHistory, patientNotes)

  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'x-api-key': key,
      'anthropic-version': '2023-06-01',
      'content-type': 'application/json',
      'anthropic-dangerous-direct-browser-access': 'true',
    },
    body: JSON.stringify({
      model: 'claude-sonnet-4-6',
      max_tokens: 1024,
      system: RECOMMENDER_SYSTEM,
      messages: [{ role: 'user', content: prompt }],
    }),
  })

  if (!res.ok) {
    const err = await res.text()
    throw new Error(`Claude API error: ${res.status} ${err}`)
  }

  const data = await res.json()
  return (data.content?.[0]?.text ?? '').trim()
}

// ── Blend suggestions ──────────────────────────────────────────────────────────

export interface BlendCard {
  label: string
  strainA: string
  strainB: string
  reason: string
}

export interface FourBlendResult {
  taste:    BlendCard
  euphoric: BlendCard
  relax:    BlendCard
  wildcard: BlendCard
}

export async function generateFourBlends(party: EnrichedStrain[]): Promise<FourBlendResult> {
  if (party.length < 2) throw new Error('Need at least 2 strains')
  const client = getClient()
  const model = client.getGenerativeModel({
    model: 'gemini-2.5-flash',
    generationConfig: { temperature: 0.6, responseMimeType: 'application/json' },
  })

  const partyList = party
    .map((s) => {
      let line = `- ${s.name} (${s.type ?? 'unknown'}`
      if (s.thc != null) line += `, THC ${s.thc}%`
      if (s.terpenes)    line += `, terpenes: ${s.terpenes}`
      if (s.effects)     line += `, effects: ${s.effects}`
      if (s.medical)     line += `, medical: ${s.medical}`
      line += ')'
      return line
    })
    .join('\n')

  const prompt = `You are a cannabis terpene expert. The user has these strains:\n\n${partyList}\n\nSuggest exactly FOUR pairings:\n1. "taste" — best combined flavour/aroma\n2. "euphoric" — best for feeling uplifted and aware\n3. "relax" — best for evening wind-down\n4. "wildcard" — a surprising pairing worth trying\n\nFor each, write 2-3 sentences explaining why. Respond with valid JSON:\n{\n  "taste":    { "strainA": "<name>", "strainB": "<name>", "reason": "<2-3 sentences>" },\n  "euphoric": { "strainA": "<name>", "strainB": "<name>", "reason": "<2-3 sentences>" },\n  "relax":    { "strainA": "<name>", "strainB": "<name>", "reason": "<2-3 sentences>" },\n  "wildcard": { "strainA": "<name>", "strainB": "<name>", "reason": "<2-3 sentences>" }\n}`

  const result = await model.generateContent(prompt)
  const data = JSON.parse(result.response.text()) as Record<string, Record<string, string>>

  const parse = (key: string, label: string): BlendCard => ({
    label,
    strainA: data[key]?.strainA ?? '',
    strainB: data[key]?.strainB ?? '',
    reason:  data[key]?.reason  ?? '',
  })

  return {
    taste:    parse('taste',    'Taste'),
    euphoric: parse('euphoric', 'Euphoric'),
    relax:    parse('relax',    'Relax'),
    wildcard: parse('wildcard', 'Wild Card'),
  }
}

export async function mixStrains(strainA: EnrichedStrain, strainB: EnrichedStrain): Promise<string> {
  const client = getClient()
  const model = client.getGenerativeModel({
    model: 'gemini-2.5-flash',
    systemInstruction: `You are a cannabis terpene expert. When given two strains, predict the combined entourage effect. Use these exact section headers:\n\nCOMBINED EFFECT\nTERPENE SCIENCE\nFLAVOUR PROFILE\nBEST FOR\nMIXING TIP`,
    generationConfig: { temperature: 0.5 },
  })

  const fmt = (s: EnrichedStrain) => {
    let line = `${s.name} (${s.type ?? 'hybrid'}`
    if (s.thc != null) line += `, THC ${s.thc}%`
    if (s.cbd != null) line += `, CBD ${s.cbd}%`
    if (s.terpenes)    line += `, terpenes: ${s.terpenes}`
    if (s.effects)     line += `, effects: ${s.effects}`
    line += ')'
    return line
  }

  const result = await model.generateContent(`Strain A: ${fmt(strainA)}\nStrain B: ${fmt(strainB)}`)
  return result.response.text().trim()
}

// ── Offline strain DB ──────────────────────────────────────────────────────────

interface StrainRecord {
  Strain: string
  Type?: string
  Effects?: string
  Flavor?: string
  Description?: string
  terpenes?: string
  thc?: number
  cbd?: number
  medical?: string
}

let _strainDb: StrainRecord[] | null = null

async function getStrainDb(): Promise<StrainRecord[]> {
  if (_strainDb) return _strainDb
  try {
    const res = await fetch('/Daily-Grind/strains.json')
    _strainDb = await res.json()
  } catch {
    _strainDb = []
  }
  return _strainDb!
}

function normalise(s: string): string {
  return s.toLowerCase().replace(/[^a-z0-9]/g, '')
}

export async function lookupStrainOffline(name: string): Promise<StrainLookupResult | null> {
  const db = await getStrainDb()
  const norm = normalise(name)
  const match = db.find(r => normalise(String(r.Strain)) === norm)
  if (!match) return null
  const out: StrainLookupResult = {}
  if (typeof match.thc === 'number') out.thc = match.thc
  if (typeof match.cbd === 'number') out.cbd = match.cbd
  const t = match.Type?.toLowerCase()
  if (t === 'sativa' || t === 'indica' || t === 'hybrid') out.type = t
  if (match.terpenes) out.terpenes = match.terpenes
  if (match.Effects)  out.effects  = match.Effects
  if (match.Description) out.history = match.Description.slice(0, 300)
  return out
}

// ── Strain lookup ──────────────────────────────────────────────────────────────

export async function lookupStrainData(name: string): Promise<StrainLookupResult> {
  // Try offline DB first if no API key
  let key: string | null = null
  try { key = localStorage.getItem('gemini_api_key') || import.meta.env.VITE_GEMINI_API_KEY } catch { /* ignore */ }
  if (!key) {
    const offline = await lookupStrainOffline(name)
    if (offline) return offline
    throw new Error('NO_KEY')
  }
  const client = getClient()
  const config = {
    systemInstruction: `You are a cannabis strain encyclopedia. Return accurate, well-researched data. Only state what is genuinely known — do not fabricate details.`,
    generationConfig: { temperature: 0.1, responseMimeType: 'application/json' },
  }

  const prompt = `Provide accurate data for the cannabis strain "${name}".
Respond ONLY with a single valid JSON object. Use null for unknown fields except thc.
{
  "thc": <typical THC % as number — required>,
  "cbd": <typical CBD % as number|null>,
  "type": <"sativa"|"indica"|"hybrid"|null>,
  "terpenes": <"comma-separated dominant terpenes"|null>,
  "effects": <"short comma-separated list of effects"|null>,
  "history": <"5-8 sentences covering: geographic origin or region, the era or decade it emerged, breeder or collective who created it, parent genetics, what made it significant or novel, any awards or cultural impact, and how it influenced later breeding — only include what is genuinely documented"|null>
}`

  const { result: raw, modelUsed } = await tryProThenFlash(client, config, m => m.generateContent(prompt))
  const data = JSON.parse(raw.response.text())
  const out: StrainLookupResult = { modelUsed }
  out.thc = typeof data.thc === 'number' ? data.thc : 15
  if (typeof data.cbd === 'number') out.cbd = data.cbd
  if (data.type === 'sativa' || data.type === 'indica' || data.type === 'hybrid') out.type = data.type
  if (typeof data.terpenes === 'string' && data.terpenes) out.terpenes = data.terpenes
  if (typeof data.effects  === 'string' && data.effects)  out.effects  = data.effects
  if (typeof data.history  === 'string' && data.history)  out.history  = data.history
  return out
}

// ── Gemini Pro judge ───────────────────────────────────────────────────────────

export interface StrainJudgment {
  thc?: number
  cbd?: number
  type?: 'sativa' | 'indica' | 'hybrid'
  confidence: 'high' | 'medium' | 'low'
  notes: string
  modelUsed?: string
}

export async function judgeStrainData(
  name: string,
  gemini: StrainLookupResult,
  claude: CrossCheckResult,
): Promise<StrainJudgment> {
  const client = getClient()
  const judgeConfig = { generationConfig: { temperature: 0.1, responseMimeType: 'application/json' } }

  const prompt = `Two AI models have provided data for the cannabis strain "${name}". Compare their answers and give your best assessment.

Gemini said:
${JSON.stringify({ thc: gemini.thc, cbd: gemini.cbd, type: gemini.type, effects: gemini.effects }, null, 2)}

Claude said:
${JSON.stringify({ thc: claude.thc, cbd: claude.cbd, type: claude.type, effects: claude.effects }, null, 2)}

Respond ONLY with valid JSON:
{
  "thc": <your best estimate of typical THC % as number>,
  "cbd": <your best estimate of typical CBD % as number or null>,
  "type": <"sativa"|"indica"|"hybrid" — your assessment>,
  "confidence": <"high" if both models largely agree, "medium" if minor discrepancies, "low" if significant disagreement>,
  "notes": <1-2 sentences: where do the models agree or disagree, and what does that tell us about data reliability for this strain>
}`

  const { result: raw, modelUsed } = await tryProThenFlash(client, judgeConfig, m => m.generateContent(prompt))
  const data = JSON.parse(raw.response.text())

  const out: StrainJudgment = {
    modelUsed,
    confidence: data.confidence === 'high' || data.confidence === 'medium' || data.confidence === 'low'
      ? data.confidence : 'medium',
    notes: typeof data.notes === 'string' ? data.notes : '',
  }
  if (typeof data.thc === 'number') out.thc = data.thc
  if (typeof data.cbd === 'number') out.cbd = data.cbd
  if (data.type === 'sativa' || data.type === 'indica' || data.type === 'hybrid') out.type = data.type
  return out
}

export async function judgeRecommendations(
  query: string,
  geminiRec: string,
  claudeRec: string,
): Promise<{ text: string; modelUsed: string }> {
  const client = getClient()
  const judgeConfig = {
    systemInstruction: `You are a senior cannabis advisor reviewing two independent recommendations. Synthesise them into a single, clear verdict. Use the same section headers as the original responses: RECOMMENDATION, TERPENES, TEMPERATURE, HISTORY, EXPECT. Be concise — one sentence per section. Where the two advisors agree, state that clearly. Where they disagree, explain why and give your own verdict.`,
    generationConfig: { temperature: 0.3 },
  }

  const prompt = `The user asked for: "${query}"

Gemini's recommendation:
${geminiRec}

Claude's recommendation:
${claudeRec}

Provide your synthesised verdict.`

  const { result: raw, modelUsed } = await tryProThenFlash(client, judgeConfig, m => m.generateContent(prompt))
  return { text: raw.response.text().trim(), modelUsed }
}

// ── Claude cross-check ─────────────────────────────────────────────────────────

export interface CrossCheckResult {
  thc?: number
  cbd?: number
  type?: 'sativa' | 'indica' | 'hybrid'
  effects?: string
  history?: string
}

export async function crossCheckStrainWithClaude(name: string): Promise<CrossCheckResult> {
  const key = localStorage.getItem('claude_api_key')
  if (!key) throw new Error('NO_CLAUDE_KEY')

  const body = {
    model: 'claude-sonnet-4-6',
    max_tokens: 512,
    system: 'You are a cannabis strain encyclopedia. Return only accurate, well-researched data. Do not fabricate details.',
    messages: [{
      role: 'user',
      content: `Provide accurate data for the cannabis strain "${name}".
Respond ONLY with a single valid JSON object. Use null for unknown fields except thc.
{
  "thc": <typical THC % as number — required>,
  "cbd": <typical CBD % as number|null>,
  "type": <"sativa"|"indica"|"hybrid"|null>,
  "effects": <"short comma-separated list of effects"|null>,
  "history": <"4-6 sentences covering origin, era, breeder, genetics, and significance — only documented facts"|null>
}`,
    }],
  }

  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'x-api-key': key,
      'anthropic-version': '2023-06-01',
      'content-type': 'application/json',
      'anthropic-dangerous-direct-browser-access': 'true',
    },
    body: JSON.stringify(body),
  })

  if (!res.ok) {
    const err = await res.text()
    throw new Error(`Claude API error: ${res.status} ${err}`)
  }

  const data = await res.json()
  const text = data.content?.[0]?.text ?? ''
  const jsonMatch = text.match(/\{[\s\S]*\}/)
  if (!jsonMatch) throw new Error('Claude returned no JSON')
  const parsed = JSON.parse(jsonMatch[0])

  const out: CrossCheckResult = {}
  if (typeof parsed.thc === 'number') out.thc = parsed.thc
  if (typeof parsed.cbd === 'number') out.cbd = parsed.cbd
  if (parsed.type === 'sativa' || parsed.type === 'indica' || parsed.type === 'hybrid') out.type = parsed.type
  if (typeof parsed.effects === 'string' && parsed.effects) out.effects = parsed.effects
  if (typeof parsed.history === 'string' && parsed.history) out.history = parsed.history
  return out
}

// ── Cannabis Q&A ───────────────────────────────────────────────────────────────

export async function askCannabisQuestion(question: string): Promise<string> {
  const client = getClient()
  const model = client.getGenerativeModel({
    model: 'gemini-2.5-flash',
    systemInstruction: `You are a knowledgeable cannabis encyclopedia. Answer questions about cannabis — strains, terpenes, cannabinoids, effects, consumption methods, botany, history, and harm reduction. Only answer cannabis-related questions. If unrelated, respond with exactly: OFF_TOPIC. Be factual, concise, non-judgmental. 3-5 sentences unless more detail is needed. Never recommend illegal activity.`,
    generationConfig: { temperature: 0.4 },
  })
  const result = await model.generateContent(question)
  return result.response.text().trim()
}

// ── OCR + strain parse ─────────────────────────────────────────────────────────

export async function parseStrainFromImage(imageBase64: string, mimeType: string): Promise<Partial<StrainEntry>> {
  const client = getClient()
  const model = client.getGenerativeModel({
    model: 'gemini-2.5-flash',
    generationConfig: { temperature: 0.1, responseMimeType: 'application/json' },
  })

  const prompt = `This is a photo of a cannabis product label or packaging. Extract any visible strain information.

Respond ONLY with valid JSON:
{
  "name": "<strain name or null>",
  "thc": <THC percentage as number or null>,
  "cbd": <CBD percentage as number or null>,
  "type": <"sativa"|"indica"|"hybrid"|null>,
  "amount": "<weight like '3.5g' or null>"
}

Only include values clearly visible in the image. Use null for anything not visible.`

  const result = await model.generateContent([
    prompt,
    { inlineData: { data: imageBase64, mimeType } },
  ])

  const data = JSON.parse(result.response.text())
  const out: Partial<StrainEntry> = {}
  if (typeof data.name   === 'string' && data.name)   out.name   = data.name
  if (typeof data.thc    === 'number')                 out.thc    = data.thc
  if (typeof data.cbd    === 'number')                 out.cbd    = data.cbd
  if (data.type === 'sativa' || data.type === 'indica' || data.type === 'hybrid') out.type = data.type
  if (typeof data.amount === 'string' && data.amount)  out.amount = data.amount
  return out
}
