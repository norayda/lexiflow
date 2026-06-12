'use client'
import { useState } from 'react'

const SLIDES = [
  {
    icon: '📖',
    title: 'Un texte par jour',
    text: 'Chaque jour, un nouveau texte dans ta langue d\'apprentissage. Différents thèmes, différentes ambiances — conçus pour enrichir ton vocabulaire naturellement.',
  },
  {
    icon: '▶',
    title: 'Le défilement automatique',
    text: 'Appuie sur ▶ pour lancer le défilement. Règle la vitesse avec le curseur. Le texte est marqué "terminé" quand la dernière phrase se trouve en haut de l\'écran.',
  },
  {
    icon: '💡',
    title: 'Interagis avec les mots',
    text: 'Maintiens la pression sur une phrase pour voir sa traduction et écouter sa prononciation. Reste appuyé sur un mot pour l\'ajouter à ta boite de vocabulaire et obtenir sa traduction dans ta langue maternelle.',
  },
  {
    icon: '📦',
    title: 'Boîte de vocabulaire',
    text: 'Depuis le détail d\'un mot, glisse-le vers le bas pour le sauvegarder. Retrouve tous tes mots dans l\'onglet Vocabulaire.',
  },
  {
    icon: '📅',
    title: 'Suis ta progression',
    text: 'Le calendrier trace tous tes textes lus. Vert = terminé, contour = disponible. Clique sur un jour passé pour relire son texte.',
  },
]

export default function HelpModal({ onClose }: { onClose: () => void }) {
  const [step, setStep] = useState(0)
  const slide = SLIDES[step]
  const isLast = step === SLIDES.length - 1

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm px-6">
      <div className="bg-surface rounded-3xl w-full max-w-sm border border-surface-raised slide-up overflow-hidden">
        {/* Close */}
        <div className="flex justify-end px-5 pt-5">
          <button
            onClick={onClose}
            className="text-text-secondary hover:text-text-primary transition-colors text-xl leading-none"
            aria-label="Fermer"
          >
            ✕
          </button>
        </div>

        {/* Slide */}
        <div className="px-8 pb-4 text-center">
          <p className="text-5xl mb-5">{slide.icon}</p>
          <h3
            className="text-xl font-light text-text-primary mb-3"
            style={{ fontFamily: 'Georgia, serif' }}
          >
            {slide.title}
          </h3>
          <p className="text-text-secondary text-sm leading-relaxed min-h-[72px]">
            {slide.text}
          </p>
        </div>

        {/* Dots */}
        <div className="flex justify-center gap-1.5 pb-6">
          {SLIDES.map((_, i) => (
            <button
              key={i}
              onClick={() => setStep(i)}
              className={`rounded-full transition-all duration-200 ${
                i === step ? 'w-5 h-1.5 bg-accent' : 'w-1.5 h-1.5 bg-surface-raised'
              }`}
            />
          ))}
        </div>

        {/* Nav buttons */}
        <div className="flex gap-2 px-6 pb-7">
          {step > 0 && (
            <button
              onClick={() => setStep((s) => s - 1)}
              className="flex-1 py-3 rounded-2xl border border-surface-raised
                         text-text-secondary text-sm hover:text-text-primary transition-colors"
            >
              ← Précédent
            </button>
          )}
          <button
            onClick={() => (isLast ? onClose() : setStep((s) => s + 1))}
            className="flex-1 py-3 rounded-2xl bg-accent text-white text-sm font-medium
                       hover:bg-accent-light transition-colors active:scale-95"
          >
            {isLast ? 'Commencer ✓' : 'Suivant →'}
          </button>
        </div>
      </div>
    </div>
  )
}
