import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";

const Register = () => {
  const navigate = useNavigate();
  const { register } = useAuth();
  const [form, setForm] = useState({ fullName: "", email: "", password: "" });
  const [isShopkeeper, setIsShopkeeper] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");

  const handleSubmit = async (event) => {
    event.preventDefault();
    setLoading(true);
    setError("");

    try {
      await register({ ...form, requestedRole: isShopkeeper ? "shopkeeper" : undefined });
      if (isShopkeeper) {
        setSuccessMessage("Shopkeeper account created. It needs admin approval before you can list products — you can still log in now.");
        setTimeout(() => navigate("/login"), 2500);
      } else {
        navigate("/login");
      }
    } catch (err) {
      setError(err.response?.data?.message || err.message || "Registration failed.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto max-w-md rounded-3xl bg-white p-8 shadow-sm">
      <h1 className="text-2xl font-semibold text-slate-900">Register</h1>
      <p className="mt-2 text-sm text-slate-600">Start ordering with your community today.</p>
      {successMessage ? (
        <div className="mt-6 rounded-2xl bg-green-50 p-4 text-sm text-green-800">{successMessage}</div>
      ) : (
        <form className="mt-6 space-y-5" onSubmit={handleSubmit}>
          <label className="block">
            <span className="text-sm text-slate-700">Full name</span>
            <input
              value={form.fullName}
              onChange={(e) => setForm({ ...form, fullName: e.target.value })}
              type="text"
              required
              className="mt-2 w-full rounded-2xl border border-slate-300 bg-slate-50 px-4 py-3 text-slate-900 focus:border-slate-900 focus:outline-none"
            />
          </label>
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
          <label className="flex items-start gap-3 rounded-2xl bg-slate-50 p-4">
            <input
              type="checkbox"
              checked={isShopkeeper}
              onChange={(e) => setIsShopkeeper(e.target.checked)}
              className="mt-1"
            />
            <span className="text-sm text-slate-700">
              I'm a shopkeeper and want to list products. <span className="text-slate-500">Requires admin approval before you can add inventory.</span>
            </span>
          </label>
          {error && <p className="text-sm text-rose-600">{error}</p>}
          <button type="submit" disabled={loading} className="w-full rounded-2xl bg-slate-900 px-4 py-3 text-white hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-60">
            {loading ? "Creating account..." : "Create account"}
          </button>
        </form>
      )}
      <p className="mt-4 text-sm text-slate-600">
        Already have an account? <Link to="/login" className="font-semibold text-slate-900">Login</Link>.
      </p>
    </div>
  );
};

export default Register;
