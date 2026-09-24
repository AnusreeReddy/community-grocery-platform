import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import { getDashboard, getBatches, getBestDeliveryDay, getAnalytics } from "../services/communityService.js";
import { getOrders } from "../services/orderService.js";

const Dashboard = () => {
  const { user } = useAuth();
  const communityId = user?.community?._id || user?.community || null;

  const [communityData, setCommunityData] = useState(null);
  const [batches, setBatches] = useState([]);
  const [ordersCount, setOrdersCount] = useState(0);
  const [bestDay, setBestDay] = useState(null);
  const [analytics, setAnalytics] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    if (communityId) {
      getDashboard(communityId).then((resp) => setCommunityData(resp.dashboard)).catch(() => setError("Unable to load community dashboard."));
      getBatches(communityId).then((resp) => setBatches(resp.batches)).catch(() => {});
      getBestDeliveryDay(communityId).then((resp) => setBestDay(resp.recommendation)).catch(() => {});
      // Revenue/analytics are restricted to community admins -- customers
      // simply won't see this section, which is expected, not an error.
      getAnalytics(communityId).then((resp) => setAnalytics(resp.analytics)).catch(() => {});
    }

    getOrders().then((resp) => setOrdersCount(resp.orders.length)).catch(() => {});
  }, [communityId]);

  return (
    <div className="space-y-6">
      <div className="rounded-3xl bg-white p-6 shadow-sm">
        <h1 className="text-2xl font-semibold text-slate-900">Welcome, {user.fullName}</h1>
        <p className="mt-2 text-slate-600">Role: {user.role}</p>
      </div>
      {error && <div className="rounded-3xl bg-rose-50 p-4 text-rose-700">{error}</div>}

      {user.role === "customer" && !communityId && (
        <div className="rounded-3xl bg-white p-6 shadow-sm text-center">
          <p className="text-slate-700">You haven't joined a community yet.</p>
          <Link to="/communities" className="mt-4 inline-flex rounded-2xl bg-slate-900 px-5 py-3 text-white hover:bg-slate-700">
            Browse communities
          </Link>
        </div>
      )}

      {/* Key Metrics */}
      {communityId && (
        <div className="grid gap-6 lg:grid-cols-4">
          <article className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <p className="text-sm text-slate-500">Your Community</p>
            <p className="mt-3 text-2xl font-semibold text-slate-900">{communityData?.community?.name || "—"}</p>
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
            <p className="text-sm text-slate-500">Upcoming Deliveries</p>
            <p className="mt-3 text-2xl font-semibold text-slate-900">{communityData?.upcomingDeliveries || 0}</p>
          </article>
        </div>
      )}

      {/* Per-batch pooling progress -- this is the real threshold picture: */}
      {/* each delivery day pools independently, not the community as a whole. */}
      {batches.length > 0 && (
        <div className="rounded-3xl bg-white p-6 shadow-sm">
          <h2 className="text-xl font-semibold text-slate-900">Pooling progress by delivery batch</h2>
          <p className="mt-1 text-sm text-slate-600">A delivery is proposed only once a specific day's pooled total reaches the threshold.</p>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            {batches.map((batch) => (
              <div key={batch.deliveryDay} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <div className="flex items-center justify-between">
                  <p className="font-semibold text-slate-900">{batch.deliveryDay}</p>
                  <span className="text-xs text-slate-500">{new Date(batch.deliveryDate).toLocaleDateString()}</span>
                </div>
                <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-slate-200">
                  <div className={`h-full rounded-full ${batch.thresholdReached ? "bg-green-500" : "bg-blue-600"}`} style={{ width: `${batch.percentToThreshold}%` }} />
                </div>
                <p className="mt-2 text-sm text-slate-600">
                  ₹{batch.totalAmount} / ₹{batch.thresholdAmount} · {batch.orderCount} pooled order{batch.orderCount === 1 ? "" : "s"}
                </p>
                <p className="text-xs text-slate-500">
                  {batch.thresholdReached
                    ? batch.delivery
                      ? `Delivery proposal ${batch.delivery.approvalStatus.toLowerCase()}`
                      : "Threshold reached — proposal pending"
                    : `₹${batch.amountRemaining} remaining to reach threshold`}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Best Delivery Day Recommendation */}
      {bestDay?.recommendedDeliveryDay && (
        <div className="rounded-3xl bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 p-6 shadow-sm">
          <h2 className="text-xl font-semibold text-slate-900">📅 Recommended Delivery Day</h2>
          <p className="mt-2 text-sm text-slate-600">{bestDay.rationale}</p>
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

      {/* Analytics (community admin / superAdmin only -- 403s silently for customers) */}
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
