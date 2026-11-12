import type { Metadata } from 'next';
import './globals.css';
import { HOSTED_EXAMPLE } from '@/lib/hosted';
import Sidebar from '@/components/Sidebar';

export const metadata: Metadata = {
  title: 'Loss Triangle Suite — Snowflake Cortex',
  description: 'AI-powered actuarial loss triangle analysis with Snowflake Cortex',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="h-full">
      <body className="h-full flex" style={{ background: 'var(--color-surface-0)' }}>
        <Sidebar />
        <main className="flex-1 ml-64 overflow-auto" style={{ minHeight: '100vh' }}>
          {HOSTED_EXAMPLE && (
            <div role="note" className="px-8 py-2 text-xs border-b" style={{ background: 'var(--color-surface-1)', color: 'var(--color-text-muted)', borderColor: 'var(--color-border)' }}>
              <strong style={{ color: 'var(--color-text-primary)' }}>Sample data mode.</strong>{' '}
              Runs entirely in your browser on synthetic triangles; no Snowflake account needed. Chat answers are scripted, not live Cortex Agent output.{' '}
              <a href="https://github.com/sfc-gh-ooral/sfguide-loss-triangle-analysis" className="underline underline-offset-2">Run it in your own account</a>
            </div>
          )}
          {children}
        </main>
      </body>
    </html>
  );
}
