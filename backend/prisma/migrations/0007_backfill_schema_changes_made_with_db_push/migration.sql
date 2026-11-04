-- Tables, enums and columns that reached schema.prisma through `prisma db push` and
-- never got a migration, so a database built from migrations alone was missing them.

-- CreateEnum
CREATE TYPE "AvailabilityStatus" AS ENUM ('OPEN', 'SELECTIVE', 'BUSY', 'UNAVAILABLE');

-- CreateEnum
CREATE TYPE "LocalRemotePreference" AS ENUM ('LOCAL', 'REMOTE', 'BOTH');

-- CreateEnum
CREATE TYPE "ProjectType" AS ENUM ('STRUCTURED', 'OPEN_COLLAB', 'COMMUNITY', 'CYPHER_EVENT');

-- CreateEnum
CREATE TYPE "CommitmentStyle" AS ENUM ('EXPERIMENTAL', 'CASUAL', 'QUICK_JAM', 'ONE_NIGHT_SESSION', 'LONG_TERM_PROJECT', 'RELEASE_FOCUSED', 'PRACTICE_SESSION', 'LEARNING_PROJECT');

-- CreateEnum
CREATE TYPE "ContributorStatus" AS ENUM ('ACTIVE', 'LEFT_VOLUNTARILY', 'REMOVED_BY_LEAD', 'INACTIVE', 'COMPLETED_CONTRIBUTION');

-- CreateEnum
CREATE TYPE "MilestoneStatus" AS ENUM ('TODO', 'IN_PROGRESS', 'SUBMITTED', 'REVISION_REQUESTED', 'APPROVED', 'COMPLETED');

-- CreateEnum
CREATE TYPE "RightsTag" AS ENUM ('DRAFT_ONLY', 'PROJECT_USE_ALLOWED', 'COMMERCIAL_USE_ALLOWED', 'OWNERSHIP_TRANSFERRED', 'ROYALTY_SPLIT_INTENDED');

-- CreateEnum
CREATE TYPE "ApplicationStatus" AS ENUM ('PENDING', 'ACCEPTED', 'REJECTED');

-- CreateEnum
CREATE TYPE "ProjectLifecycleState" AS ENUM ('ACTIVE', 'SLOWING_DOWN', 'INACTIVE', 'ARCHIVED', 'COMPLETED');

-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "NotificationType" ADD VALUE 'CYPHER_FOLLOWUP';
ALTER TYPE "NotificationType" ADD VALUE 'ROLE_APPLICATION';
ALTER TYPE "NotificationType" ADD VALUE 'MILESTONE_ASSIGNED';
ALTER TYPE "NotificationType" ADD VALUE 'DELIVERABLE_SUBMITTED';
ALTER TYPE "NotificationType" ADD VALUE 'REVISION_NEEDED';
ALTER TYPE "NotificationType" ADD VALUE 'PROJECT_COMPLETED';

-- AlterTable
ALTER TABLE "CypherRSVP" ADD COLUMN     "aliasName" TEXT,
ADD COLUMN     "intentNote" TEXT;

-- AlterTable
ALTER TABLE "Profile" ADD COLUMN     "availabilityStatus" "AvailabilityStatus" NOT NULL DEFAULT 'OPEN',
ADD COLUMN     "collaborationCapacity" INTEGER,
ADD COLUMN     "collaborationIntent" TEXT,
ADD COLUMN     "localRemotePreference" "LocalRemotePreference" NOT NULL DEFAULT 'BOTH',
ADD COLUMN     "lookingFor" TEXT[],
ADD COLUMN     "secondaryRoles" TEXT[];

-- AlterTable
ALTER TABLE "Project" ADD COLUMN     "aiDisclosureLabel" TEXT,
ADD COLUMN     "bornFromCypherId" TEXT,
ADD COLUMN     "commitmentStyle" "CommitmentStyle",
ADD COLUMN     "completedAt" TIMESTAMP(3),
ADD COLUMN     "expiresAt" TIMESTAMP(3),
ADD COLUMN     "filledRoles" TEXT[],
ADD COLUMN     "lastMeaningfulActivityAt" TIMESTAMP(3),
ADD COLUMN     "lifecycleState" "ProjectLifecycleState" NOT NULL DEFAULT 'ACTIVE',
ADD COLUMN     "localRemote" "LocalRemotePreference" NOT NULL DEFAULT 'BOTH',
ADD COLUMN     "participantCap" INTEGER,
ADD COLUMN     "projectType" "ProjectType" NOT NULL DEFAULT 'STRUCTURED',
ADD COLUMN     "roughExpectation" TEXT,
ADD COLUMN     "suppressReason" TEXT,
ADD COLUMN     "suppressedAt" TIMESTAMP(3),
ADD COLUMN     "typeTransitionLog" JSONB;

-- AlterTable
ALTER TABLE "ProjectMember" ADD COLUMN     "creativeRole" TEXT,
ADD COLUMN     "removedAt" TIMESTAMP(3),
ADD COLUMN     "removedNote" TEXT,
ADD COLUMN     "status" "ContributorStatus" NOT NULL DEFAULT 'ACTIVE';

