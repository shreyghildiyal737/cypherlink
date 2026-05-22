import { MapContainer, TileLayer, CircleMarker, Popup } from "react-leaflet";
import { Link } from "react-router-dom";
import { usePublicMap } from "../hooks";
import { Badge } from "../components/ui/Badge";
import { Button } from "../components/ui/Button";
const scenePoints = [
  { name: "Delhi", pos: [28.6139, 77.209], label: "Hip-Hop scene active" },
  {
    name: "Mumbai",
    pos: [19.076, 72.8777],
    label: "Venue cypher • spots filling",
  },
  {
    name: "Bangalore",
    pos: [12.9716, 77.5946],
    label: "Community sessions active",
  },
  {
    name: "Shillong",
    pos: [25.5788, 91.8933],
    label: "Experimental indie rising",
  },
] as const;
export default function MapPage() {
  const { data } = usePublicMap();
  const nearby = (data?.cyphers?.length ?? 0 > 0) ? data!.cyphers[0] : null;
  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      <Badge tone="cyan">Scene-level awareness. Never creepy tracking.</Badge>
      <h1 className="mt-4 text-4xl font-black md:text-6xl">Living scene map</h1>
      <p className="mt-3 max-w-2xl text-white/60">
        See music activity breathing across cities: cyphers, scenes, live
        sessions, open projects and community moves.
      </p>
      <div className="mt-8 overflow-hidden rounded-[2.5rem] border border-white/10 bg-panel">
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
          {scenePoints.map((p) => (
            <CircleMarker
              key={p.name}
              center={p.pos as [number, number]}
              radius={16}
              pathOptions={{
                color: "#22D3EE",
                fillColor: "#8B5CF6",
                fillOpacity: 0.65,
              }}
            >
              <Popup>
                <div className="text-black">
                  <strong>{p.name}</strong>
                  <p>{p.label}</p>
                </div>
              </Popup>
            </CircleMarker>
          ))}
        </MapContainer>
      </div>
      <div className="mt-6 grid gap-5 md:grid-cols-2">
        {nearby && (
          <div className="rounded-[2rem] border border-white/10 bg-panel p-5">
            <Badge tone="orange">Nearby cypher</Badge>
            <h2 className="mt-4 text-2xl font-black">{nearby.title}</h2>
            <p className="mt-2 text-white/60">
              {nearby.city} • {nearby.pullingUp} pulling up
            </p>
            <Link to={`/cyphers/${nearby.id}`}>
              <Button className="mt-5">Open venue page</Button>
            </Link>
          </div>
        )}
        <div className="rounded-[2rem] border border-white/10 bg-panel p-5">
          <Badge tone="purple">Community pulse</Badge>
          <h2 className="mt-4 text-2xl font-black">
            {(data?.sessions?.length ?? 0 > 0)
              ? `${data!.sessions.length} active sessions`
              : "Sessions loading..."}
          </h2>
          <p className="mt-2 text-white/60">
            Tap a map node to expand into a full location card with venue,
            safety, directions and RSVP.
          </p>
          <Link to="/cyphers">
            <Button className="mt-5">Browse all cyphers</Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
