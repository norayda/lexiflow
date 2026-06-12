export type Language = 'fr' | 'en' | 'es'

export interface Profile {
  id: string
  username: string | null
  native_language: Language | null
  learning_language: Language | null
  notification_time: string
  scroll_speed: number
  created_at: string
}

export interface DailyText {
  id: string
  text_date: string
  theme: string | null
  theme_en: string | null
  theme_es: string | null
  word_count: number | null
  content_fr: string
  content_en: string
  content_es: string
  created_at: string
}

export interface ReadingProgress {
  id: string
  user_id: string
  text_id: string
  read_at: string
  completed: boolean
}

export interface VocabularyWord {
  id: string
  user_id: string
  text_id: string
  word: string
  language: Language
  context_sentence: string | null
  translation_fr: string | null
  translation_en: string | null
  translation_es: string | null
  saved_at: string
  deleted_at: string | null
}

export interface CalendarDay {
  date: string
  hasText: boolean
  completed: boolean
  isFuture: boolean
}
