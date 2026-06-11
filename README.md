# LexiFlow

Une PWA Next.js 14 pour apprendre le vocabulaire via un texte quotidien défilant.

---

## Prérequis

- **Node.js 20+** — [nodejs.org](https://nodejs.org)
- **Compte Supabase** (gratuit) — [supabase.com](https://supabase.com)
- **Google AI Studio** (pour la génération des textes) — [aistudio.google.com](https://aistudio.google.com)

---

## 1. Installation

```bash
git clone <your-repo-url>
cd lexiflow
npm install
```

---

## 2. Variables d'environnement

```bash
cp .env.local.example .env.local
```

Remplissez `.env.local` :

```env
NEXT_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
```

Trouvez ces valeurs dans **Supabase Dashboard → Settings → API**.

---

## 3. Migration Supabase

1. Ouvrez [supabase.com](https://supabase.com) → votre projet → **SQL Editor**
2. Copiez le contenu de `supabase/migrations/001_init.sql`
3. Collez et cliquez **Run**

Cela crée les tables `profiles`, `daily_texts`, `reading_progress`, `vocabulary_box` avec RLS activé.

---

## 4. Génération des icônes PWA

Les icônes PNG sont requises pour l'installation PWA.

```bash
npm install --save-dev sharp
node scripts/generate-icons.js
```

Cela génère `public/icons/icon-192x192.png` et `icon-512x512.png` à partir du SVG.

---

## 5. Lancement local

```bash
npm run dev
```

Ouvrez [http://localhost:3000](http://localhost:3000).

> Le service worker PWA est désactivé en développement (`disable: NODE_ENV === 'development'`).
> Pour tester la PWA complète : `npm run build && npm start`.

---

## 6. Déploiement Vercel

1. Poussez votre dépôt sur GitHub
2. Importez le projet sur [vercel.com](https://vercel.com)
3. Dans **Settings → Environment Variables**, ajoutez :
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
4. Déployez — Vercel détecte automatiquement Next.js

---

## 7. Setup du cron job de génération

Le script `scripts/generate-texts.js` génère les textes du mois suivant en appelant Gemini.
Il est déclenché automatiquement le dernier jour de chaque mois via GitHub Actions.

### Ajouter les secrets GitHub

Dans votre dépôt GitHub → **Settings → Secrets and variables → Actions** → **New repository secret** :

| Nom | Valeur |
|-----|--------|
| `SUPABASE_URL` | URL de votre projet Supabase (sans `/rest/v1`) |
| `SUPABASE_SERVICE_KEY` | Clé `service_role` (dans Supabase → Settings → API) |
| `GEMINI_API_KEY` | Clé API depuis Google AI Studio |

### Tester manuellement

Dans GitHub → **Actions → Generate Monthly Texts → Run workflow**.

Cochez `force: true` pour ignorer la vérification du dernier jour du mois.

---

## Architecture

```
app/
  page.tsx              # Landing – redirige vers /today si connecté
  auth/page.tsx         # Connexion / Inscription
  onboarding/page.tsx   # Configuration initiale (3 étapes)
  today/page.tsx        # Texte du jour avec défilement
  calendar/page.tsx     # Grille mensuelle de lecture
  read/[date]/page.tsx  # Relecture d'un texte passé
  vocabulary/page.tsx   # Boîte à mots sauvegardés
  profile/page.tsx      # Préférences et statistiques

components/
  BottomNav.tsx         # Navigation fixe en bas (4 onglets)
  ScrollingText.tsx     # Texte défilant + contrôles + popups
  PopupPhrase.tsx       # Popup de phrase avec mots cliquables
  PopupMot.tsx          # Popup de mot avec bouton d'ajout

hooks/
  useAuth.ts            # Gestion de l'état d'authentification
  useSpeech.ts          # Web Speech API (fr-FR, en-US, es-ES)

scripts/
  generate-texts.js     # Génération mensuelle via Gemini
  generate-icons.js     # Conversion SVG → PNG pour la PWA
```

---

## Palette de couleurs

| Token | Valeur |
|-------|--------|
| `background` | `#0f0f1a` |
| `surface` | `#1a1a2e` |
| `surface-raised` | `#252540` |
| `accent` | `#6c63ff` |
| `accent-light` | `#8b85ff` |
| `success` | `#4ade80` |
| `text-primary` | `#e8e8f0` |
| `text-secondary` | `#9090a8` |
