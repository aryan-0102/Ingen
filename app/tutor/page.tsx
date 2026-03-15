'use client'

import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useRouter } from 'next/navigation'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import {
  Bot,
  Send,
  Plus,
  Trash2,
  MessageSquare,
  Sparkles,
  Paperclip,
  X,
  Loader2,
  ChevronLeft,
  Menu,
} from 'lucide-react'
import AppShell from '@/components/layout/AppShell'
import LoadingSkeleton from '@/components/common/LoadingSkeleton'
import { getSupabase } from '@/lib/supabase/client'
import { AIChat, AIMessage } from '@/lib/types'

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.06, duration: 0.4, ease: 'easeOut' },
  }),
}

const QUICK_ACTIONS = [
  { label: 'Explain this', action: 'explain' },
  { label: 'Quiz me', action: 'quiz' },
  { label: 'Summarize', action: 'summarize' },
  { label: 'Give an example', action: 'example' },
  { label: 'Simplify', action: 'simplify' },
  { label: 'Solve step-by-step', action: 'solve' },
]

export default function TutorPage() {
  const router = useRouter()
  const [userId, setUserId] = useState<string | null>(null)
  const [chats, setChats] = useState<AIChat[]>([])
  const [activeChat, setActiveChat] = useState<string | null>(null)
  const [messages, setMessages] = useState<AIMessage[]>([])
  const [loading, setLoading] = useState(true)
  const [messagesLoading, setMessagesLoading] = useState(false)
  const [sending, setSending] = useState(false)
  const [input, setInput] = useState('')
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    const init = async () => {
      const { data: { session } } = await getSupabase().auth.getSession()
      if (!session?.user) { router.push('/login'); return }
      const uid = session.user.id
      setUserId(uid)
      await fetchChats(uid)
      setLoading(false)
    }
    init()
  }, [router])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const fetchChats = async (uid: string) => {
    const res = await fetch(`/api/tutor/chats?user_id=${uid}`)
    const data = await res.json()
    setChats(Array.isArray(data) ? data : [])
  }

  const loadMessages = async (chatId: string) => {
    setActiveChat(chatId)
    setMessagesLoading(true)
    setSidebarOpen(false)
    const res = await fetch(`/api/tutor/chats/${chatId}`)
    const data = await res.json()
    setMessages(Array.isArray(data) ? data : [])
    setMessagesLoading(false)
  }

  const createNewChat = async () => {
    if (!userId) return
    const res = await fetch('/api/tutor/chats', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ user_id: userId, title: 'New Chat' }),
    })
    if (res.ok) {
      const chat = await res.json()
      setChats((prev) => [chat, ...prev])
      setActiveChat(chat.id)
      setMessages([])
      setSidebarOpen(false)
    }
  }

  const deleteChat = async (chatId: string, e: React.MouseEvent) => {
    e.stopPropagation()
    await fetch(`/api/tutor/chats/${chatId}`, { method: 'DELETE' })
    setChats((prev) => prev.filter((c) => c.id !== chatId))
    if (activeChat === chatId) {
      setActiveChat(null)
      setMessages([])
    }
  }

  const sendMessage = async (content: string, quickAction?: string) => {
    if (!userId || !content.trim() || sending) return

    let chatId = activeChat
    if (!chatId) {
      const res = await fetch('/api/tutor/chats', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: userId, title: 'New Chat' }),
      })
      if (!res.ok) return
      const chat = await res.json()
      chatId = chat.id
      setActiveChat(chatId)
      setChats((prev) => [chat, ...prev])
    }

    const userMsg: AIMessage = {
      id: `temp-${Date.now()}`,
      chat_id: chatId!,
      role: 'user',
      content: content.trim(),
      created_at: new Date().toISOString(),
    }
    setMessages((prev) => [...prev, userMsg])
    setInput('')
    setSending(true)

    try {
      const res = await fetch('/api/tutor/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: chatId,
          user_id: userId,
          content: content.trim(),
          ...(quickAction && { quick_action: quickAction }),
        }),
      })

      if (res.ok) {
        const data = await res.json()
        setMessages((prev) => {
          const filtered = prev.filter((m) => m.id !== userMsg.id)
          return [...filtered, data.userMessage, data.aiMessage]
        })
        if (userId) await fetchChats(userId)
      }
    } catch {}
    setSending(false)
  }

  const handleQuickAction = (action: string, label: string) => {
    sendMessage(label, action === 'quiz' ? 'quiz' : undefined)
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage(input)
    }
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
      <div className="flex h-[calc(100vh-3.5rem)] md:h-screen overflow-hidden">
        {/* Mobile sidebar toggle */}
        <button
          onClick={() => setSidebarOpen(true)}
          className="md:hidden fixed top-[4.25rem] left-4 z-30 p-2 rounded-xl glass-card"
        >
          <Menu className="w-4 h-4" />
        </button>

        {/* Sidebar overlay (mobile) */}
        <AnimatePresence>
          {sidebarOpen && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/40 z-40 md:hidden"
              onClick={() => setSidebarOpen(false)}
            />
          )}
        </AnimatePresence>

        {/* Chat Sidebar */}
        <div
          className={`fixed md:static z-50 md:z-auto top-0 left-0 h-full w-64 border-r border-[var(--border)] bg-[var(--card-bg)] backdrop-blur-xl flex flex-col transition-transform md:translate-x-0 ${
            sidebarOpen ? 'translate-x-0' : '-translate-x-full'
          }`}
        >
          <div className="p-4 border-b border-[var(--border)]">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Bot className="w-5 h-5 text-cyan-500" />
                <h2 className="font-semibold text-sm">AI Tutor</h2>
              </div>
              <button
                onClick={() => setSidebarOpen(false)}
                className="md:hidden p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <button
              onClick={createNewChat}
              className="btn-primary w-full text-xs flex items-center justify-center gap-1.5"
            >
              <Plus className="w-3.5 h-3.5" />
              New Chat
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-2 space-y-1">
            {chats.map((chat) => (
              <button
                key={chat.id}
                onClick={() => loadMessages(chat.id)}
                className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors flex items-center gap-2 group ${
                  activeChat === chat.id
                    ? 'bg-cyan-500/10 text-cyan-600 dark:text-cyan-400'
                    : 'hover:bg-gray-100 dark:hover:bg-gray-800 text-[var(--foreground)]'
                }`}
              >
                <MessageSquare className="w-3.5 h-3.5 flex-shrink-0 opacity-50" />
                <span className="truncate flex-1">{chat.title}</span>
                <button
                  onClick={(e) => deleteChat(chat.id, e)}
                  className="opacity-0 group-hover:opacity-100 p-0.5 rounded hover:bg-red-100 dark:hover:bg-red-900/30 hover:text-red-500 transition-all"
                >
                  <Trash2 className="w-3 h-3" />
                </button>
              </button>
            ))}
            {chats.length === 0 && (
              <p className="text-xs text-[var(--muted)] text-center py-4">
                No conversations yet
              </p>
            )}
          </div>
        </div>

        {/* Main Chat Area */}
        <div className="flex-1 flex flex-col min-w-0">
          {/* Chat Header */}
          <div className="px-4 md:px-6 py-3 border-b border-[var(--border)] flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center">
              <Bot className="w-4 h-4 text-white" />
            </div>
            <div>
              <p className="text-sm font-semibold">AI Study Tutor</p>
              <p className="text-[10px] text-[var(--muted)]">Powered by Gemini</p>
            </div>
          </div>

          {/* Messages Area */}
          <div className="flex-1 overflow-y-auto px-4 md:px-6 py-4 space-y-4">
            {!activeChat && messages.length === 0 && (
              <motion.div
                variants={fadeUp}
                custom={0}
                initial="hidden"
                animate="visible"
                className="flex flex-col items-center justify-center h-full text-center"
              >
                <div className="w-16 h-16 rounded-full bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center mb-4">
                  <Sparkles className="w-7 h-7 text-white" />
                </div>
                <h2 className="text-lg font-bold">How can I help you study?</h2>
                <p className="text-sm text-[var(--muted)] mt-1 max-w-md">
                  Ask me anything about your coursework. I can explain concepts, quiz you, summarize notes, and more.
                </p>

                <div className="flex flex-wrap justify-center gap-2 mt-6">
                  {QUICK_ACTIONS.map((qa) => (
                    <button
                      key={qa.action}
                      onClick={() => handleQuickAction(qa.action, qa.label)}
                      className="px-3 py-1.5 rounded-full text-xs font-medium bg-gray-100 dark:bg-gray-800 text-[var(--muted)] hover:text-[var(--foreground)] hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                    >
                      {qa.label}
                    </button>
                  ))}
                </div>
              </motion.div>
            )}

            {messagesLoading && (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="w-6 h-6 text-cyan-500 animate-spin" />
              </div>
            )}

            {messages.map((msg, i) => (
              <motion.div
                key={msg.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.02 }}
                className={`flex gap-3 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                {msg.role === 'assistant' && (
                  <div className="w-7 h-7 rounded-full bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center flex-shrink-0 mt-1">
                    <Bot className="w-3.5 h-3.5 text-white" />
                  </div>
                )}
                <div
                  className={`max-w-[80%] rounded-2xl px-4 py-2.5 text-sm ${
                    msg.role === 'user'
                      ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-white rounded-br-md'
                      : 'bg-gray-100 dark:bg-gray-800 rounded-bl-md'
                  }`}
                >
                  {msg.role === 'assistant' ? (
                    <div className="markdown-content prose prose-sm dark:prose-invert max-w-none">
                      <ReactMarkdown remarkPlugins={[remarkGfm]}>
                        {msg.content}
                      </ReactMarkdown>
                    </div>
                  ) : (
                    <p className="leading-relaxed">{msg.content}</p>
                  )}
                </div>
              </motion.div>
            ))}

            {/* Typing indicator */}
            {sending && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex gap-3 justify-start"
              >
                <div className="w-7 h-7 rounded-full bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center flex-shrink-0 mt-1">
                  <Bot className="w-3.5 h-3.5 text-white" />
                </div>
                <div className="bg-gray-100 dark:bg-gray-800 rounded-2xl rounded-bl-md px-4 py-3 flex items-center gap-1.5">
                  <motion.div
                    className="w-2 h-2 rounded-full bg-gray-400"
                    animate={{ y: [0, -6, 0] }}
                    transition={{ repeat: Infinity, duration: 0.8, delay: 0 }}
                  />
                  <motion.div
                    className="w-2 h-2 rounded-full bg-gray-400"
                    animate={{ y: [0, -6, 0] }}
                    transition={{ repeat: Infinity, duration: 0.8, delay: 0.15 }}
                  />
                  <motion.div
                    className="w-2 h-2 rounded-full bg-gray-400"
                    animate={{ y: [0, -6, 0] }}
                    transition={{ repeat: Infinity, duration: 0.8, delay: 0.3 }}
                  />
                </div>
              </motion.div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Quick Actions (when chat is active) */}
          {activeChat && messages.length > 0 && (
            <div className="px-4 md:px-6 pb-2">
              <div className="flex overflow-x-auto gap-2 pb-1" style={{ scrollbarWidth: 'none' }}>
                {QUICK_ACTIONS.map((qa) => (
                  <button
                    key={qa.action}
                    onClick={() => handleQuickAction(qa.action, qa.label)}
                    disabled={sending}
                    className="px-3 py-1 rounded-full text-[11px] font-medium bg-gray-100 dark:bg-gray-800 text-[var(--muted)] hover:text-[var(--foreground)] hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors whitespace-nowrap flex-shrink-0 disabled:opacity-50"
                  >
                    {qa.label}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Input Area */}
          <div className="px-4 md:px-6 pb-4 pt-2 border-t border-[var(--border)]">
            <div className="flex items-end gap-2">
              <div className="flex-1 relative">
                <textarea
                  ref={inputRef}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Ask anything..."
                  rows={1}
                  className="input-field pr-10 resize-none min-h-[42px] max-h-[120px]"
                  style={{ height: 'auto', overflow: 'hidden' }}
                  onInput={(e) => {
                    const target = e.target as HTMLTextAreaElement
                    target.style.height = 'auto'
                    target.style.height = `${Math.min(target.scrollHeight, 120)}px`
                  }}
                />
              </div>
              <button
                onClick={() => sendMessage(input)}
                disabled={!input.trim() || sending}
                className="w-10 h-10 rounded-full bg-gradient-to-r from-cyan-500 to-blue-600 flex items-center justify-center text-white disabled:opacity-50 transition-opacity flex-shrink-0"
              >
                {sending ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Send className="w-4 h-4" />
                )}
              </button>
            </div>
            <p className="text-[10px] text-[var(--muted)] text-center mt-2">
              Powered by Gemini 2.0 Flash &middot; Responses may not always be accurate
            </p>
          </div>
        </div>
      </div>
    </AppShell>
  )
}
