'use client';

import { useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import ChatPanel from '@/components/ChatPanel';
import { Sparkles } from 'lucide-react';
import { Suspense } from 'react';

function ChatContent() {
  return (
    <div className="flex flex-col h-screen">
      {/* Header */}
      <div className="px-8 py-5 border-b flex-shrink-0"
        style={{ borderColor: 'var(--color-border)', background: 'var(--color-surface-1)' }}>
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl flex items-center justify-center glow-purple"
            style={{ background: 'var(--color-accent)' }}>
            <Sparkles className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-base font-semibold" style={{ color: 'var(--color-text-primary)' }}>
              Cortex Actuarial Agent
            </h1>
            <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>
              Powered by Snowflake Cortex · claude-3-5-sonnet · Loss Triangle Specialist
            </p>
          </div>
          <div className="ml-auto flex items-center gap-2">
            <div className="w-2 h-2 rounded-full animate-pulse" style={{ background: 'var(--color-positive)' }} />
            <span className="text-xs" style={{ color: 'var(--color-text-muted)' }}>Connected</span>
          </div>
        </div>
      </div>

      {/* Chat */}
      <div className="flex-1 overflow-hidden">
        <ChatPanel />
      </div>
    </div>
  );
}

export default function ChatPage() {
  return (
    <Suspense fallback={<div />}>
      <ChatContent />
    </Suspense>
  );
}
