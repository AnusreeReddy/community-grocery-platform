import { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext.jsx";
import { getCommunities, runThresholdEvaluation } from "../services/communityService.js";
import api from "../services/api.js";

const AdminPanel = () => {
  const { user } = useAuth();
  const [communities, setCommunities] = useState([]);
  const [users, setUsers] = useState([]);
  const [message, setMessage] = useState("");
  const [thresholdResult, setThresholdResult] = useState(null);

  useEffect(() => {
    getCommunities().then((resp) => setCommunities(resp.communities)).catch(() => setMessage("Unable to load communities."));
    api.get("/users").then((resp) => setUsers(resp.users)).catch(() => setMessage("Unable to load users."));
  }, []);

  const handleRunThreshold = async () => {
    try {
      const resp = await runThresholdEvaluation();
      setThresholdResult(resp.result);
      setMessage(resp.message || "Threshold evaluation completed.");
    } catch (error) {
      setMessage(error.response?.data?.message || "Unable to run threshold evaluation.");
    }
  };

  return (
    <div className="space-y-6">
      <div className="rounded-3xl bg-white p-6 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold text-slate-900">Admin dashboard</h1>
            <p className="mt-2 text-slate-600">Manage communities, trigger threshold evaluations, and review users.</p>
            <p className="mt-4 text-sm text-slate-500">Signed in as {user.fullName} ({user.role})</p>
          </div>
          <button onClick={handleRunThreshold} className="rounded-2xl bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-700">
            Run threshold evaluation
          </button>
        </div>
      </div>
      {message && <div className="rounded-3xl bg-slate-100 p-4 text-slate-700">{message}</div>}
      {thresholdResult && (
        <div className="rounded-3xl bg-white p-6 shadow-sm">
          <h2 className="text-xl font-semibold text-slate-900">Threshold evaluation result</h2>
          <pre className="mt-4 overflow-x-auto rounded-2xl bg-slate-950 p-4 text-sm text-slate-100">{JSON.stringify(thresholdResult, null, 2)}</pre>
        </div>
      )}
      <div className="grid gap-6 lg:grid-cols-2">
        <section className="rounded-3xl bg-white p-6 shadow-sm">
          <h2 className="text-xl font-semibold text-slate-900">Communities</h2>
          <ul className="mt-4 space-y-3">
            {communities.map((community) => (
              <li key={community._id} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <p className="font-semibold text-slate-900">{community.name}</p>
                <p className="text-sm text-slate-600">{community.city}, {community.state}</p>
              </li>
            ))}
          </ul>
        </section>
        <section className="rounded-3xl bg-white p-6 shadow-sm">
          <h2 className="text-xl font-semibold text-slate-900">Users</h2>
          <ul className="mt-4 space-y-3">
            {users.map((item) => (
              <li key={item._id} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <p className="font-semibold text-slate-900">{item.fullName}</p>
                <p className="text-sm text-slate-600">{item.email} • {item.role}</p>
              </li>
            ))}
          </ul>
        </section>
      </div>
    </div>
  );
};

export default AdminPanel;
