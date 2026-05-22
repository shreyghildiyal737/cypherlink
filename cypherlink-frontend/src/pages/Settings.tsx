import { Badge } from "../components/ui/Badge";
import { Button } from "../components/ui/Button";
import { useAuthStore } from "../store/authStore";
import { useNavigate } from "react-router-dom";
export default function Settings() {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();
  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      <div className="flex items-end justify-between">
        <div>
          <Badge tone="green">Privacy and safety by design</Badge>
          <h1 className="mt-4 text-4xl font-black">Settings</h1>
        </div>
        {user && (
          <Button
            variant="secondary"
            onClick={async () => {
              await logout();
              navigate("/");
            }}
          >
            Log out
          </Button>
        )}
      </div>
      <div className="mt-8 grid gap-5 md:grid-cols-2">
        {[
          "Who can DM me",
          "Location visibility",
          "QR visibility",
          "Notification preferences",
          "Blocked users",
          "Account deletion cooldown",
        ].map((x) => (
          <div
            key={x}
            className="rounded-[2rem] border border-white/10 bg-panel p-5"
          >
            <h2 className="font-black">{x}</h2>
            <p className="mt-2 text-sm text-white/60">
              Backend controlled setting with safe defaults.
            </p>
            <Button variant="secondary" className="mt-4">
              Configure
            </Button>
          </div>
        ))}
      </div>
    </div>
  );
}
