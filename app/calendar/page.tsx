'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  CalendarDays,
  Plus,
  X,
  Loader2,
  Clock,
  Trash2,
} from 'lucide-react'
import AppShell from '@/components/layout/AppShell'
import LoadingSkeleton from '@/components/common/LoadingSkeleton'
import { CalendarEvent, Exam } from '@/lib/types'

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.08, duration: 0.4, ease: 'easeOut' },
  }),
}

const HOURS = Array.from({ length: 16 }, (_, i) => i + 7) // 07:00 to 22:00
const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']

const EVENT_COLORS: Record<string, string> = {
  class: 'bg-blue-500/80 border-blue-600 text-white',
  study: 'bg-green-500/80 border-green-600 text-white',
  exam: 'bg-red-500/80 border-red-600 text-white',
  ai_block: 'bg-purple-500/80 border-purple-600 text-white',
}

const LEGEND = [
  { type: 'class', label: 'Class', color: 'bg-blue-500' },
  { type: 'study', label: 'Study', color: 'bg-green-500' },
  { type: 'exam', label: 'Exam', color: 'bg-red-500' },
  { type: 'ai_block', label: 'AI Block', color: 'bg-purple-500' },
]

const TIME_PILLS = ['Morning', 'Afternoon', 'Evening']
const EVENT_TYPES = ['class', 'study', 'exam', 'ai_block']

const MOCK_USER_ID = 'test-user-id'

