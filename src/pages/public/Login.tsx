import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { ROUTES } from "../../constants/routes";
import { FEATURES } from "../../config/features";
import type { Role } from "../../constants/roles";

export default function Login() {
  const { login, demoLogin, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // ── Navigate to dashboard AFTER React commits isAuthenticated = true ──────
  // This useEffect fires after render, guaranteeing the auth state is fully
  // committed before we navigate. Calling navigate() directly inside the
  // login() try-block can race against React's state batching.
  useEffect(() => {
    if (isAuthenticated) {
      navigate(ROUTES.PRIVATE.DASHBOARD, { replace: true });
    }
  }, [isAuthenticated, navigate]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await login(username, password);
      // Do NOT call navigate() here — the useEffect above handles it
      // once React commits isAuthenticated = true
    } catch (err: any) {
      setError(err?.message || "Login failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleDemoLogin = (role: Role) => {
    demoLogin(role);
    // No navigate() here either — useEffect handles it
  };

  return (
    <section className="min-h-[70vh] flex items-center justify-center p-6">
      <div className="w-full max-w-sm bg-surface rounded-xl shadow p-8">

        {/* Header */}
        <div className="mb-6">
          <h2 className="text-xl font-semibold">Welcome back</h2>
          <p className="text-text-muted text-sm mt-1">
            Sign in to your Neelgar Society account
          </p>
        </div>

        {/* Login form */}
        <form onSubmit={handleLogin} className="flex flex-col gap-4">

          <div className="flex flex-col gap-1">
            <label htmlFor="username" className="text-sm font-medium">
              Username
            </label>
            <input
              id="username"
              type="text"
              placeholder="Enter your username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
              autoComplete="username"
              required
              disabled={loading}
            />
          </div>

          <div className="flex flex-col gap-1">
            <label htmlFor="password" className="text-sm font-medium">
              Password
            </label>
            <input
              id="password"
              type="password"
              placeholder="Enter your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
              autoComplete="current-password"
              required
              disabled={loading}
            />
          </div>

          {/* Error message */}
          {error && (
            <div className="rounded-lg bg-red-50 border border-red-200 px-3 py-2 text-sm text-red-700">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="px-3 py-2.5 rounded-lg bg-primary text-white text-sm font-medium hover:bg-primary/90 transition disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                Signing in…
              </span>
            ) : (
              "Sign in"
            )}
          </button>

        </form>

        {/* Hint for new users */}
        <p className="text-xs text-text-muted mt-4 text-center">
          New accounts require admin approval before first login.
        </p>

        {/* Dev-only demo login */}
        {FEATURES.SHOW_DEMO_LOGIN && (
          <div className="mt-6 pt-4 border-t">
            <p className="text-xs text-text-muted mb-2 text-center">
              Dev — quick login
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => handleDemoLogin("SUPER_ADMIN")}
                className="flex-1 px-2 py-1.5 text-xs rounded border border-purple-400 text-purple-700 hover:bg-purple-50 transition"
              >
                Super Admin
              </button>
              <button
                onClick={() => handleDemoLogin("ADMIN")}
                className="flex-1 px-2 py-1.5 text-xs rounded border border-primary text-primary hover:bg-primary/5 transition"
              >
                Admin
              </button>
              <button
                onClick={() => handleDemoLogin("MEMBER")}
                className="flex-1 px-2 py-1.5 text-xs rounded border border-gray-300 text-gray-600 hover:bg-gray-50 transition"
              >
                Member
              </button>
            </div>
          </div>
        )}

      </div>
    </section>
  );
}
