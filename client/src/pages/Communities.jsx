import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import { getCommunities, joinCommunity } from "../services/communityService.js";

const Communities = () => {
  const { user } = useAuth();
  const [communities, setCommunities] = useState([]);
  const [error, setError] = useState("");

  useEffect(() => {
    getCommunities()
      .then((resp) => setCommunities(resp.communities))
      .catch(() => setError("Could not load communities."));
  }, []);

  const handleJoin = async (id) => {
    try {
      await joinCommunity(id);
      window.location.reload();
    } catch (err) {
      setError(err.response?.data?.message || "Unable to join community.");
    }
  };

  return (
    <section className="space-y-6">
      <div className="rounded-3xl bg-white p-6 shadow-sm">
        <h1 className="text-2xl font-semibold text-slate-900">Communities</h1>
        <p className="mt-2 text-slate-600">Browse community delivery cycles and join a local group.</p>
      </div>
      {error && <div className="rounded-3xl bg-rose-50 p-4 text-rose-700">{error}</div>}
      <div className="grid gap-6 md:grid-cols-2">
        {communities.map((community) => (
          <article key={community._id} className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <Link to={`/communities/${community._id}`} className="text-xl font-semibold text-slate-900 hover:text-slate-700">{community.name}</Link>
            <p className="mt-3 text-slate-600">{community.description || "No description available."}</p>
            <p className="mt-4 text-sm text-slate-500">{community.city}, {community.state} • ₹{community.thresholdAmount} threshold</p>
            <div className="mt-4 flex flex-wrap gap-2">
              {(community.deliverySchedule || []).map((item) => (
                <span key={item.day} className="rounded-full bg-slate-100 px-3 py-1 text-xs text-slate-700">{item.day} @ {item.cutOffTime}</span>
              ))}
            </div>
            {user ? (
              <button onClick={() => handleJoin(community._id)} className="mt-6 inline-flex rounded-2xl bg-slate-900 px-4 py-2 text-white hover:bg-slate-700">
                Join Community
              </button>
            ) : (
              <Link to="/login" className="mt-6 inline-flex rounded-2xl bg-slate-900 px-4 py-2 text-white hover:bg-slate-700">
                Login to join
              </Link>
            )}
          </article>
        ))}
      </div>
    </section>
  );
};

export default Communities;
