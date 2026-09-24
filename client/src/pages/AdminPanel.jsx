import { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext.jsx";
import { getCommunities, runThresholdEvaluation, createCommunity } from "../services/communityService.js";
import { assignTruck } from "../services/deliveryService.js";
import api from "../services/api.js";

const WEEKDAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

const emptyCommunityForm = {
  name: "",
  description: "",
  address: "",
  city: "",
  state: "",
  pincode: "",
  thresholdAmount: 1000,
  maxBatchAmount: "",
  scheduleDay1: "Monday",
  cutOff1: "18:00",
  scheduleDay2: "Thursday",
  cutOff2: "18:00",
};

const AdminPanel = () => {
  const { user } = useAuth();
  const isSuperAdmin = user.role === "superAdmin";

  const [communities, setCommunities] = useState([]);
  const [users, setUsers] = useState([]);
  const [deliveries, setDeliveries] = useState([]);
  const [pendingShopkeepers, setPendingShopkeepers] = useState([]);
  const [message, setMessage] = useState("");
  const [thresholdResult, setThresholdResult] = useState(null);
  const [activeTab, setActiveTab] = useState("communities");
  const [approvalModal, setApprovalModal] = useState({ show: false, delivery: null, action: null, note: "" });
  const [truckForm, setTruckForm] = useState({});
  const [communityForm, setCommunityForm] = useState(emptyCommunityForm);
  const [creatingCommunity, setCreatingCommunity] = useState(false);

  const loadCommunities = () => {
    getCommunities().then((resp) => setCommunities(resp.communities)).catch(() => setMessage("Unable to load communities."));
  };

  const loadDeliveries = () => {
    api
      .get("/deliveries")
      .then((resp) => setDeliveries(resp.data.deliveries || []))
      .catch(() => setMessage("Unable to load deliveries."));
  };

  const loadUsers = () => {
    if (!isSuperAdmin) return;
    api
      .get("/users")
      .then((resp) => {
        const list = resp.data.users || [];
        setUsers(list);
        setPendingShopkeepers(list.filter((item) => item.role === "shopkeeper" && item.shopkeeperApprovalStatus === "Pending"));
      })
      .catch(() => setMessage("Unable to load users."));
  };

  useEffect(() => {
    loadCommunities();
    loadDeliveries();
    loadUsers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleRunThreshold = async () => {
    try {
      const resp = await runThresholdEvaluation();
      setThresholdResult(resp.result);
      setMessage("Threshold evaluation completed for every community batch.");
      loadDeliveries();
      loadCommunities();
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

  const handleAssignTruck = async (deliveryId) => {
    const data = truckForm[deliveryId] || {};
    if (!data.truckNumber && !data.driverName && !data.driverPhone) {
      setMessage("Enter at least a truck number, driver name, or driver phone.");
      return;
    }
    try {
      await assignTruck(deliveryId, data);
      setMessage("Truck details saved.");
      loadDeliveries();
    } catch (error) {
      setMessage(error.response?.data?.message || "Unable to assign truck.");
    }
  };

  const handleShopkeeperApproval = async (userId, status) => {
    try {
      await api.patch(`/users/${userId}/shopkeeper-approval`, { status });
      setMessage(`Shopkeeper ${status.toLowerCase()}.`);
      loadUsers();
    } catch (error) {
      setMessage(error.response?.data?.message || "Unable to update shopkeeper approval.");
    }
  };

  const handleCreateCommunity = async (event) => {
    event.preventDefault();
    setCreatingCommunity(true);
    try {
      await createCommunity({
        name: communityForm.name,
        description: communityForm.description,
        address: communityForm.address,
        city: communityForm.city,
        state: communityForm.state,
        pincode: communityForm.pincode,
        thresholdAmount: Number(communityForm.thresholdAmount),
        maxBatchAmount: communityForm.maxBatchAmount ? Number(communityForm.maxBatchAmount) : undefined,
        deliverySchedule: [
          { day: communityForm.scheduleDay1, cutOffTime: communityForm.cutOff1 },
          { day: communityForm.scheduleDay2, cutOffTime: communityForm.cutOff2 },
        ],
      });
      setMessage("Community created successfully.");
      setCommunityForm(emptyCommunityForm);
      loadCommunities();
    } catch (error) {
      setMessage(error.response?.data?.message || "Unable to create community.");
    } finally {
      setCreatingCommunity(false);
    }
  };

  const tabs = [
    { id: "communities", label: "Communities" },
    { id: "deliveries", label: "Deliveries" },
    ...(isSuperAdmin ? [{ id: "users", label: "Users" }] : []),
    ...(isSuperAdmin ? [{ id: "shopkeepers", label: `Shopkeeper approvals${pendingShopkeepers.length ? ` (${pendingShopkeepers.length})` : ""}` }] : []),
  ];

  return (
    <div className="space-y-6">
      <div className="rounded-3xl bg-white p-6 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold text-slate-900">Admin dashboard</h1>
            <p className="mt-2 text-slate-600">Manage communities, deliveries, and pooled demand.</p>
            <p className="mt-4 text-sm text-slate-500">Signed in as {user.fullName} ({user.role})</p>
          </div>
          <button onClick={handleRunThreshold} className="rounded-2xl bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-700">
            Run threshold evaluation
          </button>
        </div>
      </div>
      {message && <div className="rounded-3xl bg-slate-100 p-4 text-slate-700">{message}</div>}

      {/* Tabs */}
      <div className="flex flex-wrap gap-2 border-b border-slate-200">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-4 py-3 font-medium ${activeTab === tab.id ? "border-b-2 border-slate-900 text-slate-900" : "text-slate-600"}`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Communities Tab */}
      {activeTab === "communities" && (
        <section className="space-y-6">
          <div className="rounded-3xl bg-white p-6 shadow-sm">
            <h2 className="text-xl font-semibold text-slate-900">Communities</h2>
            <ul className="mt-4 space-y-3">
              {communities.map((community) => (
                <li key={community._id} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div>
                      <p className="font-semibold text-slate-900">{community.name}</p>
                      <p className="text-sm text-slate-600">{community.city}, {community.state} • Pin {community.pincode}</p>
                      <p className="text-sm text-slate-500">
                        Schedule: {community.deliverySchedule?.map((s) => `${s.day} (${s.cutOffTime})`).join(", ")}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-slate-600">Pending demand</p>
                      <p className="font-semibold text-slate-900">₹{community.currentOrderValue} / ₹{community.thresholdAmount} threshold</p>
                      {community.maxBatchAmount && <p className="text-xs text-slate-500">Batch cap: ₹{community.maxBatchAmount}</p>}
                    </div>
                  </div>
                </li>
              ))}
              {communities.length === 0 && <p className="text-slate-600">No communities yet.</p>}
            </ul>
          </div>

          {isSuperAdmin && (
            <div className="rounded-3xl bg-white p-6 shadow-sm">
              <h2 className="text-xl font-semibold text-slate-900">Create a community</h2>
              <form onSubmit={handleCreateCommunity} className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
                <input required placeholder="Name" value={communityForm.name} onChange={(e) => setCommunityForm({ ...communityForm, name: e.target.value })} className="rounded-2xl border border-slate-300 px-4 py-2" />
                <input required placeholder="Pincode" value={communityForm.pincode} onChange={(e) => setCommunityForm({ ...communityForm, pincode: e.target.value })} className="rounded-2xl border border-slate-300 px-4 py-2" />
                <input required placeholder="Address" value={communityForm.address} onChange={(e) => setCommunityForm({ ...communityForm, address: e.target.value })} className="rounded-2xl border border-slate-300 px-4 py-2 sm:col-span-2" />
                <input required placeholder="City" value={communityForm.city} onChange={(e) => setCommunityForm({ ...communityForm, city: e.target.value })} className="rounded-2xl border border-slate-300 px-4 py-2" />
                <input required placeholder="State" value={communityForm.state} onChange={(e) => setCommunityForm({ ...communityForm, state: e.target.value })} className="rounded-2xl border border-slate-300 px-4 py-2" />
                <textarea placeholder="Description (optional)" value={communityForm.description} onChange={(e) => setCommunityForm({ ...communityForm, description: e.target.value })} className="rounded-2xl border border-slate-300 px-4 py-2 sm:col-span-2" rows="2" />
                <input required type="number" min="1" placeholder="Threshold amount (₹)" value={communityForm.thresholdAmount} onChange={(e) => setCommunityForm({ ...communityForm, thresholdAmount: e.target.value })} className="rounded-2xl border border-slate-300 px-4 py-2" />
                <input type="number" min="1" placeholder="Max batch amount (optional, ₹)" value={communityForm.maxBatchAmount} onChange={(e) => setCommunityForm({ ...communityForm, maxBatchAmount: e.target.value })} className="rounded-2xl border border-slate-300 px-4 py-2" />
                <div className="flex items-center gap-2 sm:col-span-2">
                  <select value={communityForm.scheduleDay1} onChange={(e) => setCommunityForm({ ...communityForm, scheduleDay1: e.target.value })} className="rounded-2xl border border-slate-300 px-4 py-2">
                    {WEEKDAYS.map((d) => <option key={d} value={d}>{d}</option>)}
                  </select>
                  <input type="time" value={communityForm.cutOff1} onChange={(e) => setCommunityForm({ ...communityForm, cutOff1: e.target.value })} className="rounded-2xl border border-slate-300 px-4 py-2" />
                  <span className="text-sm text-slate-500">and</span>
                  <select value={communityForm.scheduleDay2} onChange={(e) => setCommunityForm({ ...communityForm, scheduleDay2: e.target.value })} className="rounded-2xl border border-slate-300 px-4 py-2">
                    {WEEKDAYS.map((d) => <option key={d} value={d}>{d}</option>)}
                  </select>
                  <input type="time" value={communityForm.cutOff2} onChange={(e) => setCommunityForm({ ...communityForm, cutOff2: e.target.value })} className="rounded-2xl border border-slate-300 px-4 py-2" />
                </div>
                <button disabled={creatingCommunity} type="submit" className="rounded-2xl bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-700 sm:col-span-2 disabled:opacity-60">
                  {creatingCommunity ? "Creating..." : "Create community"}
                </button>
              </form>
            </div>
          )}
        </section>
      )}

      {/* Deliveries Tab */}
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
                      <p className="mt-2 text-sm text-slate-600">Pooled orders: {delivery.totalOrders} • Amount: ₹{delivery.totalAmount}</p>
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
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div>
                      <p className="font-semibold text-slate-900">{delivery.community?.name || "Community"}</p>
                      <p className="text-sm text-slate-600">{delivery.deliveryDay} • {new Date(delivery.deliveryDate).toLocaleDateString()} • {delivery.deliveryStatus}</p>
                      {(delivery.truckNumber || delivery.driverName) && (
                        <p className="text-sm text-slate-500">Truck: {delivery.truckNumber || "—"} • Driver: {delivery.driverName || "—"} {delivery.driverPhone ? `(${delivery.driverPhone})` : ""}</p>
                      )}
                    </div>
                    <span className={`rounded-full px-3 py-1 text-sm font-medium ${
                      delivery.approvalStatus === "Approved" ? "bg-green-100 text-green-700" :
                      delivery.approvalStatus === "Rejected" ? "bg-red-100 text-red-700" :
                      "bg-yellow-100 text-yellow-700"
                    }`}>
                      {delivery.approvalStatus}
                    </span>
                  </div>

                  {delivery.approvalStatus === "Approved" && (
                    <div className="mt-3 flex flex-wrap items-center gap-2 border-t border-slate-200 pt-3">
                      <input
                        placeholder="Truck number"
                        defaultValue={delivery.truckNumber || ""}
                        onChange={(e) => setTruckForm({ ...truckForm, [delivery._id]: { ...truckForm[delivery._id], truckNumber: e.target.value } })}
                        className="rounded-xl border border-slate-300 px-3 py-1.5 text-sm"
                      />
                      <input
                        placeholder="Driver name"
                        defaultValue={delivery.driverName || ""}
                        onChange={(e) => setTruckForm({ ...truckForm, [delivery._id]: { ...truckForm[delivery._id], driverName: e.target.value } })}
                        className="rounded-xl border border-slate-300 px-3 py-1.5 text-sm"
                      />
                      <input
                        placeholder="Driver phone"
                        defaultValue={delivery.driverPhone || ""}
                        onChange={(e) => setTruckForm({ ...truckForm, [delivery._id]: { ...truckForm[delivery._id], driverPhone: e.target.value } })}
                        className="rounded-xl border border-slate-300 px-3 py-1.5 text-sm"
                      />
                      <button onClick={() => handleAssignTruck(delivery._id)} className="rounded-xl bg-slate-900 px-3 py-1.5 text-sm text-white hover:bg-slate-700">
                        Save truck details
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Users Tab (superAdmin only) */}
      {activeTab === "users" && isSuperAdmin && (
        <section className="rounded-3xl bg-white p-6 shadow-sm">
          <h2 className="text-xl font-semibold text-slate-900">Users</h2>
          <ul className="mt-4 space-y-3">
            {users.map((item) => (
              <li key={item._id} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <p className="font-semibold text-slate-900">{item.fullName}</p>
                <p className="text-sm text-slate-600">{item.email} • {item.role}</p>
                {item.role === "shopkeeper" && (
                  <p className="text-sm text-slate-500">Approval: {item.shopkeeperApprovalStatus}</p>
                )}
                {item.community && <p className="text-sm text-slate-500">Community: {item.community?.name || "Unknown"}</p>}
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* Shopkeeper approvals (superAdmin only) */}
      {activeTab === "shopkeepers" && isSuperAdmin && (
        <section className="rounded-3xl bg-white p-6 shadow-sm">
          <h2 className="text-xl font-semibold text-slate-900">Shopkeeper approvals</h2>
          <p className="mt-1 text-sm text-slate-600">Self-registered shopkeepers cannot list products until approved here.</p>
          <ul className="mt-4 space-y-3">
            {pendingShopkeepers.map((item) => (
              <li key={item._id} className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <div>
                  <p className="font-semibold text-slate-900">{item.fullName}</p>
                  <p className="text-sm text-slate-600">{item.email}</p>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => handleShopkeeperApproval(item._id, "Approved")} className="rounded-2xl bg-green-600 px-4 py-2 text-sm text-white hover:bg-green-500">
                    Approve
                  </button>
                  <button onClick={() => handleShopkeeperApproval(item._id, "Rejected")} className="rounded-2xl bg-red-600 px-4 py-2 text-sm text-white hover:bg-red-500">
                    Reject
                  </button>
                </div>
              </li>
            ))}
            {pendingShopkeepers.length === 0 && <p className="text-slate-600">No pending shopkeeper approvals.</p>}
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
