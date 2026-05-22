-- AlterTable: add check-in token fields to CypherRSVP
ALTER TABLE "CypherRSVP" ADD COLUMN "checkInTokenHash" TEXT;
ALTER TABLE "CypherRSVP" ADD COLUMN "checkInTokenExpiresAt" TIMESTAMP(3);

-- Index for token hash lookup on CypherRSVP
CREATE INDEX "CypherRSVP_checkInTokenHash_idx" ON "CypherRSVP"("checkInTokenHash");

-- AlterTable: add token expiry to CommunitySessionRSVP (hash column already exists)
ALTER TABLE "CommunitySessionRSVP" ADD COLUMN "checkInTokenExpiresAt" TIMESTAMP(3);

-- Index for token hash lookup on CommunitySessionRSVP
CREATE INDEX "CommunitySessionRSVP_checkInTokenHash_idx" ON "CommunitySessionRSVP"("checkInTokenHash");
