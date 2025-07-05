import { GeistSans } from 'geist/font/sans';
import { GeistMono } from 'geist/font/mono';
import { ClerkProvider } from '@clerk/nextjs';
import { ThemeProvider } from 'next-themes';
import './globals.css';

const defaultUrl = process.env.VERCEL_URL
  ? `https://${process.env.VERCEL_URL}`
  : 'http://localhost:3000';

export const metadata = {
  metadataBase: new URL(defaultUrl),
  title: 'Pathly - AI Transit Companion',
  description: 'Safe, weather-aware transit routes and travel buddies for students',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ClerkProvider>
      <html 
        lang="en" 
        className={`${GeistSans.variable} ${GeistMono.variable} light`} 
        suppressHydrationWarning
        style={{
          '--font-geist-sans': GeistSans.style.fontFamily,
          '--font-geist-mono': GeistMono.style.fontFamily,
        } as React.CSSProperties}
      >
        <body className="bg-background text-foreground antialiased">
          <ThemeProvider
            attribute="class"
            defaultTheme="light"
            forcedTheme="light"
            enableSystem={false}
            disableTransitionOnChange
          >
            <main className="min-h-screen flex flex-col">
              {children}
            </main>
          </ThemeProvider>
        </body>
      </html>
    </ClerkProvider>
  );
}
