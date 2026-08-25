-- Add COMMUNITY_HELP to CommunitySessionType enum
ALTER TYPE "CommunitySessionType" ADD VALUE IF NOT EXISTS 'COMMUNITY_HELP';

-- Add discovery fields to Profile
ALTER TABLE "Profile"
  ADD COLUMN IF NOT EXISTS "primaryRole"      TEXT,
  ADD COLUMN IF NOT EXISTS "languages"        TEXT[]  NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS "openToCollab"     BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS "beginnerFriendly" BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS "trustSignals"     TEXT[]  NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS "lastActiveAt"     TIMESTAMP(3);

-- Add discovery/safety fields to CommunitySession
ALTER TABLE "CommunitySession"
  ADD COLUMN IF NOT EXISTS "approximateLocation" TEXT,
  ADD COLUMN IF NOT EXISTS "capacity"            INTEGER,
  ADD COLUMN IF NOT EXISTS "freeLearning"        BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS "topic"               TEXT,
  ADD COLUMN IF NOT EXISTS "level"               TEXT,
  ADD COLUMN IF NOT EXISTS "safetyTags"          TEXT[]  NOT NULL DEFAULT '{}';

-- Index for artist discovery queries (city + openToCollab + beginnerFriendly)
CREATE INDEX IF NOT EXISTS "Profile_city_openToCollab_idx" ON "Profile"("city", "openToCollab");
CREATE INDEX IF NOT EXISTS "Profile_primaryRole_idx" ON "Profile"("primaryRole");
CREATE INDEX IF NOT EXISTS "Profile_lastActiveAt_idx" ON "Profile"("lastActiveAt");
