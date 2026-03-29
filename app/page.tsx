'use client';

import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
import {
  Bot,
  Library,
  BookOpen,
  Layers,
  CalendarDays,
  BarChart3,
  ArrowRight,
  Play,
} from 'lucide-react';

const features = [
  {
    icon: Bot,
    title: 'AI Tutor',
    description:
      'Get instant help with homework, concepts, and exam prep from your personal AI tutor.',
    color: 'bg-purple-100 dark:bg-purple-900/30 text-purple-600',
  },
  {
    icon: Library,
    title: 'Smart Library',
    description:
      'Upload notes, PDFs, and documents. Get AI summaries and organize everything by class.',
    color: 'bg-blue-100 dark:bg-blue-900/30 text-blue-600',
  },
  {
    icon: BookOpen,
    title: 'Class Management',
    description:
      'Create and join classes, share materials, and collaborate with classmates.',
    color: 'bg-cyan-100 dark:bg-cyan-900/30 text-cyan-600',
  },
  {
    icon: Layers,
    title: 'Flashcards',
    description:
      'Auto-generate flashcards from your notes and study with spaced repetition.',
    color: 'bg-amber-100 dark:bg-amber-900/30 text-amber-600',
  },
  {
    icon: CalendarDays,
    title: 'Calendar',
    description:
      'Plan your study schedule, track exams, and let AI optimize your time blocks.',
    color: 'bg-green-100 dark:bg-green-900/30 text-green-600',
  },
  {
    icon: BarChart3,
    title: 'Study Analytics',
    description:
      'Track your study streaks, time spent, and progress across all subjects.',
    color: 'bg-rose-100 dark:bg-rose-900/30 text-rose-600',
  },
];

const testimonials = [
  {
    name: 'Sarah Chen',
    role: 'Computer Science Student',
    quote:
      'InGen completely changed how I study. The AI tutor helped me ace my algorithms exam!',
  },
  {
    name: 'Marcus Johnson',
    role: 'High School Teacher',
    quote:
      'Managing my classes and sharing materials with students has never been easier.',
  },
  {
    name: 'Emily Rodriguez',
    role: 'Pre-Med Student',
    quote:
      'The flashcard generator saves me hours. I just upload my notes and it does the rest.',
  },
];

const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0 },
};

const stagger = {
  visible: {
    transition: {
      staggerChildren: 0.1,
    },
  },
};

