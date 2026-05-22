export const organizerStats = [
  { label: "Pulling up", value: "46", helper: "RSVPs for tonight" },
  { label: "Checked in", value: "31", helper: "Optional scans saved" },
  { label: "Waitlist", value: "8", helper: "Venue spots pending" },
  { label: "Highlights", value: "5", helper: "Chosen to survive" },
];

export const organizerTimeline = [
  { time: "6:12 PM", title: "Venue opened", body: "Host mode started by RDX." },
  {
    time: "6:44 PM",
    title: "Waitlist active",
    body: "Venue quota reached. New RSVPs moved to waitlist.",
  },
  {
    time: "7:03 PM",
    title: "Check-ins flowing",
    body: "31 people scanned. No penalty for skipped scans.",
  },
  {
    time: "7:40 PM",
    title: "Highlight candidate",
    body: "A freestyle clip was marked by 4 participants.",
  },
];

export const reportQueue = [
  {
    id: "r1",
    type: "Harassment",
    target: "Message thread",
    priority: "High",
    status: "Needs review",
  },
  {
    id: "r2",
    type: "Fake event",
    target: "Open Cypher",
    priority: "Medium",
    status: "Needs review",
  },
  {
    id: "r3",
    type: "Copyright",
    target: "Clip upload",
    priority: "Low",
    status: "Waiting info",
  },
];

export const verificationRequests = [
  {
    id: "v1",
    name: "Ayesha Soul",
    reason: "Known vocalist, repeated collaborations",
    status: "Pending",
  },
  {
    id: "v2",
    name: "Basement Sessions",
    reason: "Recurring venue organizer",
    status: "Pending",
  },
];

export const devHealth = [
  { label: "API", value: "Healthy", helper: "p95 82ms" },
  { label: "WebSocket", value: "Stable", helper: "128 active sockets" },
  {
    label: "Redis queues",
    value: "2 delayed",
    helper: "No failed critical jobs",
  },
  { label: "Uploads", value: "3 warnings", helper: "Large file retries" },
];

export const jobTimeline = [
  {
    time: "02:00",
    title: "Cypher cleanup",
    body: "Raw assets cleaned. Highlights preserved.",
  },
  {
    time: "02:05",
    title: "QR expiry",
    body: "Expired 148 event check-in tokens.",
  },
  {
    time: "02:10",
    title: "Digest prepared",
    body: "Notification digest queued for 312 users.",
  },
];
