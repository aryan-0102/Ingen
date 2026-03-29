'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useRouter } from 'next/navigation'
import {
  Sparkles,
  Plus,
  BookOpen,
  RotateCcw,
  Check,
  X,
  Loader2,
  ChevronLeft,
  ChevronRight,
  Library,
  Layers,
  Trophy,
  Trash2,
  PenLine,
} from 'lucide-react'
import AppShell from '@/components/layout/AppShell'
import LoadingSkeleton from '@/components/common/LoadingSkeleton'
import { FlashcardDeck, Flashcard, LibraryFile } from '@/lib/types'
import { formatDate } from '@/lib/utils'

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.06, duration: 0.4, ease: 'easeOut' },
  }),
}

interface DeckWithCount extends FlashcardDeck {
  card_count?: number
}

export default function FlashcardsPage() {
  const router = useRouter()
  const [userId, setUserId] = useState<string | null>(null)
  const [decks, setDecks] = useState<DeckWithCount[]>([])
  const [libraryFiles, setLibraryFiles] = useState<LibraryFile[]>([])
  const [loading, setLoading] = useState(true)
  const [generating, setGenerating] = useState(false)

  // Generate form
  const [genContent, setGenContent] = useState('')
  const [genTitle, setGenTitle] = useState('')
  const [selectedFileId, setSelectedFileId] = useState('')

  // Study mode
  const [studyDeck, setStudyDeck] = useState<FlashcardDeck | null>(null)
  const [studyCards, setStudyCards] = useState<Flashcard[]>([])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [flipped, setFlipped] = useState(false)
  const [known, setKnown] = useState<Set<string>>(new Set())
  const [review, setReview] = useState<Set<string>>(new Set())
  const [studyComplete, setStudyComplete] = useState(false)
  const [cardsLoading, setCardsLoading] = useState(false)

  // Manual deck creation
  const [showCreateDeck, setShowCreateDeck] = useState(false)
  const [createTitle, setCreateTitle] = useState('')
  const [manualCards, setManualCards] = useState([{ front: '', back: '' }])
  const [creatingDeck, setCreatingDeck] = useState(false)
  const [confirmDeleteDeck, setConfirmDeleteDeck] = useState<string | null>(null)

  useEffect(() => {
    const init = async () => {
      const uid = 'test-user-id'
      setUserId(uid)

      const [decksRes, filesRes] = await Promise.all([
        fetch(`/api/flashcards?user_id=${uid}`),
        fetch(`/api/library?user_id=${uid}`),
      ])

      const [decksData, filesData] = await Promise.all([
        decksRes.json(),
        filesRes.json(),
      ])

      setDecks(Array.isArray(decksData) ? decksData : [])
      setLibraryFiles(Array.isArray(filesData) ? filesData : [])
      setLoading(false)
    }
    init()
  }, [])

  const handleGenerate = async () => {
    if (!userId || (!genContent.trim() && !selectedFileId)) return
    setGenerating(true)

    try {
      const res = await fetch('/api/flashcards/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: userId,
          content: genContent.trim(),
          title: genTitle.trim() || 'Generated Deck',
          file_id: selectedFileId || undefined,
        }),
      })

      if (res.ok) {
        const decksRes = await fetch(`/api/flashcards?user_id=${userId}`)
        const decksData = await decksRes.json()
        setDecks(Array.isArray(decksData) ? decksData : [])
        setGenContent('')
        setGenTitle('')
        setSelectedFileId('')
      } else {
        const err = await res.json()
        console.error('Generate error:', err)
      }
    } catch {}
    setGenerating(false)
  }

  const handleCreateDeck = async () => {
    if (!userId || !createTitle.trim()) return
    setCreatingDeck(true)
    const validCards = manualCards.filter((c) => c.front.trim() && c.back.trim())
    const res = await fetch('/api/flashcards', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        user_id: userId,
        title: createTitle.trim(),
        cards: validCards,
      }),
    })
    if (res.ok) {
      const decksRes = await fetch(`/api/flashcards?user_id=${userId}`)
      const decksData = await decksRes.json()
      setDecks(Array.isArray(decksData) ? decksData : [])
      setShowCreateDeck(false)
      setCreateTitle('')
      setManualCards([{ front: '', back: '' }])
    }
    setCreatingDeck(false)
  }

  const handleDeleteDeck = async (id: string) => {
    await fetch(`/api/flashcards/${id}`, { method: 'DELETE' })
    setDecks((prev) => prev.filter((d) => d.id !== id))
    setConfirmDeleteDeck(null)
  }

  const startStudy = async (deck: DeckWithCount) => {
    setCardsLoading(true)
    setStudyDeck(deck)
    setCurrentIndex(0)
    setFlipped(false)
    setKnown(new Set())
    setReview(new Set())
    setStudyComplete(false)

    try {
      const res = await fetch(`/api/flashcards?deck_id=${deck.id}`)
      const data = await res.json()
      const cards = Array.isArray(data) ? data : data.cards || []
      setStudyCards(cards)
    } catch {
      setStudyCards([])
    }
    setCardsLoading(false)
  }

  const exitStudy = () => {
    setStudyDeck(null)
    setStudyCards([])
    setStudyComplete(false)
  }

  const markKnown = () => {
    const card = studyCards[currentIndex]
    if (card) {
      setKnown((prev) => new Set(prev).add(card.id))
      setReview((prev) => {
        const next = new Set(prev)
        next.delete(card.id)
        return next
      })
    }
    nextCard()
  }

  const markReview = () => {
    const card = studyCards[currentIndex]
    if (card) {
      setReview((prev) => new Set(prev).add(card.id))
      setKnown((prev) => {
        const next = new Set(prev)
        next.delete(card.id)
        return next
      })
    }
    nextCard()
  }

  const nextCard = () => {
    setFlipped(false)
    if (currentIndex + 1 >= studyCards.length) {
      setStudyComplete(true)
    } else {
      setCurrentIndex((prev) => prev + 1)
    }
  }

  const mastery = studyCards.length > 0 ? Math.round((known.size / studyCards.length) * 100) : 0

  if (loading) {
    return (
      <AppShell>
        <div className="p-6 md:p-8 space-y-6">
          <LoadingSkeleton variant="text" count={2} />
          <LoadingSkeleton variant="card" count={3} />
        </div>
      </AppShell>
    )
  }

  // Study Mode View
  if (studyDeck) {
    if (cardsLoading) {
      return (
        <AppShell>
          <div className="p-6 md:p-8 flex items-center justify-center min-h-[60vh]">
            <Loader2 className="w-8 h-8 text-cyan-500 animate-spin" />
          </div>
        </AppShell>
      )
    }

    if (studyCards.length === 0) {
      return (
        <AppShell>
          <div className="p-6 md:p-8 text-center">
            <p className="text-sm text-[var(--muted)]">No cards in this deck.</p>
            <button onClick={exitStudy} className="btn-primary text-sm mt-4">
              Back to Decks
            </button>
          </div>
        </AppShell>
      )
    }

    if (studyComplete) {
      return (
        <AppShell>
          <div className="p-6 md:p-8 max-w-lg mx-auto">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="glass-card p-8 text-center"
            >
              <div className="w-16 h-16 rounded-full bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center mx-auto mb-4">
                <Trophy className="w-7 h-7 text-white" />
              </div>
              <h2 className="text-xl font-bold">Session Complete!</h2>
              <p className="text-sm text-[var(--muted)] mt-1">{studyDeck.title}</p>

              <div className="grid grid-cols-3 gap-4 mt-6">
                <div className="glass-card p-3">
                  <p className="text-2xl font-bold text-green-500">{known.size}</p>
                  <p className="text-[10px] text-[var(--muted)]">Known</p>
                </div>
                <div className="glass-card p-3">
                  <p className="text-2xl font-bold text-amber-500">{review.size}</p>
                  <p className="text-[10px] text-[var(--muted)]">Review</p>
                </div>
                <div className="glass-card p-3">
                  <p className="text-2xl font-bold text-cyan-500">{mastery}%</p>
                  <p className="text-[10px] text-[var(--muted)]">Mastery</p>
                </div>
              </div>

              <div className="flex gap-3 mt-6">
                <button
                  onClick={() => {
                    setCurrentIndex(0)
                    setFlipped(false)
                    setKnown(new Set())
                    setReview(new Set())
                    setStudyComplete(false)
                  }}
                  className="btn-outline flex-1 text-sm flex items-center justify-center gap-1.5"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  Study Again
                </button>
                <button onClick={exitStudy} className="btn-primary flex-1 text-sm">
                  Back to Decks
                </button>
              </div>
            </motion.div>
          </div>
        </AppShell>
      )
    }

    const currentCard = studyCards[currentIndex]

    return (
      <AppShell>
        <div className="p-6 md:p-8 max-w-lg mx-auto">
          {/* Study Header */}
          <div className="flex items-center justify-between mb-6">
            <button
              onClick={exitStudy}
              className="text-sm text-[var(--muted)] hover:text-[var(--foreground)] flex items-center gap-1 transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
              Exit
            </button>
            <p className="text-sm font-medium">
              {currentIndex + 1} / {studyCards.length}
            </p>
          </div>

          {/* Progress Bar */}
          <div className="w-full h-1.5 bg-gray-200 dark:bg-gray-700 rounded-full mb-6 overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-300"
              style={{
                width: `${((currentIndex + 1) / studyCards.length) * 100}%`,
                background: 'linear-gradient(135deg, #06b6d4, #2563eb)',
              }}
            />
          </div>

          {/* Flashcard with 3D Flip */}
          <div
            className="relative w-full aspect-[3/2] cursor-pointer"
            style={{ perspective: '1000px' }}
            onClick={() => setFlipped(!flipped)}
          >
            <motion.div
              className="absolute inset-0 w-full h-full"
              style={{ transformStyle: 'preserve-3d' }}
              animate={{ rotateY: flipped ? 180 : 0 }}
              transition={{ duration: 0.5, ease: 'easeInOut' }}
            >
              {/* Front */}
              <div
                className="absolute inset-0 w-full h-full glass-card flex flex-col items-center justify-center p-6 text-center"
                style={{ backfaceVisibility: 'hidden' }}
              >
                <p className="text-[10px] uppercase tracking-wider text-cyan-500 font-medium mb-3">Question</p>
                <p className="text-base font-medium leading-relaxed">{currentCard.front}</p>
                <p className="text-[10px] text-[var(--muted)] mt-4">Tap to flip</p>
              </div>

              {/* Back */}
              <div
                className="absolute inset-0 w-full h-full glass-card flex flex-col items-center justify-center p-6 text-center"
                style={{ backfaceVisibility: 'hidden', transform: 'rotateY(180deg)' }}
              >
                <p className="text-[10px] uppercase tracking-wider text-green-500 font-medium mb-3">Answer</p>
                <p className="text-base font-medium leading-relaxed">{currentCard.back}</p>
                <p className="text-[10px] text-[var(--muted)] mt-4">Tap to flip back</p>
              </div>
            </motion.div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 mt-6">
            <button
              onClick={markReview}
              className="btn-outline flex-1 text-sm flex items-center justify-center gap-1.5 text-amber-500 border-amber-200 dark:border-amber-800 hover:bg-amber-50 dark:hover:bg-amber-900/20"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              Review again
            </button>
            <button
              onClick={markKnown}
              className="btn-primary flex-1 text-sm flex items-center justify-center gap-1.5 bg-green-500 hover:bg-green-600"
            >
              <Check className="w-3.5 h-3.5" />
              Know it
            </button>
          </div>

          {/* Mastery */}
          <div className="mt-4 text-center">
            <p className="text-xs text-[var(--muted)]">
              Mastery: <span className="font-medium text-cyan-500">{mastery}%</span>
            </p>
          </div>
        </div>
      </AppShell>
    )
  }

  // Main Decks View
  return (
    <AppShell>
      <div className="p-6 md:p-8 space-y-6">
        {/* Header */}
        <motion.div custom={0} variants={fadeUp} initial="hidden" animate="visible">
          <h1 className="text-2xl font-bold">Flashcards</h1>
          <p className="text-sm text-[var(--muted)] mt-1">
            Generate AI-powered flashcards from your notes or create them manually.
          </p>
        </motion.div>

        {/* Create Manually Button */}
        <motion.div custom={1} variants={fadeUp} initial="hidden" animate="visible">
          <button
            onClick={() => setShowCreateDeck(!showCreateDeck)}
            className="btn-outline flex items-center gap-2 text-sm"
          >
            <PenLine className="w-4 h-4" />
            {showCreateDeck ? 'Cancel' : 'Create Deck Manually'}
          </button>
        </motion.div>

        {/* Manual Create Form */}
        <AnimatePresence>
          {showCreateDeck && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="overflow-hidden"
            >
              <div className="glass-card p-5 space-y-3">
                <h2 className="font-semibold">New Deck</h2>
                <input
                  type="text"
                  placeholder="Deck title"
                  value={createTitle}
                  onChange={(e) => setCreateTitle(e.target.value)}
                  className="input-field"
                />
                <div className="space-y-2">
                  {manualCards.map((card, i) => (
                    <div key={i} className="grid grid-cols-2 gap-2">
                      <input
                        type="text"
                        placeholder={`Card ${i + 1} Front`}
                        value={card.front}
                        onChange={(e) => setManualCards((prev) => prev.map((c, j) => j === i ? { ...c, front: e.target.value } : c))}
                        className="input-field text-sm"
                      />
                      <input
                        type="text"
                        placeholder={`Card ${i + 1} Back`}
                        value={card.back}
                        onChange={(e) => setManualCards((prev) => prev.map((c, j) => j === i ? { ...c, back: e.target.value } : c))}
                        className="input-field text-sm"
                      />
                    </div>
                  ))}
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => setManualCards((prev) => [...prev, { front: '', back: '' }])}
                    className="btn-outline text-xs flex items-center gap-1"
                  >
                    <Plus className="w-3.5 h-3.5" /> Add Card
                  </button>
                  <button
                    onClick={handleCreateDeck}
                    disabled={creatingDeck || !createTitle.trim()}
                    className="btn-primary text-sm flex items-center gap-1.5 disabled:opacity-50"
                  >
                    {creatingDeck ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                    {creatingDeck ? 'Creating...' : 'Create Deck'}
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Generate Section */}
        <motion.div custom={1} variants={fadeUp} initial="hidden" animate="visible" className="glass-card p-5">
          <div className="flex items-center gap-2 mb-1">
            <Sparkles className="w-4 h-4 text-cyan-500" />
            <h2 className="font-semibold">Generate with AI</h2>
          </div>
          <p className="text-xs text-[var(--muted)] mb-4">
            Paste your notes or select a file from your library to auto-generate flashcards.
          </p>

          <div className="space-y-3">
            <input
              type="text"
              value={genTitle}
              onChange={(e) => setGenTitle(e.target.value)}
              placeholder="Deck title (e.g. Chapter 5 Review)"
              className="input-field"
            />

            {libraryFiles.length > 0 && (
              <div className="relative">
                <Library className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--muted)]" />
                <select
                  value={selectedFileId}
                  onChange={(e) => setSelectedFileId(e.target.value)}
                  className="input-field pl-10"
                >
                  <option value="">Select from Library (optional)</option>
                  {libraryFiles.map((f) => (
                    <option key={f.id} value={f.id}>
                      {f.file_name}
                    </option>
                  ))}
                </select>
              </div>
            )}

            <textarea
              value={genContent}
              onChange={(e) => setGenContent(e.target.value)}
              placeholder="Paste your notes here..."
              rows={4}
              className="input-field resize-y min-h-[100px]"
            />

            <button
              onClick={handleGenerate}
              disabled={generating || (!genContent.trim() && !selectedFileId)}
              className="btn-primary w-full text-sm flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {generating ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  Generate Flashcards
                </>
              )}
            </button>
          </div>
        </motion.div>

        {/* Decks Grid */}
        <motion.div custom={2} variants={fadeUp} initial="hidden" animate="visible">
          <div className="flex items-center gap-2 mb-3">
            <Layers className="w-4 h-4 text-cyan-500" />
            <h2 className="font-semibold">My Decks</h2>
            <span className="text-xs text-[var(--muted)]">({decks.length})</span>
          </div>

          {decks.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {decks.map((deck, i) => (
                <motion.div
                  key={deck.id}
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                  className="glass-card p-4 hover:shadow-lg transition-shadow"
                >
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center flex-shrink-0">
                      <BookOpen className="w-4 h-4 text-white" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm truncate">{deck.title}</p>
                      <p className="text-xs text-[var(--muted)]">
                        {deck.card_count || 0} cards &middot; {formatDate(deck.created_at)}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => startStudy(deck)}
                    className="btn-primary flex-1 text-xs mt-3 flex items-center justify-center gap-1.5"
                  >
                    <BookOpen className="w-3.5 h-3.5" />
                    Study
                  </button>
                  {confirmDeleteDeck === deck.id ? (
                    <div className="flex gap-1 mt-3">
                      <button onClick={() => handleDeleteDeck(deck.id)} className="text-xs px-2 py-1.5 rounded-lg bg-red-100 dark:bg-red-900/30 text-red-600 font-medium flex-1">Confirm</button>
                      <button onClick={() => setConfirmDeleteDeck(null)} className="text-xs px-2 py-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 flex-1">Cancel</button>
                    </div>
                  ) : (
                    <button
                      onClick={() => setConfirmDeleteDeck(deck.id)}
                      className="btn-outline text-xs mt-3 w-full flex items-center justify-center gap-1.5 text-red-500 border-red-200 dark:border-red-800 hover:bg-red-50 dark:hover:bg-red-900/20"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      Delete
                    </button>
                  )}
                </motion.div>
              ))}
            </div>
          ) : (
            <div className="glass-card p-12 text-center">
              <Layers className="w-10 h-10 mx-auto text-[var(--muted)] opacity-50" />
              <p className="font-medium mt-3">No decks yet</p>
              <p className="text-sm text-[var(--muted)] mt-1">
                Generate your first deck from notes above.
              </p>
            </div>
          )}
        </motion.div>
      </div>
    </AppShell>
  )
}
