'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import {
  BookOpen,
  Library,
  Flame,
  Bot,
  Video,
  Clock,
  FileText,
  Image,
  ArrowRight,
  Users,
  FolderOpen,
} from 'lucide-react'
import AppShell from '@/components/layout/AppShell'
import LoadingSkeleton from '@/components/common/LoadingSkeleton'
import { DashboardStats, Class, LibraryFile, CalendarEvent } from '@/lib/types'
import {
  getGreeting,
  formatDate,
  formatFileSize,
  getFileIcon,
  getEventTypeColor,
} from '@/lib/utils'

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.08, duration: 0.4, ease: 'easeOut' },
  }),
}

const EVENT_TYPE_BORDER: Record<string, string> = {
  class: 'border-l-blue-500',
  study: 'border-l-green-500',
  exam: 'border-l-red-500',
  ai_block: 'border-l-purple-500',
}

const EVENT_TYPE_BADGE: Record<string, string> = {
  class: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300',
  study: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300',
  exam: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300',
  ai_block: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300',
}

export default function DashboardPage() {
  const router = useRouter()
  const [userId, setUserId] = useState<string | null>(null)
  const [userName, setUserName] = useState('')
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [classes, setClasses] = useState<Class[]>([])
  const [files, setFiles] = useState<LibraryFile[]>([])
  const [events, setEvents] = useState<CalendarEvent[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const init = async () => {
      const uid = 'test-user-id'
      setUserId(uid)

      // Fetch profile name from custom backend
      try {
        const profileRes = await fetch(`/api/profile?user_id=${uid}`)
        if (profileRes.ok) {
          const profile = await profileRes.json()
          if (profile) setUserName(profile.full_name || 'there')
        }
      } catch {}

      // Fetch all data in parallel
      const [statsRes, classesRes, filesRes, eventsRes] = await Promise.all([
        fetch(`/api/stats?user_id=${uid}`),
        fetch(`/api/classes?user_id=${uid}`),
        fetch(`/api/library?user_id=${uid}`),
        fetch(`/api/calendar/events?user_id=${uid}`),
      ])

      const [statsData, classesData, filesData, eventsData] = await Promise.all([
        statsRes.json(),
        classesRes.json(),
        filesRes.json(),
        eventsRes.json(),
      ])

      setStats(statsData)
      setClasses(Array.isArray(classesData) ? classesData : [])
      setFiles(Array.isArray(filesData) ? filesData.slice(0, 3) : [])
      setEvents(Array.isArray(eventsData) ? eventsData : [])
      setLoading(false)
    }

    init()
  }, [])

  const todayDow = new Date().getDay()
  const todayEvents = events.filter((e) => e.day_of_week === todayDow)

  // Mock weekly study hours for analytics chart
  const weeklyHours = [3, 4.5, 2, 5, 3.5, 1, 2]
  const maxHour = Math.max(...weeklyHours)
  const dayLabels = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']

  // Mock streak calendar (last 28 days)
  const streakDays = Array.from({ length: 28 }, (_, i) => i < (stats?.studyStreak || 0) || Math.random() > 0.4)

  const getFileExtIcon = (type: string) => {
    if (type.includes('image')) return Image
    return FileText
  }

  if (loading) {
    return (
      <AppShell>
        <div className="p-6 md:p-8 space-y-6">
          <LoadingSkeleton variant="text" count={2} />
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <LoadingSkeleton variant="card" count={1} />
            <LoadingSkeleton variant="card" count={1} />
            <LoadingSkeleton variant="card" count={1} />
            <LoadingSkeleton variant="card" count={1} />
          </div>
          <LoadingSkeleton variant="card" count={2} />
        </div>
      </AppShell>
    )
  }

  return (
    <AppShell>
      <div className="p-6 md:p-8 space-y-8">
        {/* Header */}
        <motion.div
          custom={0}
          variants={fadeUp}
          initial="hidden"
          animate="visible"
        >
          <p className="text-xs uppercase tracking-wider text-[var(--muted)] font-medium">
            Dashboard
          </p>
          <h1 className="text-2xl font-bold mt-1">
            {getGreeting()}, {userName} 👋
          </h1>
          <p className="text-sm text-[var(--muted)] mt-1">
            {todayEvents.length > 0
              ? `You have ${todayEvents.length} event${todayEvents.length > 1 ? 's' : ''} scheduled today.`
              : 'No events scheduled today. Time to study!'}
          </p>
        </motion.div>

        {/* Stats Cards */}
        <motion.div
          custom={1}
          variants={fadeUp}
          initial="hidden"
          animate="visible"
          className="grid grid-cols-2 md:grid-cols-4 gap-4"
        >
          {[
            { label: 'Active Classes', value: stats?.activeClasses || 0, icon: BookOpen, suffix: '' },
            { label: 'Files in Library', value: stats?.libraryFiles || 0, icon: Library, suffix: '' },
            { label: 'Study Streak', value: stats?.studyStreak || 0, icon: Flame, suffix: ' days' },
            { label: 'AI Chats', value: stats?.aiChats || 0, icon: Bot, suffix: '' },
          ].map((stat, i) => (
            <div
              key={stat.label}
              className="glass-card p-5 relative hover:-translate-y-1 transition-transform duration-200 cursor-default"
            >
              <stat.icon className="absolute top-4 right-4 w-5 h-5 text-[var(--muted)] opacity-50" />
              <p className="text-xs text-[var(--muted)] uppercase tracking-wide font-medium">
                {stat.label}
              </p>
              <p className="text-2xl font-bold mt-1">
                {stat.value}
                {stat.suffix}
              </p>
            </div>
          ))}
        </motion.div>

        {/* Your Classes */}
        <motion.div
          custom={2}
          variants={fadeUp}
          initial="hidden"
          animate="visible"
        >
          <div className="flex items-center justify-between mb-3">
            <div>
              <h2 className="text-lg font-semibold">Your Classes</h2>
              <p className="text-sm text-[var(--muted)]">Pick up where you left off.</p>
            </div>
            <Link href="/classes" className="text-cyan-500 text-sm hover:underline">
              View all
            </Link>
          </div>

          {classes.length > 0 ? (
            <div className="flex overflow-x-auto gap-4 pb-2 scrollbar-hide" style={{ scrollbarWidth: 'none' }}>
              {classes.map((cls) => (
                <div
                  key={cls.id}
                  className="glass-card w-[300px] flex-shrink-0 overflow-hidden"
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
                        {cls.creator_name || 'Unknown'} &middot; Created {formatDate(cls.created_at)}
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
                </div>
              ))}
            </div>
          ) : (
            <div className="glass-card p-8 text-center">
              <BookOpen className="w-8 h-8 mx-auto text-[var(--muted)] opacity-50" />
              <p className="text-sm text-[var(--muted)] mt-2">
                No classes yet.{' '}
                <Link href="/classes/create" className="text-cyan-500 hover:underline">
                  Create one
                </Link>
              </p>
            </div>
          )}
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Recent Library */}
          <motion.div
            custom={3}
            variants={fadeUp}
            initial="hidden"
            animate="visible"
          >
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-lg font-semibold">Recent Library</h2>
              <Link href="/library" className="text-cyan-500 text-sm hover:underline">
                Open Library
              </Link>
            </div>
            {files.length > 0 ? (
              <div className="glass-card divide-y divide-[var(--border)]">
                {files.map((file) => {
                  const ext = file.file_name.split('.').pop() || ''
                  const iconStyle = getFileIcon(ext)
                  const IconComp = getFileExtIcon(file.file_type)
                  return (
                    <div
                      key={file.id}
                      className="flex items-center gap-3 p-4"
                    >
                      <div
                        className={`w-10 h-10 rounded-full flex items-center justify-center ${iconStyle.bg}`}
                      >
                        <IconComp className={`w-4 h-4 ${iconStyle.color}`} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm truncate">{file.file_name}</p>
                        <p className="text-xs text-[var(--muted)]">
                          {formatDate(file.uploaded_at)} &middot; {formatFileSize(file.file_size)}
                        </p>
                      </div>
                      <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 uppercase font-mono">
                        {ext}
                      </span>
                    </div>
                  )
                })}
              </div>
            ) : (
              <div className="glass-card p-8 text-center">
                <FileText className="w-8 h-8 mx-auto text-[var(--muted)] opacity-50" />
                <p className="text-sm text-[var(--muted)] mt-2">No files yet.</p>
              </div>
            )}
          </motion.div>

          {/* Today's Schedule */}
          <motion.div
            custom={4}
            variants={fadeUp}
            initial="hidden"
            animate="visible"
          >
            <div className="flex items-center gap-2 mb-3">
              <Clock className="w-4 h-4 text-[var(--muted)]" />
              <h2 className="text-lg font-semibold">Today&apos;s Schedule</h2>
            </div>
            <p className="text-sm text-[var(--muted)] -mt-2 mb-3">
              {todayEvents.length > 0
                ? `${todayEvents.length} event${todayEvents.length > 1 ? 's' : ''} today`
                : 'Nothing scheduled — enjoy your free time!'}
            </p>
            {todayEvents.length > 0 ? (
              <div className="space-y-3">
                {todayEvents.map((event) => (
                  <div
                    key={event.id}
                    className={`glass-card flex items-center border-l-4 pl-4 pr-4 py-3 ${EVENT_TYPE_BORDER[event.event_type] || 'border-l-gray-500'}`}
                  >
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm">{event.title}</p>
                      <p className="text-xs text-[var(--muted)]">
                        {event.start_time} – {event.end_time} &middot;{' '}
                        <span className="capitalize">{event.event_type.replace('_', ' ')}</span>
                      </p>
                    </div>
                    <span
                      className={`text-xs px-2 py-1 rounded-full ${EVENT_TYPE_BADGE[event.event_type] || 'bg-gray-100 text-gray-700'}`}
                    >
                      {event.start_time}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="glass-card p-8 text-center">
                <Clock className="w-8 h-8 mx-auto text-[var(--muted)] opacity-50" />
                <p className="text-sm text-[var(--muted)] mt-2">Free day!</p>
              </div>
            )}
          </motion.div>
        </div>

        {/* Study Analytics */}
        <motion.div
          custom={5}
          variants={fadeUp}
          initial="hidden"
          animate="visible"
        >
          <h2 className="text-lg font-semibold mb-3">Study Analytics</h2>
          <div className="glass-card p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* Weekly Bar Chart */}
              <div>
                <p className="text-sm font-medium mb-4">Weekly Study Hours</p>
                <div className="flex items-end gap-3 h-32">
                  {weeklyHours.map((hours, i) => (
                    <div key={i} className="flex-1 flex flex-col items-center gap-1">
                      <span className="text-[10px] text-[var(--muted)]">{hours}h</span>
                      <div
                        className="w-full rounded-t-md transition-all duration-500"
                        style={{
                          height: `${(hours / maxHour) * 100}%`,
                          background: 'linear-gradient(to top, #06b6d4, #2563eb)',
                          minHeight: '4px',
                        }}
                      />
                      <span className="text-[10px] text-[var(--muted)]">{dayLabels[i]}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Streak Calendar */}
              <div>
                <p className="text-sm font-medium mb-4">Streak Calendar</p>
                <div className="grid grid-cols-7 gap-1.5">
                  {streakDays.map((active, i) => (
                    <div
                      key={i}
                      className={`w-full aspect-square rounded-sm ${
                        active
                          ? 'bg-green-500 dark:bg-green-600'
                          : 'bg-gray-200 dark:bg-gray-800'
                      }`}
                    />
                  ))}
                </div>
                <p className="text-xs text-[var(--muted)] mt-3">
                  Most productive time: <span className="font-medium text-[var(--foreground)]">Morning</span>
                </p>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Quick AI Chat Banner */}
        <motion.div
          custom={6}
          variants={fadeUp}
          initial="hidden"
          animate="visible"
        >
          <Link href="/tutor">
            <div className="glass-card p-6 flex items-center justify-between bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20 hover:shadow-lg transition-shadow cursor-pointer group">
              <div>
                <p className="text-xs uppercase tracking-wider text-amber-600 dark:text-amber-400 font-medium">
                  Quick AI Chat
                </p>
                <p className="text-sm text-[var(--muted)] mt-1">
                  Ask your AI tutor anything about your notes, classes, or exams...
                </p>
              </div>
              <ArrowRight className="w-5 h-5 text-amber-600 dark:text-amber-400 group-hover:translate-x-1 transition-transform" />
            </div>
          </Link>
        </motion.div>
      </div>
    </AppShell>
  )
}
