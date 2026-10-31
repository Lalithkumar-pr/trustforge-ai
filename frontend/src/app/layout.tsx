import './globals.css';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'TrustForge AI - Agentic Quality Engineering for LLM Systems',
  description: 'Enterprise quality engineering framework evaluating LLM applications for accuracy, hallucination, grounding, safety, and release readiness.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;450;500;550;600;650;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="bg-app-bg text-text-primary min-h-screen antialiased selection:bg-primary-light selection:text-primary-accent font-sans">
        {children}
      </body>
    </html>
  );
}