export default function LandingPage() {
  const router = useRouter();

  return (
    <div className="min-h-screen">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 backdrop-blur-xl bg-white/70 dark:bg-gray-900/70 border-b border-[var(--border)]">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <svg
              width="32"
              height="32"
              viewBox="0 0 36 36"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <defs>
                <linearGradient id="navLogoGrad" x1="0" y1="0" x2="36" y2="36">
                  <stop offset="0%" stopColor="#06b6d4" />
                  <stop offset="100%" stopColor="#2563eb" />
                </linearGradient>
              </defs>
              <rect width="36" height="36" rx="10" fill="url(#navLogoGrad)" />
              <path
                d="M18 10L8 16L18 22L28 16L18 10Z"
                fill="white"
                fillOpacity="0.9"
              />
              <path
                d="M8 16V22L18 28L28 22V16"
                stroke="white"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                fill="none"
              />
              <path
                d="M28 16V24"
                stroke="white"
                strokeWidth="1.5"
                strokeLinecap="round"
              />
            </svg>
            <span className="text-xl font-bold text-[var(--foreground)]">
              InGen
            </span>
          </div>
          <div className="flex items-center gap-3">
            <Link
              href="/login"
              className="px-4 py-2 text-sm font-medium text-[var(--foreground)] hover:text-cyan-600 transition-colors"
            >
              Sign In
            </Link>
            <Link href="/signup" className="btn-primary text-sm">
              Get Started
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-32 pb-20 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <motion.div
            initial="hidden"
            animate="visible"
            variants={stagger}
          >
            <motion.h1
              variants={fadeUp}
              transition={{ duration: 0.6 }}
              className="text-5xl md:text-7xl font-bold leading-tight mb-6"
            >
              <span className="bg-gradient-to-r from-cyan-500 to-blue-600 bg-clip-text text-transparent">
                Learn Smarter,
              </span>
              <br />
              <span className="text-[var(--foreground)]">Together</span>
            </motion.h1>

            <motion.p
              variants={fadeUp}
              transition={{ duration: 0.6, delay: 0.1 }}
              className="text-lg md:text-xl text-[var(--muted)] mb-10 max-w-2xl mx-auto"
            >
              Your AI-powered learning companion for classes, notes, flashcards,
              and more.
            </motion.p>

            <motion.div
              variants={fadeUp}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="flex flex-col sm:flex-row items-center justify-center gap-4"
            >
              <Link
                href="/dashboard"
                className="btn-primary text-base px-8 py-3 flex items-center gap-2"
              >
                Get Started Free
                <ArrowRight className="w-4 h-4" />
              </Link>
              <button className="btn-outline text-base px-8 py-3 flex items-center gap-2">
                <Play className="w-4 h-4" />
                Watch Demo
              </button>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-20 px-6">
        <div className="max-w-6xl mx-auto">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: '-100px' }}
            variants={stagger}
            className="text-center mb-14"
          >
            <motion.h2
              variants={fadeUp}
              className="text-3xl md:text-4xl font-bold text-[var(--foreground)] mb-4"
            >
              Everything you need to succeed
            </motion.h2>
            <motion.p
              variants={fadeUp}
              className="text-[var(--muted)] text-lg max-w-xl mx-auto"
            >
              Powerful tools designed to help you study smarter, not harder.
            </motion.p>
          </motion.div>

          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: '-50px' }}
            variants={stagger}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
          >
            {features.map((feature) => {
              const Icon = feature.icon;
              return (
                <motion.div
                  key={feature.title}
                  variants={fadeUp}
                  transition={{ duration: 0.5 }}
                  className="glass-card p-6 hover:shadow-lg transition-shadow"
                >
                  <div
                    className={`w-12 h-12 rounded-xl ${feature.color} flex items-center justify-center mb-4`}
                  >
                    <Icon className="w-6 h-6" />
                  </div>
                  <h3 className="font-semibold text-[var(--foreground)] mb-2">
                    {feature.title}
                  </h3>
                  <p className="text-sm text-[var(--muted)] leading-relaxed">
                    {feature.description}
                  </p>
                </motion.div>
              );
            })}
          </motion.div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-20 px-6">
        <div className="max-w-6xl mx-auto">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: '-100px' }}
            variants={stagger}
            className="text-center mb-14"
          >
            <motion.h2
              variants={fadeUp}
              className="text-3xl md:text-4xl font-bold text-[var(--foreground)] mb-4"
            >
              Loved by students & teachers
            </motion.h2>
          </motion.div>

          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: '-50px' }}
            variants={stagger}
            className="grid grid-cols-1 md:grid-cols-3 gap-6"
          >
            {testimonials.map((t) => (
              <motion.div
                key={t.name}
                variants={fadeUp}
                transition={{ duration: 0.5 }}
                className="glass-card p-6"
              >
                <p className="text-sm text-[var(--muted)] leading-relaxed mb-4 italic">
                  &ldquo;{t.quote}&rdquo;
                </p>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-cyan-400 to-blue-500 flex items-center justify-center text-white text-sm font-semibold">
                    {t.name
                      .split(' ')
                      .map((n) => n[0])
                      .join('')}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-[var(--foreground)]">
                      {t.name}
                    </p>
                    <p className="text-xs text-[var(--muted)]">{t.role}</p>
                  </div>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-10 px-6 border-t border-[var(--border)]">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-sm text-[var(--muted)]">
            Built with <span className="font-semibold text-[var(--foreground)]">InGen</span>
          </p>
          <div className="flex items-center gap-6 text-sm text-[var(--muted)]">
            <a href="#" className="hover:text-[var(--foreground)] transition-colors">
              About
            </a>
            <a href="#" className="hover:text-[var(--foreground)] transition-colors">
              Privacy
            </a>
            <a href="#" className="hover:text-[var(--foreground)] transition-colors">
              Terms
            </a>
            <a href="#" className="hover:text-[var(--foreground)] transition-colors">
              Contact
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}