export default function CalendarPage() {
  const [events, setEvents] = useState<CalendarEvent[]>([])
  const [exams, setExams] = useState<Exam[]>([])
  const [loading, setLoading] = useState(true)
  const [generating, setGenerating] = useState(false)
  const [toastMsg, setToastMsg] = useState('')

  // Study Preferences
  const [studyHours, setStudyHours] = useState(4)
  const [preferredTimes, setPreferredTimes] = useState<string[]>(['morning', 'evening'])
  const [subjects, setSubjects] = useState('')

  // Exam inputs
  const [examRows, setExamRows] = useState<{ subject: string; date: string }[]>([])

  // Manual event form
  const [showAddEvent, setShowAddEvent] = useState(false)
  const [newEvent, setNewEvent] = useState({
    title: '',
    event_type: 'study',
    day_of_week: 1,
    start_time: '09:00',
    end_time: '10:00',
    subject: '',
  })
  const [savingEvent, setSavingEvent] = useState(false)

  useEffect(() => {
    const init = async () => {
      const [eventsRes, examsRes] = await Promise.all([
        fetch(`/api/calendar/events?user_id=${MOCK_USER_ID}`),
        fetch(`/api/exams?user_id=${MOCK_USER_ID}`),
      ])

      const [eventsData, examsData] = await Promise.all([
        eventsRes.json(),
        examsRes.json(),
      ])

      setEvents(Array.isArray(eventsData) ? eventsData : [])
      setExams(Array.isArray(examsData) ? examsData : [])
      setLoading(false)
    }
    init()
  }, [])

  const showToast = (msg: string) => {
    setToastMsg(msg)
    setTimeout(() => setToastMsg(''), 3000)
  }

  const toggleTime = (time: string) => {
    const t = time.toLowerCase()
    setPreferredTimes((prev) =>
      prev.includes(t) ? prev.filter((p) => p !== t) : [...prev, t]
    )
  }

  const addExamRow = () => setExamRows((prev) => [...prev, { subject: '', date: '' }])

  const saveExam = async (row: { subject: string; date: string }, idx: number) => {
    if (!row.subject || !row.date) return
    const res = await fetch('/api/exams', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ user_id: MOCK_USER_ID, subject: row.subject, exam_date: row.date }),
    })
    if (res.ok) {
      const newExam = await res.json()
      setExams((prev) => [...prev, newExam])
      setExamRows((prev) => prev.filter((_, i) => i !== idx))
      showToast('Exam added!')
    }
  }

  const deleteExam = async (id: string) => {
    await fetch(`/api/exams?id=${id}`, { method: 'DELETE' })
    setExams((prev) => prev.filter((e) => e.id !== id))
  }

  const handleGenerate = async () => {
    setGenerating(true)
    try {
      const res = await fetch('/api/calendar/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: MOCK_USER_ID,
          study_hours_per_day: studyHours,
          preferred_times: preferredTimes,
          subjects: subjects.split(',').map((s) => s.trim()).filter(Boolean),
          exams: exams.map((e) => ({ subject: e.subject, exam_date: e.exam_date })),
        }),
      })
      if (res.ok) {
        showToast('Timetable generated!')
        const eventsRes = await fetch(`/api/calendar/events?user_id=${MOCK_USER_ID}`)
        const eventsData = await eventsRes.json()
        setEvents(Array.isArray(eventsData) ? eventsData : [])
      } else {
        showToast('Failed to generate timetable.')
      }
    } catch { showToast('Error generating timetable.') }
    setGenerating(false)
  }

  const handleAddEvent = async () => {
    if (!newEvent.title || !newEvent.start_time || !newEvent.end_time) return
    setSavingEvent(true)
    const res = await fetch('/api/calendar/events', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        user_id: MOCK_USER_ID,
        title: newEvent.title,
        event_type: newEvent.event_type,
        day_of_week: newEvent.day_of_week,
        start_time: newEvent.start_time,
        end_time: newEvent.end_time,
        subject: newEvent.subject || null,
      }),
    })
    if (res.ok) {
      const data = await res.json()
      const evt = data.event || data
      setEvents((prev) => [...prev, evt])
      setNewEvent({ title: '', event_type: 'study', day_of_week: 1, start_time: '09:00', end_time: '10:00', subject: '' })
      setShowAddEvent(false)
      showToast('Event added!')
    } else {
      showToast('Failed to add event.')
    }
    setSavingEvent(false)
  }

  const deleteEvent = async (id: string) => {
    await fetch(`/api/calendar/events?id=${id}`, { method: 'DELETE' })
    setEvents((prev) => prev.filter((e) => e.id !== id))
    showToast('Event removed.')
  }

  // Position events on the grid
  const getEventPosition = (event: CalendarEvent) => {
    const startHour = parseInt(event.start_time.split(':')[0])
    const startMin = parseInt(event.start_time.split(':')[1] || '0')
    const endHour = parseInt(event.end_time.split(':')[0])
    const endMin = parseInt(event.end_time.split(':')[1] || '0')
    const top = (startHour - 7) * 48 + (startMin / 60) * 48
    const height = ((endHour - startHour) * 60 + (endMin - startMin)) / 60 * 48
    return { top: `${top}px`, height: `${Math.max(height, 24)}px` }
  }

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
      <div className="p-6 md:p-8 space-y-6">
        {/* Toast */}
        {toastMsg && (
          <div className="fixed top-4 right-4 z-[100] glass-card px-4 py-2 text-sm font-medium border-l-4 border-green-500 animate-in slide-in-from-right">
            {toastMsg}
          </div>
        )}

        {/* Header */}
        <motion.div custom={0} variants={fadeUp} initial="hidden" animate="visible">
          <h1 className="text-2xl font-bold">Smart Calendar</h1>
          <p className="text-sm text-[var(--muted)] mt-1">
            Add events manually or let AI generate your weekly study timetable.
          </p>
        </motion.div>

        {/* Add Manual Event + Generate */}
        <div className="flex gap-3 flex-wrap">
          <button
            onClick={() => setShowAddEvent(!showAddEvent)}
            className="btn-outline flex items-center gap-2 text-sm"
          >
            <Plus className="w-4 h-4" />
            Add Event
          </button>
          <button
            onClick={handleGenerate}
            disabled={generating}
            className="btn-primary flex items-center gap-2 text-sm disabled:opacity-50"
          >
            {generating ? <Loader2 className="w-4 h-4 animate-spin" /> : <CalendarDays className="w-4 h-4" />}
            {generating ? 'Generating...' : 'AI Generate Timetable'}
          </button>
        </div>

        {/* Manual Add Event Form */}
        <AnimatePresence>
          {showAddEvent && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="overflow-hidden"
            >
              <div className="glass-card p-5 space-y-3">
                <h2 className="font-semibold">New Event</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <input
                    type="text"
                    placeholder="Title (e.g. Physics Lecture)"
                    value={newEvent.title}
                    onChange={(e) => setNewEvent((p) => ({ ...p, title: e.target.value }))}
                    className="input-field"
                  />
                  <input
                    type="text"
                    placeholder="Subject (optional)"
                    value={newEvent.subject}
                    onChange={(e) => setNewEvent((p) => ({ ...p, subject: e.target.value }))}
                    className="input-field"
                  />
                  <select
                    value={newEvent.event_type}
                    onChange={(e) => setNewEvent((p) => ({ ...p, event_type: e.target.value }))}
                    className="input-field"
                  >
                    {EVENT_TYPES.map((t) => (
                      <option key={t} value={t}>{t.replace('_', ' ')}</option>
                    ))}
                  </select>
                  <select
                    value={newEvent.day_of_week}
                    onChange={(e) => setNewEvent((p) => ({ ...p, day_of_week: Number(e.target.value) }))}
                    className="input-field"
                  >
                    {DAYS.map((d, i) => (
                      <option key={d} value={i === 6 ? 0 : i + 1}>{d}</option>
                    ))}
                  </select>
                  <div className="flex gap-2 items-center">
                    <input
                      type="time"
                      value={newEvent.start_time}
                      onChange={(e) => setNewEvent((p) => ({ ...p, start_time: e.target.value }))}
                      className="input-field flex-1"
                    />
                    <span className="text-[var(--muted)] text-sm">–</span>
                    <input
                      type="time"
                      value={newEvent.end_time}
                      onChange={(e) => setNewEvent((p) => ({ ...p, end_time: e.target.value }))}
                      className="input-field flex-1"
                    />
                  </div>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={handleAddEvent}
                    disabled={savingEvent || !newEvent.title}
                    className="btn-primary text-sm disabled:opacity-50"
                  >
                    {savingEvent ? 'Saving...' : 'Save Event'}
                  </button>
                  <button onClick={() => setShowAddEvent(false)} className="btn-outline text-sm">Cancel</button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Study Preferences */}
          <motion.div custom={1} variants={fadeUp} initial="hidden" animate="visible" className="glass-card p-5">
            <h2 className="font-semibold mb-1">AI Study Preferences</h2>
            <p className="text-xs text-[var(--muted)] mb-4">Configure for AI timetable generation.</p>

            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium mb-1.5 block">Study hours/day</label>
                <input
                  type="number"
                  min={1}
                  max={12}
                  value={studyHours}
                  onChange={(e) => setStudyHours(Number(e.target.value))}
                  className="input-field w-24"
                />
              </div>

              <div>
                <label className="text-sm font-medium mb-1.5 block">Preferred times</label>
                <div className="flex gap-2">
                  {TIME_PILLS.map((t) => (
                    <button
                      key={t}
                      type="button"
                      onClick={() => toggleTime(t)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                        preferredTimes.includes(t.toLowerCase())
                          ? 'bg-cyan-500 text-white'
                          : 'bg-gray-100 dark:bg-gray-800 text-[var(--muted)]'
                      }`}
                    >
                      {t}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-sm font-medium mb-1.5 block">Subjects</label>
                <input
                  type="text"
                  value={subjects}
                  onChange={(e) => setSubjects(e.target.value)}
                  placeholder="Math, Physics, Literature"
                  className="input-field"
                />
              </div>
            </div>
          </motion.div>

          {/* Upcoming Exams */}
          <motion.div custom={2} variants={fadeUp} initial="hidden" animate="visible" className="glass-card p-5">
            <h2 className="font-semibold mb-1">Upcoming Exams</h2>
            <p className="text-xs text-[var(--muted)] mb-4">Used by AI to prioritize study sessions.</p>

            <div className="space-y-2">
              {exams.map((exam) => (
                <div key={exam.id} className="flex items-center gap-2">
                  <span className="text-sm flex-1">{exam.subject}</span>
                  <span className="text-xs text-[var(--muted)]">{exam.exam_date}</span>
                  <button
                    onClick={() => deleteExam(exam.id)}
                    className="p-1 rounded hover:bg-red-100 dark:hover:bg-red-900/30 text-[var(--muted)] hover:text-red-500 transition-colors"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
              {examRows.map((row, idx) => (
                <div key={idx} className="flex items-center gap-2">
                  <input
                    type="text"
                    value={row.subject}
                    onChange={(e) => setExamRows((prev) => prev.map((r, i) => i === idx ? { ...r, subject: e.target.value } : r))}
                    placeholder="Subject"
                    className="input-field flex-1"
                  />
                  <input
                    type="date"
                    value={row.date}
                    onChange={(e) => setExamRows((prev) => prev.map((r, i) => i === idx ? { ...r, date: e.target.value } : r))}
                    className="input-field w-36"
                  />
                  <button onClick={() => saveExam(row, idx)} className="btn-primary text-xs px-2 py-1">Save</button>
                  <button onClick={() => setExamRows((prev) => prev.filter((_, i) => i !== idx))} className="p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-800">
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
              <button onClick={addExamRow} className="text-cyan-500 text-sm flex items-center gap-1 hover:underline">
                <Plus className="w-3.5 h-3.5" />
                Add exam
              </button>
            </div>
          </motion.div>
        </div>

        {/* Weekly Timetable */}
        <motion.div custom={3} variants={fadeUp} initial="hidden" animate="visible" className="glass-card p-5">
          <div className="flex items-center gap-2 mb-1">
            <Clock className="w-4 h-4 text-cyan-500" />
            <h2 className="font-semibold">Weekly Timetable</h2>
            <span className="text-xs text-[var(--muted)]">({events.length} events)</span>
          </div>
          <p className="text-xs text-[var(--muted)] mb-4">Your events laid out across the week. Click an event to delete it.</p>

          <div className="overflow-x-auto">
            <div className="min-w-[700px]">
              {/* Day Headers */}
              <div className="grid grid-cols-[60px_repeat(7,1fr)] gap-0 sticky top-0 z-10">
                <div className="h-8" />
                {DAYS.map((day) => (
                  <div key={day} className="h-8 flex items-center justify-center text-xs font-semibold text-[var(--muted)] border-b border-[var(--border)]">
                    {day}
                  </div>
                ))}
              </div>

              {/* Time Grid */}
              <div className="grid grid-cols-[60px_repeat(7,1fr)] gap-0 relative">
                {/* Hour labels */}
                <div className="relative">
                  {HOURS.map((hour) => (
                    <div key={hour} className="h-12 flex items-start justify-end pr-2 text-[10px] text-[var(--muted)] -mt-1.5 first:mt-0">
                      {hour.toString().padStart(2, '0')}:00
                    </div>
                  ))}
                </div>

                {/* Day columns */}
                {DAYS.map((_, dayIdx) => {
                  const dow = dayIdx === 6 ? 0 : dayIdx + 1
                  const dayEvents = events.filter((e) => e.day_of_week === dow)

                  return (
                    <div key={dayIdx} className="relative border-l border-[var(--border)]">
                      {/* Hour gridlines */}
                      {HOURS.map((hour) => (
                        <div key={hour} className="h-12 border-b border-[var(--border)]" />
                      ))}
                      {/* Events */}
                      {dayEvents.map((event) => {
                        const pos = getEventPosition(event)
                        return (
                          <div
                            key={event.id}
                            className={`absolute left-0.5 right-0.5 rounded-md px-1 py-0.5 overflow-hidden border-l-2 cursor-pointer group ${EVENT_COLORS[event.event_type] || 'bg-gray-500/80 text-white'}`}
                            style={{ top: pos.top, height: pos.height }}
                            title={`${event.title} (${event.start_time}–${event.end_time}) – click to delete`}
                            onClick={() => deleteEvent(event.id)}
                          >
                            <p className="text-[10px] font-medium truncate leading-tight">{event.title}</p>
                            <p className="text-[9px] opacity-80 truncate">{event.start_time}</p>
                            <div className="absolute top-0.5 right-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                              <Trash2 className="w-2.5 h-2.5" />
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  )
                })}
              </div>
            </div>
          </div>

          {/* Legend */}
          <div className="flex items-center gap-4 mt-4 pt-3 border-t border-[var(--border)]">
            {LEGEND.map((item) => (
              <div key={item.type} className="flex items-center gap-1.5">
                <div className={`w-2.5 h-2.5 rounded-full ${item.color}`} />
                <span className="text-xs text-[var(--muted)]">{item.label}</span>
              </div>
            ))}
          </div>
        </motion.div>
      </div>
    </AppShell>
  )
}
