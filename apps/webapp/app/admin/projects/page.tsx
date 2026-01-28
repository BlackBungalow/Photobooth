'use client';

import { useEffect, useState } from 'react';

interface Project {
  id: string;
  name: string;
  slug: string;
  screenMode: 'GRID' | 'SLIDESHOW';
  printEnabled: boolean;
}

export default function ProjectsPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [error, setError] = useState<string | null>(null);

  const loadProjects = async () => {
    const response = await fetch('/api/admin/projects');
    if (response.ok) {
      const data = await response.json();
      setProjects(data.projects ?? []);
    }
  };

  useEffect(() => {
    loadProjects();
  }, []);

  const submit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    const response = await fetch('/api/admin/projects', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, slug })
    });

    if (!response.ok) {
      setError('Impossible de créer le projet');
      return;
    }

    setName('');
    setSlug('');
    loadProjects();
  };

  return (
    <main className="min-h-screen px-6 py-10">
      <header className="mb-8">
        <h1 className="text-3xl font-semibold">Projets</h1>
      </header>

      <form onSubmit={submit} className="mb-10 grid gap-4 rounded-xl bg-gray-900 p-6 md:grid-cols-3">
        <label className="flex flex-col text-sm text-gray-300">
          Nom du projet
          <input value={name} onChange={(event) => setName(event.target.value)} className="mt-2 rounded bg-white px-3 py-2" required />
        </label>
        <label className="flex flex-col text-sm text-gray-300">
          Slug
          <input value={slug} onChange={(event) => setSlug(event.target.value)} className="mt-2 rounded bg-white px-3 py-2" required />
        </label>
        <button type="submit" className="self-end rounded bg-brand-500 px-4 py-2 font-semibold text-white">
          Créer
        </button>
        {error && <p className="text-sm text-red-300">{error}</p>}
      </form>

      <section className="grid gap-4">
        {projects.map((project) => (
          <a key={project.id} href={`/admin/projects/${project.slug}`} className="rounded-xl bg-gray-900 p-4 hover:bg-gray-800">
            <h2 className="text-xl font-semibold">{project.name}</h2>
            <p className="text-sm text-gray-400">Slug: {project.slug}</p>
            <p className="text-sm text-gray-400">Mode écran: {project.screenMode}</p>
            <p className="text-sm text-gray-400">Impression: {project.printEnabled ? 'activée' : 'désactivée'}</p>
          </a>
        ))}
      </section>
    </main>
  );
}
