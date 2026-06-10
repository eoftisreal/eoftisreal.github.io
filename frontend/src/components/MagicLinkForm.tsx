'use client';

import { FormEvent, useState } from 'react';
import { Link } from 'react-router-dom';

const apiBase = import.meta.env.VITE_API_URL || '/api';

export default function MagicLinkForm() {
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');

  async function requestMagicLink(event: FormEvent) {
    event.preventDefault();
    setMessage('Sending magic link...');

    try {
      await fetch(`${apiBase}/auth/magic-link/request`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });

      setMessage('If an account exists, a secure magic sign-in link has been sent to your email.');
    } catch {
      setMessage('Failed to send magic link');
    }
  }

  return (
    <div className="mx-auto max-w-md rounded-md bg-white p-6 border border-secondary-bg">
      <h1 className="text-2xl font-black">Passwordless Login</h1>
      <p className="mt-2 text-sm text-slate-600">Enter your email to receive a secure sign-in link.</p>

      <form onSubmit={requestMagicLink} className="mt-4 space-y-3">
        <input
          type="email"
          required
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          placeholder="Email Address"
          className="w-full rounded border px-3 py-2"
        />
        <button className="w-full rounded bg-foreground hover:bg-black px-4 py-2 font-semibold text-white">Send Magic Link</button>
      </form>

      {message ? <p className="mt-3 text-sm text-center text-slate-700">{message}</p> : null}

      <div className="mt-4 text-center text-sm">
        <Link to="/auth/login" className="text-foreground hover:underline">Back to Login</Link>
      </div>
    </div>
  );
}