-- AlterTable
ALTER TABLE "ProjectMessage" ADD COLUMN     "linkedDeliverableId" TEXT,
ADD COLUMN     "linkedMilestoneId" TEXT;

-- CreateTable
CREATE TABLE "ProjectRoleApplication" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "applicantId" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "message" TEXT,
    "status" "ApplicationStatus" NOT NULL DEFAULT 'PENDING',
    "respondedAt" TIMESTAMP(3),
    "respondedById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ProjectRoleApplication_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProjectMilestone" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "dueDate" TIMESTAMP(3),
    "assignedRole" TEXT,
    "assignedContributorId" TEXT,
    "deliverableExpectation" TEXT,
    "status" "MilestoneStatus" NOT NULL DEFAULT 'TODO',
    "order" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ProjectMilestone_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProjectDeliverable" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "milestoneId" TEXT,
    "submittedById" TEXT NOT NULL,
    "role" TEXT,
    "fileKey" TEXT,
    "fileName" TEXT,
    "fileSize" INTEGER,
    "mimeType" TEXT,
    "publicUrl" TEXT,
    "note" TEXT,
    "rightsTag" "RightsTag" NOT NULL DEFAULT 'PROJECT_USE_ALLOWED',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ProjectDeliverable_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProjectRevisionRequest" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "milestoneId" TEXT,
    "deliverableId" TEXT,
    "requestedById" TEXT NOT NULL,
    "note" TEXT NOT NULL,
    "resolvedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ProjectRevisionRequest_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SafetyNote" (
    "id" TEXT NOT NULL,
    "targetType" TEXT NOT NULL,
    "targetId" TEXT NOT NULL,
    "organizerId" TEXT NOT NULL,
    "note" TEXT NOT NULL,
    "severity" TEXT NOT NULL DEFAULT 'LOW',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SafetyNote_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Incident" (
    "id" TEXT NOT NULL,
    "targetType" TEXT NOT NULL,
    "targetId" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'OPEN',
    "priority" TEXT NOT NULL DEFAULT 'MEDIUM',
    "summary" TEXT,
    "resolvedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Incident_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OrganizerRequest" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "reason" TEXT,
    "reviewedById" TEXT,
    "reviewedAt" TIMESTAMP(3),
    "internalNote" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "OrganizerRequest_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VerificationRequest" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "reason" TEXT,
    "reviewedById" TEXT,
    "reviewedAt" TIMESTAMP(3),
    "internalNote" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "VerificationRequest_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CollaborationMemory" (
    "id" TEXT NOT NULL,
    "userAId" TEXT NOT NULL,
    "userBId" TEXT NOT NULL,
    "collabCount" INTEGER NOT NULL DEFAULT 1,
    "firstContextType" TEXT,
    "firstContextId" TEXT,
    "firstContextTitle" TEXT,
    "lastCollabAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "isHiddenByA" BOOLEAN NOT NULL DEFAULT false,
    "isHiddenByB" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CollaborationMemory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Collective" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "handle" TEXT,
    "description" TEXT,
    "city" TEXT,
    "avatarUrl" TEXT,
    "bornFromCypherId" TEXT,
    "foundedById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "Collective_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CollectiveMember" (
    "id" TEXT NOT NULL,
    "collectiveId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'member',
    "joinedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CollectiveMember_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PushSubscription" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "endpoint" TEXT NOT NULL,
    "p256dh" TEXT NOT NULL,
    "auth" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PushSubscription_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ProjectRoleApplication_projectId_idx" ON "ProjectRoleApplication"("projectId");

-- CreateIndex
CREATE INDEX "ProjectRoleApplication_applicantId_idx" ON "ProjectRoleApplication"("applicantId");

-- CreateIndex
CREATE INDEX "ProjectMilestone_projectId_idx" ON "ProjectMilestone"("projectId");

-- CreateIndex
CREATE INDEX "ProjectDeliverable_projectId_idx" ON "ProjectDeliverable"("projectId");

-- CreateIndex
CREATE INDEX "ProjectDeliverable_milestoneId_idx" ON "ProjectDeliverable"("milestoneId");

-- CreateIndex
CREATE INDEX "ProjectRevisionRequest_projectId_idx" ON "ProjectRevisionRequest"("projectId");

-- CreateIndex
CREATE INDEX "SafetyNote_targetType_targetId_idx" ON "SafetyNote"("targetType", "targetId");

-- CreateIndex
CREATE UNIQUE INDEX "OrganizerRequest_userId_key" ON "OrganizerRequest"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "VerificationRequest_userId_key" ON "VerificationRequest"("userId");

-- CreateIndex
CREATE INDEX "CollaborationMemory_userAId_idx" ON "CollaborationMemory"("userAId");

-- CreateIndex
CREATE INDEX "CollaborationMemory_userBId_idx" ON "CollaborationMemory"("userBId");

-- CreateIndex
CREATE INDEX "CollaborationMemory_lastCollabAt_idx" ON "CollaborationMemory"("lastCollabAt");

-- CreateIndex
CREATE UNIQUE INDEX "CollaborationMemory_userAId_userBId_key" ON "CollaborationMemory"("userAId", "userBId");

-- CreateIndex
CREATE UNIQUE INDEX "Collective_handle_key" ON "Collective"("handle");

-- CreateIndex
CREATE INDEX "Collective_city_idx" ON "Collective"("city");

-- CreateIndex
CREATE INDEX "CollectiveMember_collectiveId_idx" ON "CollectiveMember"("collectiveId");

-- CreateIndex
CREATE INDEX "CollectiveMember_userId_idx" ON "CollectiveMember"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "CollectiveMember_collectiveId_userId_key" ON "CollectiveMember"("collectiveId", "userId");

-- CreateIndex
CREATE UNIQUE INDEX "PushSubscription_endpoint_key" ON "PushSubscription"("endpoint");

-- CreateIndex
CREATE INDEX "PushSubscription_userId_idx" ON "PushSubscription"("userId");

-- CreateIndex
CREATE INDEX "Project_status_idx" ON "Project"("status");

-- CreateIndex
CREATE INDEX "Project_projectType_idx" ON "Project"("projectType");

-- CreateIndex
CREATE INDEX "Project_commitmentStyle_idx" ON "Project"("commitmentStyle");

-- CreateIndex
CREATE INDEX "Project_expiresAt_idx" ON "Project"("expiresAt");

-- CreateIndex
CREATE INDEX "Project_bornFromCypherId_idx" ON "Project"("bornFromCypherId");

-- CreateIndex
CREATE INDEX "Project_lifecycleState_idx" ON "Project"("lifecycleState");

-- CreateIndex
CREATE INDEX "Project_lastMeaningfulActivityAt_idx" ON "Project"("lastMeaningfulActivityAt");

-- CreateIndex
CREATE INDEX "Project_suppressedAt_idx" ON "Project"("suppressedAt");

-- AddForeignKey
ALTER TABLE "ProjectMessage" ADD CONSTRAINT "ProjectMessage_linkedMilestoneId_fkey" FOREIGN KEY ("linkedMilestoneId") REFERENCES "ProjectMilestone"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProjectMessage" ADD CONSTRAINT "ProjectMessage_linkedDeliverableId_fkey" FOREIGN KEY ("linkedDeliverableId") REFERENCES "ProjectDeliverable"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProjectRoleApplication" ADD CONSTRAINT "ProjectRoleApplication_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProjectRoleApplication" ADD CONSTRAINT "ProjectRoleApplication_applicantId_fkey" FOREIGN KEY ("applicantId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProjectRoleApplication" ADD CONSTRAINT "ProjectRoleApplication_respondedById_fkey" FOREIGN KEY ("respondedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProjectMilestone" ADD CONSTRAINT "ProjectMilestone_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProjectMilestone" ADD CONSTRAINT "ProjectMilestone_assignedContributorId_fkey" FOREIGN KEY ("assignedContributorId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProjectDeliverable" ADD CONSTRAINT "ProjectDeliverable_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProjectDeliverable" ADD CONSTRAINT "ProjectDeliverable_milestoneId_fkey" FOREIGN KEY ("milestoneId") REFERENCES "ProjectMilestone"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProjectDeliverable" ADD CONSTRAINT "ProjectDeliverable_submittedById_fkey" FOREIGN KEY ("submittedById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProjectRevisionRequest" ADD CONSTRAINT "ProjectRevisionRequest_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProjectRevisionRequest" ADD CONSTRAINT "ProjectRevisionRequest_milestoneId_fkey" FOREIGN KEY ("milestoneId") REFERENCES "ProjectMilestone"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProjectRevisionRequest" ADD CONSTRAINT "ProjectRevisionRequest_deliverableId_fkey" FOREIGN KEY ("deliverableId") REFERENCES "ProjectDeliverable"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProjectRevisionRequest" ADD CONSTRAINT "ProjectRevisionRequest_requestedById_fkey" FOREIGN KEY ("requestedById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SafetyNote" ADD CONSTRAINT "SafetyNote_organizerId_fkey" FOREIGN KEY ("organizerId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrganizerRequest" ADD CONSTRAINT "OrganizerRequest_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrganizerRequest" ADD CONSTRAINT "OrganizerRequest_reviewedById_fkey" FOREIGN KEY ("reviewedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VerificationRequest" ADD CONSTRAINT "VerificationRequest_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VerificationRequest" ADD CONSTRAINT "VerificationRequest_reviewedById_fkey" FOREIGN KEY ("reviewedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CollaborationMemory" ADD CONSTRAINT "CollaborationMemory_userAId_fkey" FOREIGN KEY ("userAId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CollaborationMemory" ADD CONSTRAINT "CollaborationMemory_userBId_fkey" FOREIGN KEY ("userBId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Collective" ADD CONSTRAINT "Collective_foundedById_fkey" FOREIGN KEY ("foundedById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CollectiveMember" ADD CONSTRAINT "CollectiveMember_collectiveId_fkey" FOREIGN KEY ("collectiveId") REFERENCES "Collective"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CollectiveMember" ADD CONSTRAINT "CollectiveMember_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PushSubscription" ADD CONSTRAINT "PushSubscription_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

