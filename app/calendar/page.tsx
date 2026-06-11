'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/hooks/useAuth'
import type { CalendarDay } from '@/types'

const DAY_LABELS = ['L', 'M', 'M', 'J', 'V', 'S', 'D']
const MONTH_NAMES = [
  'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
  'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre',
]

export default function CalendarPage() {
  const { user, loading: authLoading } = useAuth()
  const [days, setDays] = useState<CalendarDay[]>([])
  const [loading, setLoading] = useState(true)
  const [viewDate, setViewDate] = useState(new Date())
  const router = useRouter()

  useEffect(() => {
    if (!authLoading && !user) router.replace('/auth')
  }, [user, authLoading, router])

  useEffect(() => {
    if (!user) return

    const load = async () => {
      setLoading(true)
      const year = viewDate.getFullYear()
      const month = viewDate.getMonth()

      const firstDay = new Date(year, month, 1)
      const lastDay = new Date(year, month + 1, 0)
      const from = firstDay.toISOString().split('T')[0]
      const to = lastDay.toISOString().split('T')[0]
      const today = new Date().toISOString().split('T')[0]

      const [{ data: texts }, { data: progresses }] = await Promise.all([
        supabase
          .from('daily_texts')
          .select('text_date, id')
          .gte('text_date', from)
          .lte('text_date', to),
        supabase
          .from('reading_progress')
          .select('text_id, completed')
          .eq('user_id', user.id),
      ])

      const textMap = new Map((texts ?? []).map((t) => [t.text_date, t.id]))
      const completedSet = new Set(
        (progresses ?? []).filter((p) => p.completed).map((p) => p.text_id),
      )

      const result: CalendarDay[] = []
      for (let d = 1; d <= lastDay.getDate(); d++) {
        const date = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`
        const textId = textMap.get(date)
        result.push({
          date,
          hasText: !!textId,
          completed: textId ? completedSet.has(textId) : false,
          isFuture: date > today,
        })
      }

      setDays(result)
      setLoading(false)
    }

    load()
  }, [user, viewDate])

  // Offset for first day of month (Mon=0)
  const firstDayOffset = () => {
    const d = new Date(viewDate.getFullYear(), viewDate.getMonth(), 1).getDay()
    return d === 0 ? 6 : d - 1
  }

  const prevMonth = () =>
    setViewDate((d) => new Date(d.getFullYear(), d.getMonth() - 1, 1))
  const nextMonth = () =>
    setViewDate((d) => new Date(d.getFullYear(), d.getMonth() + 1, 1))

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="w-8 h-8 border-2 border-accent border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background px-4 pt-8 pb-24 page-fade">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <button
          onClick={prevMonth}
          className="w-9 h-9 flex items-center justify-center rounded-xl
                     bg-surface text-text-secondary hover:text-text-primary transition-colors"
        >
          ‹
        </button>
        <h1 className="text-xl font-light text-text-primary">
          {MONTH_NAMES[viewDate.getMonth()]} {viewDate.getFullYear()}
        </h1>
        <button
          onClick={nextMonth}
          className="w-9 h-9 flex items-center justify-center rounded-xl
                     bg-surface text-text-secondary hover:text-text-primary transition-colors"
        >
          ›
        </button>
      </div>

      {/* Day labels */}
      <div className="grid grid-cols-7 mb-2">
        {DAY_LABELS.map((l, i) => (
          <p key={i} className="text-center text-[11px] text-text-secondary py-1">
            {l}
          </p>
        ))}
      </div>

      {/* Grid */}
      {loading ? (
        <div className="flex justify-center py-16">
          <div className="w-6 h-6 border-2 border-accent border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        <div className="grid grid-cols-7 gap-1.5">
          {/* Empty cells for offset */}
          {Array.from({ length: firstDayOffset() }).map((_, i) => (
            <div key={`e-${i}`} />
          ))}

          {days.map((day) => {
            const d = Number(day.date.split('-')[2])

            if (day.completed) {
              return (
                <Link
                  key={day.date}
                  href={`/read/${day.date}`}
                  className="aspect-square flex items-center justify-center rounded-xl
                             bg-success/20 text-success text-sm font-medium
                             border border-success/40 hover:bg-success/30 transition-colors"
                >
                  {d}
                </Link>
              )
            }

            if (day.hasText && !day.isFuture) {
              return (
                <Link
                  key={day.date}
                  href={`/read/${day.date}`}
                  className="aspect-square flex items-center justify-center rounded-xl
                             text-text-primary text-sm border-2 border-accent/60
                             hover:border-accent hover:bg-accent/10 transition-colors"
                >
                  {d}
                </Link>
              )
            }

            return (
              <div
                key={day.date}
                className="aspect-square flex items-center justify-center rounded-xl
                           text-text-secondary/40 text-sm bg-surface-raised"
              >
                {d}
              </div>
            )
          })}
        </div>
      )}

      {/* Legend */}
      <div className="flex gap-5 justify-center mt-8 text-xs text-text-secondary">
        <span className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded-sm bg-success/20 border border-success/40 inline-block" />
          Terminé
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded-sm border-2 border-accent/60 inline-block" />
          Disponible
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded-sm inline-block bg-surface-raised" />
          Indisponible
        </span>
      </div>
    </div>
  )
}
