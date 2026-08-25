import { PrismaClient, UserRole, CypherType, EventState, ProjectVisibility, ProjectStatus, MessageIntent, CommunitySessionType, NotificationType, ProjectType, CommitmentStyle, ContributorStatus, MilestoneStatus, RightsTag } from '@prisma/client';
import * as bcryptjs from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  const passwordHash = await bcryptjs.hash('password123', 10);

  // Users
  const kaali = await prisma.user.create({
    data: {
      email: 'kaali@cypherlink.in',
      passwordHash,
      displayName: 'Kaali',
      role: UserRole.USER,
      profile: {
        create: {
          handle: '@kaali.wav',
          bio: 'Delhi drill artist making waves in the underground scene.',
          city: 'Delhi',
          state: 'Delhi',
          genres: ['Hip-Hop', 'Drill'],
          momentum: 'Scene Active',
          avatarUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=kaali',
        },
      },
    },
    include: { profile: true },
  });

  const ayesha = await prisma.user.create({
    data: {
      email: 'ayesha@cypherlink.in',
      passwordHash,
      displayName: 'Ayesha',
      role: UserRole.USER,
      profile: {
        create: {
          handle: '@ayesha.soul',
          bio: 'Neo-soul vocalist from Bangalore. Looking to collaborate and create.',
          city: 'Bangalore',
          state: 'Karnataka',
          genres: ['Neo-Soul', 'R&B'],
          momentum: 'Rising',
          avatarUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=ayesha',
        },
      },
    },
    include: { profile: true },
  });

  const rdx = await prisma.user.create({
    data: {
      email: 'rdx@cypherlink.in',
      passwordHash,
      displayName: 'RDX',
      role: UserRole.ORGANIZER,
      profile: {
        create: {
          handle: '@rdxbeats',
          bio: 'Mumbai-based producer and organizer. Community trusted.',
          city: 'Mumbai',
          state: 'Maharashtra',
          genres: ['Producer', 'Trap'],
          momentum: 'Community Trusted',
          avatarUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=rdx',
        },
      },
    },
    include: { profile: true },
  });

  const mizo = await prisma.user.create({
    data: {
      email: 'mizo@cypherlink.in',
      passwordHash,
      displayName: 'Mizo Static',
      role: UserRole.USER,
      profile: {
        create: {
          handle: '@mizo.static',
          bio: 'Indie experimental artist from the hills of Shillong.',
          city: 'Shillong',
          state: 'Meghalaya',
          genres: ['Indie', 'Experimental'],
          momentum: 'New Voice',
          avatarUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=mizo',
        },
      },
    },
    include: { profile: true },
  });

  const raga = await prisma.user.create({
    data: {
      email: 'raga@cypherlink.in',
      passwordHash,
      displayName: 'Raga Mehta',
      role: UserRole.USER,
      profile: {
        create: {
          handle: '@raga.mehta',
          bio: 'Carnatic vocalist blending classical ragas with contemporary production. Chennai → Pune.',
          city: 'Chennai',
          state: 'Tamil Nadu',
          genres: ['Classical', 'Fusion'],
          momentum: 'Rising',
          avatarUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=raga',
        },
      },
    },
    include: { profile: true },
  });

  const priya = await prisma.user.create({
    data: {
      email: 'priya@cypherlink.in',
      passwordHash,
      displayName: 'Priya Rawat',
      role: UserRole.USER,
      profile: {
        create: {
          handle: '@priyarawat',
          bio: 'Folk singer-songwriter. Rajasthani roots, Hindustani heart. Looking for a tabla player.',
          city: 'Jaipur',
          state: 'Rajasthan',
          genres: ['Folk', 'Acoustic'],
          momentum: 'Scene Active',
          avatarUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=priya',
        },
      },
    },
    include: { profile: true },
  });

  const vik = await prisma.user.create({
    data: {
      email: 'vik@cypherlink.in',
      passwordHash,
      displayName: 'Vikrant DSP',
      role: UserRole.USER,
      profile: {
        create: {
          handle: '@vikrantdsp',
          bio: 'Ambient / club electronic producer. Chasing that Goa sunset sound.',
          city: 'Goa',
          state: 'Goa',
          genres: ['Electronic', 'Ambient'],
          momentum: 'New Voice',
          avatarUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=vik',
        },
      },
    },
    include: { profile: true },
  });

  // Follows
  await prisma.follow.createMany({
    data: [
      { followerId: kaali.id, followingId: ayesha.id },
      { followerId: kaali.id, followingId: rdx.id },
      { followerId: ayesha.id, followingId: kaali.id },
      { followerId: ayesha.id, followingId: mizo.id },
      { followerId: rdx.id, followingId: kaali.id },
      { followerId: rdx.id, followingId: mizo.id },
      { followerId: mizo.id, followingId: kaali.id },
      { followerId: mizo.id, followingId: ayesha.id },
      { followerId: raga.id, followingId: ayesha.id },
      { followerId: raga.id, followingId: mizo.id },
      { followerId: priya.id, followingId: raga.id },
      { followerId: priya.id, followingId: ayesha.id },
      { followerId: vik.id, followingId: rdx.id },
      { followerId: vik.id, followingId: mizo.id },
      { followerId: kaali.id, followingId: vik.id },
    ],
  });

  // Projects
  const project1 = await prisma.project.create({
    data: {
      title: 'Midnight Tape',
      description: 'A collaborative neo-soul tape fusing Hindi and English lyrics.',
      status: ProjectStatus.LOOKING_FOR_COLLABORATORS,
      visibility: ProjectVisibility.OPEN,
      city: 'Delhi / Bangalore',
      tags: ['Neo-Soul', 'Hindi-English'],
      openRoles: ['Female vocalist', 'Guitarist'],
      ownerId: kaali.id,
      members: {
        create: [
          { userId: kaali.id, role: 'owner' },
          { userId: ayesha.id, role: 'vocalist' },
        ],
      },
      credits: {
        create: [
          { profileId: kaali.profile!.id, role: 'Lead Artist' },
          { profileId: ayesha.profile!.id, role: 'Featured Vocalist' },
        ],
      },
    },
  });

  const project2 = await prisma.project.create({
    data: {
      title: 'North East Frequencies',
      description: 'Experimental indie project exploring the sounds of Northeast India.',
      status: ProjectStatus.COOKING,
      visibility: ProjectVisibility.DISCOVERABLE,
      city: 'Shillong',
      tags: ['Experimental', 'Indie'],
      openRoles: ['Mix engineer'],
      ownerId: mizo.id,
      members: {
        create: [
          { userId: mizo.id, role: 'owner' },
        ],
      },
      credits: {
        create: [
          { profileId: mizo.profile!.id, role: 'Producer' },
        ],
      },
    },
  });

  const project3 = await prisma.project.create({
    data: {
      title: 'Basement Drill Pack',
      description: 'Hard-hitting drill beats from the Mumbai underground.',
      status: ProjectStatus.RECORDING,
      visibility: ProjectVisibility.PRIVATE,
      city: 'Mumbai',
      tags: ['Drill', 'Trap'],
      openRoles: [],
      ownerId: rdx.id,
      members: {
        create: [
          { userId: rdx.id, role: 'owner' },
          { userId: kaali.id, role: 'vocalist' },
        ],
      },
      credits: {
        create: [
          { profileId: rdx.profile!.id, role: 'Producer' },
          { profileId: kaali.profile!.id, role: 'Vocalist' },
        ],
      },
    },
  });

  // Cyphers
  const now = new Date();
  const cypher1 = await prisma.cypher.create({
    data: {
      title: 'Delhi Rooftop Sessions',
      type: CypherType.OPEN,
      state: EventState.ACTIVE,
      city: 'Delhi',
      venue: 'South Delhi rooftop',
      startsAt: new Date(now.getTime() - 2 * 60 * 60 * 1000),
      endsAt: new Date(now.getTime() + 4 * 60 * 60 * 1000),
      safetyTags: ['Community moderated', 'Optional check-in'],
      organizerId: rdx.id,
      rsvps: {
        create: [
          { userId: kaali.id },
          { userId: ayesha.id },
          { userId: mizo.id },
        ],
      },
      highlights: {
        create: [
          { title: 'Best freestyle', mediaUrl: 'https://example.com/highlight1.mp4', mediaType: 'video', selectedBy: rdx.id },
          { title: 'New collab formed', mediaUrl: 'https://example.com/highlight2.mp4', mediaType: 'video', selectedBy: rdx.id },
        ],
      },
    },
  });

  const cypher2 = await prisma.cypher.create({
    data: {
      title: 'Basement Sessions Mumbai',
      type: CypherType.VENUE,
      state: EventState.UPCOMING,
      city: 'Mumbai',
      venue: 'Verified venue • Bandra',
      startsAt: new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000),
      endsAt: new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000 + 4 * 60 * 60 * 1000),
      quota: 50,
      safetyTags: ['Verified organizer', 'Venue staff present'],
      organizerId: rdx.id,
      rsvps: {
        create: [
          { userId: kaali.id },
          { userId: ayesha.id },
        ],
      },
    },
  });

  const cypher3 = await prisma.cypher.create({
    data: {
      title: 'Bangalore Open Circle',
      type: CypherType.OPEN,
      state: EventState.UPCOMING,
      city: 'Bangalore',
      venue: 'Indiranagar park side',
      startsAt: new Date(now.getTime() + 5 * 24 * 60 * 60 * 1000),
      endsAt: new Date(now.getTime() + 5 * 24 * 60 * 60 * 1000 + 3 * 60 * 60 * 1000),
      safetyTags: ['Open circle', 'Beginner friendly'],
      organizerId: ayesha.id,
      rsvps: {
        create: [
          { userId: mizo.id },
        ],
      },
    },
  });

  // Community Sessions
  const session1 = await prisma.communitySession.create({
    data: {
      title: 'Bangalore Scene Cleanup',
      type: CommunitySessionType.CLEANUP,
      state: EventState.UPCOMING,
      city: 'Bangalore',
      venue: 'Cubbon Park',
      startsAt: new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000),
      organizerId: ayesha.id,
      rsvps: {
        create: [
          { userId: kaali.id },
        ],
      },
    },
  });

  const session2 = await prisma.communitySession.create({
    data: {
      title: 'Free FL Studio Basics',
      type: CommunitySessionType.TEACHING,
      state: EventState.UPCOMING,
      city: 'Delhi',
      venue: 'Community Studio, Hauz Khas',
      startsAt: new Date(now.getTime() + 10 * 24 * 60 * 60 * 1000),
      organizerId: rdx.id,
    },
  });

  // Clips — 15 clips spanning diverse music cultures and formats
  const d = (daysAgo: number) => new Date(Date.now() - daysAgo * 86_400_000);

  // Clip 1: Live cypher capture — kaali at Delhi Rooftop Sessions
  await prisma.clip.create({
    data: {
      creatorId: kaali.id,
      city: 'Delhi',
      reason: 'LIVE_SESSION',
      caption: 'That rooftop energy hit different tonight. Delhi drill meets open sky — unfiltered.',
      cypherId: cypher1.id,
      createdAt: d(1),
    },
  });

  // Clip 2: Open mic moment — ayesha at Bangalore Open Circle
  await prisma.clip.create({
    data: {
      creatorId: ayesha.id,
      city: 'Bangalore',
      reason: 'LIVE_SESSION',
      caption: 'Opened the circle with a raw acapella. No track, no backing, just voice and the park air.',
      cypherId: cypher3.id,
      createdAt: d(2),
    },
  });

  // Clip 3: Producer studio drop — rdx linked to Basement Drill Pack
  await prisma.clip.create({
    data: {
      creatorId: rdx.id,
      city: 'Mumbai',
      reason: 'STUDIO_DROP',
      caption: '808s tight, muted bass, sidechain breathing. New beats from the basement — heat pack dropping soon.',
      projectId: project3.id,
      createdAt: d(3),
    },
  });

  // Clip 4: Collab studio session — kaali in Mumbai with rdx
  await prisma.clip.create({
    data: {
      creatorId: kaali.id,
      city: 'Mumbai',
      reason: 'STUDIO_DROP',
      caption: 'Locked in with RDX for three hours straight. The drill pack sounds different when you lay the verse live.',
      projectId: project3.id,
      createdAt: d(5),
    },
  });

  // Clip 5: Independent drop — mizo experimenting solo in Shillong
  await prisma.clip.create({
    data: {
      creatorId: mizo.id,
      city: 'Shillong',
      reason: 'INDEPENDENT',
      caption: 'Rain sounds filtered through a cassette delay — full track drops once the hills stop talking.',
      projectId: project2.id,
      createdAt: d(4),
    },
  });

  // Clip 6: Open collab call — ayesha looking for guitar on Midnight Tape
  await prisma.clip.create({
    data: {
      creatorId: ayesha.id,
      city: 'Delhi',
      reason: 'COLLAB',
      caption: 'Need a guitarist for this hook. Hindi-English bridge, neo-soul feel. If you play with feeling, reach out.',
      projectId: project1.id,
      createdAt: d(6),
    },
  });

  // Clip 7: Community teaching session — rdx doing free FL Studio workshop
  await prisma.clip.create({
    data: {
      creatorId: rdx.id,
      city: 'Delhi',
      reason: 'COMMUNITY',
      caption: 'Free FL Studio basics this weekend. Zero gatekeeping. If you want to make beats, pull up.',
      communitySessionId: session2.id,
      createdAt: d(7),
    },
  });

  // Clip 8: Classical fusion live — raga performing Carnatic-electronic fusion
  await prisma.clip.create({
    data: {
      creatorId: raga.id,
      city: 'Chennai',
      reason: 'LIVE_SESSION',
      caption: 'Todi raga on the veena, 140bpm kick underneath. When the old meets the now — this is what happens.',
      createdAt: d(8),
    },
  });

  // Clip 9: Folk acoustic circle — priya leading a folk session in Jaipur
  await prisma.clip.create({
    data: {
      creatorId: priya.id,
      city: 'Jaipur',
      reason: 'LIVE_SESSION',
      caption: 'Sat under the haveli arch with five strangers and a sarangi. Sang Malhar till the walls felt it.',
      createdAt: d(9),
    },
  });

  // Clip 10: Electronic live set — vik at a Goa sunset spot
  await prisma.clip.create({
    data: {
      creatorId: vik.id,
      city: 'Goa',
      reason: 'LIVE_SESSION',
      caption: 'Played a 40-minute ambient set as the sun hit the water. No tracklist, all feeling.',
      createdAt: d(2),
    },
  });

  // Clip 11: Folk collab call — priya looking for tabla player
  await prisma.clip.create({
    data: {
      creatorId: priya.id,
      city: 'Jaipur',
      reason: 'COLLAB',
      caption: 'Writing a seven-song folk EP rooted in Rajasthani dhamal. Need a tabla player who hears the space.',
      createdAt: d(11),
    },
  });

  // Clip 12: Independent classical drop — raga in studio
  await prisma.clip.create({
    data: {
      creatorId: raga.id,
      city: 'Pune',
      reason: 'INDEPENDENT',
      caption: 'Three-hour raga exploration recorded in one take. Bhairavi as sun went down. Nowhere to hide in a raga.',
      createdAt: d(10),
    },
  });

  // Clip 13: Indie jam community moment — mizo at a Shillong open session
  await prisma.clip.create({
    data: {
      creatorId: mizo.id,
      city: 'Shillong',
      reason: 'COMMUNITY',
      caption: 'Northeast open mic at the café — five acts, five genres, one stage. The crowd stayed for all of it.',
      createdAt: d(12),
    },
  });

  // Clip 14: Ambient studio drop — vik dropping a club-facing track
  await prisma.clip.create({
    data: {
      creatorId: vik.id,
      city: 'Hyderabad',
      reason: 'STUDIO_DROP',
      caption: 'Slow-burn club track — no drops, just pressure building for six minutes. Mastered at 3am.',
      createdAt: d(13),
    },
  });

  // Clip 15: Community jam — ayesha at Bangalore Scene Cleanup energy
  await prisma.clip.create({
    data: {
      creatorId: ayesha.id,
      city: 'Bangalore',
      reason: 'COMMUNITY',
      caption: 'We cleaned up Cubbon Park then someone pulled out a guitar. Three songs later the whole group was singing.',
      communitySessionId: session1.id,
      createdAt: d(14),
    },
  });

  // Message Requests
  await prisma.messageRequest.create({
    data: {
      senderId: mizo.id,
      receiverId: kaali.id,
      intent: MessageIntent.COLLABORATE,
      message: 'Hey Kaali, love your drill sound. Want to collab on something experimental?',
      status: 'pending',
    },
  });

  await prisma.messageRequest.create({
    data: {
      senderId: ayesha.id,
      receiverId: rdx.id,
      intent: MessageIntent.IDEA_SHARING,
      message: 'RDX! Been following your beats. Got an idea for a neo-soul track with trap elements.',
      status: 'accepted',
    },
  });

  // Conversation for the accepted request
  const conv = await prisma.conversation.create({
    data: {
      userAId: ayesha.id,
      userBId: rdx.id,
      messages: {
        create: [
          { senderId: ayesha.id, body: 'RDX! Been following your beats. Got an idea for a neo-soul track with trap elements.' },
          { senderId: rdx.id, body: 'Yo Ayesha! That sounds dope. Let me hear what you have in mind.' },
        ],
      },
    },
  });

  // Notifications
  await prisma.notification.createMany({
    data: [
      { userId: kaali.id, type: NotificationType.MESSAGE_REQUEST, title: 'New Message', body: 'Mizo Static wants to collaborate with you', referenceId: mizo.id },
      { userId: ayesha.id, type: NotificationType.COLLAB_INVITE, title: 'Project Invite', body: 'You were invited to join Midnight Tape', referenceId: project1.id },
      { userId: rdx.id, type: NotificationType.MESSAGE_REQUEST, title: 'New Message', body: 'Ayesha sent you a message request', referenceId: ayesha.id },
      { userId: kaali.id, type: NotificationType.CYPHER_REMINDER, title: 'Cypher Tonight', body: 'Delhi Rooftop Sessions starts in 2 hours', referenceId: cypher1.id },
      { userId: mizo.id, type: NotificationType.FOLLOW, title: 'New Follower', body: 'Kaali started following you', referenceId: kaali.id },
    ],
  });

  // ── Ops / Admin Test Seed ──────────────────────────────────────────────────
  //
  // Users covering all permission levels
  const demoArtist = await prisma.user.create({
    data: {
      email: 'demo@cypherlink.in',
      passwordHash,
      displayName: 'Demo Artist',
      role: UserRole.USER,
      profile: {
        create: {
          handle: '@demo.artist',
          bio: 'Test account — plain artist, no events created.',
          city: 'Pune',
          state: 'Maharashtra',
          genres: ['Hip-Hop'],
          momentum: 'New Voice',
          avatarUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=demo',
        },
      },
    },
    include: { profile: true },
  });

  // Normal USER who created events — does NOT have ORGANIZER role
  const eventHost = await prisma.user.create({
    data: {
      email: 'eventhost@cypherlink.in',
      passwordHash,
      displayName: 'Arjun Host',
      role: UserRole.USER,
      profile: {
        create: {
          handle: '@arjunhost',
          bio: 'Hyderabad hip-hop organizer. Hosting but not yet verified.',
          city: 'Hyderabad',
          state: 'Telangana',
          genres: ['Hip-Hop', 'R&B'],
          momentum: 'Scene Active',
          avatarUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=arjun',
        },
      },
    },
    include: { profile: true },
  });

  const modUser = await prisma.user.create({
    data: {
      email: 'mod@cypherlink.in',
      passwordHash,
      displayName: 'Prachi Mod',
      role: UserRole.MODERATOR,
      profile: {
        create: {
          handle: '@prachi.mod',
          bio: 'Platform moderator. Keeps the ecosystem safe and honest.',
          city: 'Delhi',
          state: 'Delhi',
          genres: [],
          momentum: 'Community Trusted',
          avatarUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=prachi',
        },
      },
    },
    include: { profile: true },
  });

  const adminUser = await prisma.user.create({
    data: {
      email: 'admin@cypherlink.in',
      passwordHash,
      displayName: 'Platform Admin',
      role: UserRole.ADMIN,
      profile: {
        create: {
          handle: '@cypherlink.admin',
          bio: 'Internal admin account.',
          city: 'Mumbai',
          state: 'Maharashtra',
          genres: [],
          momentum: 'Community Trusted',
          avatarUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=admin',
        },
      },
    },
    include: { profile: true },
  });

  // Mark ayesha as verified (matches the approved verification request below)
  await prisma.user.update({ where: { id: ayesha.id }, data: { isVerified: true } });

  // Cyphers for ops testing
  // 1. Created by a normal USER (eventHost) — host tools should work, no ORGANIZER role needed
  const hostCypher = await prisma.cypher.create({
    data: {
      title: 'Hyderabad Underground Showcase',
      type: CypherType.OPEN,
      state: EventState.UPCOMING,
      city: 'Hyderabad',
      venue: 'Banjara Hills rooftop',
      startsAt: new Date(now.getTime() + 2 * 24 * 60 * 60 * 1000),
      endsAt: new Date(now.getTime() + 2 * 24 * 60 * 60 * 1000 + 3 * 60 * 60 * 1000),
      safetyTags: ['Community moderated', 'First-time host'],
      organizerId: eventHost.id,
      rsvps: {
        create: [
          { userId: kaali.id },
          { userId: mizo.id },
          { userId: demoArtist.id },
        ],
      },
    },
  });

  // 2. Afterglow cypher by ORGANIZER rdx — with raw assets and a preserved highlight
  const afterglowCypher = await prisma.cypher.create({
    data: {
      title: 'Mumbai Basement Sessions Vol.2',
      type: CypherType.VENUE,
      state: EventState.AFTERGLOW,
      city: 'Mumbai',
      venue: 'Verified venue • Bandra West',
      startsAt: new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000),
      endsAt: new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000 + 4 * 60 * 60 * 1000),
      safetyTags: ['Verified organizer', 'Venue staff present'],
      organizerId: rdx.id,
      rsvps: {
        create: [
          { userId: kaali.id },
          { userId: ayesha.id },
          { userId: mizo.id },
          { userId: eventHost.id },
        ],
      },
    },
  });

  // Raw uploaded asset (not yet preserved)
  await prisma.cypherAsset.create({
    data: {
      cypherId: afterglowCypher.id,
      uploaderId: kaali.id,
      fileKey: 'cyphers/afterglow-raw-freestyle.mp4',
      fileName: 'freestyle-raw.mp4',
      fileSize: 24117248,
      mimeType: 'video/mp4',
      publicUrl: null,
      isHighlight: false,
      expiresAt: new Date(now.getTime() + 22 * 60 * 60 * 1000),
    },
  });

  // Preserved (highlight) asset
  const preservedAsset = await prisma.cypherAsset.create({
    data: {
      cypherId: afterglowCypher.id,
      uploaderId: ayesha.id,
      fileKey: 'cyphers/afterglow-highlight.mp4',
      fileName: 'closing-verse-highlight.mp4',
      fileSize: 10485760,
      mimeType: 'video/mp4',
      publicUrl: 'https://example.com/cyphers/afterglow-highlight.mp4',
      isHighlight: true,
      expiresAt: null,
    },
  });

  await prisma.cypherHighlight.create({
    data: {
      cypherId: afterglowCypher.id,
      title: 'Closing verse — best of the night',
      description: 'Ayesha closing the cypher with a double-time hook.',
      mediaUrl: preservedAsset.publicUrl!,
      mediaType: 'video/mp4',
      selectedBy: rdx.id,
    },
  });

  // 3. Archived cypher — no more management needed
  const archivedCypher = await prisma.cypher.create({
    data: {
      title: 'Mumbai Basement Sessions Vol.1',
      type: CypherType.VENUE,
      state: EventState.ARCHIVED,
      city: 'Mumbai',
      venue: 'Bandra venue',
      startsAt: new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000),
      endsAt: new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000 + 4 * 60 * 60 * 1000),
      safetyTags: ['Verified organizer'],
      organizerId: rdx.id,
    },
  });

  // Community session created by normal USER (eventHost)
  const hostSession = await prisma.communitySession.create({
    data: {
      title: 'Hyderabad Producers Open Jam',
      type: CommunitySessionType.TEACHING,
      state: EventState.UPCOMING,
      city: 'Hyderabad',
      venue: 'Jubilee Hills music room',
      startsAt: new Date(now.getTime() + 4 * 24 * 60 * 60 * 1000),
      organizerId: eventHost.id,
      rsvps: {
        create: [
          { userId: vik.id },
          { userId: demoArtist.id },
        ],
      },
    },
  });

  // ── Reports (4 types for admin queue testing) ──────────────────────────────

  // Capture a clip ID for the clip report
  const clipForReport = await prisma.clip.findFirst({ where: { creatorId: kaali.id } });

  await prisma.report.createMany({
    data: [
      {
        reporterId: kaali.id,
        reportedId: mizo.id,
        targetType: 'PROFILE',
        targetId: mizo.id,
        reason: 'HARASSMENT',
        description: 'Repeated DM harassment after cypher refusal.',
        status: 'open',
      },
      {
        reporterId: ayesha.id,
        reportedId: kaali.id,
        targetType: 'CLIP',
        targetId: clipForReport?.id ?? kaali.id,
        reason: 'SPAM',
        description: 'Clip contains repeated promotional content not related to music.',
        status: 'under_review',
      },
      {
        reporterId: mizo.id,
        reportedId: rdx.id,
        targetType: 'CYPHER',
        targetId: cypher1.id,
        reason: 'FAKE_EVENT',
        description: 'Event listed as open but actually private — misleading.',
        status: 'resolved',
      },
      {
        reporterId: priya.id,
        reportedId: kaali.id,
        targetType: 'MESSAGE',
        targetId: kaali.id,
        reason: 'PREDATORY_CONDUCT',
        description: 'Unsolicited messages despite declined collab.',
        status: 'open',
      },
    ],
  });

  // ── Verification Requests ──────────────────────────────────────────────────

  await prisma.verificationRequest.createMany({
    data: [
      {
        userId: raga.id,
        status: 'PENDING',
        reason: 'Active classical fusion artist with 3 years of live shows across Tamil Nadu and Maharashtra.',
      },
      {
        userId: ayesha.id,
        status: 'APPROVED',
        reason: 'Featured vocalist, 2 cross-city collabs, strong community presence.',
        reviewedById: adminUser.id,
        reviewedAt: new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000),
        internalNote: 'Profile verified. Consistent activity across events and projects.',
      },
      {
        userId: demoArtist.id,
        status: 'REJECTED',
        reason: 'New account with limited activity history.',
        reviewedById: modUser.id,
        reviewedAt: new Date(now.getTime() - 10 * 24 * 60 * 60 * 1000),
        internalNote: 'Account too new. Re-apply after 3 months of platform activity.',
      },
    ],
  });

  // ── Organizer Requests ─────────────────────────────────────────────────────

  await prisma.organizerRequest.createMany({
    data: [
      {
        userId: eventHost.id,
        status: 'PENDING',
        reason: 'Hosted 2 underground shows in Hyderabad. Want verified host tools and community trust signals.',
      },
      {
        userId: rdx.id,
        status: 'APPROVED',
        reason: 'Long-time Mumbai scene organizer. Multiple cyphers hosted across venues.',
        reviewedById: adminUser.id,
        reviewedAt: new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000),
        internalNote: 'Well-known in the Mumbai scene. Granted ORGANIZER role.',
      },
    ],
  });

  // ── Incidents ──────────────────────────────────────────────────────────────

  await prisma.incident.createMany({
    data: [
      {
        targetType: 'CYPHER',
        targetId: cypher1.id,
        status: 'OPEN',
        priority: 'HIGH',
        summary: 'Altercation near venue entrance — two attendees involved. Safety note filed. Waiting for host response.',
      },
      {
        targetType: 'PROFILE',
        targetId: kaali.id,
        status: 'RESOLVED',
        priority: 'LOW',
        summary: 'False impersonation report — account confirmed as genuine Kaali. Report dismissed.',
        resolvedAt: new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000),
      },
    ],
  });

  // ── Audit Logs ────────────────────────────────────────────────────────────

  await prisma.auditLog.createMany({
    data: [
      {
        userId: modUser.id,
        action: 'REPORT_UPDATE',
        targetType: 'REPORT',
        targetId: 'seed-report-1',
        metadata: { status: 'under_review', internalNote: 'Reviewing message history.' },
        createdAt: new Date(now.getTime() - 2 * 60 * 60 * 1000),
      },
      {
        userId: adminUser.id,
        action: 'VERIFICATION_UPDATE',
        targetType: 'VERIFICATION_REQUEST',
        targetId: ayesha.id,
        metadata: { status: 'APPROVED', targetUserId: ayesha.id },
        createdAt: new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000),
      },
      {
        userId: adminUser.id,
        action: 'ORGANIZER_REQUEST_UPDATE',
        targetType: 'ORGANIZER_REQUEST',
        targetId: rdx.id,
        metadata: { status: 'APPROVED', targetUserId: rdx.id },
        createdAt: new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000),
      },
      {
        userId: rdx.id,
        action: 'HIGHLIGHT_PRESERVED',
        targetType: 'CYPHER',
        targetId: afterglowCypher.id,
        metadata: { detail: 'Closing verse highlight preserved from Mumbai Vol.2', fileName: 'closing-verse-highlight.mp4' },
        createdAt: new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000),
      },
      {
        userId: adminUser.id,
        action: 'ASSET_EXPIRED',
        targetType: 'CYPHER',
        targetId: archivedCypher.id,
        metadata: { detail: 'Raw assets cleared after 24h window', count: 4 },
        createdAt: new Date(now.getTime() - 29 * 24 * 60 * 60 * 1000),
      },
    ],
  });

  // ── Organizer Summary (ops users) ─────────────────────────────────────────

  await prisma.organizerSummary.upsert({
    where: { userId: eventHost.id },
    update: { totalCyphers: 1, totalSessions: 1, totalAttendance: 3 },
    create: { userId: eventHost.id, totalCyphers: 1, totalSessions: 1, totalAttendance: 3 },
  });

  console.log('\nOps test seed accounts:');
  console.log('  demo@cypherlink.in    → USER (no events)');
  console.log('  eventhost@cypherlink.in → USER (created cypher + session, no ORGANIZER role)');
  console.log('  mod@cypherlink.in     → MODERATOR (admin console access)');
  console.log('  admin@cypherlink.in   → ADMIN (full access)');
  console.log('  rdx@cypherlink.in     → ORGANIZER (organizer dashboard)');

  // ── Organizer Summary ─────────────────────────────────────────────────────

  await prisma.organizerSummary.upsert({
    where: { userId: rdx.id },
    create: {
      userId: rdx.id,
      totalCyphers: 2,
      totalSessions: 1,
      totalAttendance: 5,
      totalHighlights: 2,
    },
    update: {
      totalCyphers: 2,
      totalSessions: 1,
      totalAttendance: 5,
      totalHighlights: 2,
    },
  });

  // Reputation Events
  await prisma.reputationEvent.createMany({
    data: [
      { userId: kaali.id, event: 'project_started', label: 'Project Starter' },
      { userId: ayesha.id, event: 'collaboration_joined', label: 'Collaborator' },
      { userId: rdx.id, event: 'cypher_hosted', label: 'Scene Organizer' },
      { userId: mizo.id, event: 'message_sent', label: 'Community Engaged' },
    ],
  });

  // ── Phase 2 seed data ────────────────────────────────────────────────────────

  // 1. Update project1 to STRUCTURED, LONG_TERM_PROJECT, add milestones + transition log
  await prisma.project.update({
    where: { id: project1.id },
    data: {
      projectType: ProjectType.STRUCTURED,
      commitmentStyle: CommitmentStyle.LONG_TERM_PROJECT,
      typeTransitionLog: [
        {
          from: 'OPEN_COLLAB',
          to: 'STRUCTURED',
          at: '2025-04-01T00:00:00Z',
          note: 'Decided to formalize after getting serious about the EP release',
        },
      ],
    },
  });

  await prisma.projectMilestone.createMany({
    data: [
      {
        projectId: project1.id,
        title: 'Lyrics draft',
        description: 'Complete Hindi-English lyrics for all 5 tracks',
        status: MilestoneStatus.TODO,
        order: 0,
        assignedRole: 'Female vocalist',
      },
      {
        projectId: project1.id,
        title: 'Vocal tracking',
        description: 'Record all vocals in the studio',
        status: MilestoneStatus.IN_PROGRESS,
        order: 1,
        assignedContributorId: ayesha.id,
        assignedRole: 'Female vocalist',
        deliverableExpectation: 'Raw vocal stems (WAV, 24-bit), no reverb',
      },
      {
        projectId: project1.id,
        title: 'Mixing',
        description: 'Final mix of all tracks',
        status: MilestoneStatus.TODO,
        order: 2,
        assignedRole: 'Guitarist',
        dueDate: new Date(Date.now() + 30 * 86400000),
      },
    ],
  });

  // 2. Update project2 to OPEN_COLLAB, EXPERIMENTAL, add expires
  await prisma.project.update({
    where: { id: project2.id },
    data: {
      projectType: ProjectType.OPEN_COLLAB,
      commitmentStyle: CommitmentStyle.EXPERIMENTAL,
      expiresAt: new Date(Date.now() + 30 * 86400000),
    },
  });

  // 3. Mark project3 as FINISHED, set completedAt 7 days ago
  const completedAt3 = new Date(Date.now() - 7 * 86400000);
  await prisma.project.update({
    where: { id: project3.id },
    data: {
      status: ProjectStatus.FINISHED,
      completedAt: completedAt3,
    },
  });

  // Add a deliverable from rdx on project3
  const deliverable3 = await prisma.projectDeliverable.create({
    data: {
      projectId: project3.id,
      submittedById: rdx.id,
      role: 'Producer',
      fileName: 'basement-drill-pack-full.zip',
      note: 'All stems included, ready for mixing',
      rightsTag: RightsTag.PROJECT_USE_ALLOWED,
      publicUrl: null,
    },
  });

  // 4. Revision request on the deliverable
  await prisma.projectRevisionRequest.create({
    data: {
      projectId: project3.id,
      deliverableId: deliverable3.id,
      requestedById: rdx.id,
      note: 'Need the hi-hats more punchy on tracks 3-7. Otherwise sounds great.',
    },
  });

  // 5. Add vik as a removed contributor on project1
  await prisma.projectMember.create({
    data: {
      projectId: project1.id,
      userId: vik.id,
      role: 'member',
      creativeRole: 'Guitarist',
      status: ContributorStatus.REMOVED_BY_LEAD,
      removedAt: new Date(Date.now() - 3 * 86400000),
      removedNote: "Timing didn't work out — no hard feelings",
    },
  });

  console.log('Seed data created successfully!');
  console.log(`Users: ${kaali.displayName}, ${ayesha.displayName}, ${rdx.displayName}, ${mizo.displayName}, ${raga.displayName}, ${priya.displayName}, ${vik.displayName}`);
  console.log('15 seed clips created across: Hip-Hop, Neo-Soul, Drill, Indie, Classical, Folk, Electronic');
  console.log('Phase 2: Milestones, deliverables, revisions, and member status seeded.');
  console.log('All passwords: password123');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
