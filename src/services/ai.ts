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
}

function getClient(): GoogleGenerativeAI {
  const key = localStorage.getItem('gemini_api_key') || import.meta.env.VITE_GEMINI_API_KEY
  if (!key) throw new Error('NO_KEY')
  return new GoogleGenerativeAI(key)
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

const RECOMMENDER_SYSTEM = `You are a knowledgeable cannabis advisor — calm, non-judgmental, and precise. The user gives you their current strains with botanical data. Recommend the best match for their needs.

Structure your response with these exact section headers:

RECOMMENDATION
Which strain you recommend and precisely why it matches their request. Reference the specific THC/CBD ratio and how it fits their needs.

TERPENE SCIENCE
For the 2-3 dominant terpenes in the recommended strain: name, its aroma, how it works in the body, and exactly why it contributes to the desired effect. Explain the entourage effect between terpenes and cannabinoids.

TEMPERATURE GUIDE
The optimal vaporisation temperature in Celsius only (never Fahrenheit). Explain what activates at that temperature — which terpenes boil off, which cannabinoids decarboxylate, and what the user will experience.

STRAIN HISTORY
2 sentences only: where it came from, who bred it, and one standout fact about its lineage.

WHAT TO EXPECT
1-2 sentences: vaping onset, peak duration, and any key caution. Keep it brief.`

export interface ConsultationFeedback {
  strainName: string
  rating: 'up' | 'down'
  note: string
  date: string
}

export async function getRecommendation(
  desiredEffect: string,
  party: EnrichedStrain[],
  feedbackHistory?: ConsultationFeedback[],
  patientNotes?: string,
  onChunk?: (chunk: string) => void,
): Promise<string> {
  if (party.length === 0) throw new Error('No strains in stash')

  const client = getClient()
  const model = client.getGenerativeModel({
    model: 'gemini-2.5-flash',
    systemInstruction: RECOMMENDER_SYSTEM,
    generationConfig: { temperature: 0.7 },
  })

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

  const prompt = `My stash:\n${partyList}${notesBlock}${memoryBlock}\n\nWhat I want: ${desiredEffect}`

  if (onChunk) {
    const stream = await model.generateContentStream(prompt)
    let full = ''
    for await (const chunk of stream.stream) {
      const text = chunk.text()
      if (text) { full += text; onChunk(full) }
    }
    return full.trim()
  }

  const result = await model.generateContent(prompt)
  return result.response.text().trim()
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

// ── Strain lookup ──────────────────────────────────────────────────────────────

export async function lookupStrainData(name: string): Promise<StrainLookupResult> {
  const client = getClient()
  const model = client.getGenerativeModel({
    model: 'gemini-2.5-flash',
    systemInstruction: `You are a cannabis strain encyclopedia. Return accurate, well-researched data. Only state what is genuinely known — do not fabricate details.`,
    generationConfig: { temperature: 0.1, responseMimeType: 'application/json' },
  })

  const prompt = `Provide accurate data for the cannabis strain "${name}".
Respond ONLY with a single valid JSON object. Use null for unknown fields except thc.
{
  "thc": <typical THC % as number — required>,
  "cbd": <typical CBD % as number|null>,
  "type": <"sativa"|"indica"|"hybrid"|null>,
  "terpenes": <"comma-separated dominant terpenes"|null>,
  "effects": <"short comma-separated list of effects"|null>,
  "history": <"2-4 sentences covering origin, breeder, genetics"|null>
}`

  const result = await model.generateContent(prompt)
  const data = JSON.parse(result.response.text())
  const out: StrainLookupResult = {}
  out.thc = typeof data.thc === 'number' ? data.thc : 15
  if (typeof data.cbd === 'number') out.cbd = data.cbd
  if (data.type === 'sativa' || data.type === 'indica' || data.type === 'hybrid') out.type = data.type
  if (typeof data.terpenes === 'string' && data.terpenes) out.terpenes = data.terpenes
  if (typeof data.effects  === 'string' && data.effects)  out.effects  = data.effects
  if (typeof data.history  === 'string' && data.history)  out.history  = data.history
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
