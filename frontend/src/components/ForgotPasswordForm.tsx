'use client';

import { FormEvent, useState } from 'react';
import { Link } from 'react-router-dom';

const apiBase = import.meta.env.VITE_API_URL || '/api';

export default function ForgotPasswordForm() {
  const [identifier, setIdentifier] = useState('');
  const [message, setMessage] = useState('');

  async function requestReset(event: FormEvent) {
    event.preventDefault();
    setMessage('Sending reset link...');

    try {
      await fetch(`${apiBase}/auth/forgot-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ identifier }),
      });

      // Always show success to prevent enumeration
      setMessage('If an account exists, a password reset link has been sent to the registered email.');
    } catch {
      setMessage('Failed to request password reset');
    }
  }

  return (
    <div className="mx-auto max-w-md rounded-md bg-white p-6 border border-secondary-bg">
      <h1 className="text-2xl font-black">Reset Password</h1>
      <p className="mt-2 text-sm text-slate-600">Enter your email or username to receive a password reset link via email.</p>

      <form onSubmit={requestReset} className="mt-4 space-y-3">
        <input
          type="text"
          required
          value={identifier}
          onChange={(event) => setIdentifier(event.target.value)}
          placeholder="Email or Username"
          className="w-full rounded border px-3 py-2"
        />
        <button className="w-full rounded bg-foreground hover:bg-black px-4 py-2 font-semibold text-white">Send Reset Link</button>
      </form>

      {message ? <p className="mt-3 text-sm text-center text-slate-700">{message}</p> : null}

      <div className="mt-4 text-center text-sm">
        <Link to="/auth/login" className="text-foreground hover:underline">Back to Login</Link>
      </div>
    </div>
  );
}
