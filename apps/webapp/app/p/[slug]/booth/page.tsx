'use client';

import { useEffect, useRef, useState } from 'react';

interface Background {
  id: string;
  name: string;
  s3Key: string;
  publicUrl?: string | null;
}

interface Project {
  name: string;
  slug: string;
  logoUrl?: string | null;
  messageBottom?: string | null;
  jpegQuality: number;
  cameraFacingMode: 'user' | 'environment';
  backgrounds: Background[];
}

type Step = 'preview' | 'countdown' | 'select' | 'confirm' | 'printing';

export default function BoothPage({ params }: { params: { slug: string } }) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [project, setProject] = useState<Project | null>(null);
  const [step, setStep] = useState<Step>('preview');
  const [countdown, setCountdown] = useState(3);
  const [snapshot, setSnapshot] = useState<string | null>(null);
  const [selectedBackground, setSelectedBackground] = useState<Background | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPublic, setIsPublic] = useState(true);
  const [printStatus, setPrintStatus] = useState<string | null>(null);

  useEffect(() => {
    const fetchProject = async () => {
      const response = await fetch(`/api/projects/${params.slug}`);
      if (response.ok) {
        const data = await response.json();
        setProject(data.project);
        setSelectedBackground(data.project.backgrounds[0] ?? null);
      }
    };

    fetchProject();
  }, [params.slug]);

  useEffect(() => {
    const setupCamera = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: project?.cameraFacingMode ?? 'user'
          }
        });
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
      } catch (err) {
        setError('Permission caméra refusée');
      }
    };

    setupCamera();
  }, [project]);

  const startCountdown = () => {
    setStep('countdown');
    setCountdown(3);
    const interval = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          capture();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const capture = () => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas) {
      return;
    }
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const context = canvas.getContext('2d');
    if (!context) {
      return;
    }
    context.drawImage(video, 0, 0, canvas.width, canvas.height);
    const image = canvas.toDataURL('image/jpeg', project?.jpegQuality ?? 0.92);
    setSnapshot(image);
    setStep('select');
  };

  const composeAndUpload = async () => {
    if (!snapshot || !project) {
      return;
    }
    setStep('printing');
    setPrintStatus('Upload en cours...');

    const baseImage = new Image();
    baseImage.src = snapshot;
    await baseImage.decode();

    const canvas = document.createElement('canvas');
    canvas.width = baseImage.width;
    canvas.height = baseImage.height;
    const context = canvas.getContext('2d');
    if (!context) {
      setPrintStatus('Erreur canvas');
      return;
    }

    context.drawImage(baseImage, 0, 0, canvas.width, canvas.height);

    if (selectedBackground?.publicUrl) {
      const bgImage = new Image();
      bgImage.src = selectedBackground.publicUrl;
      await bgImage.decode();
      context.drawImage(bgImage, 0, 0, canvas.width, canvas.height);
    }

    if (project.logoUrl) {
      const logoImage = new Image();
      logoImage.src = project.logoUrl;
      await logoImage.decode();
      const logoWidth = canvas.width * 0.2;
      const logoHeight = (logoImage.height / logoImage.width) * logoWidth;
      context.drawImage(logoImage, canvas.width - logoWidth - 24, 24, logoWidth, logoHeight);
    }

    if (project.messageBottom) {
      context.fillStyle = 'rgba(0, 0, 0, 0.6)';
      context.fillRect(0, canvas.height - 80, canvas.width, 80);
      context.fillStyle = '#ffffff';
      context.font = 'bold 32px sans-serif';
      context.textAlign = 'center';
      context.fillText(project.messageBottom, canvas.width / 2, canvas.height - 30);
    }

    const composedImage = canvas.toDataURL('image/jpeg', project.jpegQuality ?? 0.92);

    const response = await fetch('/api/photos', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        projectSlug: project.slug,
        imageBase64: composedImage,
        isPublic,
        backgroundId: selectedBackground?.id
      })
    });

    if (!response.ok) {
      setPrintStatus('Erreur upload');
      return;
    }

    const data = await response.json();
    setPrintStatus('Impression en cours...');

    const printResponse = await fetch('/api/print', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ photoId: data.photo.id })
    });

    if (!printResponse.ok) {
      setPrintStatus('Erreur impression ❌');
      return;
    }

    setPrintStatus('Imprimé ✅');
    setTimeout(() => {
      setStep('preview');
      setSnapshot(null);
      setIsPublic(true);
      setPrintStatus(null);
    }, 4000);
  };

  if (!project) {
    return <main className="min-h-screen px-6 py-10">Chargement...</main>;
  }

  return (
    <main className="min-h-screen bg-black text-white">
      <div className="flex min-h-screen flex-col items-center justify-center gap-6 px-6">
        <h1 className="text-2xl font-semibold">{project.name}</h1>

        {error && <p className="rounded bg-red-600 px-4 py-2 text-sm">{error}</p>}

        <div className="relative w-full max-w-2xl overflow-hidden rounded-xl bg-gray-900">
          <video ref={videoRef} autoPlay playsInline muted className="w-full" />
          <canvas ref={canvasRef} className="hidden" />
          {snapshot && step !== 'preview' && (
            <img src={snapshot} alt="capture" className="absolute inset-0 h-full w-full object-cover" />
          )}
          {step === 'countdown' && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/50 text-6xl font-bold">
              {countdown}
            </div>
          )}
        </div>

        {step === 'preview' && (
          <button onClick={startCountdown} className="rounded-full bg-brand-500 px-8 py-4 text-xl font-semibold">
            Prendre la photo
          </button>
        )}

        {step === 'select' && (
          <div className="w-full max-w-2xl space-y-4">
            <h2 className="text-xl font-semibold">Choisir un décor</h2>
            <div className="flex gap-3 overflow-x-auto">
              {project.backgrounds.map((bg) => (
                <button
                  key={bg.id}
                  onClick={() => setSelectedBackground(bg)}
                  className={`min-w-[120px] rounded-lg border p-2 ${selectedBackground?.id === bg.id ? 'border-brand-500' : 'border-transparent'}`}
                >
                  <div className="h-20 w-28 rounded bg-gray-800" />
                  <p className="mt-2 text-xs text-gray-300">{bg.name}</p>
                </button>
              ))}
            </div>
            <label className="flex items-center gap-2 text-sm text-gray-300">
              <input type="checkbox" checked={!isPublic} onChange={(event) => setIsPublic(!event.target.checked)} />
              Ne pas afficher sur l'écran secondaire
            </label>
            <button onClick={composeAndUpload} className="w-full rounded bg-brand-500 px-4 py-3 text-lg font-semibold">
              Valider
            </button>
          </div>
        )}

        {step === 'printing' && (
          <div className="rounded-xl bg-gray-900 px-6 py-4 text-lg font-semibold">{printStatus}</div>
        )}
      </div>
    </main>
  );
}
