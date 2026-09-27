import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { getCommunity, getMergeSuggestions, joinCommunity } from "../services/communityService.js";
import { useAuth } from "../context/AuthContext.jsx";

const CommunityDetail = () => {
  const { id } = useParams();
  const { user, updateUser } = useAuth();
  const [community, setCommunity] = useState(null);
  const [suggestions, setSuggestions] = useState([]);
  const [message, setMessage] = useState("");
  const [joining, setJoining] = useState(false);

  useEffect(() => {
    getCommunity(id)
      .then((resp) => setCommunity(resp.community))
      .catch(() => setMessage("Unable to load community details."));

    getMergeSuggestions(id)
      .then((resp) => setSuggestions(resp.suggestions || []))
      .catch(() => {});
  }, [id]);

  const handleJoin = async () => {
    setJoining(true);
    try {
      const response = await joinCommunity(id);

      if (response?.user) {
        updateUser(response.user);
      }

      window.location.reload();
    } catch (err) {
      setMessage(err.response?.data?.message || "Unable to join community.");
    } finally {
      setJoining(false);
    }
  };

  const isMember = user?.community === id;
  const currentVal = community?.currentOrderValue || 0;
  const targetVal = community?.thresholdAmount || 1000;
  const pct = Math.min(100, Math.round((currentVal / targetVal) * 100));

  return (
    <div className="space-y-6">
      {/* Community Hero Header */}
      <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-800">
              <span>🏡 Neighborhood Pool Hub</span>
            </div>
            <h1 className="mt-2 text-3xl font-bold text-slate-900">
              {community?.name || "Community Details"}
            </h1>
            <p className="mt-1 text-sm text-slate-600 max-w-2xl">
              {community?.description || "Residential grocery pooling community."}
            </p>
          </div>

          {isMember ? (
            <div className="rounded-2xl border border-emerald-300 bg-emerald-50 p-4 text-right">
              <span className="text-xs font-bold uppercase text-emerald-800">
                ✓ Member of this Pool
              </span>
              <p className="text-xs text-emerald-700 mt-1">Orders you place contribute directly here</p>
              <Link
                to="/dashboard"
                className="mt-2 inline-block rounded-xl bg-emerald-600 px-3.5 py-1.5 text-xs font-semibold text-white hover:bg-emerald-500"
              >
                Go to Active Batch Dashboard
              </Link>
            </div>
          ) : user ? (
            <button
              onClick={handleJoin}
              disabled={joining}
              className="rounded-2xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white hover:bg-slate-700 disabled:opacity-50"
            >
              {joining ? "Joining..." : "Join this Community Pool"}
            </button>
          ) : (
            <Link
              to="/login"
              className="rounded-2xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white hover:bg-slate-700"
            >
              Login to Join Pool
            </Link>
          )}
        </div>
      </div>

      {message && <div className="rounded-3xl bg-rose-50 p-4 text-rose-700 text-sm">{message}</div>}

      <div className="grid gap-6 md:grid-cols-2">
        {/* Pool Threshold & Location */}
        <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-xl font-bold text-slate-900">Pooling Status & Hub Location</h2>
          <p className="mt-3 text-sm text-slate-600 font-medium">📍 {community?.address}</p>
          <p className="text-xs text-slate-500">
            {community?.city}, {community?.state} • Pincode: {community?.pincode}
          </p>

          <div className="mt-6 rounded-2xl bg-slate-50 p-4 border border-slate-100">
            <div className="flex justify-between text-xs text-slate-600 mb-1">
              <span>Current Batch Order Value</span>
              <span className="font-bold text-slate-900">
                ₹{currentVal} / ₹{targetVal}
              </span>
            </div>
            <div className="h-3 w-full rounded-full bg-slate-200 overflow-hidden">
              <div
                className="h-full bg-emerald-600 rounded-full transition-all duration-300"
                style={{ width: `${pct}%` }}
              />
            </div>
            <div className="flex justify-between text-[11px] text-slate-500 mt-1">
              <span>{pct}% of pooling threshold reached</span>
              <span>₹{Math.max(0, targetVal - currentVal)} remaining</span>
            </div>
          </div>
        </section>

        {/* Scheduled Batch Cycles */}
        <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-xl font-bold text-slate-900">Scheduled Delivery Cycles</h2>
          <p className="mt-1 text-xs text-slate-500">
            Weekly drop-off batches scheduled for this neighborhood
          </p>

          <div className="mt-4 space-y-3">
            {(community?.deliverySchedule || []).map((item) => (
              <div
                key={item.day}
                className="flex items-center justify-between rounded-2xl border border-slate-200 bg-slate-50 p-4"
              >
                <div>
                  <p className="font-bold text-slate-900">{item.day} Batch</p>
                  <p className="text-xs text-rose-600 font-medium">Order Cutoff: {item.cutOffTime}</p>
                </div>
                <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-800">
                  Bulk Truck Dispatch
                </span>
              </div>
            ))}
          </div>
        </section>
      </div>

      {/* Cross-Community Merge Opportunities */}
      {suggestions.length > 0 && (
        <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex items-center gap-2">
            <span className="text-xl">🤝</span>
            <h2 className="text-xl font-bold text-slate-900">Nearby Pool Merging Opportunities</h2>
          </div>
          <p className="mt-1 text-xs text-slate-500">
            Adjacent communities sharing delivery corridors that can combine order totals to reach threshold faster.
          </p>

          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            {suggestions.map((item) => (
              <div
                key={item.community?._id || item._id}
                className="rounded-2xl border border-slate-200 bg-slate-50 p-4"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-bold text-slate-900">{item.community?.name || item.name}</h3>
                    <p className="text-xs text-slate-500">
                      Pincode: {item.community?.pincode || community?.pincode}
                    </p>
                  </div>
                  {item.compatibilityScore && (
                    <span className="rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-bold text-blue-800">
                      {item.compatibilityScore}% Compatible
                    </span>
                  )}
                </div>

                <p className="mt-2 text-xs text-slate-600">
                  {item.recommendation || "Shared delivery days available for consolidation."}
                </p>

                {item.sharedDays && (
                  <div className="mt-3 flex flex-wrap gap-1">
                    {item.sharedDays.map((day) => (
                      <span key={day} className="rounded bg-white px-2 py-0.5 text-[10px] text-slate-700 border border-slate-200">
                        Shared {day}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
};

export default CommunityDetail;
