import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";

const Login = () => {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [form, setForm] = useState({ email: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setLoading(true);
    setError("");

    try {
      await login(form);
      navigate("/dashboard");
    } catch (err) {
      setError(err.response?.data?.message || err.message || "Login failed.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto max-w-md rounded-3xl bg-white p-8 shadow-sm">
      <h1 className="text-2xl font-semibold text-slate-900">Login</h1>
      <p className="mt-2 text-sm text-slate-600">Access your community grocery dashboard.</p>
      <form className="mt-6 space-y-5" onSubmit={handleSubmit}>
        <label className="block">
          <span className="text-sm text-slate-700">Email</span>
          <input
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
            type="email"
            required
            className="mt-2 w-full rounded-2xl border border-slate-300 bg-slate-50 px-4 py-3 text-slate-900 focus:border-slate-900 focus:outline-none"
          />
        </label>
        <label className="block">
          <span className="text-sm text-slate-700">Password</span>
          <input
            value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })}
            type="password"
            required
            className="mt-2 w-full rounded-2xl border border-slate-300 bg-slate-50 px-4 py-3 text-slate-900 focus:border-slate-900 focus:outline-none"
          />
        </label>
        {error && <p className="text-sm text-rose-600">{error}</p>}
        <button type="submit" disabled={loading} className="w-full rounded-2xl bg-slate-900 px-4 py-3 text-white hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-60">
          {loading ? "Signing in..." : "Sign in"}
        </button>
      </form>
      <p className="mt-4 text-sm text-slate-600">
        New to GroceryPool? <Link to="/register" className="font-semibold text-slate-900">Create an account</Link>.
      </p>
    </div>
  );
};

export default Login;
