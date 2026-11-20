'use client';

// Header Sample/Live switch. Live needs a Snowflake connection on the server; without one,
// choosing Live opens setup steps instead (the app never asks for credentials in the browser).
import { Database, FlaskConical, X } from 'lucide-react';
import { useState } from 'react';
import { HOSTED_EXAMPLE } from '@/lib/hosted';
import { type Mode, setPreferredMode, useMode } from '@/lib/mode';

const REPO = 'https://github.com/sfc-gh-ooral/sfguide-loss-triangle-analysis';

export function ModeChip() {
  const { mode, configured } = useMode();
  const [help, setHelp] = useState(false);
  if (!mode) return null;

  const choose = (next: Mode) => {
    if (next === mode) return;
    if (next === 'live' && !configured) { setHelp(true); return; }
    setPreferredMode(next);
    window.location.reload(); // every screen refetches from the chosen source
  };
  const live = mode === 'live';

  return (
    <>
      <div className={`mode-switch ${live ? 'is-live' : 'is-sample'}`} role="radiogroup" aria-label="Data source">
        <button role="radio" aria-checked={!live} onClick={() => choose('sample')}
          title="Bundled synthetic data; AI answers are scripted samples">
          <FlaskConical className="w-3.5 h-3.5" aria-hidden />Sample
        </button>
        <button role="radio" aria-checked={live} onClick={() => choose('live')}
          title={configured ? 'Data and AI answers from your Snowflake account' : 'Needs a Snowflake connection'}>
          {live && <span className="mode-dot" aria-hidden />}<Database className="w-3.5 h-3.5" aria-hidden />Live
        </button>
      </div>

      {help && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60" onClick={() => setHelp(false)}>
          <div role="dialog" aria-modal="true" aria-labelledby="live-help-title"
            className="max-w-lg w-full max-h-[calc(100dvh-2rem)] overflow-y-auto p-5 rounded-xl"
            style={{ background: 'var(--color-surface-2)', border: '1px solid var(--color-border)' }}
            onClick={(e) => e.stopPropagation()}>
            <div className="flex items-start justify-between gap-3 mb-3">
              <h2 id="live-help-title" className="text-base font-semibold" style={{ color: 'var(--color-text-primary)' }}>
                Connect Snowflake to use Live mode
              </h2>
              <button className="p-1 rounded" onClick={() => setHelp(false)} aria-label="Close"
                style={{ color: 'var(--color-text-secondary)' }}><X className="w-4 h-4" /></button>
            </div>
            {HOSTED_EXAMPLE ? (
              <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>
                This hosted example runs only on synthetic data in your browser. To use Live mode, clone the{' '}
                <a className="underline" href={REPO} target="_blank" rel="noreferrer">repository</a> and follow{' '}
                <a className="underline" href={`${REPO}#live-mode-deploy-to-your-account`} target="_blank" rel="noreferrer">
                  &ldquo;Live mode: deploy to your account&rdquo;</a> in the README.
              </p>
            ) : (
              <div className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>
                <p className="mb-3">No Snowflake connection is configured on this server. For security, the app
                  doesn&apos;t take credentials in the browser. Set them up once on the machine running the app:</p>
                <ol className="space-y-2 list-decimal pl-5 mb-3">
                  <li>Run <code>sql/setup.sql</code>, then <code>sql/cortex-agent.sql</code>, in a Snowsight worksheet.</li>
                  <li>Create a key pair outside the repository and register the public key on your user (README step 3).</li>
                  <li>Copy <code>.env.example</code> to <code>.env.local</code> and fill in:</li>
                </ol>
                <pre className="text-xs rounded-lg p-3 mb-3 overflow-x-auto" style={{ background: 'var(--color-surface-3)' }}>{`SNOWFLAKE_ACCOUNT=<orgname>-<account_name>
SNOWFLAKE_USERNAME=<YOUR_USER>
SNOWFLAKE_PRIVATE_KEY_PATH=/absolute/path/to/loss_triangle_key.p8`}</pre>
                <p>Then restart with <code>npm run dev</code> and switch to Live.{' '}
                  <a className="underline" href={`${REPO}#live-mode-deploy-to-your-account`} target="_blank" rel="noreferrer">Full guide</a></p>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
