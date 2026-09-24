import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import { getCommunities, joinCommunity, leaveCommunity } from "../services/communityService.js";

const Communities = () => {
  const { user, setUser } = useAuth();
  const navigate = useNavigate();
  const [communities, setCommunities] = useState([]);
  const [error, setError] = useState("");
  const [busyId, setBusyId] = useState(null);

  useEffect(() => {
    getCommunities()
      .then((resp) => setCommunities(resp.communities))
      .catch(() => setError("Could not load communities."));
  }, []);

  const updateUser = (updatedUser) => {
    setUser(updatedUser);
    localStorage.setItem("community-user", JSON.stringify(updatedUser));
  };

  const handleJoin = async (id) => {
    setError("");
    setBusyId(id);
    try {
      const resp = await joinCommunity(id);
      updateUser(resp.user);
      navigate("/products");
    } catch (err) {
      setError(err.response?.data?.message || "Unable to join community.");
    } finally {
      setBusyId(null);
    }
  };

  const handleLeave = async () => {
    setError("");
    setBusyId("leave");
    try {
      const resp = await leaveCommunity();
      updateUser(resp.user);
    } catch (err) {
      setError(err.response?.data?.message || "Unable to leave community.");
    } finally {
      setBusyId(null);
    }
  };

  const currentCommunity = communities.find((c) => c._id === user?.community || c._id === user?.community?._id);

  return (
    <section className="space-y-6">
      <div className="rounded-3xl bg-white p-6 shadow-sm">
        <h1 className="text-2xl font-semibold text-slate-900">Communities</h1>
        <p className="mt-2 text-slate-600">
          Join a community first — products, delivery batches, and pooled pricing are all specific to your community.
        </p>
        {user?.role === "customer" && (
          <div className="mt-4 rounded-2xl bg-slate-50 p-4 text-sm text-slate-700">
            {user.community ? (
              <div className="flex flex-wrap items-center justify-between gap-3">
                <span>
                  You are currently part of <strong>{currentCommunity?.name || "a community"}</strong>.
                </span>
                <button
                  onClick={handleLeave}
                  disabled={busyId === "leave"}
                  className="rounded-2xl border border-rose-300 px-3 py-1.5 text-rose-700 hover:bg-rose-50 disabled:opacity-60"
                >
                  {busyId === "leave" ? "Leaving..." : "Leave community"}
                </button>
              </div>
            ) : (
              <span>You haven't joined a community yet. Pick one below to start shopping.</span>
            )}
          </div>
        )}
      </div>
      {error && <div className="rounded-3xl bg-rose-50 p-4 text-rose-700">{error}</div>}
      <div className="grid gap-6 md:grid-cols-2">
        {communities.map((community) => {
          const isMine = user?.community === community._id || user?.community?._id === community._id;
          return (
            <article key={community._id} className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
              <Link to={`/communities/${community._id}`} className="text-xl font-semibold text-slate-900 hover:text-slate-700">{community.name}</Link>
              <p className="mt-3 text-slate-600">{community.description || "No description available."}</p>
              <p className="mt-4 text-sm text-slate-500">{community.city}, {community.state} • ₹{community.thresholdAmount} pooling threshold</p>
              <div className="mt-4 flex flex-wrap gap-2">
                {(community.deliverySchedule || []).map((item) => (
                  <span key={item.day} className="rounded-full bg-slate-100 px-3 py-1 text-xs text-slate-700">{item.day} @ {item.cutOffTime}</span>
                ))}
              </div>
              {!user ? (
                <Link to="/login" className="mt-6 inline-flex rounded-2xl bg-slate-900 px-4 py-2 text-white hover:bg-slate-700">
                  Login to join
                </Link>
              ) : isMine ? (
                <span className="mt-6 inline-flex rounded-2xl bg-green-100 px-4 py-2 text-green-700">You're a member</span>
              ) : user.role === "customer" && !user.community ? (
                <button
                  onClick={() => handleJoin(community._id)}
                  disabled={busyId === community._id}
                  className="mt-6 inline-flex rounded-2xl bg-slate-900 px-4 py-2 text-white hover:bg-slate-700 disabled:opacity-60"
                >
                  {busyId === community._id ? "Joining..." : "Join Community"}
                </button>
              ) : user.role === "customer" ? (
                <span className="mt-6 inline-block text-sm text-slate-500">Leave your current community to join this one.</span>
              ) : null}
            </article>
          );
        })}
      </div>
    </section>
  );
};

export default Communities;
