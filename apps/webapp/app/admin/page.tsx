'use client';

import { useState } from 'react';

export default function AdminLoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);

  const submit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);

    const response = await fetch('/api/admin/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });

    if (!response.ok) {
      setError('Identifiants invalides');
      return;
    }

    window.location.href = '/admin/projects';
  };

  return (
    <main className="flex min-h-screen items-center justify-center px-6">
      <form onSubmit={submit} className="w-full max-w-md space-y-4 rounded-xl bg-gray-900 p-6 shadow">
        <h1 className="text-2xl font-semibold">Admin Photobooth</h1>
        <label className="block text-sm font-medium text-gray-300">
          Email
          <input
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            className="mt-1 w-full rounded bg-white px-3 py-2"
            required
          />
        </label>
        <label className="block text-sm font-medium text-gray-300">
          Mot de passe
          <input
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            className="mt-1 w-full rounded bg-white px-3 py-2"
            required
          />
        </label>
        {error && <p className="text-sm text-red-300">{error}</p>}
        <button type="submit" className="w-full rounded bg-brand-500 px-4 py-2 font-semibold text-white">
          Se connecter
        </button>
      </form>
    </main>
  );
}
