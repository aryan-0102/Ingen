'use client'

import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useRouter } from 'next/navigation'
import {
  Upload,
  Search,
  FileText,
  Image,
  Trash2,
  Download,
  Sparkles,
  ExternalLink,
  X,
  CloudUpload,
  Loader2,
} from 'lucide-react'
import AppShell from '@/components/layout/AppShell'
import LoadingSkeleton from '@/components/common/LoadingSkeleton'
import { LibraryFile } from '@/lib/types'
import { formatDate, formatFileSize, getFileIcon } from '@/lib/utils'

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.06, duration: 0.4, ease: 'easeOut' },
  }),
}

export default function LibraryPage() {
  const router = useRouter()
  const [userId, setUserId] = useState<string | null>(null)
  const [files, setFiles] = useState<LibraryFile[]>([])
  const [loading, setLoading] = useState(true)
  const [showUpload, setShowUpload] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [dragOver, setDragOver] = useState(false)
  const [search, setSearch] = useState('')
  const [activeTag, setActiveTag] = useState('All')
  const [summaryPanel, setSummaryPanel] = useState<{ file: LibraryFile; summary: string | null; loading: boolean } | null>(null)
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    const init = async () => {
      const uid = 'test-user-id'
      setUserId(uid)
      await fetchFiles(uid)
    }
    init()
  }, [])

  const fetchFiles = async (uid: string) => {
    setLoading(true)
    const res = await fetch(`/api/library?user_id=${uid}`)
    const data = await res.json()
    setFiles(Array.isArray(data) ? data : [])
    setLoading(false)
  }

  const allTags = Array.from(new Set(files.flatMap((f) => f.tags || [])))

  const filteredFiles = files.filter((f) => {
    const matchSearch = !search || f.file_name.toLowerCase().includes(search.toLowerCase())
    const matchTag = activeTag === 'All' || (f.tags && f.tags.includes(activeTag))
    return matchSearch && matchTag
  })

  const uploadFile = async (file: File) => {
    if (!userId) return
    setUploading(true)
    setUploadProgress(0)

    try {
      const formData = new FormData()
      formData.append('file', file)
      formData.append('user_id', userId)

      // Simulate progress
      const progressInterval = setInterval(() => {
        setUploadProgress((p) => Math.min(p + 15, 85))
      }, 200)

      const uploadRes = await fetch('/api/library/upload', { method: 'POST', body: formData })
      clearInterval(progressInterval)

      if (!uploadRes.ok) { setUploading(false); return }
      const uploadData = await uploadRes.json()
      setUploadProgress(90)

      await fetch('/api/library', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: userId,
          file_name: file.name,
          file_type: file.type,
          file_size: file.size,
          storage_path: uploadData.storage_path,
          tags: [],
        }),
      })

      setUploadProgress(100)
      await fetchFiles(userId)
      setShowUpload(false)
    } catch {}
    setUploading(false)
    setUploadProgress(0)
  }

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) uploadFile(file)
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(false)
    const file = e.dataTransfer.files?.[0]
    if (file) uploadFile(file)
  }

  const handleDelete = async (id: string) => {
    await fetch(`/api/library/${id}`, { method: 'DELETE' })
    setConfirmDelete(null)
    if (userId) await fetchFiles(userId)
  }

  const handleSummarize = async (file: LibraryFile) => {
    setSummaryPanel({ file, summary: null, loading: true })
    try {
      const res = await fetch(`/api/library/${file.id}/summarize`, { method: 'POST' })
      const data = await res.json()
      setSummaryPanel({ file, summary: data.summary || data.error || 'No summary available.', loading: false })
    } catch {
      setSummaryPanel({ file, summary: 'Failed to generate summary.', loading: false })
    }
  }

  const getIconComp = (type: string) => (type.includes('image') ? Image : FileText)

  if (loading) {
    return (
      <AppShell>
        <div className="p-6 md:p-8 space-y-6">
          <LoadingSkeleton variant="text" count={2} />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
        <motion.div custom={0} variants={fadeUp} initial="hidden" animate="visible">
          <h1 className="text-2xl font-bold">My Library</h1>
          <p className="text-sm text-[var(--muted)] mt-1">
            Upload notes, keep them searchable, and open an AI summary side panel.
          </p>
        </motion.div>

        {/* Upload Toggle */}
        <motion.div custom={1} variants={fadeUp} initial="hidden" animate="visible">
          <button
            onClick={() => setShowUpload(!showUpload)}
            className="btn-primary w-full text-sm flex items-center justify-center gap-2"
          >
            <Upload className="w-4 h-4" />
            {showUpload ? 'Hide Upload' : 'Upload Files'}
          </button>
        </motion.div>

        {/* Upload Zone */}
        <AnimatePresence>
          {showUpload && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="overflow-hidden"
            >
              <div
                onClick={() => fileInputRef.current?.click()}
                onDragOver={(e) => { e.preventDefault(); setDragOver(true) }}
                onDragLeave={() => setDragOver(false)}
                onDrop={handleDrop}
                className={`border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition-colors ${
                  dragOver
                    ? 'border-cyan-500 bg-cyan-50/50 dark:bg-cyan-900/10'
                    : 'border-gray-300 dark:border-gray-600'
                }`}
              >
                {uploading ? (
                  <div className="space-y-3">
                    <Loader2 className="w-10 h-10 mx-auto text-cyan-500 animate-spin" />
                    <p className="text-sm font-medium">Uploading...</p>
                    <div className="w-full max-w-xs mx-auto h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-300"
                        style={{ width: `${uploadProgress}%`, background: 'linear-gradient(135deg, #06b6d4, #2563eb)' }}
                      />
                    </div>
                  </div>
                ) : (
                  <>
                    <CloudUpload className="w-10 h-10 mx-auto text-[var(--muted)] opacity-50" />
                    <p className="text-sm font-medium mt-3">Drop files here or click to browse</p>
                    <p className="text-xs text-[var(--muted)] mt-1">Supported: PDF, DOCX, TXT, images</p>
                  </>
                )}
                <input
                  ref={fileInputRef}
                  type="file"
                  className="hidden"
                  onChange={handleFileSelect}
                  disabled={uploading}
                />
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Search & Tags */}
        <motion.div custom={2} variants={fadeUp} initial="hidden" animate="visible" className="space-y-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--muted)]" />
            <input
              type="text"
              placeholder="Search files..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="input-field pl-10"
            />
          </div>
          <div className="flex overflow-x-auto gap-2 pb-1" style={{ scrollbarWidth: 'none' }}>
            {['All', ...allTags].map((tag) => (
              <button
                key={tag}
                onClick={() => setActiveTag(tag)}
                className={`px-3 py-1 rounded-full text-xs font-medium whitespace-nowrap transition-colors ${
                  activeTag === tag
                    ? 'bg-cyan-500 text-white'
                    : 'bg-gray-100 dark:bg-gray-800 text-[var(--muted)] hover:text-[var(--foreground)]'
                }`}
              >
                {tag}
              </button>
            ))}
          </div>
        </motion.div>

        {/* File Grid */}
        {filteredFiles.length > 0 ? (
          <motion.div custom={3} variants={fadeUp} initial="hidden" animate="visible" className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredFiles.map((file, i) => {
              const ext = file.file_name.split('.').pop() || ''
              const iconStyle = getFileIcon(ext)
              const IconComp = getIconComp(file.file_type)

              return (
                <motion.div
                  key={file.id}
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.04 }}
                  className="glass-card p-4 hover:shadow-lg transition-shadow"
                >
                  <div className="flex items-start gap-3">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${iconStyle.bg}`}>
                      <IconComp className={`w-4 h-4 ${iconStyle.color}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm truncate">{file.file_name}</p>
                      <p className="text-xs text-[var(--muted)]">
                        {formatDate(file.uploaded_at)} &middot; {formatFileSize(file.file_size)}
                      </p>
                      {file.tags && file.tags.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-2">
                          {file.tags.map((tag) => (
                            <span key={tag} className="text-[10px] px-1.5 py-0.5 rounded-full bg-gray-100 dark:bg-gray-800 text-[var(--muted)]">
                              {tag}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 mt-3 flex-wrap">
                    <a
                      href={file.storage_path}
                      download={file.file_name}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="btn-outline text-xs px-2.5 py-1 flex items-center gap-1"
                    >
                      <Download className="w-3 h-3" />
                      Download
                    </a>
                    <button
                      onClick={() => handleSummarize(file)}
                      className="btn-primary text-xs px-2.5 py-1 flex items-center gap-1"
                    >
                      <Sparkles className="w-3 h-3" />
                      Summarize
                    </button>
                    <a
                      href="https://notebooklm.google.com"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="btn-outline text-xs px-2.5 py-1 flex items-center gap-1"
                    >
                      <ExternalLink className="w-3 h-3" />
                      NotebookLM
                    </a>
                    {confirmDelete === file.id ? (
                      <div className="flex items-center gap-1 ml-auto">
                        <button onClick={() => handleDelete(file.id)} className="text-xs px-2 py-1 rounded-lg bg-red-100 dark:bg-red-900/30 text-red-600 font-medium">
                          Confirm
                        </button>
                        <button onClick={() => setConfirmDelete(null)} className="text-xs px-2 py-1 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800">
                          Cancel
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => setConfirmDelete(file.id)}
                        className="btn-outline text-xs px-2.5 py-1 flex items-center gap-1 ml-auto text-red-500 border-red-200 dark:border-red-800 hover:bg-red-50 dark:hover:bg-red-900/20"
                      >
                        <Trash2 className="w-3 h-3" />
                        Delete
                      </button>
                    )}
                  </div>
                </motion.div>
              )
            })}
          </motion.div>
        ) : (
          <motion.div custom={3} variants={fadeUp} initial="hidden" animate="visible" className="glass-card p-12 text-center">
            <FileText className="w-10 h-10 mx-auto text-[var(--muted)] opacity-50" />
            <p className="font-medium mt-3">No files found</p>
            <p className="text-sm text-[var(--muted)] mt-1">Upload your first file to get started.</p>
          </motion.div>
        )}
      </div>

      {/* AI Summary Side Panel */}
      <AnimatePresence>
        {summaryPanel && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/40 z-50 md:bg-black/20"
              onClick={() => setSummaryPanel(null)}
            />
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', stiffness: 350, damping: 35 }}
              className="fixed right-0 top-0 h-full w-full md:w-[40%] z-50 backdrop-blur-xl bg-white/95 dark:bg-gray-900/95 border-l border-[var(--border)] shadow-2xl"
            >
              <div className="p-6 h-full flex flex-col">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <p className="text-xs uppercase tracking-wider text-cyan-500 font-medium">AI Summary</p>
                    <p className="text-sm font-medium mt-1 truncate">{summaryPanel.file.file_name}</p>
                  </div>
                  <button
                    onClick={() => setSummaryPanel(null)}
                    className="p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <div className="flex-1 overflow-y-auto">
                  {summaryPanel.loading ? (
                    <div className="flex flex-col items-center justify-center h-full gap-3">
                      <Loader2 className="w-8 h-8 text-cyan-500 animate-spin" />
                      <p className="text-sm text-[var(--muted)]">Generating summary...</p>
                    </div>
                  ) : (
                    <div className="prose prose-sm dark:prose-invert max-w-none">
                      {summaryPanel.summary?.split('\n').map((line, i) => (
                        <p key={i} className="text-sm leading-relaxed text-[var(--foreground)]">
                          {line}
                        </p>
                      ))}
                    </div>
                  )}
                </div>

                {!summaryPanel.loading && (
                  <div className="pt-4 border-t border-[var(--border)]">
                    <a
                      href="https://notebooklm.google.com"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="btn-primary w-full text-sm flex items-center justify-center gap-2"
                    >
                      <ExternalLink className="w-4 h-4" />
                      Open in NotebookLM
                    </a>
                  </div>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </AppShell>
  )
}
