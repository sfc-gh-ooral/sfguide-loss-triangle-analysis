import type { Metadata } from 'next';
import './globals.css';
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
          {children}
        </main>
      </body>
    </html>
  );
}
