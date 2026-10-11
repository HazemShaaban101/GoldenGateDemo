import { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { useLocation } from 'react-router-dom';
import { create } from 'zustand';
import { useAuth } from '@/gateway/auth';
import { BUILDINGS } from '@/model/site';
import { scopeLabel, useScopeStore } from '@/sim/scope';
import { ChevronDown, LogoutIcon } from '@/components/icons/UiIcons';
import { Glyph } from '@/components/icons/Glyph';

/** Home-page overlay visibility, shared between the strip's toggle and the campus screen. */
export const useHomeUi = create<{ kpis: boolean; toggleKpis: () => void }>((set) => ({
  kpis: true,
  toggleKpis: () => set((s) => ({ kpis: !s.kpis })),
}));

/**
 * The strip under the wordmark: who is signed in (with sign-out), and — always — what the KPIs on
 * screen describe (the entire project or one building), with a switcher.
 */
export function ScopeBar() {
  const { pathname } = useLocation();
  const user = useAuth((s) => (s.status?.authenticated ? s.status.user : null));
  const logout = useAuth((s) => s.logout);
  const scope = useScopeStore((s) => s.scope);
  const setScope = useScopeStore((s) => s.setScope);
  const { kpis, toggleKpis } = useHomeUi();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const home = pathname === '/';
  const inSite = pathname.startsWith('/site/');

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => ref.current && !ref.current.contains(e.target as Node) && setOpen(false);
    document.addEventListener('mousedown', onDown);
    return () => document.removeEventListener('mousedown', onDown);
  }, [open]);

  return (
    <div className="absolute left-[52px] top-[160px] z-30 flex items-center gap-[12px]">
      <div className="flex h-[34px] items-center gap-[10px] rounded-full border border-white/12 bg-night-900/60 pl-[4px] pr-[6px] backdrop-blur" title="Signed in">
        <span className="flex h-[26px] w-[26px] items-center justify-center rounded-full bg-gradient-to-b from-lavender to-lavender-dim text-[13px] font-semibold uppercase text-night-950">
          {(user ?? '?').replace(/^.*\\/, '').slice(0, 1)}
        </span>
        <span className={`max-w-[190px] truncate text-[14px] ${user ? 'text-white' : 'text-gold'}`}>{user ?? 'Dev preview · not signed in'}</span>
        <button onClick={() => void logout()} className="flex h-[26px] items-center gap-[5px] rounded-full px-[8px] text-[13px] text-ink-3 transition-colors hover:bg-white/10 hover:text-gold" title="Sign out">
          <LogoutIcon size={15} />
          {user ? 'Sign out' : 'Exit preview'}
        </button>
      </div>

      <div ref={ref} className="relative">
        <button
          onClick={() => !inSite && setOpen((o) => !o)}
          className="flex h-[34px] items-center gap-[8px] rounded-full border border-gold/60 bg-night-900/60 px-[14px] text-[14px] text-white backdrop-blur transition-colors hover:border-gold"
          style={{ cursor: inSite ? 'default' : 'pointer' }}
          title={inSite ? 'Scoped to the building you are viewing' : 'Change what the KPIs describe'}
        >
          <Glyph id={scope === 'project' ? 'location' : 'building'} size={16} color="#ffaa00" />
          <span className="text-ink-3">KPIs for</span>
          <span className="text-gold">{scopeLabel(scope)}</span>
          {!inSite && <ChevronDown size={14} className="text-ink-3" />}
        </button>
        <AnimatePresence>
          {open && (
            <motion.ul
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              className="gg-panel absolute left-0 top-[40px] w-[240px] overflow-hidden bg-night-800/95 py-[6px] backdrop-blur-xl"
            >
              {['project', ...BUILDINGS.map((b) => b.id)].map((id) => (
                <li key={id}>
                  <button
                    onClick={() => {
                      setScope(id);
                      setOpen(false);
                    }}
                    className={`flex w-full items-center justify-between px-[14px] py-[8px] text-left text-[14px] hover:bg-white/5 ${scope === id ? 'text-gold' : 'text-ink-2'}`}
                  >
                    {scopeLabel(id)}
                    {id !== 'project' && <span className="text-[11px] text-ink-4">{BUILDINGS.find((b) => b.id === id)?.use.split(' · ')[0]}</span>}
                  </button>
                </li>
              ))}
            </motion.ul>
          )}
        </AnimatePresence>
      </div>

      {home && (
        <button onClick={toggleKpis} className="h-[34px] rounded-full border border-white/12 bg-night-900/60 px-[14px] text-[13px] text-ink-2 backdrop-blur hover:border-gold/60 hover:text-white">
          {kpis ? 'Hide KPIs' : 'Show KPIs'}
        </button>
      )}
    </div>
  );
}
