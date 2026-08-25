import { useState, useCallback, useEffect } from 'react';
import type { ArtistDiscoveryFilters } from '../../hooks';

const ROLES = ['Rapper', 'Producer', 'Vocalist', 'Engineer', 'Beatmaker', 'DJ', 'Instrumentalist', 'Visual Artist', 'Organizer'];
const GENRES = ['Hip-hop', 'Trap', 'Drill', 'Afrobeats', 'R&B', 'Lo-fi', 'Jazz Rap', 'Punjabi Rap', 'Desi Hip-hop'];
const AVAILABILITY_OPTIONS = [
  { label: 'Open', value: 'OPEN' },
  { label: 'Selective', value: 'SELECTIVE' },
  { label: 'Busy', value: 'BUSY' },
];

interface Props {
  onFilter?: (filters: ArtistDiscoveryFilters) => void;
}

export function ArtistFilters({ onFilter }: Props) {
  const [q, setQ] = useState('');
  const [city, setCity] = useState('');
  const [role, setRole] = useState('');
  const [genre, setGenre] = useState('');
  const [openToCollab, setOpenToCollab] = useState(false);
  const [beginnerFriendly, setBeginnerFriendly] = useState(false);
  const [localRemote, setLocalRemote] = useState('');
  const [availability, setAvailability] = useState('');

  const emit = useCallback(() => {
    onFilter?.({
      city: city || undefined,
      role: role || undefined,
      genre: genre || undefined,
      openToCollab: openToCollab || undefined,
      beginnerFriendly: beginnerFriendly || undefined,
      localRemote: localRemote || undefined,
      availability: availability || undefined,
    });
  }, [city, role, genre, openToCollab, beginnerFriendly, localRemote, availability, onFilter]);

  useEffect(() => { emit(); }, [emit]);

  const active =
    !!city || !!role || !!genre || openToCollab || beginnerFriendly || !!localRemote || !!availability;

  function clearAll() {
    setCity('');
    setRole('');
    setGenre('');
    setOpenToCollab(false);
    setBeginnerFriendly(false);
    setLocalRemote('');
    setAvailability('');
  }

  return (
    <section className="glass-card rounded-2xl border border-white/[0.06] p-5 space-y-4">
      {/* Text search */}
      <div className="flex items-center gap-3 rounded-xl border border-white/[0.08] bg-white/[0.03] px-4 py-3 transition-colors focus-within:border-primary-container/40 focus-within:ring-1 focus-within:ring-primary-container/20">
        <span className="material-symbols-outlined shrink-0 text-lg text-on-surface-variant/40">search</span>
        <input
          className="w-full bg-transparent font-body-md text-sm text-on-surface outline-none placeholder:text-on-surface-variant/28"
          placeholder="Search artists by name, handle, city, genre..."
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />
      </div>

      {/* Filter row */}
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4">
        {/* City */}
        <input
          className="rounded-xl border border-white/[0.08] bg-white/[0.03] px-3 py-2 font-body-md text-sm text-on-surface placeholder:text-on-surface-variant/30 outline-none focus:border-primary-container/40 transition"
          placeholder="City"
          value={city}
          onChange={(e) => setCity(e.target.value)}
        />

        {/* Role */}
        <select
          value={role}
          onChange={(e) => setRole(e.target.value)}
          className="rounded-xl border border-white/[0.08] bg-surface px-3 py-2 font-body-md text-sm text-on-surface outline-none focus:border-primary-container/40 transition"
        >
          <option value="">Any role</option>
          {ROLES.map((r) => <option key={r} value={r}>{r}</option>)}
        </select>

        {/* Genre */}
        <select
          value={genre}
          onChange={(e) => setGenre(e.target.value)}
          className="rounded-xl border border-white/[0.08] bg-surface px-3 py-2 font-body-md text-sm text-on-surface outline-none focus:border-primary-container/40 transition"
        >
          <option value="">Any genre</option>
          {GENRES.map((g) => <option key={g} value={g}>{g}</option>)}
        </select>

        {/* Availability */}
        <select
          value={availability}
          onChange={(e) => setAvailability(e.target.value)}
          className="rounded-xl border border-white/[0.08] bg-surface px-3 py-2 font-body-md text-sm text-on-surface outline-none focus:border-primary-container/40 transition"
        >
          <option value="">Any availability</option>
          {AVAILABILITY_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>
      </div>

      {/* Toggle filters row */}
      <div className="flex flex-wrap items-center gap-2">
        <button
          onClick={() => setOpenToCollab((v) => !v)}
          className={`rounded-full border px-4 py-1.5 font-label-sm text-sm transition ${
            openToCollab
              ? 'border-primary-container/50 bg-primary-container/15 text-primary-fixed-dim'
              : 'border-white/[0.08] bg-white/[0.04] text-on-surface-variant/60 hover:border-primary-container/20 hover:text-on-surface'
          }`}
        >
          Open to collab
        </button>
        <button
          onClick={() => setBeginnerFriendly((v) => !v)}
          className={`rounded-full border px-4 py-1.5 font-label-sm text-sm transition ${
            beginnerFriendly
              ? 'border-green-500/40 bg-green-500/10 text-green-400'
              : 'border-white/[0.08] bg-white/[0.04] text-on-surface-variant/60 hover:border-primary-container/20 hover:text-on-surface'
          }`}
        >
          Beginner friendly
        </button>
        {(['LOCAL', 'REMOTE', 'BOTH'] as const).map((v) => (
          <button
            key={v}
            onClick={() => setLocalRemote(localRemote === v ? '' : v)}
            className={`rounded-full border px-4 py-1.5 font-label-sm text-sm transition ${
              localRemote === v
                ? 'border-primary-container/50 bg-primary-container/15 text-primary-fixed-dim'
                : 'border-white/[0.08] bg-white/[0.04] text-on-surface-variant/60 hover:border-primary-container/20 hover:text-on-surface'
            }`}
          >
            {v === 'LOCAL' ? 'Local only' : v === 'REMOTE' ? 'Remote OK' : 'Local + Remote'}
          </button>
        ))}
        {active && (
          <button
            onClick={clearAll}
            className="rounded-full border border-white/[0.06] px-4 py-1.5 font-label-sm text-sm text-on-surface-variant/40 hover:text-on-surface-variant/70 transition"
          >
            Clear filters
          </button>
        )}
      </div>
    </section>
  );
}
