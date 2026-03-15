'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { ArrowLeft, MapPin, Video } from 'lucide-react'
import AppShell from '@/components/layout/AppShell'
import { getSupabase } from '@/lib/supabase/client'
import { SUBJECTS, CLASS_COLORS } from '@/lib/utils'

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: 'easeOut' } },
}

export default function CreateClassPage() {
  const router = useRouter()
  const [userId, setUserId] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const [name, setName] = useState('')
  const [subject, setSubject] = useState('')
  const [description, setDescription] = useState('')
  const [location, setLocation] = useState('')
  const [meetLink, setMeetLink] = useState('')
  const [visibility, setVisibility] = useState<'public' | 'private'>('public')

  useEffect(() => {
    const init = async () => {
      const {
        data: { session },
      } = await getSupabase().auth.getSession()

      if (!session?.user) {
        router.push('/login')
        return
      }

      setUserId(session.user.id)
    }

    init()
  }, [router])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!userId || !name || !subject) return

    setLoading(true)
    setError('')

    try {
      const color = CLASS_COLORS[Math.floor(Math.random() * CLASS_COLORS.length)]

      const res = await fetch('/api/classes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          subject,
          description: description || null,
          location: location || null,
          meet_link: meetLink || null,
          visibility,
          color,
          user_id: userId,
        }),
      })

      const data = await res.json()

      if (!res.ok) {
        setError(data.error || 'Failed to create class')
        setLoading(false)
        return
      }

      router.push(`/classes/${data.id}`)
    } catch {
      setError('Something went wrong')
      setLoading(false)
    }
  }

  return (
    <AppShell>
      <div className="p-6 md:p-8 max-w-2xl mx-auto">
        <motion.div variants={fadeUp} initial="hidden" animate="visible">
          <Link
            href="/classes"
            className="text-sm text-[var(--muted)] hover:text-[var(--foreground)] flex items-center gap-1.5 mb-6 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to classes
          </Link>

          <div className="glass-card p-6 md:p-8">
            <h1 className="text-xl font-bold">Create a Class</h1>
            <p className="text-sm text-[var(--muted)] mt-1">
              Set up your class shell to organize members and host meetings.
            </p>

            <form onSubmit={handleSubmit} className="mt-6 space-y-5">
              {/* Class Name */}
              <div>
                <label className="text-sm font-medium mb-1.5 block">
                  Class Name
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Advanced Mathematics"
                  className="input-field"
                  required
                />
              </div>

              {/* Subject */}
              <div>
                <label className="text-sm font-medium mb-1.5 block">
                  Subject
                </label>
                <select
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  className="input-field"
                  required
                >
                  <option value="">Select a subject...</option>
                  {SUBJECTS.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
              </div>

              {/* Description */}
              <div>
                <label className="text-sm font-medium mb-1.5 block">
                  Description
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Describe what students will learn..."
                  className="input-field min-h-[100px] resize-y"
                  rows={3}
                />
              </div>

              {/* Location */}
              <div>
                <label className="text-sm font-medium mb-1.5 block">
                  Location
                </label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--muted)]" />
                  <input
                    type="text"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    placeholder="e.g. Room 101, Central Campus"
                    className="input-field pl-10"
                  />
                </div>
              </div>

              {/* Meet Link */}
              <div>
                <label className="text-sm font-medium mb-1.5 block">
                  Google Meet / Zoom Link
                </label>
                <div className="relative">
                  <Video className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--muted)]" />
                  <input
                    type="url"
                    value={meetLink}
                    onChange={(e) => setMeetLink(e.target.value)}
                    placeholder="https://meet.google.com/..."
                    className="input-field pl-10"
                  />
                </div>
              </div>

              {/* Visibility */}
              <div>
                <label className="text-sm font-medium mb-1.5 block">
                  Visibility
                </label>
                <div className="flex items-center gap-1 p-1 rounded-xl bg-gray-100 dark:bg-gray-800/50 w-fit">
                  <button
                    type="button"
                    onClick={() => setVisibility('public')}
                    className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-all ${
                      visibility === 'public'
                        ? 'bg-cyan-500 text-white shadow-sm'
                        : 'text-[var(--muted)] hover:text-[var(--foreground)]'
                    }`}
                  >
                    Public
                  </button>
                  <button
                    type="button"
                    onClick={() => setVisibility('private')}
                    className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-all ${
                      visibility === 'private'
                        ? 'bg-cyan-500 text-white shadow-sm'
                        : 'text-[var(--muted)] hover:text-[var(--foreground)]'
                    }`}
                  >
                    Private
                  </button>
                </div>
              </div>

              {error && (
                <p className="text-sm text-red-500">{error}</p>
              )}

              <button
                type="submit"
                disabled={loading || !name || !subject}
                className="btn-primary w-full text-sm disabled:opacity-50"
              >
                {loading ? 'Creating...' : 'Create Class'}
              </button>
            </form>
          </div>
        </motion.div>
      </div>
    </AppShell>
  )
}
