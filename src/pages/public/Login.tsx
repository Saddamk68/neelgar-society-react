import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { ROUTES } from "../../constants/routes";

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleLogin = (role: "admin" | "member") => {
    login(role);
    navigate(ROUTES.PRIVATE.DASHBOARD);
  };

  return (
    <section className="min-h-[70vh] flex items-center justify-center p-6">
      <div className="w-full max-w-sm bg-surface rounded-xl shadow p-6">
        <h2 className="text-xl font-semibold mb-4">Login</h2>
        <p className="text-sm text-text-muted mb-4">Demo buttons for now:</p>
        <div className="flex gap-2">
          <button onClick={() => handleLogin("admin")} className="flex-1 px-3 py-2 rounded bg-primary text-white">
            Login as Admin
          </button>
          <button onClick={() => handleLogin("member")} className="flex-1 px-3 py-2 rounded bg-secondary text-white">
            Login as Member
          </button>
        </div>
      </div>
    </section>
  );
}
