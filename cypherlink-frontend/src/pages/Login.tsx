import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Button } from "../components/ui/Button";
import { useAuthStore } from "../store/authStore";
import { FadeUp } from "../components/ui/motion";

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
        await register({ email, password, displayName, handle: handle || undefined });
        navigate("/onboarding");
      } else {
        await login(email, password);
        const u = useAuthStore.getState().user;
        navigate(!u?.city ? "/onboarding" : from);
      }
    } catch {}
  };

  return (
    <div className="mx-auto grid min-h-screen max-w-7xl place-items-center px-margin-mobile md:px-margin-desktop">
      {/* Ambient bloom */}
      <div aria-hidden className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-96 h-96 bg-primary-container/10 rounded-full blur-[120px]" />
      </div>

      <FadeUp className="relative z-10 w-full max-w-md">
        <section className="glass-panel rounded-2xl border border-white/[0.07] p-6 md:p-8">
          {/* Wordmark */}
          <div className="flex items-center gap-2 mb-8">
            <span className="material-symbols-outlined text-primary text-[20px]" style={{ fontVariationSettings: "'FILL' 1" }}>graphic_eq</span>
            <span className="font-label-sm text-label-sm text-on-surface-variant/50 uppercase tracking-widest">CypherLink</span>
          </div>

          <h1 className="font-headline-xl text-[2rem] text-on-surface tracking-tight">
            {isRegister ? "Create your space" : "Welcome back"}
          </h1>
          <p className="mt-2 font-body-md text-body-md text-on-surface-variant/60">
            {isRegister
              ? "Join the creative network."
              : "Browse freely. Log in only when you want to participate."}
          </p>

          {/* Error */}
          {error && (
            <p className="mt-4 rounded-xl border border-error/20 bg-error/08 p-3 font-body-md text-sm text-error">
              {error}
            </p>
          )}

          <div className="mt-6 space-y-3">
            {isRegister && (
              <>
                <input
                  className="input-ghost w-full px-0 py-3 font-body-md text-body-md"
                  placeholder="Display name"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                />
                <input
                  className="input-ghost w-full px-0 py-3 font-body-md text-body-md"
                  placeholder="Handle (optional)"
                  value={handle}
                  onChange={(e) => setHandle(e.target.value)}
                />
              </>
            )}
            <input
              className="input-ghost w-full px-0 py-3 font-body-md text-body-md"
              placeholder="Email"
              type="email"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
            />
            <input
              className="input-ghost w-full px-0 py-3 font-body-md text-body-md"
              placeholder="Password"
              type="password"
              autoComplete={isRegister ? "new-password" : "current-password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
            />

            <div className="pt-2">
              <Button className="w-full justify-center" onClick={handleSubmit} disabled={loading}>
                {loading
                  ? "Loading..."
                  : isRegister
                  ? "Create account"
                  : "Log in"}
              </Button>
            </div>

            <div className="flex items-center gap-3 py-1">
              <div className="h-px flex-1 bg-white/[0.07]" />
              <span className="font-label-sm text-[10px] uppercase tracking-widest text-on-surface-variant/25">or</span>
              <div className="h-px flex-1 bg-white/[0.07]" />
            </div>

            <p className="text-center font-body-md text-sm text-on-surface-variant/45">
              {isRegister ? "Already have an account? " : "No account? "}
              <button
                className="text-primary-fixed-dim hover:text-primary transition-colors underline decoration-primary-container/30"
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
      </FadeUp>
    </div>
  );
}
