import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { getCommunity, getMergeSuggestions, joinCommunity } from "../services/communityService.js";
import { useAuth } from "../context/AuthContext.jsx";

const CommunityDetail = () => {
  const { id } = useParams();
  const { user } = useAuth();
  const [community, setCommunity] = useState(null);
  const [suggestions, setSuggestions] = useState([]);
  const [message, setMessage] = useState("");

  useEffect(() => {
    getCommunity(id)
      .then((resp) => setCommunity(resp.community))
      .catch(() => setMessage("Unable to load community."));

    getMergeSuggestions(id)
      .then((resp) => setSuggestions(resp.suggestions))
      .catch(() => {});
  }, [id]);

  const handleJoin = async () => {
    try {
      await joinCommunity(id);
      window.location.reload();
    } catch (err) {
      setMessage(err.response?.data?.message || "Unable to join community.");
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
            <p className="text-sm text-slate-500">Threshold</p>
            <p className="text-lg font-semibold text-slate-900">₹{community?.thresholdAmount}</p>
            <p className="text-sm text-slate-500">Current order value</p>
            <p className="text-lg font-semibold text-slate-900">₹{community?.currentOrderValue}</p>
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
          {user && !user.community && (
            <button onClick={handleJoin} className="mt-6 w-full rounded-2xl bg-slate-900 px-4 py-3 text-white hover:bg-slate-700">
              Join this community
            </button>
          )}
        </section>
      </div>
      {suggestions.length > 0 && (
        <section className="rounded-3xl bg-white p-6 shadow-sm">
          <h2 className="text-xl font-semibold text-slate-900">Merge suggestions</h2>
          <div className="mt-4 grid gap-4">
            {suggestions.map((item) => (
              <div key={item._id} className="rounded-3xl border border-slate-200 p-4">
                <p className="font-semibold text-slate-900">{item.name}</p>
                <p className="mt-1 text-sm text-slate-600">Local community with threshold reached for merge.</p>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
};

export default CommunityDetail;
