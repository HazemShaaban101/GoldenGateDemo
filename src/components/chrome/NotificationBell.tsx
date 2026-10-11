import { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion, useAnimationControls } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { BellIcon, LogoutIcon } from '@/components/icons/UiIcons';
import { useScenario, type Severity } from '@/sim/scenario';
import { useAuth } from '@/gateway/auth';
import { useNow } from '@/sim/clock';
import { timeAgo } from '@/utils/format';

const SEVERITY: Record<Severity, string> = { critical: '#ef4444', warning: '#ffaa00', info: '#999bff' };

/** Bell with unread badge; opens the platform's notification center (and the session menu). */
export function NotificationBell() {
  const notifications = useScenario((s) => s.notifications);
  const markAllRead = useScenario((s) => s.markAllRead);
  const user = useAuth((s) => s.status?.user);
  const logout = useAuth((s) => s.logout);
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const bell = useAnimationControls();
  const navigate = useNavigate();
  useNow(30_000); // keep "x min ago" fresh

  const unread = notifications.filter((n) => !n.read);
  const critical = unread.some((n) => n.severity === 'critical');
  const newest = notifications[0]?.id;

  // Ring the bell when something new arrives.
  const seen = useRef(newest);
  useEffect(() => {
    if (newest && newest !== seen.current) {
      seen.current = newest;
      void bell.start({ rotate: [0, -18, 16, -12, 8, -4, 0], transition: { duration: 0.9 } });
    }
  }, [newest, bell]);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => ref.current && !ref.current.contains(e.target as Node) && setOpen(false);
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false);
    document.addEventListener('mousedown', onDown);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDown);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  return (
    <div ref={ref} className="relative">
      <button onClick={() => setOpen((o) => !o)} className="relative block text-white outline-none" aria-label={`Notifications (${unread.length} unread)`}>
        <motion.span animate={bell} className="block origin-top">
          <BellIcon size={38} />
        </motion.span>
        {unread.length > 0 && (
          <span
            className="absolute -right-[4px] -top-[2px] flex h-[20px] min-w-[20px] items-center justify-center rounded-full px-[5px] text-[12px] font-semibold text-night-950"
            style={{ background: critical ? '#ef4444' : '#ffaa00', boxShadow: `0 0 12px ${critical ? '#ef4444' : '#ffaa00'}` }}
          >
            {unread.length}
          </span>
        )}
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -8, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.18 }}
            className="gg-panel absolute right-[-40px] top-[56px] z-50 w-[440px] overflow-hidden bg-night-800/95 backdrop-blur-xl"
          >
            <div className="flex items-center justify-between border-b border-white/10 px-[20px] py-[14px]">
              <span className="text-[18px] text-white">Notifications</span>
              <button onClick={markAllRead} className="text-[13px] text-lavender hover:text-white">
                Mark all read
              </button>
            </div>
            <ul className="gg-scroll max-h-[420px]">
              {notifications.length === 0 && <li className="px-[20px] py-[24px] text-[14px] text-ink-3">No notifications.</li>}
              {notifications.map((n) => (
                <li key={n.id} className="flex gap-[12px] border-b border-white/5 px-[20px] py-[14px]">
                  <span className="mt-[6px] h-[8px] w-[8px] shrink-0 rounded-full" style={{ background: SEVERITY[n.severity], boxShadow: `0 0 8px ${SEVERITY[n.severity]}`, opacity: n.read ? 0.4 : 1 }} />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-baseline justify-between gap-[8px]">
                      <span className={`truncate text-[15px] ${n.read ? 'text-ink-2' : 'text-white'}`}>{n.title}</span>
                      <span className="shrink-0 text-[12px] text-ink-4">{timeAgo(n.time)}</span>
                    </div>
                    <p className="mt-[4px] text-[13px] leading-snug text-ink-3">{n.detail}</p>
                    <div className="mt-[6px] flex items-center gap-[10px] text-[12px]">
                      <span className="text-ink-4">{n.system}</span>
                      {n.route && (
                        <button
                          onClick={() => {
                            setOpen(false);
                            navigate(n.route!);
                          }}
                          className="text-gold hover:underline"
                        >
                          View
                        </button>
                      )}
                    </div>
                  </div>
                </li>
              ))}
            </ul>
            <div className="flex items-center justify-between px-[20px] py-[12px] text-[13px]">
              <span className="text-ink-3">
                Signed in as <span className="text-white">{user ?? '—'}</span>
              </span>
              <button onClick={() => void logout()} className="flex items-center gap-[6px] text-ink-2 hover:text-gold">
                <LogoutIcon size={16} /> Sign out
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
