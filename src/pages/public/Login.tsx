import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { ROUTES } from "../../constants/routes";

export default function Login() {
  const { login, register, demoLogin } = useAuth();
  const navigate = useNavigate();

  // Tabs: "login" | "register"
  const [tab, setTab] = useState<"login" | "register">("login");

  // Shared state
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [email, setEmail] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // ---- Handle Login ----
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await login(username, password);
      navigate(ROUTES.PRIVATE.DASHBOARD);
    } catch (err: any) {
      setError(err.message || "Login failed");
    } finally {
      setLoading(false);
    }
  };

  // ---- Handle Register ----
  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    setError(null);
    setLoading(true);
    try {
      await register(username, password, email);
      navigate(ROUTES.PRIVATE.DASHBOARD);
    } catch (err: any) {
      setError(err.message || "Registration failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="min-h-[70vh] flex items-center justify-center p-6">
      <div className="w-full max-w-sm bg-surface rounded-xl shadow p-6">
        <h2 className="text-xl font-semibold mb-4">Welcome</h2>

        {/* Tabs */}
        <div className="flex mb-4 border-b">
          <button
            className={`flex-1 py-2 ${
              tab === "login"
                ? "border-b-2 border-primary font-semibold"
                : "text-gray-500"
            }`}
            onClick={() => setTab("login")}
          >
            Login
          </button>
          <button
            className={`flex-1 py-2 ${
              tab === "register"
                ? "border-b-2 border-primary font-semibold"
                : "text-gray-500"
            }`}
            onClick={() => setTab("register")}
          >
            Register
          </button>
        </div>

        {/* Login Form */}
        {tab === "login" && (
          <form onSubmit={handleLogin} className="flex flex-col gap-3 mb-4">
            <input
              type="text"
              placeholder="Username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="border rounded px-3 py-2"
              required
            />
            <input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="border rounded px-3 py-2"
              required
            />
            {error && <p className="text-red-500 text-sm">{error}</p>}
            <button
              type="submit"
              disabled={loading}
              className="px-3 py-2 rounded bg-primary text-white"
            >
              {loading ? "Logging in..." : "Login"}
            </button>
          </form>
        )}

        {/* Register Form */}
        {tab === "register" && (
          <form onSubmit={handleRegister} className="flex flex-col gap-3 mb-4">
            <input
              type="text"
              placeholder="Username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="border rounded px-3 py-2"
              required
            />
            <input
              type="email"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="border rounded px-3 py-2"
              required
            />
            <input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="border rounded px-3 py-2"
              required
            />
            <input
              type="password"
              placeholder="Confirm Password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="border rounded px-3 py-2"
              required
            />
            {error && <p className="text-red-500 text-sm">{error}</p>}
            <button
              type="submit"
              disabled={loading}
              className="px-3 py-2 rounded bg-secondary text-white"
            >
              {loading ? "Registering..." : "Register"}
            </button>
          </form>
        )}


        <hr className="my-4" />

        {/* Demo login buttons */}
        {tab === "login" && (
          <>
            <p className="text-sm text-text-muted mb-4">Demo buttons:</p>
            <div className="flex gap-2">
              <button
                onClick={() => {
                  demoLogin("admin");
                  navigate(ROUTES.PRIVATE.DASHBOARD);
                }}
                className="flex-1 px-3 py-2 rounded bg-primary text-white"
              >
                Login as Admin
              </button>
              <button
                onClick={() => {
                  demoLogin("member");
                  navigate(ROUTES.PRIVATE.DASHBOARD);
                }}
                className="flex-1 px-3 py-2 rounded bg-secondary text-white"
              >
                Login as Member
              </button>
            </div>
          </>
        )}
      </div>
    </section>
  );
}
