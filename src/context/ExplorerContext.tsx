import { normalizeSavedTariff } from '../utils/pricing';
import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { loadCatalog, sampleCatalog, type Listing } from '../data/catalog';
import type { Coordinates } from '../utils/staySearch';
export type StartingPoint = { mode: 'city' | 'current' | 'manual'; label: string; coordinates: Coordinates | null };
export const cityCentre: StartingPoint = { mode: 'city', label: 'Bhopal City Centre', coordinates: { latitude: 23.250, longitude: 77.420 } };
function read<T>(key: string, fallback: T): T { try { return JSON.parse(localStorage.getItem(key) || 'null') ?? fallback; } catch { return fallback; } }
function useExplorerState() {
  const [catalog, setCatalog] = useState<Listing[]>(sampleCatalog);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [favourites, setFavourites] = useState<Listing[]>(() => read<Listing[]>('traar-favourites', []).map(normalizeSavedTariff));
  const [comparison, setComparison] = useState<Listing[]>([]);
  const [persons, setPersons] = useState(() => Math.max(1, Math.min(99, Number(read('traar-persons', 1)) || 1)));
  const [startingPoint, setStartingPoint] = useState<StartingPoint>(() => read('traar-starting-point', cityCentre));
  const [query, setQuery] = useState('');
  const [notice, setNotice] = useState('');
  const [notifications, setNotifications] = useState<string[]>([]);
  const [readCount, setReadCount] = useState(0);
  const [modal, setModal] = useState<'compare' | 'profile' | 'notifications' | 'starting' | null>(null);
  const [detail, setDetail] = useState<Listing | null>(null);
  const [ways, setWays] = useState<Listing | null>(null);
  const [report, setReport] = useState<Listing | null>(null);
  useEffect(() => {
    let active = true;
    loadCatalog().then((rows) => { if (active) setCatalog([...rows, ...sampleCatalog]); })
      .catch(() => { if (active) setLoadError('Live provider listings are unavailable. Showing the existing destination guide.'); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, []);
  useEffect(() => { try { localStorage.setItem('traar-favourites', JSON.stringify(favourites)); } catch { /* Storage is optional. */ } }, [favourites]);
  useEffect(() => { try { localStorage.setItem('traar-persons', JSON.stringify(persons)); localStorage.setItem('traar-starting-point', JSON.stringify(startingPoint)); } catch { /* Storage is optional. */ } }, [persons, startingPoint]);
  function notify(message: string) { setNotice(message); setNotifications((current) => [message, ...current].slice(0, 30)); }
  function toggleFavourite(listing: Listing) {
    setFavourites((current) => current.some((item) => item.key === listing.key) ? current.filter((item) => item.key !== listing.key) : [...current, listing]);
  }
  function toggleCompare(listing: Listing) {
    if (!comparison.some((item) => item.key === listing.key) && comparison.length >= 3) { notify('Compare up to 3 services. Remove one to add another.'); setModal('compare'); return; }
    setComparison((current) => current.some((item) => item.key === listing.key) ? current.filter((item) => item.key !== listing.key) : [...current, listing]);
  }
  return { catalog, loading, loadError, favourites, toggleFavourite, comparison, toggleCompare, persons, setPersons,
    startingPoint, setStartingPoint, query, setQuery, notice, setNotice, notifications, readCount, setReadCount,
    modal, setModal, detail, setDetail, ways, setWays, report, setReport, notify };
}
const ExplorerContext = createContext<ReturnType<typeof useExplorerState> | null>(null);
export function ExplorerProvider({ children }: { children: ReactNode }) { const value = useExplorerState(); return <ExplorerContext.Provider value={value}>{children}</ExplorerContext.Provider>; }
export function useExplorer() { const context = useContext(ExplorerContext); if (!context) throw new Error('ExplorerProvider is required'); return context; }
