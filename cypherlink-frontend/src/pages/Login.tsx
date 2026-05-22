import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Button } from "../components/ui/Button";
import { useAuthStore } from "../store/authStore";
export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isRegister, setIsRegister] = useState(false);
  const [displayName, setDisplayName] = useState("");
  const [handle, setHandle] = useState("");
  const { login, register, loading, error, clearError } = useAuthStore();
  const navigate = useNavigate();
  const location = useLocation();
  const from = (location.state as any)?.from?.pathname ?? "/home";
  const handleSubmit = async () => {
    clearError();
    try {
      if (isRegister) {
        await register({
          email,
          password,
          displayName,
          handle: handle || undefined,
        });
      } else {
        await login(email, password);
      }
      navigate(from);
    } catch {}
  };
  return (
    <div className="mx-auto grid min-h-[calc(100vh-4rem)] max-w-7xl place-items-center px-4">
      <section className="w-full max-w-md rounded-[2rem] border border-white/10 bg-panel p-6">
        <h1 className="text-3xl font-black">
          {isRegister ? "Create your space" : "Welcome back"}
        </h1>
        <p className="mt-2 text-white/60">
          {isRegister
            ? "Join the creative network."
            : "Browse freely. Log in only when you want to participate."}
        </p>
        {error && (
          <p className="mt-3 rounded-2xl bg-red-500/20 p-3 text-sm text-red-400">
            {error}
          </p>
        )}
        <div className="mt-6 space-y-3">
          {isRegister && (
            <>
              <input
                className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 outline-none"
                placeholder="Display name"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
              />
              <input
                className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 outline-none"
                placeholder="Handle (optional)"
                value={handle}
                onChange={(e) => setHandle(e.target.value)}
              />
            </>
          )}
          <input
            className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 outline-none"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <input
            className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 outline-none"
            placeholder="Password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          <Button className="w-full" onClick={handleSubmit} disabled={loading}>
            {loading ? "Loading..." : isRegister ? "Create account" : "Log in"}
          </Button>
          <p className="text-center text-sm text-white/50">
            {isRegister ? "Already have an account? " : "No account? "}
            <button
              className="text-cyanGlow underline"
              onClick={() => {
                setIsRegister(!isRegister);
                clearError();
              }}
            >
              {isRegister ? "Log in" : "Register"}
            </button>
          </p>
        </div>
      </section>
    </div>
  );
}
