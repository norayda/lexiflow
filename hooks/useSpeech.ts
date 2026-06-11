export function useSpeech() {
  const langMap: Record<string, string> = {
    fr: 'fr-FR',
    en: 'en-US',
    es: 'es-ES',
  }

  const speak = (text: string, lang: 'fr' | 'en' | 'es') => {
    if (typeof window === 'undefined') return
    window.speechSynthesis.cancel()
    const utterance = new SpeechSynthesisUtterance(text)
    utterance.lang = langMap[lang]
    utterance.rate = 0.85
    utterance.pitch = 1
    window.speechSynthesis.speak(utterance)
  }

  const stop = () => {
    if (typeof window !== 'undefined') {
      window.speechSynthesis.cancel()
    }
  }

  return { speak, stop }
}
