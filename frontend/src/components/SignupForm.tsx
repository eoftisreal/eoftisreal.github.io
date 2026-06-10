'use client';

import { FormEvent, useState } from 'react';
import { Link } from 'react-router-dom';

const apiBase = import.meta.env.VITE_API_URL || '/api';

export default function SignupForm() {
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [message, setMessage] = useState('');
  const [success, setSuccess] = useState(false);

  async function submit(event: FormEvent) {
    event.preventDefault();
    setMessage('Creating account...');

    try {
      const response = await fetch(`${apiBase}/auth/signup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, username, password, name }),
      });

      const body = await response.json();
      if (response.ok) {
        setSuccess(true);
      } else {
        if (body.details && body.details.fieldErrors) {
          const errors = Object.values(body.details.fieldErrors).flat();
          if (errors.length > 0) {
            setMessage(errors.join(', '));
            return;
          }
        }
        setMessage(body.message || 'Failed to create account');
      }
    } catch {
      setMessage('Failed to create account');
    }
  }

  if (success) {
    return (
      <div className="mx-auto max-w-md rounded-md bg-white p-6 text-center">
        <h1 className="text-2xl font-black text-foreground">Account Created!</h1>
        <p className="mt-4 text-slate-600">
          We have sent a verification email to <strong>{email}</strong>.
          Please click the link in the email to verify your account before logging in.
        </p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-md rounded-md bg-white p-6 border border-secondary-bg">
      <h1 className="text-2xl font-black">Create an Account</h1>
      <form onSubmit={submit} className="mt-4 space-y-3">
        <input
          type="email"
          required
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          placeholder="Email Address"
          className="w-full rounded border px-3 py-2"
        />
        <input
          type="text"
          required
          value={username}
          onChange={(event) => setUsername(event.target.value)}
          placeholder="Unique Username"
          className="w-full rounded border px-3 py-2"
        />
        <input
          type="text"
          value={name}
          onChange={(event) => setName(event.target.value)}
          placeholder="Full Name (Optional)"
          className="w-full rounded border px-3 py-2"
        />
        <input
          type="password"
          required
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          placeholder="Password (min 8 chars)"
          className="w-full rounded border px-3 py-2"
        />
        <button className="w-full rounded bg-foreground hover:bg-black px-4 py-2 font-semibold text-white">Create Account</button>
      </form>

      {message ? <p className="mt-3 text-sm text-center text-secondary-text">{message}</p> : null}

      <div className="mt-4 text-center text-sm">
        <Link to="/auth/login" className="text-foreground hover:underline">Already have an account? Log in</Link>
      </div>
    </div>
  );
}
