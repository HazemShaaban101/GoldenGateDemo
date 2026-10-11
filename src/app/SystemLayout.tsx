import { Suspense, useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { useLocation, useOutlet, useParams } from 'react-router-dom';
import { TopBar } from '@/components/chrome/TopBar';
import { SubsystemTabs } from '@/components/frame/SubsystemTabs';
import { AlertBanner } from '@/components/chrome/AlertBanner';
import { ConnectionBanner } from '@/components/chrome/ConnectionBanner';
import { ScopeBar } from '@/components/chrome/ScopeBar';
import { useScopeStore } from '@/sim/scope';
import { systemById } from '@/model/navigation';

/**
 * Chrome around every screen: header, the page (cross-fading between routes), the subsystem tabs
 * of the current system, and platform-wide banners (fire alarm, gateway reconnecting).
 */
export function SystemLayout() {
  const location = useLocation();
  const { system } = useParams();
  const sys = systemById(system);
  const setScope = useScopeStore((st) => st.setScope);

  // Warm the drill-down screens so opening a building or a floor never waits on a download.
  useEffect(() => {
    const t = setTimeout(() => {
      void import('@/screens/site/BuildingScreen');
      void import('@/screens/site/FloorScreen');
      void import('@/screens/site/EquipmentScreen');
    }, 1500);
    return () => clearTimeout(t);
  }, []);

  // The home page is the whole project; entering a building scopes every vertical to it until the
  // user goes home or picks another scope.
  useEffect(() => {
    if (location.pathname === '/') setScope('project');
    const m = location.pathname.match(/^\/site\/([^/]+)/);
    if (m) setScope(m[1]);
  }, [location.pathname, setScope]);

  return (
    <>
      <TopBar />
      <AnimatePresence mode="popLayout" initial={false}>
        <motion.main
          key={location.pathname}
          className="absolute inset-0"
          initial={{ opacity: 0, filter: 'blur(4px)' }}
          // Drop the filter once settled: an idle blur(0px) still costs a compositing layer.
          animate={{ opacity: 1, filter: 'blur(0px)', transitionEnd: { filter: 'none' } }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.22, ease: 'easeOut' }}
          style={{ top: 0 }}
        >
          <Suspense fallback={null}>
            <FrozenOutlet />
          </Suspense>
        </motion.main>
      </AnimatePresence>
      <ScopeBar />
      {sys && sys.subsystems.length > 0 && <SubsystemTabs system={sys} />}
      <AlertBanner />
      <ConnectionBanner />
    </>
  );
}

/**
 * The route element as it was when this page mounted. While a page fades out, the router has already
 * moved on; a live <Outlet /> would re-render the leaving page as the new route.
 */
function FrozenOutlet() {
  const outlet = useOutlet();
  const [frozen] = useState(outlet);
  return frozen;
}
