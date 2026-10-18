import type { Metadata, Viewport } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'KeoClub - Le Réseau Social de Partage Culturel & Drops',
  description: 'Partagez et découvrez vos pépites en Films, Séries, Musique, Livres et Podcasts avec votre cercle d\'amis.',
  manifest: '/manifest.json',
  icons: {
    icon: '/icon.svg',
    apple: '/icon.svg',
  },
};

export const viewport: Viewport = {
  themeColor: '#4f46e5',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="fr" className="dark bg-club-950">
      <body className="bg-club-950 text-slate-100 antialiased min-h-screen">
        {children}
      </body>
    </html>
  );
}
