import './globals.css';
import type { ReactNode } from 'react';

export const metadata = {
  title: 'Photobooth',
  description: 'Photobooth événementiel web'
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="fr">
      <body className="min-h-screen bg-gray-950 text-gray-50">{children}</body>
    </html>
  );
}
