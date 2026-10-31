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
    <html lang="en" className="dark">
      <body className="bg-navy-900 text-gray-100 min-h-screen antialiased selection:bg-blue-600 selection:text-white">
        {children}
      </body>
    </html>
  );
}

