'use strict'

/**
 * LexiFlow — Monthly text generation script
 *
 * Launched on the 28th of each month via GitHub Actions.
 * Generates one text per day of the FOLLOWING month (28–31 texts).
 *
 * Required env vars:
 *   SUPABASE_URL       — Supabase project URL
 *   SUPABASE_SERVICE_KEY — service_role key (not anon)
 *   GEMINI_API_KEY     — Google AI Studio key
 *
 * Usage: node scripts/generate-texts.js
 */

const { createClient } = require('@supabase/supabase-js')

// ── Env validation ────────────────────────────────────────────────────────────

const SUPABASE_URL       = process.env.SUPABASE_URL
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY
const GEMINI_API_KEY     = process.env.GEMINI_API_KEY

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY || !GEMINI_API_KEY) {
  console.error(
    'Erreur : variables d\'environnement manquantes.\n' +
    'Requis : SUPABASE_URL, SUPABASE_SERVICE_KEY, GEMINI_API_KEY'
  )
  process.exit(1)
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)

// ── Compute next month's dates ────────────────────────────────────────────────

// TARGET_MONTH=YYYY-MM targets a specific month; default = next month
const now = new Date()
let targetFirst
if (process.env.TARGET_MONTH) {
  const [y, m] = process.env.TARGET_MONTH.split('-').map(Number)
  if (!y || !m || m < 1 || m > 12) {
    console.error('Erreur : TARGET_MONTH doit être au format YYYY-MM (ex: 2026-06)')
    process.exit(1)
  }
  targetFirst = new Date(y, m - 1, 1)
} else {
  targetFirst = new Date(now.getFullYear(), now.getMonth() + 1, 1)
}
const nextMonthFirst = targetFirst
const year  = targetFirst.getFullYear()
const month = targetFirst.getMonth()             // 0-indexed
const daysInMonth = new Date(year, month + 1, 0).getDate()

const dates = Array.from({ length: daysInMonth }, (_, i) => {
  const day = String(i + 1).padStart(2, '0')
  const mon = String(month + 1).padStart(2, '0')
  return `${year}-${mon}-${day}`
})

// ── Themes — cycled in order ──────────────────────────────────────────────────

const THEMES = [
  'un marché au lever du soleil',
  'une lettre jamais envoyée',
  'le bruit de la pluie sur un toit',
  'une ville vue depuis un train',
  "la mémoire d'une odeur",
  'une bibliothèque abandonnée',
  "le dernier jour de l'été",
  'une conversation entre étrangers',
  'un objet transmis de génération en génération',
  'le silence après une tempête',
  'une fenêtre allumée la nuit',
  'le premier café du matin',
  "une langue qu'on oublie",
  "un chemin qu'on ne reprend jamais",
  'la mer en hiver',
  'une photographie jaunie',
  "le retour dans une ville d'enfance",
  'une promesse faite à soi-même',
  "l'heure bleue entre chien et loup",
  'un repas partagé avec des inconnus',
  "le son d'un instrument qu'on entend de loin",
  'une gare un soir de départ',
  "la lumière d'octobre",
  "un jardin à l'abandon",
  "les mains d'une personne âgée",
  'une nuit sans sommeil',
  "le parfum d'un livre ancien",
  'une frontière traversée',
  'la neige sur une ville',
  'un dimanche sans plan',
  'une langue maternelle retrouvée',
]

// ── Prompts ───────────────────────────────────────────────────────────────────

const SYSTEM_PROMPT =
  "Tu es un générateur de textes pédagogiques pour l'apprentissage du vocabulaire. " +
  'Tu génères des textes riches et naturels de 180 à 220 mots avec 8 à 12 mots de ' +
  'vocabulaire soutenu ou peu courant, dans un registre légèrement littéraire, ' +
  'agréable à lire à voix haute. ' +
  "Retourne UNIQUEMENT un objet JSON valide, sans markdown, sans commentaire, sans backticks."

