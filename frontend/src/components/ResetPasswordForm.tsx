'use client';

import { FormEvent, useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';

const apiBase = import.meta.env.VITE_API_URL || '/api';

export default function ResetPasswordForm() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');

  const [newPassword, setNewPassword] = useState('');
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (!token) {
      setMessage('Invalid or missing reset token.');
    }
  }, [token]);

  async function resetPassword(event: FormEvent) {
    event.preventDefault();
    if (!token) return;

    setMessage('Resetting password...');

    try {
      const response = await fetch(`${apiBase}/auth/reset-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, newPassword }),
      });

      const body = await response.json();
      if (response.ok) {
        setMessage('Password reset successfully! You can now log in.');
        setTimeout(() => navigate('/auth/login'), 2000);
      } else {
        setMessage(body.message || 'Failed to reset password');
      }
    } catch {
      setMessage('Failed to reset password');
    }
  }

  return (
    <div className="mx-auto max-w-md rounded-md bg-white p-6 border border-secondary-bg">
      <h1 className="text-2xl font-black">Choose New Password</h1>

      {!token ? (
        <p className="mt-4 text-secondary-text">{message}</p>
      ) : (
        <>
          <p className="mt-2 text-sm text-slate-600">Enter your new password below.</p>
          <form onSubmit={resetPassword} className="mt-4 space-y-3">
            <input
              type="password"
              required
              value={newPassword}
              onChange={(event) => setNewPassword(event.target.value)}
              placeholder="New Password (min 8 chars)"
              className="w-full rounded border px-3 py-2"
            />
            <button className="w-full rounded bg-foreground hover:bg-black px-4 py-2 font-semibold text-white mt-4">Confirm Reset</button>
          </form>
        </>
      )}

      {message && token ? <p className="mt-3 text-sm text-center text-slate-700">{message}</p> : null}

      <div className="mt-4 text-center text-sm">
        <Link to="/auth/login" className="text-foreground hover:underline">Back to Login</Link>
      </div>
    </div>
  );
}
