'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function SignupPage() {
  const router = useRouter();
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fullName, email, password }),
      });
      if (res.ok) {
        router.push('/dashboard');
      } else {
        const data = await res.json();
        setError(data.error || 'Failed to sign up');
      }
    } catch (err) {
      setError('An error occurred');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center gradient-bg px-6">
      <div className="glass-card w-full max-w-md p-8">
        <h2 className="text-2xl font-bold mb-6 text-center text-[var(--foreground)]">Create an Account</h2>
        {error && <p className="text-red-500 mb-4 text-sm text-center">{error}</p>}
        <form onSubmit={handleSignup} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1 text-[var(--foreground)]">Full Name</label>
            <input
              type="text"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className="w-full px-4 py-2 rounded-lg border border-[var(--border)] bg-white/50 dark:bg-gray-900/50 focus:ring-2 focus:ring-cyan-500 outline-none"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1 text-[var(--foreground)]">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-2 rounded-lg border border-[var(--border)] bg-white/50 dark:bg-gray-900/50 focus:ring-2 focus:ring-cyan-500 outline-none"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1 text-[var(--foreground)]">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-2 rounded-lg border border-[var(--border)] bg-white/50 dark:bg-gray-900/50 focus:ring-2 focus:ring-cyan-500 outline-none"
              required
            />
          </div>
          <button type="submit" className="w-full btn-primary py-2 mt-2">
            Sign Up
          </button>
        </form>
        <p className="mt-6 text-center text-sm text-[var(--muted)]">
          Already have an account? <Link href="/login" className="text-cyan-600 font-medium">Sign in</Link>
        </p>
      </div>
    </div>
  );
}
