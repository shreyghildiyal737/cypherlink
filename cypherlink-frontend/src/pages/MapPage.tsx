import { MapContainer, TileLayer, CircleMarker, Popup } from "react-leaflet";
import { Link } from "react-router-dom";
import { usePublicMap } from "../hooks";
import { Badge } from "../components/ui/Badge";
import { Button } from "../components/ui/Button";
import { FadeUp } from "../components/ui/motion";
import type { SceneCity } from "../types";

function genreMood(genres: string[]): string {
  if (!genres.length) return "";
  const mood: Record<string, string> = {
    "Trap": "hard and humid",
    "Drill": "urgent and raw",
    "Boom bap": "classic and grounded",
    "R&B": "smooth and layered",
    "Afrobeats": "vibrant and moving",
    "Jazz": "introspective and deep",
    "Lo-fi": "quiet and late-night",
    "Experimental": "restless and searching",
    "Hip-hop": "real and present",
    "Spoken word": "precise and alive",
    "Pop": "open and melodic",
    "Indie": "independent and built",
  };
  const first = genres[0];
  return mood[first] ?? "";
}

export default function MapPage() {
  const { data } = usePublicMap();
  const cities: SceneCity[] = data?.cities ?? [];

  const sorted = cities
    .slice()
    .sort(
      (a, b) =>
        b.activeCyphers * 4 +
        b.artistCount -
        (a.activeCyphers * 4 + a.artistCount),
    );

  const activeCities = sorted.filter((c) => c.activeCyphers > 0);

  return (
    <div className="mx-auto max-w-7xl px-margin-mobile md:px-margin-desktop py-8 md:py-12">
      <FadeUp>
        <Badge tone="muted">Scene-level awareness. Never creepy tracking.</Badge>
        <h1 className="mt-4 font-headline-xl text-headline-xl md:text-[clamp(2.5rem,6vw,4rem)] text-on-surface tracking-tight">
          Living scene map
        </h1>
        <p className="mt-3 max-w-2xl font-body-md text-body-md text-on-surface-variant/60">
          Music activity breathing across cities. Brighter = more active right now.
        </p>
      </FadeUp>

      {/* Active now banner */}
      {activeCities.length > 0 && (
        <div className="mt-5 flex items-center gap-3 rounded-2xl border border-error/20 bg-error/05 px-5 py-3">
          <span className="h-2.5 w-2.5 animate-pulse rounded-full bg-error" />
          <p className="font-body-md text-sm text-on-surface/80">
            <span className="font-semibold">Active right now:</span>{" "}
            {activeCities.map((c) => c.city).join(", ")}
          </p>
        </div>
      )}

      {/* Map container — DO NOT touch this block */}
      <div className="mt-6 overflow-hidden rounded-2xl border border-white/[0.06] glass-card">
        <MapContainer
          center={[22.9734, 78.6569]}
          zoom={5}
          scrollWheelZoom={false}
          className="h-[66vh] min-h-[520px]"
        >
          <TileLayer
            attribution="&copy; OpenStreetMap contributors"
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          {cities.map((city) => {
            const activity = city.activeCyphers * 4 + city.artistCount * 2;
            const radius = Math.min(34, Math.max(9, activity / 3 + 9));
            const hasActiveCyphers = city.activeCyphers > 0;
            return (
              <CircleMarker
                key={city.city}
                center={[city.lat, city.lng]}
                radius={radius}
                pathOptions={{
                  color: hasActiveCyphers ? "#9333ea" : "#6d28d9",
                  fillColor: hasActiveCyphers ? "#9333ea" : "#6d28d9",
                  fillOpacity: hasActiveCyphers ? 0.70 : 0.38,
                  weight: hasActiveCyphers ? 2 : 1,
                }}
              >
                <Popup>
                  <div className="min-w-[180px] text-black">
                    <p className="text-base font-black">{city.city}</p>
                    {hasActiveCyphers && (
                      <p className="mt-0.5 font-semibold text-red-700">
                        {city.activeCyphers} cypher{city.activeCyphers !== 1 ? "s" : ""} active now
                      </p>
                    )}
                    <p className="mt-0.5 text-sm text-gray-600">
                      {city.artistCount} artist{city.artistCount !== 1 ? "s" : ""} building
                    </p>
                    {city.topGenres.length > 0 && (
                      <p className="mt-1 text-xs text-gray-400">
                        {city.topGenres.slice(0, 3).join(" · ")}
                      </p>
                    )}
                    <Link
                      to={`/scenes/${city.city.toLowerCase()}`}
                      className="mt-2 block text-sm font-semibold text-[#7c3aed] hover:underline"
                    >
                      Open {city.city} scene →
                    </Link>
                  </div>
                </Popup>
              </CircleMarker>
            );
          })}
        </MapContainer>
      </div>

      {cities.length === 0 && (
        <div className="mt-6 rounded-2xl border border-white/[0.06] glass-panel p-6 text-center">
          <p className="font-body-md text-on-surface-variant/50">
            Cities appear here as artists join and cyphers go live. Be the first in your city.
          </p>
          <Link to="/create">
            <Button className="mt-4">Start something</Button>
          </Link>
        </div>
      )}

      {sorted.length > 0 && (
        <div className="mt-6 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          {sorted.slice(0, 6).map((city) => {
            const mood = genreMood(city.topGenres);
            const isActive = city.activeCyphers > 0;
            return (
              <div
                key={city.city}
                className={`rounded-2xl border p-5 transition-all duration-300 hover:border-primary-container/20 ${
                  isActive
                    ? "border-error/25 bg-error/05"
                    : "border-white/[0.06] glass-card"
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    {city.topGenres.length > 0 && (
                      <p className="font-label-sm text-[10px] uppercase tracking-widest text-on-surface-variant/35">
                        {city.topGenres.slice(0, 2).join(" · ")}
                      </p>
                    )}
                    <h3 className="mt-1 font-headline-lg-mobile text-headline-lg-mobile text-on-surface">
                      {city.city}
                    </h3>
                    {mood && (
                      <p className="mt-0.5 font-label-sm text-xs italic text-on-surface-variant/35">{mood}</p>
                    )}
                    <p className="mt-1.5 font-body-md text-sm text-on-surface-variant/55">
                      {city.artistCount} artist{city.artistCount !== 1 ? "s" : ""}
                      {isActive && (
                        <span className="text-error">
                          {" · "}
                          <span className="inline-flex items-center gap-1">
                            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-error" />
                            {city.activeCyphers} active
                          </span>
                        </span>
                      )}
                    </p>
                  </div>
                  {isActive && <Badge tone="live">Live</Badge>}
                </div>
                <Link to={`/scenes/${city.city.toLowerCase()}`}>
                  <Button variant="secondary" className="mt-4 w-full">
                    Open scene
                  </Button>
                </Link>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
