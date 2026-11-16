import type { Metadata } from 'next';
import './globals.css';
import { HOSTED_EXAMPLE } from '@/lib/hosted';
import Sidebar from '@/components/Sidebar';
import { ModeChip } from '@/components/ModeChip';

export const metadata: Metadata = {
  title: 'Loss Triangle Analysis — Snowflake example',
  description: 'Chain-ladder loss triangle analysis on synthetic data, with a Cortex Agent and AI_COMPLETE',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="h-full">
      <body className="h-full flex" style={{ background: 'var(--color-surface-0)' }}>
        <Sidebar />
        <main className="flex-1 ml-64 overflow-auto" style={{ minHeight: '100vh' }}>
          <header className="sticky top-0 z-30 px-8 py-2.5 flex items-center gap-3 border-b text-xs"
            style={{ background: 'var(--color-surface-1)', borderColor: 'var(--color-border)', color: 'var(--color-text-muted)' }}>
            <span className="flex-1">
              {HOSTED_EXAMPLE ? (
                <><strong style={{ color: 'var(--color-text-primary)' }}>Hosted example, Sample mode.</strong>{' '}
                  Runs in your browser on synthetic triangles; AI answers are scripted samples.{' '}
                  <a href="https://github.com/sfc-gh-ooral/sfguide-loss-triangle-analysis#live-mode-deploy-to-your-account" className="underline underline-offset-2">Run it live in your own account</a></>
              ) : (
                <>Synthetic data and illustrative chain-ladder logic. Not actuarial, reserving, or regulatory advice.</>
              )}
            </span>
            <ModeChip />
          </header>
          {children}
        </main>
      </body>
    </html>
  );
}
