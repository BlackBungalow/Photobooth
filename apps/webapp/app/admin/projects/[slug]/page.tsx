'use client';

import { useEffect, useState } from 'react';

interface Background {
  id: string;
  name: string;
  s3Key: string;
  isActive: boolean;
  sortOrder: number;
}

interface Project {
  id: string;
  name: string;
  slug: string;
  logoUrl?: string | null;
  messageBottom?: string | null;
  printEnabled: boolean;
  screenMode: 'GRID' | 'SLIDESHOW';
  screenSpeed: number;
  jpegQuality: number;
  cameraFacingMode: 'user' | 'environment';
  isS3Public: boolean;
  backgrounds: Background[];
}

export default function ProjectDetailPage({ params }: { params: { slug: string } }) {
  const [project, setProject] = useState<Project | null>(null);
  const [backgroundName, setBackgroundName] = useState('');
  const [backgroundKey, setBackgroundKey] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [backgroundFile, setBackgroundFile] = useState<File | null>(null);

  const loadProject = async () => {
    const response = await fetch(`/api/admin/projects/${params.slug}`);
    if (response.ok) {
      const data = await response.json();
      setProject(data.project);
    }
  };

  useEffect(() => {
    loadProject();
  }, []);

  const updateProject = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!project) {
      return;
    }

    const response = await fetch(`/api/admin/projects/${params.slug}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(project)
    });

    if (!response.ok) {
      setError('Impossible de sauvegarder');
      return;
    }

    setError(null);
    loadProject();
  };

  const addBackground = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    let s3Key = backgroundKey;

    if (backgroundFile) {
      setUploading(true);
      const presign = await fetch('/api/admin/uploads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          projectSlug: params.slug,
          filename: backgroundFile.name,
          contentType: backgroundFile.type || 'image/jpeg'
        })
      });

      if (!presign.ok) {
        setUploading(false);
        return;
      }

      const { uploadUrl, key } = await presign.json();
      await fetch(uploadUrl, {
        method: 'PUT',
        body: backgroundFile,
        headers: { 'Content-Type': backgroundFile.type || 'image/jpeg' }
      });
      s3Key = key;
      setBackgroundKey('');
      setBackgroundFile(null);
    }

    const response = await fetch(`/api/admin/projects/${params.slug}/backgrounds`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: backgroundName, s3Key, isActive: true, sortOrder: 0 })
    });

    if (response.ok) {
      setBackgroundName('');
      loadProject();
    }
    setUploading(false);
  };

  if (!project) {
    return <main className="min-h-screen px-6 py-10">Chargement...</main>;
  }

  return (
    <main className="min-h-screen px-6 py-10">
      <header className="mb-8">
        <h1 className="text-3xl font-semibold">Projet {project.name}</h1>
        <p className="text-gray-400">Slug: {project.slug}</p>
      </header>

      <form onSubmit={updateProject} className="grid gap-4 rounded-xl bg-gray-900 p-6 md:grid-cols-2">
        <label className="flex flex-col text-sm text-gray-300">
          Nom
          <input
            value={project.name}
            onChange={(event) => setProject({ ...project, name: event.target.value })}
            className="mt-2 rounded bg-white px-3 py-2"
          />
        </label>
        <label className="flex flex-col text-sm text-gray-300">
          Slug
          <input
            value={project.slug}
            onChange={(event) => setProject({ ...project, slug: event.target.value })}
            className="mt-2 rounded bg-white px-3 py-2"
          />
        </label>
        <label className="flex flex-col text-sm text-gray-300">
          Logo URL
          <input
            value={project.logoUrl ?? ''}
            onChange={(event) => setProject({ ...project, logoUrl: event.target.value })}
            className="mt-2 rounded bg-white px-3 py-2"
          />
        </label>
        <label className="flex flex-col text-sm text-gray-300">
          Message bas
          <input
            value={project.messageBottom ?? ''}
            onChange={(event) => setProject({ ...project, messageBottom: event.target.value })}
            className="mt-2 rounded bg-white px-3 py-2"
          />
        </label>
        <label className="flex flex-col text-sm text-gray-300">
          Mode écran
          <select
            value={project.screenMode}
            onChange={(event) => setProject({ ...project, screenMode: event.target.value as Project['screenMode'] })}
            className="mt-2 rounded bg-white px-3 py-2"
          >
            <option value="GRID">Grille</option>
            <option value="SLIDESHOW">Slideshow</option>
          </select>
        </label>
        <label className="flex flex-col text-sm text-gray-300">
          Vitesse écran (sec)
          <input
            type="number"
            value={project.screenSpeed}
            onChange={(event) => setProject({ ...project, screenSpeed: Number(event.target.value) })}
            className="mt-2 rounded bg-white px-3 py-2"
          />
        </label>
        <label className="flex flex-col text-sm text-gray-300">
          Qualité JPEG
          <input
            type="number"
            step="0.01"
            value={project.jpegQuality}
            onChange={(event) => setProject({ ...project, jpegQuality: Number(event.target.value) })}
            className="mt-2 rounded bg-white px-3 py-2"
          />
        </label>
        <label className="flex flex-col text-sm text-gray-300">
          Caméra
          <select
            value={project.cameraFacingMode}
            onChange={(event) => setProject({ ...project, cameraFacingMode: event.target.value as Project['cameraFacingMode'] })}
            className="mt-2 rounded bg-white px-3 py-2"
          >
            <option value="user">Front</option>
            <option value="environment">Back</option>
          </select>
        </label>
        <label className="flex items-center gap-3 text-sm text-gray-300">
          <input
            type="checkbox"
            checked={project.printEnabled}
            onChange={(event) => setProject({ ...project, printEnabled: event.target.checked })}
          />
          Impression activée
        </label>
        <label className="flex items-center gap-3 text-sm text-gray-300">
          <input
            type="checkbox"
            checked={project.isS3Public}
            onChange={(event) => setProject({ ...project, isS3Public: event.target.checked })}
          />
          S3 public
        </label>
        <button type="submit" className="rounded bg-brand-500 px-4 py-2 font-semibold text-white">
          Sauvegarder
        </button>
        {error && <p className="text-sm text-red-300">{error}</p>}
      </form>

      <section className="mt-10">
        <h2 className="text-2xl font-semibold">Décors</h2>
        <form onSubmit={addBackground} className="mt-4 grid gap-4 rounded-xl bg-gray-900 p-6 md:grid-cols-3">
          <label className="flex flex-col text-sm text-gray-300">
            Nom
            <input value={backgroundName} onChange={(event) => setBackgroundName(event.target.value)} className="mt-2 rounded bg-white px-3 py-2" />
          </label>
          <label className="flex flex-col text-sm text-gray-300">
            S3 key
            <input value={backgroundKey} onChange={(event) => setBackgroundKey(event.target.value)} className="mt-2 rounded bg-white px-3 py-2" />
          </label>
          <label className="flex flex-col text-sm text-gray-300">
            Upload image
            <input type="file" accept="image/*" onChange={(event) => setBackgroundFile(event.target.files?.[0] ?? null)} className="mt-2 rounded bg-white px-3 py-2" />
          </label>
          <button type="submit" className="self-end rounded bg-brand-500 px-4 py-2 font-semibold text-white">
            {uploading ? 'Upload...' : 'Ajouter'}
          </button>
        </form>
        <div className="mt-4 grid gap-3">
          {project.backgrounds.map((bg) => (
            <div key={bg.id} className="rounded-lg bg-gray-900 p-4 text-sm text-gray-200">
              <p className="font-semibold">{bg.name}</p>
              <p className="text-gray-400">{bg.s3Key}</p>
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}
