import { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { getCommunity, getMergeSuggestions, joinCommunity } from "../services/communityService.js";
import { useAuth } from "../context/AuthContext.jsx";

const CommunityDetail = () => {
  const { id } = useParams();
  const { user, setUser } = useAuth();
  const navigate = useNavigate();
  const [community, setCommunity] = useState(null);
  const [suggestions, setSuggestions] = useState([]);
  const [message, setMessage] = useState("");
  const [joining, setJoining] = useState(false);

  useEffect(() => {
    getCommunity(id)
      .then((resp) => setCommunity(resp.community))
      .catch(() => setMessage("Unable to load community."));

    getMergeSuggestions(id)
      .then((resp) => setSuggestions(resp.suggestions))
      .catch(() => {});
  }, [id]);

  const isMine = user?.community === id || user?.community?._id === id;

  const handleJoin = async () => {
    setJoining(true);
    try {
      const resp = await joinCommunity(id);
      setUser(resp.user);
      localStorage.setItem("community-user", JSON.stringify(resp.user));
      navigate("/products");
    } catch (err) {
      setMessage(err.response?.data?.message || "Unable to join community.");
    } finally {
      setJoining(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="rounded-3xl bg-white p-6 shadow-sm">
        <h1 className="text-2xl font-semibold text-slate-900">{community?.name || "Community details"}</h1>
        <p className="mt-2 text-slate-600">{community?.description}</p>
      </div>
      {message && <div className="rounded-3xl bg-rose-50 p-4 text-rose-700">{message}</div>}
      <div className="grid gap-6 md:grid-cols-2">
        <section className="rounded-3xl bg-white p-6 shadow-sm">
          <h2 className="text-xl font-semibold text-slate-900">Location</h2>
          <p className="mt-3 text-slate-600">{community?.address}</p>
          <p className="mt-1 text-slate-600">{community?.city}, {community?.state} • {community?.pincode}</p>
          <div className="mt-4 space-y-2">
            <p className="text-sm text-slate-500">Pooling threshold</p>
            <p className="text-lg font-semibold text-slate-900">₹{community?.thresholdAmount}</p>
            {community?.maxBatchAmount && (
              <>
                <p className="text-sm text-slate-500">Per-batch capacity</p>
                <p className="text-lg font-semibold text-slate-900">₹{community.maxBatchAmount}</p>
              </>
            )}
          </div>
        </section>
        <section className="rounded-3xl bg-white p-6 shadow-sm">
          <h2 className="text-xl font-semibold text-slate-900">Delivery schedule</h2>
          <div className="mt-4 space-y-3">
            {(community?.deliverySchedule || []).map((item) => (
              <div key={item.day} className="rounded-3xl border border-slate-200 bg-slate-50 p-4">
                <p className="font-semibold text-slate-900">{item.day}</p>
                <p className="text-sm text-slate-600">Cut off at {item.cutOffTime}</p>
              </div>
            ))}
          </div>
          {user?.role === "customer" && (
            isMine ? (
              <p className="mt-6 rounded-2xl bg-green-50 px-4 py-3 text-center text-green-700">You're a member of this community</p>
            ) : !user.community ? (
              <button onClick={handleJoin} disabled={joining} className="mt-6 w-full rounded-2xl bg-slate-900 px-4 py-3 text-white hover:bg-slate-700 disabled:opacity-60">
                {joining ? "Joining..." : "Join this community"}
              </button>
            ) : (
              <p className="mt-6 text-sm text-slate-500">
                You're already in another community. <Link to="/communities" className="underline">Leave it</Link> to join this one instead.
              </p>
            )
          )}
        </section>
      </div>
      {suggestions.length > 0 && (
        <section className="rounded-3xl bg-white p-6 shadow-sm">
          <h2 className="text-xl font-semibold text-slate-900">Nearby communities that could merge</h2>
          <p className="mt-1 text-sm text-slate-600">Same pincode, overlapping delivery days — pooling together could reach threshold faster.</p>
          <div className="mt-4 grid gap-4">
            {suggestions.map((item) => (
              <div key={item.community._id} className="rounded-3xl border border-slate-200 p-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="font-semibold text-slate-900">{item.community.name}</p>
                  <span className={`rounded-full px-3 py-1 text-xs font-medium ${item.canReachThreshold ? "bg-green-100 text-green-700" : "bg-slate-100 text-slate-600"}`}>
                    {item.compatibilityScore}% match
                  </span>
                </div>
                <p className="mt-1 text-sm text-slate-600">Shared days: {item.sharedDays.join(", ")}</p>
                <p className="mt-1 text-sm text-slate-600">{item.recommendation}</p>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
};

export default CommunityDetail;
