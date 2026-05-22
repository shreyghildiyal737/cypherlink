import { useNotifications, useMarkNotificationRead } from "../hooks";
import { Badge } from "../components/ui/Badge";
export default function Notifications() {
  const { data: notifications, isLoading } = useNotifications();
  const markRead = useMarkNotificationRead();
  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <Badge tone="cyan">Meaningful, not needy</Badge>
      <h1 className="mt-4 text-4xl font-black">Notifications</h1>
      <div className="mt-8 space-y-3">
        {isLoading ? (
          <div className="text-center text-white/40">
            Loading notifications...
          </div>
        ) : notifications?.length === 0 ? (
          <div className="text-center text-white/40">No notifications yet</div>
        ) : (
          notifications?.map((n: any) => (
            <div
              key={n.id}
              className={`rounded-2xl border ${n.read ? "border-white/5 bg-white/5" : "border-white/10 bg-panel"} p-4 cursor-pointer`}
              onClick={() => {
                if (!n.read) markRead.mutate(n.id);
              }}
            >
              <p className={n.read ? "text-white/60" : "text-white"}>
                {n.message}
              </p>
              <p className="mt-1 text-xs text-white/40">
                {new Date(n.createdAt).toLocaleDateString()}
              </p>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
