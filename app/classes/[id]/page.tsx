'use client'

import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import Link from 'next/link'
import { useRouter, useParams } from 'next/navigation'
import {
  ArrowLeft,
  Video,
  Settings,
  Copy,
  Upload,
  Users,
  FileText,
  Image,
  Trash2,
  Download,
  MapPin,
  Calendar,
  FolderOpen,
  Check,
  X,
} from 'lucide-react'
import AppShell from '@/components/layout/AppShell'
import LoadingSkeleton from '@/components/common/LoadingSkeleton'
import { Class, ClassMember, LibraryFile } from '@/lib/types'
import { formatDate, formatFileSize, getFileIcon } from '@/lib/utils'

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: 'easeOut' } },
}

type Tab = 'overview' | 'files' | 'members'

const ROLE_STYLES: Record<string, string> = {
  owner: 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300',
  teacher: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300',
  member: 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400',
}

export default function ClassDetailPage() {
  const router = useRouter()
  const params = useParams()
  const classId = params.id as string

  const [userId, setUserId] = useState<string | null>(null)
  const [cls, setCls] = useState<Class | null>(null)
  const [members, setMembers] = useState<ClassMember[]>([])
  const [files, setFiles] = useState<LibraryFile[]>([])
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState<Tab>('overview')
  const [codeCopied, setCodeCopied] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [confirmDeleteMember, setConfirmDeleteMember] = useState<string | null>(null)
  const [confirmDeleteFile, setConfirmDeleteFile] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const isOwner = cls?.creator_id === userId

  useEffect(() => {
    setUserId('test-user-id')
    fetchAll()
  }, [classId])

  const fetchAll = async () => {
    setLoading(true)
    const [clsRes, membersRes, filesRes] = await Promise.all([
      fetch(`/api/classes/${classId}`),
      fetch(`/api/classes/${classId}/members`),
      fetch(`/api/classes/${classId}/files`),
    ])

    const [clsData, membersData, filesData] = await Promise.all([
      clsRes.json(),
      membersRes.json(),
      filesRes.json(),
    ])

    if (clsRes.ok) setCls(clsData.class || clsData)
    setMembers(Array.isArray(membersData.members) ? membersData.members : Array.isArray(membersData) ? membersData : [])
    setFiles(Array.isArray(filesData.files) ? filesData.files : Array.isArray(filesData) ? filesData : [])
    setLoading(false)
  }

  const copyCode = async () => {
    if (!cls) return
    await navigator.clipboard.writeText(cls.code)
    setCodeCopied(true)
    setTimeout(() => setCodeCopied(false), 2000)
  }

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !userId) return

    setUploading(true)
    try {
      // Upload to storage
      const formData = new FormData()
      formData.append('file', file)
      formData.append('user_id', userId)

      const uploadRes = await fetch('/api/library/upload', {
        method: 'POST',
        body: formData,
      })

      const uploadData = await uploadRes.json()

      if (!uploadRes.ok) {
        setUploading(false)
        return
      }

      // Create file record
      await fetch('/api/library', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: userId,
          class_id: classId,
          file_name: file.name,
          file_type: file.type,
          file_size: file.size,
          storage_path: uploadData.storage_path,
          tags: [],
        }),
      })

      await fetchAll()
    } catch {}
    setUploading(false)
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  const handleDeleteFile = async (fileId: string) => {
    await fetch(`/api/library/${fileId}`, { method: 'DELETE' })
    setConfirmDeleteFile(null)
    await fetchAll()
  }

  const handleRemoveMember = async (memberUserId: string) => {
    await fetch(`/api/classes/${classId}/members`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ user_id_to_remove: memberUserId }),
    })
    setConfirmDeleteMember(null)
    await fetchAll()
  }

  if (loading) {
    return (
      <AppShell>
        <div className="p-6 md:p-8 space-y-6">
          <LoadingSkeleton variant="text" count={3} />
          <LoadingSkeleton variant="card" count={2} />
        </div>
      </AppShell>
    )
  }

  if (!cls) {
    return (
      <AppShell>
        <div className="p-6 md:p-8 text-center">
          <p className="text-[var(--muted)]">Class not found.</p>
          <Link href="/classes" className="text-cyan-500 text-sm hover:underline mt-2 inline-block">
            Back to classes
          </Link>
        </div>
      </AppShell>
    )
  }

  return (
    <AppShell>
      <div>
        {/* Color banner */}
        <div className="h-2" style={{ background: cls.color || '#0EA5E9' }} />

        <div className="p-6 md:p-8 space-y-6">
          <motion.div variants={fadeUp} initial="hidden" animate="visible">
            <Link
              href="/classes"
              className="text-sm text-[var(--muted)] hover:text-[var(--foreground)] flex items-center gap-1.5 mb-4 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to classes
            </Link>

            {/* Class header */}
            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
              <div>
                <h1 className="text-2xl font-bold">{cls.name}</h1>
                <div className="flex items-center gap-2 mt-2 flex-wrap">
                  <span className="text-xs px-2 py-0.5 rounded-full bg-cyan-100 dark:bg-cyan-900/30 text-cyan-700 dark:text-cyan-300">
                    {cls.subject}
                  </span>
                  <button
                    onClick={copyCode}
                    className="text-xs px-2 py-0.5 rounded-full bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 font-mono flex items-center gap-1 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                  >
                    {cls.code}
                    {codeCopied ? (
                      <Check className="w-3 h-3 text-green-500" />
                    ) : (
                      <Copy className="w-3 h-3" />
                    )}
                  </button>
                </div>
                <p className="text-sm text-[var(--muted)] mt-2">
                  {cls.creator_name || 'Unknown'} &middot; Created{' '}
                  {formatDate(cls.created_at)}
                </p>
              </div>
              <div className="flex items-center gap-2">
                {cls.meet_link && (
                  <a
                    href={cls.meet_link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn-outline text-sm flex items-center gap-1.5"
                  >
                    <Video className="w-4 h-4" />
                    Meet link
                  </a>
                )}
                {isOwner && (
                  <button className="btn-outline text-sm flex items-center gap-1.5">
                    <Settings className="w-4 h-4" />
                    Settings
                  </button>
                )}
              </div>
            </div>
          </motion.div>

          {/* Tabs */}
          <motion.div
            variants={fadeUp}
            initial="hidden"
            animate="visible"
            className="flex items-center gap-1 p-1 rounded-xl bg-gray-100 dark:bg-gray-800/50 w-fit"
          >
            {(['overview', 'files', 'members'] as Tab[]).map((t) => (
              <button
                key={t}
                onClick={() => setTab(t)}
                className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-all capitalize ${
                  tab === t
                    ? 'bg-cyan-500 text-white shadow-sm'
                    : 'text-[var(--muted)] hover:text-[var(--foreground)]'
                }`}
              >
                {t}
              </button>
            ))}
          </motion.div>

          {/* Tab Content */}
          <AnimatePresence mode="wait">
            {tab === 'overview' && (
              <motion.div
                key="overview"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="space-y-6"
              >
                {/* Description */}
                {cls.description && (
                  <div className="glass-card p-5">
                    <h3 className="font-semibold text-sm mb-2">Description</h3>
                    <p className="text-sm text-[var(--muted)] leading-relaxed">
                      {cls.description}
                    </p>
                  </div>
                )}

                {/* Info grid */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  {cls.location && (
                    <div className="glass-card p-4 flex items-center gap-3">
                      <MapPin className="w-4 h-4 text-[var(--muted)]" />
                      <div>
                        <p className="text-xs text-[var(--muted)]">Location</p>
                        <p className="text-sm font-medium">{cls.location}</p>
                      </div>
                    </div>
                  )}
                  <div className="glass-card p-4 flex items-center gap-3">
                    <Users className="w-4 h-4 text-[var(--muted)]" />
                    <div>
                      <p className="text-xs text-[var(--muted)]">Members</p>
                      <p className="text-sm font-medium">{members.length}</p>
                    </div>
                  </div>
                  <div className="glass-card p-4 flex items-center gap-3">
                    <FolderOpen className="w-4 h-4 text-[var(--muted)]" />
                    <div>
                      <p className="text-xs text-[var(--muted)]">Files</p>
                      <p className="text-sm font-medium">{files.length}</p>
                    </div>
                  </div>
                  <div className="glass-card p-4 flex items-center gap-3">
                    <Calendar className="w-4 h-4 text-[var(--muted)]" />
                    <div>
                      <p className="text-xs text-[var(--muted)]">Created</p>
                      <p className="text-sm font-medium">{formatDate(cls.created_at)}</p>
                    </div>
                  </div>
                </div>

                {/* Quick Actions */}
                <div className="glass-card p-5">
                  <h3 className="font-semibold text-sm mb-3">Quick Actions</h3>
                  <div className="flex flex-wrap gap-3">
                    <button
                      onClick={() => {
                        setTab('files')
                        setTimeout(() => fileInputRef.current?.click(), 100)
                      }}
                      className="btn-outline text-sm flex items-center gap-1.5"
                    >
                      <Upload className="w-4 h-4" />
                      Upload File
                    </button>
                    <button
                      onClick={copyCode}
                      className="btn-outline text-sm flex items-center gap-1.5"
                    >
                      <Copy className="w-4 h-4" />
                      {codeCopied ? 'Copied!' : 'Copy Invite Code'}
                    </button>
                  </div>
                </div>
              </motion.div>
            )}

            {tab === 'files' && (
              <motion.div
                key="files"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="space-y-4"
              >
                {/* Upload zone */}
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="glass-card border-2 border-dashed border-[var(--border)] p-8 text-center cursor-pointer hover:border-cyan-500/50 transition-colors"
                >
                  <Upload className="w-8 h-8 mx-auto text-[var(--muted)] opacity-50" />
                  <p className="text-sm font-medium mt-2">
                    {uploading ? 'Uploading...' : 'Click to upload a file'}
                  </p>
                  <p className="text-xs text-[var(--muted)] mt-1">
                    PDF, documents, images, and more
                  </p>
                  <input
                    ref={fileInputRef}
                    type="file"
                    className="hidden"
                    onChange={handleFileUpload}
                    disabled={uploading}
                  />
                </div>

                {/* File list */}
                {files.length > 0 ? (
                  <div className="glass-card divide-y divide-[var(--border)]">
                    {files.map((file) => {
                      const ext = file.file_name.split('.').pop() || ''
                      const iconStyle = getFileIcon(ext)
                      const IconComp = file.file_type.includes('image') ? Image : FileText

                      return (
                        <div
                          key={file.id}
                          className="flex items-center gap-3 p-4"
                        >
                          <div
                            className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${iconStyle.bg}`}
                          >
                            <IconComp className={`w-4 h-4 ${iconStyle.color}`} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-sm truncate">
                              {file.file_name}
                            </p>
                            <p className="text-xs text-[var(--muted)]">
                              {formatDate(file.uploaded_at)} &middot;{' '}
                              {formatFileSize(file.file_size)}
                            </p>
                          </div>
                          <div className="flex items-center gap-1.5 flex-shrink-0">
                            <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 uppercase font-mono">
                              {ext}
                            </span>
                            {confirmDeleteFile === file.id ? (
                              <div className="flex items-center gap-1">
                                <button
                                  onClick={() => handleDeleteFile(file.id)}
                                  className="p-1.5 rounded-lg bg-red-100 dark:bg-red-900/30 text-red-600 hover:bg-red-200 transition-colors"
                                >
                                  <Check className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  onClick={() => setConfirmDeleteFile(null)}
                                  className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                                >
                                  <X className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            ) : (
                              <button
                                onClick={() => setConfirmDeleteFile(file.id)}
                                className="p-1.5 rounded-lg hover:bg-red-100 dark:hover:bg-red-900/30 text-[var(--muted)] hover:text-red-600 transition-colors"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                ) : (
                  <div className="glass-card p-8 text-center">
                    <FolderOpen className="w-8 h-8 mx-auto text-[var(--muted)] opacity-50" />
                    <p className="text-sm text-[var(--muted)] mt-2">
                      No files uploaded yet.
                    </p>
                  </div>
                )}
              </motion.div>
            )}

            {tab === 'members' && (
              <motion.div
                key="members"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="space-y-4"
              >
                {/* Share section */}
                <div className="glass-card p-5">
                  <h3 className="font-semibold text-sm mb-2">Share Class Code</h3>
                  <p className="text-xs text-[var(--muted)] mb-3">
                    Share this code with students to let them join your class.
                  </p>
                  <div className="flex items-center gap-3">
                    <div className="flex-1 input-field text-center text-lg font-mono tracking-[0.3em] py-3">
                      {cls.code}
                    </div>
                    <button
                      onClick={copyCode}
                      className="btn-primary text-sm flex items-center gap-1.5 whitespace-nowrap"
                    >
                      {codeCopied ? (
                        <>
                          <Check className="w-4 h-4" />
                          Copied!
                        </>
                      ) : (
                        <>
                          <Copy className="w-4 h-4" />
                          Copy Code
                        </>
                      )}
                    </button>
                  </div>
                </div>

                {/* Members list */}
                {members.length > 0 ? (
                  <div className="glass-card divide-y divide-[var(--border)]">
                    {members.map((member) => (
                      <div
                        key={member.id}
                        className="flex items-center gap-3 p-4"
                      >
                        <div
                          className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-sm flex-shrink-0"
                          style={{ background: cls.color || '#0EA5E9' }}
                        >
                          {(member.full_name || member.email || '?')[0].toUpperCase()}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-sm">
                            {member.full_name || 'Unknown'}
                          </p>
                          <p className="text-xs text-[var(--muted)] truncate">
                            {member.email || ''}
                          </p>
                        </div>
                        <span
                          className={`text-xs px-2 py-0.5 rounded-full font-medium capitalize ${
                            ROLE_STYLES[member.role] || ROLE_STYLES.member
                          }`}
                        >
                          {member.role}
                        </span>
                        {isOwner && member.user_id !== userId && (
                          <>
                            {confirmDeleteMember === member.user_id ? (
                              <div className="flex items-center gap-1">
                                <button
                                  onClick={() => handleRemoveMember(member.user_id)}
                                  className="p-1.5 rounded-lg bg-red-100 dark:bg-red-900/30 text-red-600 hover:bg-red-200 transition-colors"
                                >
                                  <Check className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  onClick={() => setConfirmDeleteMember(null)}
                                  className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                                >
                                  <X className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            ) : (
                              <button
                                onClick={() => setConfirmDeleteMember(member.user_id)}
                                className="p-1.5 rounded-lg hover:bg-red-100 dark:hover:bg-red-900/30 text-[var(--muted)] hover:text-red-600 transition-colors"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="glass-card p-8 text-center">
                    <Users className="w-8 h-8 mx-auto text-[var(--muted)] opacity-50" />
                    <p className="text-sm text-[var(--muted)] mt-2">
                      No members yet. Share the class code to invite.
                    </p>
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </AppShell>
  )
}
