import { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext.jsx";
import { getDashboard } from "../services/communityService.js";
import { getOrders } from "../services/orderService.js";

const Dashboard = () => {
  const { user } = useAuth();
  const [communityData, setCommunityData] = useState(null);
  const [ordersCount, setOrdersCount] = useState(0);
  const [error, setError] = useState("");

  useEffect(() => {
    if (user?.community) {
      getDashboard(user.community)
        .then((resp) => setCommunityData(resp.dashboard))
        .catch(() => setError("Unable to load community dashboard."));
    }

    getOrders()
      .then((resp) => setOrdersCount(resp.orders.length))
      .catch(() => {});
  }, [user]);

  return (
    <div className="space-y-6">
      <div className="rounded-3xl bg-white p-6 shadow-sm">
        <h1 className="text-2xl font-semibold text-slate-900">Welcome, {user.fullName}</h1>
        <p className="mt-2 text-slate-600">Role: {user.role}</p>
      </div>
      {error && <div className="rounded-3xl bg-rose-50 p-4 text-rose-700">{error}</div>}
      <div className="grid gap-6 lg:grid-cols-3">
        <article className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <p className="text-sm text-slate-500">Your community</p>
          <p className="mt-3 text-3xl font-semibold text-slate-900">{communityData?.community?.name || "Not joined"}</p>
        </article>
        <article className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <p className="text-sm text-slate-500">Order history</p>
          <p className="mt-3 text-3xl font-semibold text-slate-900">{ordersCount}</p>
        </article>
        <article className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <p className="text-sm text-slate-500">Community progress</p>
          <p className="mt-3 text-3xl font-semibold text-slate-900">{communityData ? `${Math.round((communityData.community.currentOrderValue / communityData.community.thresholdAmount) * 100)}%` : "0%"}</p>
        </article>
      </div>
      {communityData && (
        <div className="rounded-3xl bg-white p-6 shadow-sm">
          <h2 className="text-xl font-semibold text-slate-900">Community insights</h2>
          <div className="mt-4 grid gap-4 md:grid-cols-2">
            <div className="rounded-3xl border border-slate-200 bg-slate-50 p-4">
              <p className="text-sm text-slate-500">Members</p>
              <p className="mt-2 text-2xl font-semibold text-slate-900">{communityData.memberCount}</p>
            </div>
            <div className="rounded-3xl border border-slate-200 bg-slate-50 p-4">
              <p className="text-sm text-slate-500">Current order value</p>
              <p className="mt-2 text-2xl font-semibold text-slate-900">₹{communityData.community.currentOrderValue}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
