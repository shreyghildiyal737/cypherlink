import { DiscoverPortalCard } from '../components/discover/DiscoverPortalCard';
import { Badge } from '../components/ui/Badge';
import { FadeUp, StaggerChildren } from '../components/ui/motion';

export default function Discover() {
  return (
    <div className="mx-auto max-w-7xl px-margin-mobile md:px-margin-desktop py-8 md:py-12">
      <FadeUp>
        <Badge tone="orange">Discovery should lead to creation</Badge>
        <h1 className="mt-4 max-w-4xl font-headline-xl text-headline-xl md:text-[clamp(2.5rem,6vw,4rem)] text-on-surface tracking-tight">
          Find people, scenes, projects and movements without losing the culture.
        </h1>
        <p className="mt-4 max-w-2xl font-body-md text-body-md text-on-surface-variant/60">
          The doorway into artists, cities, cyphers, free learning, community sessions and open collaboration.
        </p>
      </FadeUp>

      <StaggerChildren className="mt-10 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
        <DiscoverPortalCard
          eyebrow="People"
          title="Discover Artists"
          body="Find rappers, producers, vocalists, engineers, organizers and beginners by city, genre, language and role."
          to="/artists"
          tone="cyan"
        />
        <DiscoverPortalCard
          eyebrow="Cities"
          title="Explore Scenes"
          body="See how cities move through cyphers, projects and community work."
          to="/scenes"
          tone="muted"
        />
        <DiscoverPortalCard
          eyebrow="Projects"
          title="Open Collaborations"
          body="Find projects that need vocalists, producers, engineers and instrumentalists."
          to="/projects"
          tone="green"
        />
        <DiscoverPortalCard
          eyebrow="Culture"
          title="Cyphers"
          body="Open circles and venue sessions that live temporarily, then leave selected highlights behind."
          to="/cyphers"
          tone="orange"
        />
        <DiscoverPortalCard
          eyebrow="Community"
          title="Musicians for a Cause"
          body="Cleanup drives, helping sessions, artist support and free teaching."
          to="/community"
          tone="green"
        />
        <DiscoverPortalCard
          eyebrow="Moments"
          title="Clips"
          body="Watch selected clips and highlights intentionally, not as a forced default dopamine loop."
          to="/feed"
          tone="cyan"
        />
      </StaggerChildren>
    </div>
  );
}
