import type { Metadata } from 'next';
import { IBM_Plex_Mono, Inter } from 'next/font/google';
import '@/styles/globals.css';
import { Providers } from '@/app/providers';

const ibmPlexMono = IBM_Plex_Mono({
  weight: ['400', '500', '600', '700'],
  variable: '--font-ibm-plex-mono',
  subsets: ['latin'],
  display: 'swap',
});

const inter = Inter({
  weight: ['300', '400', '500', '600'],
  variable: '--font-inter',
  subsets: ['latin'],
  display: 'swap',
});

export const metadata: Metadata = {
  title: {
    default: 'SeqForge - Specification Portal',
    template: '%s | SeqForge',
  },
  description: 'AI-powered specification portal for feature management and collaboration',
  icons: {
    icon: [
      { url: '/logos/favicon-16x16.png', sizes: '16x16', type: 'image/png' },
      { url: '/logos/favicon-32x32.png', sizes: '32x32', type: 'image/png' },
      { url: '/logos/favicon-96x96.png', sizes: '96x96', type: 'image/png' },
    ],
    apple: [
      { url: '/logos/apple-icon-57x57.png', sizes: '57x57', type: 'image/png' },
      { url: '/logos/apple-icon-60x60.png', sizes: '60x60', type: 'image/png' },
      { url: '/logos/apple-icon-72x72.png', sizes: '72x72', type: 'image/png' },
      { url: '/logos/apple-icon-76x76.png', sizes: '76x76', type: 'image/png' },
      { url: '/logos/apple-icon-114x114.png', sizes: '114x114', type: 'image/png' },
      { url: '/logos/apple-icon-120x120.png', sizes: '120x120', type: 'image/png' },
      { url: '/logos/apple-icon-144x144.png', sizes: '144x144', type: 'image/png' },
      { url: '/logos/apple-icon-152x152.png', sizes: '152x152', type: 'image/png' },
      { url: '/logos/apple-icon-180x180.png', sizes: '180x180', type: 'image/png' },
    ],
    other: [
      { rel: 'apple-touch-icon-precomposed', url: '/logos/apple-icon-precomposed.png' },
    ],
  },
  manifest: '/logos/manifest.json',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${ibmPlexMono.variable} ${inter.variable} font-sans antialiased`}>
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  );
}
