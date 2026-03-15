'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Play, Pause, RotateCcw, Timer } from 'lucide-react';

const POMODORO_DURATION = 25 * 60; // 25 minutes in seconds

export default function PomodoroTimer() {
  const [expanded, setExpanded] = useState(false);
  const [timeLeft, setTimeLeft] = useState(POMODORO_DURATION);
  const [running, setRunning] = useState(false);
  const [completed, setCompleted] = useState(0);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const playBeep = useCallback(() => {
    try {
      const ctx = new AudioContext();
      const oscillator = ctx.createOscillator();
      const gainNode = ctx.createGain();
      oscillator.connect(gainNode);
      gainNode.connect(ctx.destination);
      oscillator.frequency.value = 800;
      oscillator.type = 'sine';
      gainNode.gain.value = 0.3;
      oscillator.start();
      setTimeout(() => {
        oscillator.stop();
        ctx.close();
      }, 200);
    } catch {
      // Web Audio API not available
    }
  }, []);

  useEffect(() => {
    if (running && timeLeft > 0) {
      intervalRef.current = setInterval(() => {
        setTimeLeft((prev) => prev - 1);
      }, 1000);
    } else if (timeLeft === 0 && running) {
      setRunning(false);
      setCompleted((prev) => prev + 1);
      playBeep();
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [running, timeLeft, playBeep]);

  const handleStart = () => setRunning(true);
  const handlePause = () => setRunning(false);
  const handleReset = () => {
    setRunning(false);
    setTimeLeft(POMODORO_DURATION);
  };

  return (
    <div className="fixed bottom-6 right-6 z-50 md:bottom-6 md:right-6 bottom-24 right-4">
      <AnimatePresence mode="wait">
        {expanded ? (
          <motion.div
            key="expanded"
            initial={{ opacity: 0, scale: 0.8, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.8, y: 20 }}
            transition={{ type: 'spring', stiffness: 400, damping: 30 }}
            className="bg-white dark:bg-gray-900 rounded-2xl shadow-xl border border-[var(--border)] p-5 w-[220px]"
          >
            {/* Header */}
            <button
              onClick={() => setExpanded(false)}
              className="flex items-center gap-2 text-sm font-semibold text-[var(--foreground)] mb-4 hover:text-cyan-500 transition-colors"
            >
              <Timer className="w-4 h-4" />
              Pomodoro
            </button>

            {/* Timer display */}
            <div className="text-center mb-4">
              <p className="text-4xl font-bold text-[var(--foreground)] tabular-nums">
                {formatTime(timeLeft)}
              </p>
              {completed > 0 && (
                <p className="text-xs text-[var(--muted)] mt-1">
                  {completed} session{completed !== 1 ? 's' : ''} completed
                </p>
              )}
            </div>

            {/* Controls */}
            <div className="flex items-center justify-center gap-2">
              {running ? (
                <button
                  onClick={handlePause}
                  className="p-2.5 rounded-xl bg-amber-50 dark:bg-amber-900/20 text-amber-600 hover:bg-amber-100 dark:hover:bg-amber-900/30 transition-colors"
                >
                  <Pause className="w-5 h-5" />
                </button>
              ) : (
                <button
                  onClick={handleStart}
                  className="p-2.5 rounded-xl bg-cyan-50 dark:bg-cyan-900/20 text-cyan-600 hover:bg-cyan-100 dark:hover:bg-cyan-900/30 transition-colors"
                >
                  <Play className="w-5 h-5" />
                </button>
              )}
              <button
                onClick={handleReset}
                className="p-2.5 rounded-xl bg-gray-50 dark:bg-gray-800 text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              >
                <RotateCcw className="w-5 h-5" />
              </button>
            </div>
          </motion.div>
        ) : (
          <motion.button
            key="mini"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setExpanded(true)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-full bg-white dark:bg-gray-900 shadow-lg border border-[var(--border)] text-sm font-medium text-[var(--foreground)] hover:shadow-xl transition-shadow"
          >
            {running ? (
              <span className="w-2 h-2 rounded-full bg-cyan-500 animate-pulse" />
            ) : (
              <Timer className="w-4 h-4 text-cyan-500" />
            )}
            <span className="tabular-nums">{formatTime(timeLeft)}</span>
          </motion.button>
        )}
      </AnimatePresence>
    </div>
  );
}
