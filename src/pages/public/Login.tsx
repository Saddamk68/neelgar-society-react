import logoMd from "../../assets/logo/neelgar-society-logo-md.png";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { ROUTES } from "../../constants/routes";

export default function Login() {
  const { login, isAuthenticated } = useAuth();
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
      const raw: string = err?.message || "";
      if (raw.toLowerCase().includes("locked")) {
        // Extract time hint if backend sends it
        setError("Your account has been temporarily locked due to too many failed attempts. Please try again after 15 minutes or contact your system administrator.");
      } else if (raw.toLowerCase().includes("pending")) {
        setError("Your account is pending admin approval. Please wait or contact your administrator.");
      } else if (raw.toLowerCase().includes("rejected")) {
        setError("Your account has been rejected. Please contact your system administrator.");
      } else if (raw.toLowerCase().includes("disabled")) {
        setError("Your account has been deactivated. Please contact your system administrator.");
      } else if (raw.match(/\d+ attempt/i)) {
        setError(raw.replace("OAuth 2.0 Parameter: ", "").trim());
      } else if (raw.toLowerCase().includes("username or password")) {
        setError("Invalid username or password. Please check your credentials and try again.");
      } else {
        setError(raw || "Login failed. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="min-h-[70vh] flex items-center justify-center p-6">
      <div className="w-full max-w-sm bg-surface rounded-xl shadow p-8">

        {/* Header */}
        <div className="mb-6 flex flex-col items-center text-center">
          <img src={logoMd} alt="Neelgar Society" className="w-45 h-45 object-cover" />
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
            <div className={[
              "rounded-lg px-3 py-2 text-sm border",
              error.toLowerCase().includes("locked")
                ? "bg-amber-50 border-amber-200 text-amber-800"
                : "bg-red-50 border-red-200 text-red-700"
            ].join(" ")}>
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

      </div>
    </section>
  );
}
