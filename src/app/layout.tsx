import type { Metadata, Viewport } from 'next';
import { Inter, JetBrains_Mono } from 'next/font/google';
import { Toaster } from '@/components/ui/sonner';
import { TooltipProvider } from '@/components/ui/tooltip';
import AppShell from '@/components/layout/app-shell';
import './globals.css';

// ============================================================================
// Fonts
// ============================================================================

const inter = Inter({
  variable: '--font-sans',
  subsets: ['latin'],
  display: 'swap',
});

const jetbrainsMono = JetBrains_Mono({
  variable: '--font-mono',
  subsets: ['latin'],
  display: 'swap',
});

// ============================================================================
// Metadata
// ============================================================================

export const metadata: Metadata = {
  title: 'SMC Journal — Smart Money Concepts Trading Journal',
  description:
    'A premium, calendar-based Smart Money Concepts trading journal. Track your trades, analyze execution quality, and improve discipline.',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'SMC Journal',
  },
};

export const viewport: Viewport = {
  themeColor: '#0a0a0f',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: 'cover',
};

// ============================================================================
// Root Layout
// ============================================================================

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      className={`${inter.variable} ${jetbrainsMono.variable} dark`}
      suppressHydrationWarning
    >
      <body suppressHydrationWarning className="min-h-[100dvh] bg-background text-foreground antialiased">
        <TooltipProvider>
          <AppShell>{children}</AppShell>
          <Toaster
            position="top-right"
            richColors
            theme="dark"
            toastOptions={{
              className: 'glass-strong',
            }}
          />
        </TooltipProvider>
      </body>
    </html>
  );
}