function buildUserPrompt(date, theme, index, total) {
  return (
    `Génère le texte numéro ${index + 1} sur ${total} pour la date du ${date}. ` +
    `Thème : ${theme}.\n` +
    'Retourne ce JSON exact :\n' +
    '{\n' +
    `  "text_date": "${date}",\n` +
    `  "theme": "${theme}",\n` +
    '  "word_count": <nombre entier>,\n' +
    '  "content_fr": "texte complet en français",\n' +
    '  "content_en": "natural english translation",\n' +
    '  "content_es": "traducción natural al español"\n' +
    '}'
  )
}

// ── Gemini API ────────────────────────────────────────────────────────────────

async function callGemini(userPrompt) {
  const url =
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent` +
    `?key=${GEMINI_API_KEY}`

  const body = {
    system_instruction: { parts: [{ text: SYSTEM_PROMPT }] },
    contents: [{ role: 'user', parts: [{ text: userPrompt }] }],
    generationConfig: {
      temperature: 0.9,
      topP: 0.95,
      maxOutputTokens: 1200,
      responseMimeType: 'application/json',
    },
  }

  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })

  if (!res.ok) {
    const text = await res.text()
    throw new Error(`Gemini ${res.status}: ${text.slice(0, 200)}`)
  }

  const data = await res.json()
  const raw = data?.candidates?.[0]?.content?.parts?.[0]?.text
  if (!raw) throw new Error('Réponse Gemini vide ou malformée')
  return raw
}

// ── JSON extraction (handles stray markdown or surrounding text) ──────────────

function extractJSON(raw) {
  // Remove fenced code blocks
  let s = raw.replace(/```(?:json)?/gi, '').replace(/```/g, '').trim()
  // Isolate the outermost { … }
  const start = s.indexOf('{')
  const end   = s.lastIndexOf('}')
  if (start === -1 || end === -1 || end < start) {
    throw new Error('Aucun objet JSON trouvé dans la réponse')
  }
  return s.slice(start, end + 1)
}

// ── Helpers ───────────────────────────────────────────────────────────────────

const sleep = (ms) => new Promise((r) => setTimeout(r, ms))

// ── Main ──────────────────────────────────────────────────────────────────────

async function main() {
  const monthLabel = nextMonthFirst.toLocaleDateString('fr-FR', {
    month: 'long',
    year: 'numeric',
  })

  console.log(`\nLexiFlow — génération des textes pour ${monthLabel}`)
  console.log(`${dates.length} textes à générer (${dates[0]} → ${dates[dates.length - 1]})\n`)

  const themeOffset = month % THEMES.length
  let success = 0
  let failure = 0

  for (let i = 0; i < dates.length; i++) {
    const date  = dates[i]
    const theme = THEMES[(themeOffset + i) % THEMES.length]

    try {
      const raw     = await callGemini(buildUserPrompt(date, theme, i, dates.length))
      const jsonStr = extractJSON(raw)
      const payload = JSON.parse(jsonStr)

      // Enforce correct date and compute real word count
      payload.text_date  = date
      payload.word_count = (payload.content_fr || '').split(/\s+/).filter(Boolean).length

      const { error } = await supabase
        .from('daily_texts')
        .upsert(payload, { onConflict: 'text_date' })

      if (error) throw new Error(error.message)

      console.log(`✓ ${date} — ${theme}`)
      success++
    } catch (err) {
      console.error(`✗ ${date} — ${err.message}`)
      failure++
    }

    if (i < dates.length - 1) await sleep(1500)
  }

  console.log(`\n${success} textes générés avec succès sur ${dates.length}`)

  if (failure > 0) {
    console.error(`${failure} erreur(s) — vérifiez les logs ci-dessus.`)
    process.exit(1)
  }
}

main().catch((err) => {
  console.error('Erreur fatale :', err.message)
  process.exit(1)
})
