'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, MessageSquare, Triangle, Layers, CheckSquare, Zap } from 'lucide-react';
import { cn } from '@/lib/utils';

const NAV_ITEMS = [
  { href: '/', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/chat', label: 'AI Agent', icon: MessageSquare },
  { href: '/triangles', label: 'Triangle Explorer', icon: Triangle },
  { href: '/segments', label: 'Segment Analysis', icon: Layers },
  { href: '/consistency', label: 'Consistency Test', icon: CheckSquare },
];

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="fixed inset-y-0 left-0 w-64 flex flex-col z-40"
      style={{ background: 'var(--color-surface-1)', borderRight: '1px solid var(--color-border)' }}>

      {/* Logo */}
      <div className="px-6 py-5 border-b" style={{ borderColor: 'var(--color-border)' }}>
        <div className="flex items-center gap-3 mb-1">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center"
            style={{ background: 'var(--color-accent)' }}>
            <Zap className="w-4 h-4 text-white" />
          </div>
          <div>
            <div className="text-sm font-semibold leading-none" style={{ color: 'var(--color-text-primary)' }}>
              Loss Triangles
            </div>
            <div className="text-xs mt-0.5" style={{ color: 'var(--color-text-muted)' }}>
              Snowflake Cortex
            </div>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-1">
        <div className="text-xs font-medium px-3 mb-3 uppercase tracking-wider"
          style={{ color: 'var(--color-text-muted)' }}>
          Analysis
        </div>
        {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
          const active = pathname === href;
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150',
                active
                  ? 'text-white'
                  : 'hover:text-white'
              )}
              style={active
                ? { background: 'var(--color-accent)', color: 'white' }
                : { color: 'var(--color-text-secondary)' }
              }
            >
              <Icon className="w-4 h-4 flex-shrink-0" />
              {label}
              {href === '/chat' && (
                <span className="ml-auto text-xs px-1.5 py-0.5 rounded-full font-semibold"
                  style={{ background: 'rgba(123,14,160,0.3)', color: 'var(--color-accent-light)' }}>
                  AI
                </span>
              )}
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="px-4 py-4 border-t" style={{ borderColor: 'var(--color-border)' }}>
        <div className="rounded-lg p-3" style={{ background: 'rgba(41,181,232,0.08)', border: '1px solid rgba(41,181,232,0.2)' }}>
          <div className="flex items-center gap-2 mb-1">
            <div className="w-2 h-2 rounded-full animate-pulse" style={{ background: 'var(--color-snowflake)' }} />
            <span className="text-xs font-semibold" style={{ color: 'var(--color-snowflake)' }}>
              Snowflake Cortex
            </span>
          </div>
          <p className="text-xs leading-relaxed" style={{ color: 'var(--color-text-muted)' }}>
            Powered by Cortex Agents + claude-3-5-sonnet
          </p>
        </div>
        <p className="text-xs mt-3 text-center" style={{ color: 'var(--color-text-muted)' }}>
          Demo — Eval Date 12/31/2024
        </p>
      </div>
    </aside>
  );
}
