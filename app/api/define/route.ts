import { NextRequest, NextResponse } from 'next/server'
import type { Language } from '@/types'

async function fetchDefinition(word: string, lang: Language): Promise<string | null> {
  try {
    if (lang === 'en') {
      const res = await fetch(
        `https://api.dictionaryapi.dev/api/v2/entries/en/${encodeURIComponent(word.toLowerCase())}`,
        { next: { revalidate: 86400 } },
      )
      if (!res.ok) return null
      const data = await res.json()
      return data[0]?.meanings?.[0]?.definitions?.[0]?.definition ?? null
    } else {
      const res = await fetch(
        `https://${lang}.wiktionary.org/api/rest_v1/page/summary/${encodeURIComponent(word.toLowerCase())}`,
        { next: { revalidate: 86400 } },
      )
      if (!res.ok) return null
      const data = await res.json()
      return data.extract ?? null
    }
  } catch {
    return null
  }
}

async function fetchTranslation(word: string, from: Language, to: Language): Promise<string | null> {
  if (from === to) return null
  try {
    const res = await fetch(
      `https://api.mymemory.translated.net/get?q=${encodeURIComponent(word)}&langpair=${from}|${to}`,
    )
    if (!res.ok) return null
    const data = await res.json()
    const t: string = data.responseData?.translatedText ?? ''
    if (!t || t.toLowerCase() === word.toLowerCase()) return null
    return t
  } catch {
    return null
  }
}

export async function POST(req: NextRequest) {
  const { word, language, nativeLang } = (await req.json()) as {
    word: string
    language: Language
    nativeLang: Language
  }

  const [definition, translation] = await Promise.all([
    fetchDefinition(word, language),
    fetchTranslation(word, language, nativeLang),
  ])

  // Combined field stored in vocabulary_box.translation_[nativeLang]
  let combined: string | null = null
  if (translation && definition) combined = `${translation} — ${definition}`
  else if (translation) combined = translation
  else if (definition) combined = definition

  return NextResponse.json({ combined, translation, definition })
}
