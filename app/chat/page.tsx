'use client';

import ChatPanel from '@/components/ChatPanel';
import { Sparkles } from 'lucide-react';
import { Suspense } from 'react';
import { useMode } from '@/lib/mode';

function ChatContent() {
  const { mode } = useMode();
  const live = mode === 'live';
  return (
    <div className="flex flex-col" style={{ height: 'calc(100vh - 45px)' }}>
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
              Actuarial Assistant
            </h1>
            <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>
              Cortex Agent (LOSS_TRIANGLE_AGENT) with Cortex Analyst over the LOSS_TRIANGLE_SV semantic view
            </p>
          </div>
          <div className="ml-auto flex items-center gap-2">
            <div className="w-2 h-2 rounded-full" style={{ background: live ? 'var(--color-positive)' : 'var(--color-warning)' }} />
            <span className="text-xs" style={{ color: 'var(--color-text-muted)' }}>
              {mode === undefined ? '' : live ? 'Live · answers from your Snowflake account' : 'Sample · scripted answers, matched by keyword'}
            </span>
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
