'use client';

import { useEffect, useMemo, useState } from 'react';
import { io, Socket } from 'socket.io-client';

interface Photo {
  id: string;
  publicUrl?: string | null;
  createdAt: string;
}

interface Project {
  name: string;
  slug: string;
  screenMode: 'GRID' | 'SLIDESHOW';
  screenSpeed: number;
}

export default function ScreenPage({ params }: { params: { slug: string } }) {
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [project, setProject] = useState<Project | null>(null);
  const socketUrl = useMemo(() => process.env.NEXT_PUBLIC_WEBSOCKET_URL ?? '', []);

  useEffect(() => {
    const loadProject = async () => {
      const response = await fetch(`/api/projects/${params.slug}`);
      if (response.ok) {
        const data = await response.json();
        setProject(data.project);
      }
    };

    const loadPhotos = async () => {
      const response = await fetch(`/api/photos?slug=${params.slug}`);
      if (response.ok) {
        const data = await response.json();
        setPhotos(data.photos ?? []);
      }
    };

    loadProject();
    loadPhotos();
  }, [params.slug]);

  useEffect(() => {
    const socket: Socket = io(socketUrl || window.location.origin, {
      transports: ['websocket']
    });

    socket.emit('join', params.slug);
    socket.on('photo:new', (payload: Photo) => {
      setPhotos((prev) => [payload, ...prev].slice(0, 30));
    });

    return () => {
      socket.disconnect();
    };
  }, [params.slug, socketUrl]);

  if (!project) {
    return <main className="min-h-screen bg-black text-white">Chargement...</main>;
  }

  return (
    <main className="min-h-screen bg-black text-white">
      <header className="px-6 py-4">
        <h1 className="text-2xl font-semibold">{project.name}</h1>
      </header>
      {project.screenMode === 'GRID' ? (
        <div className="grid grid-cols-2 gap-4 px-6 pb-10 md:grid-cols-3">
          {photos.map((photo) => (
            <div key={photo.id} className="aspect-[3/2] overflow-hidden rounded-lg bg-gray-800">
              {photo.publicUrl ? (
                <img src={photo.publicUrl} alt="photo" className="h-full w-full object-cover" />
              ) : (
                <div className="flex h-full w-full items-center justify-center text-sm text-gray-400">
                  Image indisponible
                </div>
              )}
            </div>
          ))}
        </div>
      ) : (
        <Slideshow photos={photos} interval={project.screenSpeed * 1000} />
      )}
    </main>
  );
}

function Slideshow({ photos, interval }: { photos: Photo[]; interval: number }) {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    if (photos.length === 0) return;
    const timer = setInterval(() => {
      setIndex((prev) => (prev + 1) % photos.length);
    }, interval);
    return () => clearInterval(timer);
  }, [photos, interval]);

  const photo = photos[index];

  return (
    <div className="flex h-[80vh] items-center justify-center px-6">
      {photo?.publicUrl ? (
        <img src={photo.publicUrl} alt="slideshow" className="max-h-full max-w-full rounded-xl object-contain" />
      ) : (
        <div className="text-gray-400">Aucune photo</div>
      )}
    </div>
  );
}
