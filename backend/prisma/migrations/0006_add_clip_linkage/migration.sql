-- Add optional FK linkage from Clip to Cypher, Project, CommunitySession.
-- All nullable so existing clips keep working; ON DELETE SET NULL keeps clip
-- visible even after the linked entity is removed.

ALTER TABLE "Clip"
  ADD COLUMN IF NOT EXISTS "cypherId" TEXT,
  ADD COLUMN IF NOT EXISTS "projectId" TEXT,
  ADD COLUMN IF NOT EXISTS "communitySessionId" TEXT;

DO $$ BEGIN
  ALTER TABLE "Clip"
    ADD CONSTRAINT "Clip_cypherId_fkey"
    FOREIGN KEY ("cypherId") REFERENCES "Cypher"("id")
    ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE "Clip"
    ADD CONSTRAINT "Clip_projectId_fkey"
    FOREIGN KEY ("projectId") REFERENCES "Project"("id")
    ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE "Clip"
    ADD CONSTRAINT "Clip_communitySessionId_fkey"
    FOREIGN KEY ("communitySessionId") REFERENCES "CommunitySession"("id")
    ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE INDEX IF NOT EXISTS "Clip_cypherId_idx" ON "Clip"("cypherId");
CREATE INDEX IF NOT EXISTS "Clip_projectId_idx" ON "Clip"("projectId");
CREATE INDEX IF NOT EXISTS "Clip_communitySessionId_idx" ON "Clip"("communitySessionId");
