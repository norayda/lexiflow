import { NextRequest, NextResponse } from 'next/server'
import type { Language } from '@/types'

export async function POST(req: NextRequest) {
  const { text, from, to } = (await req.json()) as {
    text: string
    from: Language
    to: Language
  }

  if (from === to || !text) {
    return NextResponse.json({ translation: null })
  }

  try {
    const res = await fetch(
      `https://api.mymemory.translated.net/get?q=${encodeURIComponent(text)}&langpair=${from}|${to}`,
    )
    if (!res.ok) return NextResponse.json({ translation: null })
    const data = await res.json()
    const t: string = data.responseData?.translatedText ?? ''
    return NextResponse.json({ translation: t || null })
  } catch {
    return NextResponse.json({ translation: null })
  }
}
