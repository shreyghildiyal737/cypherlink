import { SceneCard } from '../components/scenes/SceneCard';
import { Badge } from '../components/ui/Badge';
import { FadeUp, StaggerChildren } from '../components/ui/motion';
import { scenes as mockScenes, Scene } from '../data/discoveryMock';
import { useScenes } from '../hooks/useScenes';

function mapApiScene(s: any): Scene {
  return {
    id: `scene-${s.city.toLowerCase()}`,
    city: s.city,
    region: '',
    title: `${s.city} scene`,
    subtitle: `${s.activeArtists} artists • ${s.openProjects} open projects • ${s.upcomingCyphers} cyphers`,
    dominantGenres: [],
    momentum: 'Scene Active',
    activeArtists: s.activeArtists ?? 0,
    openProjects: s.openProjects ?? 0,
    upcomingCyphers: s.upcomingCyphers ?? 0,
    communitySessions: s.communitySessions ?? 0,
  };
}

export default function Scenes() {
  const { data, isLoading } = useScenes();
  const apiScenes = Array.isArray(data) ? data.map(mapApiScene) : [];
  const scenes = apiScenes.length > 0 ? apiScenes : mockScenes;
  const showingMock = apiScenes.length === 0 && !isLoading;

  return (
    <div className="mx-auto max-w-7xl px-margin-mobile md:px-margin-desktop py-8 md:py-12">
      <FadeUp>
        <Badge tone="muted">Cities have sound</Badge>
        <h1 className="mt-4 max-w-4xl font-headline-xl text-headline-xl md:text-[clamp(2.5rem,6vw,4rem)] text-on-surface tracking-tight">
          Explore music scenes as living ecosystems.
        </h1>
        <p className="mt-4 max-w-2xl font-body-md text-body-md text-on-surface-variant/60">
          Scenes are artists, cyphers, projects, languages, memories, learning circles and community action.
        </p>
      </FadeUp>

      {isLoading && (
        <div className="mt-10 grid gap-5 md:grid-cols-2">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-64 animate-pulse rounded-2xl glass-card" />
          ))}
        </div>
      )}

      {!isLoading && showingMock && (
        <p className="mt-6 font-label-sm text-xs text-on-surface-variant/28">
          Showing sample scenes — real city data fills in as artists join.
        </p>
      )}

      {!isLoading && (
        <StaggerChildren className="mt-10 grid gap-5 md:grid-cols-2">
          {scenes.map((scene) => <SceneCard key={scene.id} scene={scene} />)}
        </StaggerChildren>
      )}
    </div>
  );
}
