import { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext.jsx";
import { getDashboard } from "../services/communityService.js";
import { getOrders } from "../services/orderService.js";
import api from "../services/api.js";

const Dashboard = () => {
  const { user } = useAuth();
  const [communityData, setCommunityData] = useState(null);
  const [ordersCount, setOrdersCount] = useState(0);
  const [bestDay, setBestDay] = useState(null);
  const [analytics, setAnalytics] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    if (user?.community) {
      getDashboard(user.community)
        .then((resp) => setCommunityData(resp.dashboard))
        .catch(() => setError("Unable to load community dashboard."));

      // Load best delivery day recommendation
      api.get(`/communities/${user.community}/best-delivery-day`)
        .then((resp) => setBestDay(resp.data.recommendation))
        .catch(() => {});

      // Load community analytics
      api.get(`/communities/${user.community}/analytics`)
        .then((resp) => setAnalytics(resp.data.analytics))
        .catch(() => {});
    }

    getOrders()
      .then((resp) => setOrdersCount(resp.orders.length))
      .catch(() => {});
  }, [user]);

  const thresholdPercent = communityData 
    ? Math.min(100, Math.round((communityData.community.currentOrderValue / communityData.community.thresholdAmount) * 100))
    : 0;

  return (
    <div className="space-y-6">
      <div className="rounded-3xl bg-white p-6 shadow-sm">
        <h1 className="text-2xl font-semibold text-slate-900">Welcome, {user.fullName}</h1>
        <p className="mt-2 text-slate-600">Role: {user.role}</p>
      </div>
      {error && <div className="rounded-3xl bg-rose-50 p-4 text-rose-700">{error}</div>}

      {/* Key Metrics */}
      <div className="grid gap-6 lg:grid-cols-4">
        <article className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <p className="text-sm text-slate-500">Your Community</p>
          <p className="mt-3 text-2xl font-semibold text-slate-900">{communityData?.community?.name || "Not joined"}</p>
        </article>
        <article className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <p className="text-sm text-slate-500">Your Orders</p>
          <p className="mt-3 text-2xl font-semibold text-slate-900">{ordersCount}</p>
        </article>
        <article className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <p className="text-sm text-slate-500">Community Members</p>
          <p className="mt-3 text-2xl font-semibold text-slate-900">{communityData?.memberCount || 0}</p>
        </article>
        <article className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <p className="text-sm text-slate-500">Pending Orders Value</p>
          <p className="mt-3 text-2xl font-semibold text-slate-900">₹{analytics?.pendingOrderValue || 0}</p>
        </article>
      </div>

      {/* Threshold Progress */}
      {communityData && (
        <div className="rounded-3xl bg-white p-6 shadow-sm">
          <h2 className="text-xl font-semibold text-slate-900">Threshold Progress</h2>
          <div className="mt-4 space-y-4">
            <div>
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm text-slate-600">Current Order Value</p>
                <p className="text-sm font-semibold text-slate-900">₹{communityData.community.currentOrderValue} / ₹{communityData.community.thresholdAmount}</p>
              </div>
              <div className="h-3 rounded-full bg-slate-200 overflow-hidden">
                <div 
                  className="h-full bg-blue-600 transition-all duration-300"
                  style={{ width: `${thresholdPercent}%` }}
                />
              </div>
              <p className="mt-2 text-sm text-slate-600">
                {thresholdPercent >= 100 
                  ? "Threshold reached! 🎉 Delivery proposal will be created."
                  : `₹${Math.max(0, communityData.community.thresholdAmount - communityData.community.currentOrderValue)} remaining to reach threshold`}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Best Delivery Day Recommendation */}
      {bestDay && (
        <div className="rounded-3xl bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 p-6 shadow-sm">
          <h2 className="text-xl font-semibold text-slate-900">📅 Recommended Delivery Day</h2>
          <p className="mt-2 text-sm text-slate-600">Based on community order patterns</p>
          <div className="mt-4 flex items-center gap-4">
            <div className="rounded-2xl bg-white px-6 py-4">
              <p className="text-sm text-slate-500">Best Day</p>
              <p className="mt-2 text-3xl font-bold text-amber-600">{bestDay.recommendedDeliveryDay}</p>
            </div>
            <div className="flex-1">
              <p className="text-sm text-slate-600 mb-3">Historical Performance</p>
              <div className="space-y-2">
                {bestDay.historicalPerformance?.slice(0, 3).map((day, idx) => (
                  <div key={idx} className="flex items-center justify-between text-sm">
                    <span className="text-slate-700">{day.day}</span>
                    <div className="flex items-center gap-2 flex-1 ml-4">
                      <div className="h-2 rounded bg-slate-200 flex-1" style={{ width: `${(day.amount / (bestDay.historicalPerformance[0]?.amount || 1)) * 100}%` }} />
                      <span className="text-slate-600 min-w-fit">₹{day.amount}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Community Insights */}
      {communityData && (
        <div className="rounded-3xl bg-white p-6 shadow-sm">
          <h2 className="text-xl font-semibold text-slate-900">Community Insights</h2>
          <div className="mt-4 grid gap-4 md:grid-cols-2">
            <div className="rounded-3xl border border-slate-200 bg-slate-50 p-4">
              <p className="text-sm text-slate-500">Pending Orders</p>
              <p className="mt-2 text-2xl font-semibold text-slate-900">{communityData.pendingOrders}</p>
            </div>
            <div className="rounded-3xl border border-slate-200 bg-slate-50 p-4">
              <p className="text-sm text-slate-500">Confirmed Orders</p>
              <p className="mt-2 text-2xl font-semibold text-slate-900">{communityData.confirmedOrders}</p>
            </div>
            <div className="rounded-3xl border border-slate-200 bg-slate-50 p-4">
              <p className="text-sm text-slate-500">Upcoming Deliveries</p>
              <p className="mt-2 text-2xl font-semibold text-slate-900">{communityData.upcomingDeliveries}</p>
            </div>
            <div className="rounded-3xl border border-slate-200 bg-slate-50 p-4">
              <p className="text-sm text-slate-500">Delivery Status</p>
              <p className="mt-2 text-2xl font-semibold text-slate-900">{communityData.community.isDeliveryConfirmed ? "✓ Confirmed" : "Pending"}</p>
            </div>
          </div>
        </div>
      )}

      {/* Analytics */}
      {analytics && (
        <div className="rounded-3xl bg-white p-6 shadow-sm">
          <h2 className="text-xl font-semibold text-slate-900">Community Analytics</h2>
          <div className="mt-4 grid gap-4 md:grid-cols-3">
            <div className="rounded-2xl bg-slate-50 p-4">
              <p className="text-sm text-slate-500">Total Revenue</p>
              <p className="mt-2 text-2xl font-semibold text-slate-900">₹{analytics.revenue}</p>
            </div>
            <div className="rounded-2xl bg-slate-50 p-4">
              <p className="text-sm text-slate-500">Completed Orders</p>
              <p className="mt-2 text-2xl font-semibold text-slate-900">{analytics.completedOrders}</p>
            </div>
            <div className="rounded-2xl bg-slate-50 p-4">
              <p className="text-sm text-slate-500">Avg Order Value</p>
              <p className="mt-2 text-2xl font-semibold text-slate-900">₹{Math.round(analytics.averageOrder)}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
