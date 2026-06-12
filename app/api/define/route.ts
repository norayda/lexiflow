import { NextRequest, NextResponse } from 'next/server'
import type { Language } from '@/types'

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

  const translation = await fetchTranslation(word, language, nativeLang)
  return NextResponse.json({ combined: translation, translation })
}
