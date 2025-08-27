import { Link } from "react-router-dom";
import { ROUTES } from "../../constants/routes";

export default function Home() {
  return (
    <section className="max-w-5xl mx-auto p-6">
      <h1 className="text-3xl font-bold text-primary">Welcome to Neelgar Society</h1>
      <p className="mt-2 text-text-muted">Public homepage accessible to everyone.</p>
      <Link to={ROUTES.PUBLIC.LOGIN} className="inline-block mt-4 px-4 py-2 rounded bg-primary text-white">
        Go to Login
      </Link>
    </section>
  );
}
