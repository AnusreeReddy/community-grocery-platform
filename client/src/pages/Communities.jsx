import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import { getCommunities, joinCommunity } from "../services/communityService.js";

const Communities = () => {
  const { user, updateUser } = useAuth();
  const [communities, setCommunities] = useState([]);
  const [error, setError] = useState("");
  const [joiningId, setJoiningId] = useState(null);

  useEffect(() => {
    getCommunities()
      .then((resp) => setCommunities(resp.communities || []))
      .catch(() => setError("Could not load communities."));
  }, []);

  const handleJoin = async (id) => {
    setJoiningId(id);
    try {
      const response = await joinCommunity(id);

      if (response?.user) {
        updateUser(response.user);
      }

      window.location.reload();
    } catch (err) {
      setError(err.response?.data?.message || "Unable to join community.");
    } finally {
      setJoiningId(null);
    }
  };

  return (
    <section className="space-y-6">
      <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="inline-flex items-center gap-2 rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-800">
          <span>🏡 Neighborhood Grocery Hubs</span>
        </div>
        <h1 className="mt-2 text-2xl font-bold text-slate-900">Neighborhood Communities</h1>
        <p className="mt-1 text-sm text-slate-600">
          Join your local residential community to coordinate weekly grocery pools, unlock zero delivery fees, and meet batch delivery thresholds.
        </p>
      </div>

      {error && <div className="rounded-3xl bg-rose-50 p-4 text-rose-700 text-sm">{error}</div>}

      <div className="grid gap-6 md:grid-cols-2">
        {communities.map((community) => {
          const isMember = user?.community === community._id;
          const pct = Math.min(
            100,
            Math.round(((community.currentOrderValue || 0) / (community.thresholdAmount || 1000)) * 100)
          );

          return (
            <article
              key={community._id}
              className={`rounded-3xl border bg-white p-6 shadow-sm transition hover:shadow-md ${
                isMember ? "border-emerald-500 ring-2 ring-emerald-500/20" : "border-slate-200"
              }`}
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  {isMember && (
                    <span className="mb-2 inline-block rounded-full bg-emerald-100 px-2.5 py-0.5 text-[11px] font-bold text-emerald-800">
                      ✓ Your Active Pool
                    </span>
                  )}
                  <Link
                    to={`/communities/${community._id}`}
                    className="text-xl font-bold text-slate-900 hover:text-emerald-700 block"
                  >
                    {community.name}
                  </Link>
                  <p className="mt-1 text-xs text-slate-500">
                    📍 {community.address}, {community.city}, {community.state} ({community.pincode})
                  </p>
                </div>
                <div className="text-right">
                  <span className="text-[11px] text-slate-400 block uppercase font-medium">Batch Goal</span>
                  <span className="text-base font-bold text-slate-900">₹{community.thresholdAmount}</span>
                </div>
              </div>

              <p className="mt-3 text-sm text-slate-600 line-clamp-2">
                {community.description || "Neighborhood grocery pooling group."}
              </p>

              {/* Progress Indicator */}
              <div className="mt-4 rounded-2xl bg-slate-50 p-3 border border-slate-100">
                <div className="flex justify-between text-xs text-slate-600 mb-1">
                  <span>Current Pooled Value</span>
                  <span className="font-bold text-slate-900">
                    ₹{community.currentOrderValue} / ₹{community.thresholdAmount} ({pct}%)
                  </span>
                </div>
                <div className="h-2 w-full rounded-full bg-slate-200 overflow-hidden">
                  <div
                    className="h-full bg-emerald-600 rounded-full transition-all duration-300"
                    style={{ width: `${pct}%` }}
                  />
                </div>
              </div>

              {/* Delivery Schedule Badges */}
              <div className="mt-4">
                <span className="text-[11px] font-semibold text-slate-500 uppercase block mb-1.5">
                  Scheduled Batch Delivery Cycles:
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {(community.deliverySchedule || []).map((item) => (
                    <span
                      key={item.day}
                      className="rounded-xl bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-700 border border-slate-200"
                    >
                      {item.day} (Cutoff: {item.cutOffTime})
                    </span>
                  ))}
                </div>
              </div>

              {/* Action Button */}
              <div className="mt-6 border-t border-slate-100 pt-4 flex items-center justify-between">
                <Link
                  to={`/communities/${community._id}`}
                  className="text-xs font-semibold text-slate-700 hover:text-slate-900"
                >
                  View Details & Sourcing →
                </Link>

                {user ? (
                  isMember ? (
                    <Link
                      to="/dashboard"
                      className="rounded-2xl bg-emerald-600 px-4 py-2 text-xs font-bold text-white hover:bg-emerald-500"
                    >
                      Go to Pool Dashboard
                    </Link>
                  ) : (
                    <button
                      onClick={() => handleJoin(community._id)}
                      disabled={joiningId === community._id}
                      className="rounded-2xl bg-slate-900 px-4 py-2 text-xs font-semibold text-white hover:bg-slate-700 disabled:opacity-50"
                    >
                      {joiningId === community._id ? "Joining..." : "Join Community"}
                    </button>
                  )
                ) : (
                  <Link
                    to="/login"
                    className="rounded-2xl bg-slate-900 px-4 py-2 text-xs font-semibold text-white hover:bg-slate-700"
                  >
                    Login to Join Pool
                  </Link>
                )}
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
};

export default Communities;
