'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import {
  Plus,
  UserPlus,
  Search,
  MapPin,
  Video,
  Users,
  FolderOpen,
  X,
  BookOpen,
} from 'lucide-react'
import AppShell from '@/components/layout/AppShell'
import LoadingSkeleton from '@/components/common/LoadingSkeleton'
import { Class } from '@/lib/types'
import { formatDate } from '@/lib/utils'

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: 'easeOut' } },
}

export default function ClassesPage() {
  const router = useRouter()
  const [userId, setUserId] = useState<string | null>(null)
  const [classes, setClasses] = useState<Class[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [locationFilter, setLocationFilter] = useState('')
  const [tab, setTab] = useState<'my' | 'joined'>('my')
  const [joinModalOpen, setJoinModalOpen] = useState(false)
  const [joinCode, setJoinCode] = useState('')
  const [joinLoading, setJoinLoading] = useState(false)
  const [joinError, setJoinError] = useState('')

  useEffect(() => {
    const uid = 'test-user-id'
    setUserId(uid)
    fetchClasses(uid)
  }, [])

  const fetchClasses = async (uid: string) => {
    setLoading(true)
    const res = await fetch(`/api/classes?user_id=${uid}`)
    const data = await res.json()
    setClasses(Array.isArray(data) ? data : [])
    setLoading(false)
  }

  const handleJoin = async () => {
    if (!userId || joinCode.length < 1) return
    setJoinLoading(true)
    setJoinError('')

    try {
      const res = await fetch('/api/classes/join', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: joinCode, user_id: userId }),
      })

      const data = await res.json()

      if (!res.ok) {
        setJoinError(data.error || 'Failed to join class')
        setJoinLoading(false)
        return
      }

      setJoinModalOpen(false)
      setJoinCode('')
      await fetchClasses(userId)
    } catch {
      setJoinError('Something went wrong')
    }
    setJoinLoading(false)
  }

  const filteredClasses = classes.filter((cls) => {
    const matchSearch =
      !search ||
      cls.name.toLowerCase().includes(search.toLowerCase()) ||
      cls.subject.toLowerCase().includes(search.toLowerCase())
    const matchLocation =
      !locationFilter ||
      (cls.location && cls.location.toLowerCase().includes(locationFilter.toLowerCase()))

    if (tab === 'my') {
      return matchSearch && matchLocation && cls.creator_id === userId
    }
    return matchSearch && matchLocation && cls.creator_id !== userId
  })

  if (loading) {
    return (
      <AppShell>
        <div className="p-6 md:p-8 space-y-6">
          <LoadingSkeleton variant="text" count={2} />
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <LoadingSkeleton variant="card" count={1} />
            <LoadingSkeleton variant="card" count={1} />
            <LoadingSkeleton variant="card" count={1} />
          </div>
        </div>
      </AppShell>
    )
  }

  return (
    <AppShell>
      <div className="p-6 md:p-8 space-y-6">
        {/* Header */}
        <motion.div variants={fadeUp} initial="hidden" animate="visible">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold">My Classes</h1>
              <p className="text-sm text-[var(--muted)] mt-1">
                Organize your classrooms, materials, and live sessions in one place.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setJoinModalOpen(true)}
                className="btn-outline text-sm flex items-center gap-1.5"
              >
                <UserPlus className="w-4 h-4" />
                Join Class
              </button>
              <Link
                href="/classes/create"
                className="btn-primary text-sm flex items-center gap-1.5"
              >
                <Plus className="w-4 h-4" />
                Create Class
              </Link>
            </div>
          </div>
        </motion.div>

        {/* Filters */}
        <motion.div
          variants={fadeUp}
          initial="hidden"
          animate="visible"
          className="flex flex-col sm:flex-row gap-3"
        >
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--muted)]" />
            <input
              type="text"
              placeholder="Search classes..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="input-field pl-10"
            />
          </div>
          <div className="relative flex-1 sm:max-w-[240px]">
            <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--muted)]" />
            <input
              type="text"
              placeholder="Filter by location..."
              value={locationFilter}
              onChange={(e) => setLocationFilter(e.target.value)}
              className="input-field pl-10"
            />
          </div>
        </motion.div>

        {/* Tabs */}
        <motion.div
          variants={fadeUp}
          initial="hidden"
          animate="visible"
          className="flex items-center gap-1 p-1 rounded-xl bg-gray-100 dark:bg-gray-800/50 w-fit"
        >
          <button
            onClick={() => setTab('my')}
            className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-all ${
              tab === 'my'
                ? 'bg-cyan-500 text-white shadow-sm'
                : 'text-[var(--muted)] hover:text-[var(--foreground)]'
            }`}
          >
            My Classes
          </button>
          <button
            onClick={() => setTab('joined')}
            className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-all ${
              tab === 'joined'
                ? 'bg-cyan-500 text-white shadow-sm'
                : 'text-[var(--muted)] hover:text-[var(--foreground)]'
            }`}
          >
            Joined Classes
          </button>
        </motion.div>

        {/* Class Grid */}
        {filteredClasses.length > 0 ? (
          <motion.div
            variants={fadeUp}
            initial="hidden"
            animate="visible"
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
          >
            {filteredClasses.map((cls, i) => (
              <motion.div
                key={cls.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                className="glass-card overflow-hidden hover:shadow-lg transition-shadow"
              >
                <div
                  className="h-1.5 rounded-t-2xl"
                  style={{ background: cls.color || '#0EA5E9' }}
                />
                <div className="p-5">
                  <div className="flex items-center gap-2">
                    <span className="text-xs px-2 py-0.5 rounded-full bg-cyan-100 dark:bg-cyan-900/30 text-cyan-700 dark:text-cyan-300">
                      {cls.subject}
                    </span>
                    <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 font-mono">
                      {cls.code}
                    </span>
                  </div>
                  <h3 className="font-semibold text-base mt-2">{cls.name}</h3>
                  <div className="flex items-center gap-2 mt-2">
                    <div
                      className="w-6 h-6 rounded-full flex items-center justify-center text-white text-[10px] font-bold"
                      style={{ background: cls.color || '#0EA5E9' }}
                    >
                      {(cls.creator_name || '?')[0].toUpperCase()}
                    </div>
                    <span className="text-xs text-[var(--muted)]">
                      {cls.creator_name || 'Unknown'} &middot; Created{' '}
                      {formatDate(cls.created_at)}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 mt-3">
                    <span className="text-xs px-2 py-0.5 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 flex items-center gap-1">
                      <Users className="w-3 h-3" />
                      {cls.member_count || 0}
                    </span>
                    <span className="text-xs px-2 py-0.5 rounded-full bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300 flex items-center gap-1">
                      <FolderOpen className="w-3 h-3" />
                      {cls.file_count || 0}
                    </span>
                  </div>
                  {cls.description && (
                    <p className="text-sm text-[var(--muted)] line-clamp-2 mt-2">
                      {cls.description}
                    </p>
                  )}
                  <div className="flex items-center gap-2 mt-4">
                    {cls.meet_link && (
                      <a
                        href={cls.meet_link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="btn-outline text-xs px-3 py-1.5 flex items-center gap-1.5"
                      >
                        <Video className="w-3.5 h-3.5" />
                        Meet link
                      </a>
                    )}
                    <Link
                      href={`/classes/${cls.id}`}
                      className="btn-primary text-xs px-3 py-1.5 flex items-center gap-1.5"
                    >
                      Enter Class
                    </Link>
                  </div>
                </div>
              </motion.div>
            ))}
          </motion.div>
        ) : (
          <motion.div
            variants={fadeUp}
            initial="hidden"
            animate="visible"
            className="glass-card p-12 text-center"
          >
            <div className="w-16 h-16 mx-auto rounded-full border-2 border-dashed border-[var(--border)] flex items-center justify-center">
              <BookOpen className="w-7 h-7 text-[var(--muted)] opacity-50" />
            </div>
            <p className="font-medium mt-4">No classes found</p>
            <p className="text-sm text-[var(--muted)] mt-1">
              Create a class or join one with a code to get started.
            </p>
          </motion.div>
        )}

        {/* Join Class Modal */}
        <AnimatePresence>
          {joinModalOpen && (
            <>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 bg-black/50 z-50"
                onClick={() => setJoinModalOpen(false)}
              />
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                className="fixed inset-0 z-50 flex items-center justify-center p-4"
                onClick={(e) => e.target === e.currentTarget && setJoinModalOpen(false)}
              >
                <div className="glass-card p-6 w-full max-w-md" onClick={(e) => e.stopPropagation()}>
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold">Join a class</h3>
                    <button
                      onClick={() => setJoinModalOpen(false)}
                      className="p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>
                  <p className="text-sm text-[var(--muted)] mb-4">
                    Enter the 6-character class code shared by your teacher or classmate.
                  </p>
                  <input
                    type="text"
                    value={joinCode}
                    onChange={(e) => setJoinCode(e.target.value.toUpperCase().slice(0, 6))}
                    placeholder="ABC123"
                    className="input-field text-center text-xl font-mono tracking-[0.3em] uppercase"
                    maxLength={6}
                  />
                  {joinError && (
                    <p className="text-sm text-red-500 mt-2">{joinError}</p>
                  )}
                  <div className="flex items-center gap-3 mt-6">
                    <button
                      onClick={() => {
                        setJoinModalOpen(false)
                        setJoinCode('')
                        setJoinError('')
                      }}
                      className="btn-outline flex-1 text-sm"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleJoin}
                      disabled={joinCode.length < 1 || joinLoading}
                      className="btn-primary flex-1 text-sm disabled:opacity-50"
                    >
                      {joinLoading ? 'Joining...' : 'Join'}
                    </button>
                  </div>
                </div>
              </motion.div>
            </>
          )}
        </AnimatePresence>
      </div>
    </AppShell>
  )
}
