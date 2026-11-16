'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { Send, Bot, User, Loader2, Sparkles, AlertTriangle, Table2, CheckSquare, Layers } from 'lucide-react';
import { AGENT_RESPONSES, SUGGESTED_PROMPTS, matchResponseKey, type ResponseKey } from '@/lib/responses';
import { TRIANGLES_BY_ID } from '@/lib/data';
import type { ChatMessage } from '@/lib/types';
import TriangleTable from './TriangleTable';
import { liveJson, useMode } from '@/lib/mode';
import { sampleDelayMs, wait } from '@/lib/sample-timing';
import { AiSourceBadge } from './AiBadges';
import { AGENT_STEPS, Reasoning } from './Reasoning';
import { cn } from '@/lib/utils';

function renderMarkdown(text: string): React.ReactNode {
  const lines = text.split('\n');
  const elements: React.ReactNode[] = [];
  let tableLines: string[] = [];
  let inTable = false;
  let key = 0;

  const flushTable = () => {
    if (tableLines.length < 2) { tableLines = []; return; }
    const headers = tableLines[0].split('|').map(c => c.trim()).filter(Boolean);
    const dataRows = tableLines.slice(2).map(l => l.split('|').map(c => c.trim()).filter(Boolean));
    elements.push(
      <div key={key++} className="overflow-auto my-3">
        <table className="text-xs border-collapse w-full">
          <thead>
            <tr>
              {headers.map((h, i) => (
                <th key={i} className="px-3 py-2 text-left font-semibold"
                  style={{ background: 'var(--color-surface-3)', color: 'var(--color-accent-light)', borderBottom: '1px solid var(--color-border)' }}>
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {dataRows.map((row, ri) => (
              <tr key={ri} style={{ borderBottom: '1px solid var(--color-border-subtle)' }}>
                {row.map((cell, ci) => {
                  const isNum = /^[+−\-]?\$?[\d,.]+[MK%]?$/.test(cell);
                  const isPos = cell.startsWith('+');
                  const isNeg = cell.startsWith('−') || cell.startsWith('-');
                  return (
                    <td key={ci} className="px-3 py-1.5 text-xs tabular-nums"
                      style={{
                        color: isNeg ? 'var(--color-positive)' 
                          : isPos ? 'var(--color-negative)' 
                          : isNum ? 'var(--color-text-primary)' 
                          : 'var(--color-text-secondary)'
                      }}>
                      {cell}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
    tableLines = [];
  };

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    if (line.startsWith('|')) {
      inTable = true;
      tableLines.push(line);
      continue;
    }
    if (inTable) {
      inTable = false;
      flushTable();
    }

    if (line === '---') {
      elements.push(<hr key={key++} style={{ borderColor: 'var(--color-border)', margin: '12px 0' }} />);
      continue;
    }

    if (line.startsWith('**') && line.endsWith('**') && !line.slice(2, -2).includes('**')) {
      elements.push(
        <p key={key++} className="font-semibold text-sm mt-3 mb-1" style={{ color: 'var(--color-accent-light)' }}>
          {line.slice(2, -2)}
        </p>
      );
      continue;
    }

    // Priority alert lines
    const alertMatch = line.match(/^(🔴|🟡|🟢)\s+\*\*(.*?)\*\*(.*)/);
    if (alertMatch) {
      const [, emoji, title, rest] = alertMatch;
      const color = emoji === '🔴' ? 'var(--color-negative)' : emoji === '🟡' ? 'var(--color-warning)' : 'var(--color-positive)';
      const bg = emoji === '🔴' ? 'rgba(239,68,68,0.08)' : emoji === '🟡' ? 'rgba(245,158,11,0.08)' : 'rgba(16,185,129,0.08)';
      elements.push(
        <div key={key++} className="rounded-lg px-3 py-2.5 my-2 text-sm"
          style={{ background: bg, borderLeft: `3px solid ${color}` }}>
          <span style={{ color }}>{emoji} </span>
          <strong style={{ color }}>{title}</strong>
          <InlineMarkdown text={rest} />
        </div>
      );
      continue;
    }

    if (line.startsWith('- ') || line.startsWith('* ')) {
      elements.push(
        <div key={key++} className="flex gap-2 text-sm my-0.5">
          <span style={{ color: 'var(--color-accent-light)', flexShrink: 0 }}>•</span>
          <span style={{ color: 'var(--color-text-secondary)' }}><InlineMarkdown text={line.slice(2)} /></span>
        </div>
      );
      continue;
    }

    if (line.trim() === '') {
      elements.push(<div key={key++} className="h-2" />);
      continue;
    }

    elements.push(
      <p key={key++} className="text-sm leading-relaxed" style={{ color: 'var(--color-text-secondary)' }}>
        <InlineMarkdown text={line} />
      </p>
    );
  }
  if (inTable) flushTable();
  return <>{elements}</>;
}

function InlineMarkdown({ text }: { text: string }) {
  const parts: React.ReactNode[] = [];
  const regex = /\*\*(.*?)\*\*|`(.*?)`/g;
  let last = 0;
  let match;
  let i = 0;
  while ((match = regex.exec(text)) !== null) {
    if (match.index > last) parts.push(<span key={i++}>{text.slice(last, match.index)}</span>);
    if (match[1] !== undefined) {
      parts.push(<strong key={i++} style={{ color: 'var(--color-text-primary)' }}>{match[1]}</strong>);
    } else if (match[2] !== undefined) {
      parts.push(
        <code key={i++} className="text-xs px-1 py-0.5 rounded"
          style={{ background: 'var(--color-surface-4)', color: 'var(--color-snowflake)', fontFamily: 'monospace' }}>
          {match[2]}
        </code>
      );
    }
    last = match.index + match[0].length;
  }
  if (last < text.length) parts.push(<span key={i++}>{text.slice(last)}</span>);
  return <>{parts}</>;
}

function MessageBubble({ message, isStreaming }: { message: ChatMessage; isStreaming?: boolean }) {
  const isUser = message.role === 'user';
  const triangle = message.embeddedTriangleId ? TRIANGLES_BY_ID[message.embeddedTriangleId] : null;

  return (
    <div className={cn('flex gap-3 mb-6', isUser ? 'justify-end' : 'justify-start')}>
      {!isUser && (
        <div className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 glow-purple"
          style={{ background: 'var(--color-accent)' }}>
          <Sparkles className="w-4 h-4 text-white" />
        </div>
      )}

      <div className={cn('max-w-[85%]', isUser ? 'max-w-[60%]' : '')}>
        <div className={cn('rounded-2xl px-4 py-3', isUser ? 'rounded-br-sm' : 'rounded-bl-sm')}
          style={{
            background: isUser ? 'var(--color-accent)' : 'var(--color-surface-3)',
            border: isUser ? 'none' : '1px solid var(--color-border)',
          }}>
          {isUser ? (
            <p className="text-sm text-white">{message.content}</p>
          ) : (
            <div>
              {renderMarkdown(message.content)}
              {isStreaming && <span className="streaming-cursor" />}
            </div>
          )}
        </div>

        {/* Embedded triangle */}
        {triangle && !isStreaming && (
          <div className="mt-3 rounded-xl overflow-hidden"
            style={{ border: '1px solid var(--color-border)', background: 'var(--color-surface-2)' }}>
            <div className="px-4 py-2.5 flex items-center gap-2 border-b"
              style={{ borderColor: 'var(--color-border)', background: 'var(--color-surface-3)' }}>
              <Table2 className="w-3.5 h-3.5" style={{ color: 'var(--color-accent-light)' }} />
              <span className="text-xs font-semibold" style={{ color: 'var(--color-text-secondary)' }}>
                {triangle.name} — Paid Losses ($M) as of {triangle.evalDate}
              </span>
            </div>
            <div className="p-2">
              <TriangleTable
                triangle={triangle}
                highlightCells={message.highlightCells}
                compact
              />
            </div>
          </div>
        )}

        {/* Comparison table */}
        {message.comparisonData && !isStreaming && (
          <div className="mt-3 rounded-xl overflow-hidden"
            style={{ border: '1px solid var(--color-border)', background: 'var(--color-surface-2)' }}>
            <div className="px-4 py-2.5 flex items-center gap-2 border-b"
              style={{ borderColor: 'var(--color-border)', background: 'var(--color-surface-3)' }}>
              <CheckSquare className="w-3.5 h-3.5" style={{ color: 'var(--color-positive)' }} />
              <span className="text-xs font-semibold" style={{ color: 'var(--color-text-secondary)' }}>
                Reserve Impact — Consistent Selection Rules
              </span>
            </div>
            <div className="overflow-auto">
              <table className="w-full text-xs border-collapse">
                <thead>
                  <tr>
                    {['Segment', 'Prior Ultimate', 'Current Ultimate', 'Change', 'Δ%'].map(h => (
                      <th key={h} className="px-3 py-2 text-left font-semibold"
                        style={{ background: 'var(--color-surface-3)', color: 'var(--color-text-muted)', borderBottom: '1px solid var(--color-border)' }}>
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {message.comparisonData.map((row, i) => {
                    const isPos = row.change > 0;
                    const changeColor = isPos ? 'var(--color-negative)' : 'var(--color-positive)';
                    const isTotal = i === message.comparisonData!.length - 1;
                    return (
                      <tr key={i}
                        style={{
                          background: isTotal ? 'rgba(123,14,160,0.1)' : undefined,
                          borderBottom: '1px solid var(--color-border-subtle)',
                          borderTop: isTotal ? '2px solid var(--color-border)' : undefined,
                        }}>
                        <td className="px-3 py-1.5 font-medium" style={{ color: 'var(--color-text-secondary)' }}>{row.segment}</td>
                        <td className="px-3 py-1.5 tabular-nums text-right" style={{ color: 'var(--color-text-muted)' }}>
                          ${row.priorUltimate.toFixed(1)}M
                        </td>
                        <td className="px-3 py-1.5 tabular-nums text-right font-semibold"
                          style={{ color: 'var(--color-accent-light)' }}>
                          ${row.currentUltimate.toFixed(1)}M
                        </td>
                        <td className="px-3 py-1.5 tabular-nums text-right font-semibold" style={{ color: changeColor }}>
                          {isPos ? '+' : ''}${row.change.toFixed(1)}M
                        </td>
                        <td className="px-3 py-1.5 tabular-nums text-right font-semibold" style={{ color: changeColor }}>
                          {isPos ? '+' : ''}{row.changePct.toFixed(1)}%
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* The welcome message is pre-rendered, so its time legitimately differs from the browser's */}
        <div className="mt-1 px-1 text-xs flex items-center gap-2 flex-wrap" style={{ color: 'var(--color-text-muted)' }} suppressHydrationWarning>
          {isUser ? <span>You</span>
            : message.source === 'live' ? <AiSourceBadge live feature="Cortex Agent" ms={message.latencyMs} />
            : message.source === 'sample' ? <AiSourceBadge live={false} feature="" />
            : message.source === 'error' ? <span style={{ color: 'var(--color-negative)' }}>Live call failed · no sample substituted</span>
            : <span>Assistant</span>}
          <span suppressHydrationWarning>{message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
        </div>
      </div>

      {isUser && (
        <div className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5"
          style={{ background: 'var(--color-surface-4)', border: '1px solid var(--color-border)' }}>
          <User className="w-4 h-4" style={{ color: 'var(--color-text-secondary)' }} />
        </div>
      )}
    </div>
  );
}

const ICON_MAP: Record<string, React.ComponentType<{ className?: string; style?: React.CSSProperties }>> = {
  table: Table2,
  layers: Layers,
  'check-square': CheckSquare,
  'alert-triangle': AlertTriangle,
};

export default function ChatPanel() {
  const [messages, setMessages] = useState<ChatMessage[]>([{
    id: '0',
    role: 'assistant',
    content: AGENT_RESPONSES.free_form.text,
    timestamp: new Date(),
  }]);
  const [input, setInput] = useState('');
  const [isThinking, setIsThinking] = useState(false);
  const [expectedMs, setExpectedMs] = useState(6000);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const { mode } = useMode();
  const live = mode === 'live';

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isThinking]);

  const sendMessage = useCallback(async (text: string, responseKey?: ResponseKey) => {
    if (!text.trim() || isThinking || !mode) return;
    setMessages(prev => [...prev, { id: Date.now().toString(), role: 'user', content: text, timestamp: new Date() }]);
    setInput('');
    setIsThinking(true);

    let reply: ChatMessage;
    if (mode === 'live') {
      // Live: the Cortex Agent plans, Cortex Analyst writes SQL over LOSS_TRIANGLE_SV, and the query
      // runs on LOSS_TRIANGLE_WH. Errors are shown as errors, never replaced with a scripted answer.
      setExpectedMs(12000);
      try {
        const data = await liveJson<{ text: string; latencyMs: number }>('/api/chat', {
          method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ message: text }),
        });
        reply = { id: (Date.now() + 1).toString(), role: 'assistant', content: data.text, timestamp: new Date(), source: 'live', latencyMs: data.latencyMs };
      } catch (e) {
        reply = { id: (Date.now() + 1).toString(), role: 'assistant', content: `**Live call failed.** ${(e as Error).message}`, timestamp: new Date(), source: 'error' };
      }
    } else {
      // Sample: a scripted, keyword-matched answer after a realistic delay.
      const ms = sampleDelayMs();
      setExpectedMs(ms);
      await wait(ms);
      const key = responseKey ?? matchResponseKey(text);
      const r = AGENT_RESPONSES[key];
      reply = {
        id: (Date.now() + 1).toString(), role: 'assistant', content: r.text, timestamp: new Date(),
        embeddedTriangleId: r.embeddedTriangleId, highlightCells: r.highlightCells, comparisonData: r.comparisonData,
        responseKey: key, source: 'sample',
      };
    }
    setIsThinking(false);
    setMessages(prev => [...prev, reply]);
  }, [isThinking, mode]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    sendMessage(input);
  };

  return (
    <div className="flex flex-col h-full">
      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-6 py-6">
        {messages.map(msg => (
          <MessageBubble key={msg.id} message={msg} />
        ))}

        {/* Staged progress */}
        {isThinking && (
          <div className="flex gap-3 mb-6">
            <div className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0"
              style={{ background: 'var(--color-accent)' }}>
              <Sparkles className="w-4 h-4 text-white" />
            </div>
            <div className="w-full max-w-md">
              <Reasoning steps={AGENT_STEPS} expectedMs={expectedMs} />
            </div>
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      {/* Suggested prompts */}
      {messages.length <= 1 && (
        <div className="px-6 pb-4 grid grid-cols-2 gap-2">
          {SUGGESTED_PROMPTS.map(prompt => {
            const Icon = ICON_MAP[prompt.icon] ?? Table2;
            return (
              <button
                key={prompt.key}
                onClick={() => sendMessage(prompt.label, prompt.key)}
                disabled={isThinking}
                className="flex items-start gap-2.5 px-3 py-2.5 rounded-xl text-left transition-all duration-150 group"
                style={{
                  background: 'var(--color-surface-3)',
                  border: '1px solid var(--color-border)',
                }}>
                <Icon className="w-4 h-4 mt-0.5 flex-shrink-0" style={{ color: 'var(--color-accent-light)' }} />
                <div>
                  <div className="text-xs font-semibold" style={{ color: 'var(--color-text-primary)' }}>
                    {prompt.label}
                  </div>
                  <div className="text-xs mt-0.5" style={{ color: 'var(--color-text-muted)' }}>
                    {prompt.description}
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      )}

      {/* Input */}
      <div className="px-6 pb-6 pt-2">
        <form onSubmit={handleSubmit}
          className="flex gap-2 rounded-xl px-4 py-3"
          style={{ background: 'var(--color-surface-3)', border: '1px solid var(--color-border)' }}>
          <input
            ref={inputRef}
            value={input}
            onChange={e => setInput(e.target.value)}
            placeholder="Ask about loss triangles, segments, selections..."
            disabled={isThinking}
            className="flex-1 bg-transparent text-sm outline-none placeholder:text-sm"
            style={{ color: 'var(--color-text-primary)' }}
          />
          <button
            type="submit"
            disabled={!input.trim() || isThinking}
            className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 transition-all duration-150 disabled:opacity-40"
            style={{ background: 'var(--color-accent)' }}>
            <Send className="w-4 h-4 text-white" />
          </button>
        </form>
      </div>
    </div>
  );
}
