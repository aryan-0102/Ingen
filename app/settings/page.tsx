'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useRouter } from 'next/navigation'
import {
  User,
  Palette,
  Link2,
  AlertTriangle,
  Save,
  Loader2,
  Sun,
  Moon,
  Check,
  Trash2,
  X,
} from 'lucide-react'
import AppShell from '@/components/layout/AppShell'
import LoadingSkeleton from '@/components/common/LoadingSkeleton'
import { Profile } from '@/lib/types'

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.08, duration: 0.4, ease: 'easeOut' },
  }),
}

export default function SettingsPage() {
  const router = useRouter()
  const [userId, setUserId] = useState<string | null>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [toastMsg, setToastMsg] = useState('')

  // Profile fields
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [role, setRole] = useState('student')

  // Appearance
  const [theme, setTheme] = useState<'dark' | 'light'>('dark')

  // Integrations
  const [calendarUrl, setCalendarUrl] = useState('')
  const [defaultMeetLink, setDefaultMeetLink] = useState('')

  // Danger zone
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [deleteConfirmText, setDeleteConfirmText] = useState('')

  useEffect(() => {
    const init = async () => {
      const uid = 'test-user-id'
      setUserId(uid)
      setEmail('admin@g')

      const res = await fetch(`/api/profile?user_id=${uid}`)
      const data = await res.json()

      if (data && !data.error) {
        setProfile(data)
        setFullName(data.full_name || '')
        setRole(data.role || 'student')
        if (data.google_calendar_url) setCalendarUrl(data.google_calendar_url)
        if (data.default_meet_link) setDefaultMeetLink(data.default_meet_link)
      }

      // Detect current theme
      const isDark = document.documentElement.classList.contains('dark')
      setTheme(isDark ? 'dark' : 'light')

      setLoading(false)
    }
    init()
  }, [])

  const showToast = (msg: string) => {
    setToastMsg(msg)
    setTimeout(() => setToastMsg(''), 3000)
  }

  const handleSaveProfile = async () => {
    if (!userId) return
    setSaving(true)

    try {
      const res = await fetch('/api/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: userId,
          full_name: fullName,
          role,
          google_calendar_url: calendarUrl || null,
          default_meet_link: defaultMeetLink || null,
        }),
      })

      if (res.ok) {
        showToast('Profile saved successfully!')
      } else {
        showToast('Failed to save profile.')
      }
    } catch {
      showToast('Error saving profile.')
    }
    setSaving(false)
  }

  const toggleTheme = (newTheme: 'dark' | 'light') => {
    setTheme(newTheme)
    if (newTheme === 'dark') {
      document.documentElement.classList.add('dark')
      localStorage.setItem('theme', 'dark')
    } else {
      document.documentElement.classList.remove('dark')
      localStorage.setItem('theme', 'light')
    }
  }

  const handleDeleteAccount = async () => {
    if (deleteConfirmText !== 'DELETE') return
    showToast('Account deletion is not available in demo mode.')
    setShowDeleteConfirm(false)
    setDeleteConfirmText('')
  }

  const initials = fullName
    ? fullName.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2)
    : email ? email[0].toUpperCase() : '?'

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

  return (
    <AppShell>
      <div className="p-6 md:p-8 space-y-6 max-w-3xl mx-auto">
        {/* Toast */}
        {toastMsg && (
          <div className="fixed top-4 right-4 z-[100] glass-card px-4 py-2 text-sm font-medium border-l-4 border-green-500 animate-in slide-in-from-right">
            {toastMsg}
          </div>
        )}

        {/* Header */}
        <motion.div custom={0} variants={fadeUp} initial="hidden" animate="visible">
          <h1 className="text-2xl font-bold">Settings</h1>
          <p className="text-sm text-[var(--muted)] mt-1">
            Manage your profile, appearance, and integrations.
          </p>
        </motion.div>

        {/* Profile Card */}
        <motion.div custom={1} variants={fadeUp} initial="hidden" animate="visible" className="glass-card p-5">
          <div className="flex items-center gap-2 mb-4">
            <User className="w-4 h-4 text-cyan-500" />
            <h2 className="font-semibold">Profile</h2>
          </div>

          <div className="flex flex-col sm:flex-row items-start gap-5">
            {/* Avatar */}
            <div className="w-20 h-20 rounded-full bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center flex-shrink-0">
              <span className="text-2xl font-bold text-white">{initials}</span>
            </div>

            <div className="flex-1 space-y-4 w-full">
              <div>
                <label className="text-sm font-medium mb-1.5 block">Full Name</label>
                <input
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="John Doe"
                  className="input-field"
                />
              </div>

              <div>
                <label className="text-sm font-medium mb-1.5 block">Email</label>
                <input
                  type="email"
                  value={email}
                  disabled
                  className="input-field opacity-60 cursor-not-allowed"
                />
                <p className="text-[10px] text-[var(--muted)] mt-1">Email cannot be changed here.</p>
              </div>

              <div>
                <label className="text-sm font-medium mb-1.5 block">Role</label>
                <div className="flex items-center gap-1 p-1 rounded-xl bg-gray-100 dark:bg-gray-800/50 w-fit">
                  {['student', 'teacher'].map((r) => (
                    <button
                      key={r}
                      type="button"
                      onClick={() => setRole(r)}
                      className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-all capitalize ${
                        role === r
                          ? 'bg-cyan-500 text-white shadow-sm'
                          : 'text-[var(--muted)] hover:text-[var(--foreground)]'
                      }`}
                    >
                      {r}
                    </button>
                  ))}
                </div>
              </div>

              <button
                onClick={handleSaveProfile}
                disabled={saving}
                className="btn-primary text-sm flex items-center gap-2 disabled:opacity-50"
              >
                {saving ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4" />
                    Save Profile
                  </>
                )}
              </button>
            </div>
          </div>
        </motion.div>

        {/* Appearance Card */}
        <motion.div custom={2} variants={fadeUp} initial="hidden" animate="visible" className="glass-card p-5">
          <div className="flex items-center gap-2 mb-4">
            <Palette className="w-4 h-4 text-cyan-500" />
            <h2 className="font-semibold">Appearance</h2>
          </div>

          <div className="grid grid-cols-2 gap-4">
            {/* Dark Theme Card */}
            <button
              onClick={() => toggleTheme('dark')}
              className={`relative rounded-xl border-2 p-4 transition-all ${
                theme === 'dark'
                  ? 'border-cyan-500 ring-2 ring-cyan-500/20'
                  : 'border-[var(--border)] hover:border-gray-400'
              }`}
            >
              {theme === 'dark' && (
                <div className="absolute top-2 right-2 w-5 h-5 rounded-full bg-cyan-500 flex items-center justify-center">
                  <Check className="w-3 h-3 text-white" />
                </div>
              )}
              <div className="w-full aspect-[16/10] rounded-lg bg-gray-900 border border-gray-700 mb-3 flex items-center justify-center">
                <Moon className="w-6 h-6 text-gray-400" />
              </div>
              <p className="text-sm font-medium">Dark</p>
              <p className="text-[10px] text-[var(--muted)]">Easy on the eyes</p>
            </button>

            {/* Light Theme Card */}
            <button
              onClick={() => toggleTheme('light')}
              className={`relative rounded-xl border-2 p-4 transition-all ${
                theme === 'light'
                  ? 'border-cyan-500 ring-2 ring-cyan-500/20'
                  : 'border-[var(--border)] hover:border-gray-400'
              }`}
            >
              {theme === 'light' && (
                <div className="absolute top-2 right-2 w-5 h-5 rounded-full bg-cyan-500 flex items-center justify-center">
                  <Check className="w-3 h-3 text-white" />
                </div>
              )}
              <div className="w-full aspect-[16/10] rounded-lg bg-white border border-gray-200 mb-3 flex items-center justify-center">
                <Sun className="w-6 h-6 text-amber-500" />
              </div>
              <p className="text-sm font-medium">Light</p>
              <p className="text-[10px] text-[var(--muted)]">Classic bright mode</p>
            </button>
          </div>
        </motion.div>

        {/* Integrations Card */}
        <motion.div custom={3} variants={fadeUp} initial="hidden" animate="visible" className="glass-card p-5">
          <div className="flex items-center gap-2 mb-4">
            <Link2 className="w-4 h-4 text-cyan-500" />
            <h2 className="font-semibold">Integrations</h2>
          </div>

          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium mb-1.5 block">Google Calendar URL</label>
              <input
                type="url"
                value={calendarUrl}
                onChange={(e) => setCalendarUrl(e.target.value)}
                placeholder="https://calendar.google.com/calendar/ical/..."
                className="input-field"
              />
              <p className="text-[10px] text-[var(--muted)] mt-1">
                Public iCal URL for calendar sync
              </p>
            </div>

            <div>
              <label className="text-sm font-medium mb-1.5 block">Default Meet Link</label>
              <input
                type="url"
                value={defaultMeetLink}
                onChange={(e) => setDefaultMeetLink(e.target.value)}
                placeholder="https://meet.google.com/..."
                className="input-field"
              />
              <p className="text-[10px] text-[var(--muted)] mt-1">
                Used when creating new classes
              </p>
            </div>

            <button
              onClick={handleSaveProfile}
              disabled={saving}
              className="btn-primary text-sm flex items-center gap-2 disabled:opacity-50"
            >
              {saving ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  Save Integrations
                </>
              )}
            </button>
          </div>
        </motion.div>

        {/* Danger Zone */}
        <motion.div custom={4} variants={fadeUp} initial="hidden" animate="visible" className="glass-card p-5 border-red-200 dark:border-red-900/50 border">
          <div className="flex items-center gap-2 mb-4">
            <AlertTriangle className="w-4 h-4 text-red-500" />
            <h2 className="font-semibold text-red-500">Danger Zone</h2>
          </div>

          <p className="text-sm text-[var(--muted)] mb-4">
            Permanently delete your account and all associated data. This action cannot be undone.
          </p>

          {!showDeleteConfirm ? (
            <button
              onClick={() => setShowDeleteConfirm(true)}
              className="px-4 py-2 rounded-xl text-sm font-medium bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 hover:bg-red-200 dark:hover:bg-red-900/50 transition-colors flex items-center gap-2"
            >
              <Trash2 className="w-4 h-4" />
              Delete Account
            </button>
          ) : (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              className="space-y-3"
            >
              <p className="text-sm text-red-500 font-medium">
                Type DELETE to confirm account deletion:
              </p>
              <input
                type="text"
                value={deleteConfirmText}
                onChange={(e) => setDeleteConfirmText(e.target.value)}
                placeholder="DELETE"
                className="input-field border-red-300 dark:border-red-800 focus:ring-red-500"
              />
              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setShowDeleteConfirm(false)
                    setDeleteConfirmText('')
                  }}
                  className="btn-outline text-sm flex-1"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDeleteAccount}
                  disabled={deleteConfirmText !== 'DELETE'}
                  className="px-4 py-2 rounded-xl text-sm font-medium bg-red-500 text-white disabled:opacity-50 flex-1 transition-opacity"
                >
                  Permanently Delete
                </button>
              </div>
            </motion.div>
          )}
        </motion.div>
      </div>
    </AppShell>
  )
}
