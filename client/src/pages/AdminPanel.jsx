import { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext.jsx";
import { getCommunities, runThresholdEvaluation } from "../services/communityService.js";
import api from "../services/api.js";

const AdminPanel = () => {
  const { user } = useAuth();
  const [communities, setCommunities] = useState([]);
  const [users, setUsers] = useState([]);
  const [deliveries, setDeliveries] = useState([]);
  const [message, setMessage] = useState("");
  const [thresholdResult, setThresholdResult] = useState(null);
  const [activeTab, setActiveTab] = useState("communities");
  const [approvalModal, setApprovalModal] = useState({ show: false, delivery: null, action: null, note: "" });

  const loadDeliveries = () => {
    api.get("/deliveries").then((resp) => setDeliveries(resp.deliveries)).catch(() => setMessage("Unable to load deliveries."));
  };

  useEffect(() => {
    getCommunities().then((resp) => setCommunities(resp.communities)).catch(() => setMessage("Unable to load communities."));
    api.get("/users").then((resp) => setUsers(resp.data.users || resp.users)).catch(() => setMessage("Unable to load users."));
    loadDeliveries();
  }, []);

  const handleRunThreshold = async () => {
    try {
      const resp = await runThresholdEvaluation();
      setThresholdResult(resp.result);
      setMessage(resp.message || "Threshold evaluation completed.");
      loadDeliveries();
    } catch (error) {
      setMessage(error.response?.data?.message || "Unable to run threshold evaluation.");
    }
  };

  const handleApproveDelivery = async (deliveryId, approvalStatus, note) => {
    try {
      await api.patch(`/deliveries/${deliveryId}/approval`, { approvalStatus, note });
      setMessage(`Delivery ${approvalStatus === "Approved" ? "approved" : "rejected"}.`);
      setApprovalModal({ show: false, delivery: null, action: null, note: "" });
      loadDeliveries();
    } catch (error) {
      setMessage(error.response?.data?.message || "Unable to process approval.");
    }
  };

  return (
    <div className="space-y-6">
      <div className="rounded-3xl bg-white p-6 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold text-slate-900">Admin dashboard</h1>
            <p className="mt-2 text-slate-600">Manage communities, deliveries, and system operations.</p>
            <p className="mt-4 text-sm text-slate-500">Signed in as {user.fullName} ({user.role})</p>
          </div>
          <button onClick={handleRunThreshold} className="rounded-2xl bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-700">
            Run threshold evaluation
          </button>
        </div>
      </div>
      {message && <div className="rounded-3xl bg-slate-100 p-4 text-slate-700">{message}</div>}

      {/* Tabs */}
      <div className="flex gap-2 border-b border-slate-200">
        <button onClick={() => setActiveTab("communities")} className={`px-4 py-3 font-medium ${activeTab === "communities" ? "border-b-2 border-slate-900 text-slate-900" : "text-slate-600"}`}>
          Communities
        </button>
        <button onClick={() => setActiveTab("deliveries")} className={`px-4 py-3 font-medium ${activeTab === "deliveries" ? "border-b-2 border-slate-900 text-slate-900" : "text-slate-600"}`}>
          Deliveries
        </button>
        <button onClick={() => setActiveTab("users")} className={`px-4 py-3 font-medium ${activeTab === "users" ? "border-b-2 border-slate-900 text-slate-900" : "text-slate-600"}`}>
          Users
        </button>
      </div>

      {/* Tab Content */}
      {activeTab === "communities" && (
        <section className="rounded-3xl bg-white p-6 shadow-sm">
          <h2 className="text-xl font-semibold text-slate-900">Communities</h2>
          <ul className="mt-4 space-y-3">
            {communities.map((community) => (
              <li key={community._id} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-semibold text-slate-900">{community.name}</p>
                    <p className="text-sm text-slate-600">{community.city}, {community.state} • ₹{community.thresholdAmount} threshold</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-slate-600">Progress</p>
                    <p className="font-semibold text-slate-900">₹{community.currentOrderValue} / ₹{community.thresholdAmount}</p>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </section>
      )}

      {activeTab === "deliveries" && (
        <section className="rounded-3xl bg-white p-6 shadow-sm">
          <h2 className="text-xl font-semibold text-slate-900">Delivery Proposals</h2>
          <div className="mt-4 space-y-4">
            {deliveries.filter((d) => d.approvalStatus === "Pending").length > 0 ? (
              deliveries.filter((d) => d.approvalStatus === "Pending").map((delivery) => (
                <div key={delivery._id} className="rounded-3xl border border-slate-200 p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-semibold text-slate-900">{delivery.community?.name || "Community"}</h3>
                      <p className="text-sm text-slate-600">{delivery.deliveryDay} • {new Date(delivery.deliveryDate).toLocaleDateString()}</p>
                      <p className="mt-2 text-sm text-slate-600">Orders: {delivery.totalOrders} • Amount: ₹{delivery.totalAmount}</p>
                    </div>
                    <span className="rounded-full bg-yellow-100 px-3 py-1 text-sm text-yellow-700">Pending</span>
                  </div>
                  <div className="mt-4 flex gap-2">
                    <button onClick={() => setApprovalModal({ show: true, delivery, action: "Approved", note: "" })} className="rounded-2xl bg-green-600 px-4 py-2 text-sm text-white hover:bg-green-500">
                      Approve
                    </button>
                    <button onClick={() => setApprovalModal({ show: true, delivery, action: "Rejected", note: "" })} className="rounded-2xl bg-red-600 px-4 py-2 text-sm text-white hover:bg-red-500">
                      Reject
                    </button>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-slate-600">No pending delivery proposals.</p>
            )}
          </div>

          <div className="mt-8">
            <h3 className="text-lg font-semibold text-slate-900">All Deliveries</h3>
            <div className="mt-4 space-y-3">
              {deliveries.map((delivery) => (
                <div key={delivery._id} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-semibold text-slate-900">{delivery.community?.name || "Community"}</p>
                      <p className="text-sm text-slate-600">{delivery.deliveryDay} • {delivery.deliveryStatus}</p>
                    </div>
                    <span className={`rounded-full px-3 py-1 text-sm font-medium ${
                      delivery.approvalStatus === "Approved" ? "bg-green-100 text-green-700" :
                      delivery.approvalStatus === "Rejected" ? "bg-red-100 text-red-700" :
                      "bg-yellow-100 text-yellow-700"
                    }`}>
                      {delivery.approvalStatus}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {activeTab === "users" && (
        <section className="rounded-3xl bg-white p-6 shadow-sm">
          <h2 className="text-xl font-semibold text-slate-900">Users</h2>
          <ul className="mt-4 space-y-3">
            {users.map((item) => (
              <li key={item._id} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <p className="font-semibold text-slate-900">{item.fullName}</p>
                <p className="text-sm text-slate-600">{item.email} • {item.role}</p>
                {item.community && <p className="text-sm text-slate-500">Community: {item.community?.name || "Unknown"}</p>}
              </li>
            ))}
          </ul>
        </section>
      )}

      {thresholdResult && (
        <div className="rounded-3xl bg-white p-6 shadow-sm">
          <h2 className="text-xl font-semibold text-slate-900">Threshold evaluation result</h2>
          <pre className="mt-4 overflow-x-auto rounded-2xl bg-slate-950 p-4 text-sm text-slate-100">{JSON.stringify(thresholdResult, null, 2)}</pre>
        </div>
      )}

      {/* Approval Modal */}
      {approvalModal.show && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="rounded-3xl bg-white p-6 shadow-lg max-w-md w-full mx-4">
            <h3 className="text-xl font-semibold text-slate-900">
              {approvalModal.action === "Approved" ? "Approve" : "Reject"} Delivery?
            </h3>
            <p className="mt-2 text-slate-600">
              {approvalModal.delivery?.community?.name || "Community"} delivery proposal ({approvalModal.delivery?.totalOrders} orders)
            </p>
            <textarea
              value={approvalModal.note}
              onChange={(e) => setApprovalModal({ ...approvalModal, note: e.target.value })}
              placeholder="Add a note (optional)"
              className="mt-4 w-full rounded-2xl border border-slate-300 bg-slate-50 px-4 py-3 text-slate-900"
              rows="3"
            />
            <div className="mt-6 flex gap-3">
              <button onClick={() => setApprovalModal({ show: false, delivery: null, action: null, note: "" })} className="flex-1 rounded-2xl border border-slate-300 px-4 py-2 text-slate-900 hover:bg-slate-50">
                Cancel
              </button>
              <button onClick={() => handleApproveDelivery(approvalModal.delivery._id, approvalModal.action, approvalModal.note)} className={`flex-1 rounded-2xl px-4 py-2 text-white ${
                approvalModal.action === "Approved" ? "bg-green-600 hover:bg-green-500" : "bg-red-600 hover:bg-red-500"
              }`}>
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminPanel;
