import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function generateClassCode(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
  let code = ''
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return code
}

export function formatDate(date: string | Date): string {
  return new Date(date).toLocaleDateString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric'
  })
}

export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i]
}

export function getGreeting(): string {
  const hour = new Date().getHours()
  if (hour < 12) return 'Good morning'
  if (hour < 17) return 'Good afternoon'
  return 'Good evening'
}

export function getFileIcon(type: string): { color: string; bg: string } {
  const map: Record<string, { color: string; bg: string }> = {
    pdf: { color: 'text-red-600', bg: 'bg-red-100 dark:bg-red-900/30' },
    docx: { color: 'text-blue-600', bg: 'bg-blue-100 dark:bg-blue-900/30' },
    doc: { color: 'text-blue-600', bg: 'bg-blue-100 dark:bg-blue-900/30' },
    txt: { color: 'text-gray-600', bg: 'bg-gray-100 dark:bg-gray-800' },
    png: { color: 'text-green-600', bg: 'bg-green-100 dark:bg-green-900/30' },
    jpg: { color: 'text-green-600', bg: 'bg-green-100 dark:bg-green-900/30' },
    jpeg: { color: 'text-green-600', bg: 'bg-green-100 dark:bg-green-900/30' },
  }
  return map[type.toLowerCase()] || { color: 'text-gray-600', bg: 'bg-gray-100 dark:bg-gray-800' }
}

export function getEventTypeColor(type: string): string {
  const map: Record<string, string> = {
    class: 'border-blue-500 bg-blue-50 dark:bg-blue-900/20',
    study: 'border-green-500 bg-green-50 dark:bg-green-900/20',
    exam: 'border-red-500 bg-red-50 dark:bg-red-900/20',
    ai_block: 'border-purple-500 bg-purple-50 dark:bg-purple-900/20',
  }
  return map[type] || 'border-gray-500 bg-gray-50 dark:bg-gray-900/20'
}

export const CLASS_COLORS = [
  '#0EA5E9', '#10B981', '#F59E0B', '#8B5CF6',
  '#EF4444', '#EC4899', '#06B6D4', '#84CC16'
]

export const SUBJECTS = [
  'Math', 'Science', 'English', 'History', 'Computer Science',
  'Physics', 'Chemistry', 'Biology', 'Literature', 'Art', 'Music', 'Other'
]
