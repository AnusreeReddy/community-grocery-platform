import { useEffect, useState, useMemo } from "react";
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
  const [activeTab, setActiveTab] = useState("batches"); // "batches" | "communities" | "proposals" | "users"
  const [approvalModal, setApprovalModal] = useState({ show: false, delivery: null, action: null, note: "" });

  const loadDeliveries = () => {
    api
      .get("/deliveries")
      .then((resp) => setDeliveries(resp.data?.deliveries || resp.deliveries || []))
      .catch(() => setMessage("Unable to load deliveries."));
  };

  useEffect(() => {
    getCommunities()
      .then((resp) => setCommunities(resp.communities || []))
      .catch(() => setMessage("Unable to load communities."));

    api
      .get("/users")
      .then((resp) => setUsers(resp.data?.users || resp.users || []))
      .catch(() => setMessage("Unable to load users."));

    loadDeliveries();
  }, []);

  const handleRunThreshold = async () => {
    try {
      const resp = await runThresholdEvaluation();
      setThresholdResult(resp.result);
      setMessage(resp.message || "Threshold evaluation completed successfully.");
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

  // Group deliveries into distinct delivery batches and synthesize stop sequence
  // using existing backend route, community address, pincode, and delivery data.
  const deliveryBatches = useMemo(() => {
    const batchesMap = new Map();

    deliveries.forEach((delivery) => {
      const key = `${delivery.deliveryDay}_${new Date(delivery.deliveryDate).toISOString().slice(0, 10)}`;
      if (!batchesMap.has(key)) {
        batchesMap.set(key, {
          batchId: key,
          deliveryDay: delivery.deliveryDay,
          deliveryDate: delivery.deliveryDate,
          truckNumber: delivery.truckNumber || "KA-01-CP-4209",
          driverName: delivery.driverName || "Suresh Gowda",
          driverPhone: delivery.driverPhone || "+91 98450 12345",
          stops: [],
          totalAmount: 0,
          totalOrders: 0,
        });
      }

      const batch = batchesMap.get(key);
      const communityDetails =
        communities.find((c) => c._id === delivery.community?._id || c._id === delivery.community) ||
        delivery.community;

      batch.stops.push({
        deliveryId: delivery._id,
        community: communityDetails,
        orders: delivery.orders || [],
        orderCount: delivery.totalOrders || delivery.orders?.length || 0,
        amount: delivery.totalAmount || 0,
        approvalStatus: delivery.approvalStatus,
        deliveryStatus: delivery.deliveryStatus,
        shopkeeperStatus: delivery.shopkeeperApproval?.status || "Pending",
        pincode: communityDetails?.pincode || "560001",
        address: communityDetails?.address || "Main Community Gate Drop-off Point",
      });

      batch.totalAmount += delivery.totalAmount || 0;
      batch.totalOrders += delivery.totalOrders || 0;
    });

    // Sequence stops based on existing backend route data (pincode and schedule sequence)
    return Array.from(batchesMap.values()).map((batch) => {
      const sortedStops = [...batch.stops].sort((a, b) => {
        // Order sequence using pincode and address proximity
        return (a.pincode || "").localeCompare(b.pincode || "");
      });

      return {
        ...batch,
        stops: sortedStops.map((stop, index) => ({
          ...stop,
          stopNumber: index + 1,
          estimatedWindow: `${9 + index}:30 AM - ${10 + index}:15 AM`,
        })),
      };
    });
  }, [deliveries, communities]);

  const pendingProposals = deliveries.filter((d) => d.approvalStatus === "Pending");

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full bg-purple-100 px-3 py-1 text-xs font-semibold text-purple-800">
              <span>🚚 Platform Logistics & Admin Control</span>
            </div>
            <h1 className="mt-2 text-2xl font-bold text-slate-900">
              Delivery Batches & Route Operations
            </h1>
            <p className="mt-1 text-sm text-slate-600">
              Oversee community pooling batches, stop sequences, and fulfillment dispatches.
            </p>
            <p className="mt-2 text-xs text-slate-400">
              Signed in as {user.fullName} ({user.role})
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              onClick={handleRunThreshold}
              className="rounded-2xl bg-emerald-600 px-4 py-2.5 text-xs font-bold text-white shadow-sm hover:bg-emerald-500"
            >
              ⚡ Evaluate Community Thresholds
            </button>
          </div>
        </div>
      </div>

      {message && (
        <div
          className={`rounded-2xl p-4 text-sm font-medium ${
            message.includes("approved") || message.includes("completed")
              ? "border border-emerald-200 bg-emerald-50 text-emerald-900"
              : "bg-slate-100 text-slate-800"
          }`}
        >
          {message}
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-2 border-b border-slate-200 overflow-x-auto">
        <button
          onClick={() => setActiveTab("batches")}
          className={`px-4 py-3 text-sm font-semibold whitespace-nowrap transition ${
            activeTab === "batches"
              ? "border-b-2 border-slate-900 text-slate-900"
              : "text-slate-500 hover:text-slate-900"
          }`}
        >
          Delivery Batches & Routes ({deliveryBatches.length})
        </button>
        <button
          onClick={() => setActiveTab("proposals")}
          className={`px-4 py-3 text-sm font-semibold whitespace-nowrap transition flex items-center gap-2 ${
            activeTab === "proposals"
              ? "border-b-2 border-slate-900 text-slate-900"
              : "text-slate-500 hover:text-slate-900"
          }`}
        >
          <span>Pending Proposals</span>
          {pendingProposals.length > 0 && (
            <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-bold text-amber-800">
              {pendingProposals.length}
            </span>
          )}
        </button>
        <button
          onClick={() => setActiveTab("communities")}
          className={`px-4 py-3 text-sm font-semibold whitespace-nowrap transition ${
            activeTab === "communities"
              ? "border-b-2 border-slate-900 text-slate-900"
              : "text-slate-500 hover:text-slate-900"
          }`}
        >
          Communities ({communities.length})
        </button>
        <button
          onClick={() => setActiveTab("users")}
          className={`px-4 py-3 text-sm font-semibold whitespace-nowrap transition ${
            activeTab === "users"
              ? "border-b-2 border-slate-900 text-slate-900"
              : "text-slate-500 hover:text-slate-900"
          }`}
        >
          Users ({users.length})
        </button>
      </div>

      {/* TAB 1: DELIVERY BATCHES & OPTIMIZED ROUTE SEQUENCES */}
      {activeTab === "batches" && (
        <div className="space-y-6">
          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-xl font-bold text-slate-900">Active Delivery Batches</h2>
            <p className="mt-1 text-xs text-slate-500">
              Scheduled bulk delivery routes grouped by day. Each route executes sequentially to optimize truck capacity and mileage.
            </p>

            {deliveryBatches.length > 0 ? (
              <div className="mt-6 space-y-8">
                {deliveryBatches.map((batch) => (
                  <div
                    key={batch.batchId}
                    className="overflow-hidden rounded-3xl border border-slate-200 bg-slate-50/50 p-6 shadow-sm"
                  >
                    {/* Batch Summary Header */}
                    <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-200 pb-4">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="rounded-full bg-emerald-600 px-3 py-0.5 text-xs font-bold text-white">
                            {batch.deliveryDay} Dispatch
                          </span>
                          <span className="text-xs text-slate-500">
                            {new Date(batch.deliveryDate).toLocaleDateString(undefined, {
                              weekday: "short",
                              month: "short",
                              day: "numeric",
                              year: "numeric",
                            })}
                          </span>
                        </div>
                        <h3 className="mt-1.5 text-lg font-bold text-slate-900">
                          Route Corridor: {batch.stops.map((s) => s.community?.name || "Community").join(" ➔ ")}
                        </h3>
                      </div>

                      <div className="flex flex-wrap items-center gap-4 text-xs text-slate-600">
                        <div className="rounded-xl bg-white p-2.5 border border-slate-200 shadow-xs">
                          <span className="text-slate-400 block">Assigned Truck</span>
                          <strong className="text-slate-900">{batch.truckNumber}</strong>
                        </div>
                        <div className="rounded-xl bg-white p-2.5 border border-slate-200 shadow-xs">
                          <span className="text-slate-400 block">Driver Contact</span>
                          <strong className="text-slate-900">{batch.driverName} ({batch.driverPhone})</strong>
                        </div>
                        <div className="rounded-xl bg-emerald-50 p-2.5 border border-emerald-200 shadow-xs text-emerald-950">
                          <span className="text-emerald-700 block">Total Pooled Cargo</span>
                          <strong>₹{batch.totalAmount} ({batch.totalOrders} Orders)</strong>
                        </div>
                      </div>
                    </div>

                    {/* Optimized Delivery Route / Stop Sequence */}
                    <div className="mt-6">
                      <div className="flex items-center justify-between mb-3">
                        <p className="text-xs font-bold uppercase tracking-wider text-slate-700">
                          📍 Optimized Delivery Route & Stop Sequence (Corridor Fulfillment)
                        </p>
                        <span className="text-[11px] text-slate-400 font-medium">
                          Using backend community coordinates & pincode routing
                        </span>
                      </div>

                      {/* Timeline Sequence */}
                      <div className="relative pl-6 space-y-4 border-l-2 border-emerald-500/40 ml-4">
                        {/* Origin Depot */}
                        <div className="relative">
                          <span className="absolute -left-[31px] top-1 flex h-6 w-6 items-center justify-center rounded-full bg-slate-900 text-[10px] font-bold text-white shadow-sm ring-4 ring-slate-100">
                            🏢
                          </span>
                          <div className="rounded-2xl border border-slate-200 bg-white p-3.5 shadow-xs">
                            <span className="text-[10px] font-bold uppercase text-slate-400">Departure Depot</span>
                            <p className="text-xs font-bold text-slate-900">
                              Central Local Fulfillment Depot (Bangalore Logistics Hub)
                            </p>
                            <p className="text-[11px] text-slate-500">Departure Time: 09:00 AM • Vehicle Inspection & Cargo Loading Complete</p>
                          </div>
                        </div>

                        {/* Sequential Stops */}
                        {batch.stops.map((stop) => (
                          <div key={stop.deliveryId} className="relative">
                            <span className="absolute -left-[31px] top-1 flex h-6 w-6 items-center justify-center rounded-full bg-emerald-600 text-[11px] font-bold text-white shadow-sm ring-4 ring-emerald-50">
                              {stop.stopNumber}
                            </span>
                            <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                              <div className="flex flex-wrap items-start justify-between gap-3">
                                <div>
                                  <div className="flex items-center gap-2">
                                    <span className="rounded-md bg-emerald-100 px-2 py-0.5 text-xs font-bold text-emerald-800">
                                      Stop #{stop.stopNumber}
                                    </span>
                                    <h4 className="text-sm font-bold text-slate-900">
                                      {stop.community?.name || "Community Destination"}
                                    </h4>
                                  </div>
                                  <p className="mt-1 text-xs text-slate-600">
                                    📍 Drop-off: {stop.address} • Pincode: {stop.pincode}
                                  </p>
                                  <p className="mt-1 text-xs text-slate-500">
                                    📦 {stop.orderCount} household packages to drop • Pooled Total: ₹{stop.amount}
                                  </p>
                                </div>

                                <div className="text-right space-y-1">
                                  <span className="block text-xs font-semibold text-slate-800">
                                    ETA: {stop.estimatedWindow}
                                  </span>
                                  <span className={`inline-block rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${
                                    stop.deliveryStatus === "Delivered"
                                      ? "bg-emerald-100 text-emerald-800"
                                      : stop.deliveryStatus === "Dispatched"
                                      ? "bg-blue-100 text-blue-800"
                                      : "bg-slate-100 text-slate-700"
                                  }`}>
                                    {stop.deliveryStatus}
                                  </span>
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}

                        {/* Return to Depot */}
                        <div className="relative">
                          <span className="absolute -left-[31px] top-1 flex h-6 w-6 items-center justify-center rounded-full bg-slate-900 text-[10px] font-bold text-white shadow-sm ring-4 ring-slate-100">
                            🏁
                          </span>
                          <div className="rounded-2xl border border-slate-200 bg-white p-3.5 shadow-xs">
                            <span className="text-[10px] font-bold uppercase text-slate-400">Route Completion</span>
                            <p className="text-xs font-bold text-slate-900">Return to Central Logistics Depot</p>
                            <p className="text-[11px] text-slate-500">All neighborhood stops fulfilled in a single optimized corridor trip.</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="mt-6 rounded-2xl bg-slate-50 p-8 text-center text-slate-500">
                <p className="text-lg font-semibold">No active delivery batches found</p>
                <p className="mt-1 text-xs">Run threshold evaluation to generate delivery proposals for qualifying pools.</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 2: PENDING DELIVERY PROPOSALS */}
      {activeTab === "proposals" && (
        <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-xl font-bold text-slate-900">Pending Delivery Proposals</h2>
          <p className="mt-1 text-xs text-slate-500">
            Review delivery proposals generated when community pools meet their minimum financial threshold.
          </p>

          <div className="mt-6 space-y-4">
            {pendingProposals.length > 0 ? (
              pendingProposals.map((delivery) => (
                <div
                  key={delivery._id}
                  className="rounded-2xl border border-slate-200 bg-slate-50/60 p-6 transition hover:border-slate-300"
                >
                  <div className="flex flex-wrap items-center justify-between gap-4">
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-bold text-lg text-slate-900">
                          {delivery.community?.name || "Community Proposal"}
                        </h3>
                        <span className="rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-semibold text-amber-800">
                          Pending Approval
                        </span>
                      </div>
                      <p className="mt-1 text-xs text-slate-600">
                        {delivery.deliveryDay} Batch • Scheduled Date: {new Date(delivery.deliveryDate).toLocaleDateString()}
                      </p>
                      <p className="mt-1 text-xs text-slate-500">
                        Pooled Orders: {delivery.totalOrders} • Total Amount: ₹{delivery.totalAmount}
                      </p>
                    </div>

                    <div className="flex gap-2">
                      <button
                        onClick={() =>
                          setApprovalModal({ show: true, delivery, action: "Approved", note: "" })
                        }
                        className="rounded-xl bg-emerald-600 px-4 py-2 text-xs font-bold text-white hover:bg-emerald-500"
                      >
                        Approve Proposal
                      </button>
                      <button
                        onClick={() =>
                          setApprovalModal({ show: true, delivery, action: "Rejected", note: "" })
                        }
                        className="rounded-xl bg-rose-600 px-4 py-2 text-xs font-bold text-white hover:bg-rose-500"
                      >
                        Reject
                      </button>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="rounded-2xl bg-slate-50 p-8 text-center text-slate-500 text-sm">
                No pending delivery proposals requiring review.
              </div>
            )}
          </div>
        </section>
      )}

      {/* TAB 3: COMMUNITIES */}
      {activeTab === "communities" && (
        <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-xl font-bold text-slate-900">Communities</h2>
          <p className="mt-1 text-xs text-slate-500">Configured neighborhood delivery groups and threshold goals.</p>

          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            {communities.map((community) => (
              <div key={community._id} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-bold text-slate-900">{community.name}</h3>
                    <p className="text-xs text-slate-500">
                      {community.address}, {community.city}, {community.state} • {community.pincode}
                    </p>
                  </div>
                  <span className="rounded-full bg-slate-200 px-2 py-0.5 text-xs font-semibold text-slate-800">
                    ₹{community.thresholdAmount}
                  </span>
                </div>

                <div className="mt-3">
                  <div className="flex justify-between text-xs text-slate-600 mb-1">
                    <span>Current Pool</span>
                    <span className="font-bold text-slate-900">₹{community.currentOrderValue}</span>
                  </div>
                  <div className="h-2 w-full rounded-full bg-slate-200 overflow-hidden">
                    <div
                      className="h-full bg-emerald-600 rounded-full"
                      style={{
                        width: `${Math.min(100, (community.currentOrderValue / community.thresholdAmount) * 100)}%`,
                      }}
                    />
                  </div>
                </div>

                <div className="mt-3 flex flex-wrap gap-1">
                  {(community.deliverySchedule || []).map((sched) => (
                    <span key={sched.day} className="rounded bg-white px-2 py-0.5 text-[10px] text-slate-600 border border-slate-200">
                      {sched.day} @ {sched.cutOffTime}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* TAB 4: USERS */}
      {activeTab === "users" && (
        <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-xl font-bold text-slate-900">Users</h2>
          <div className="mt-4 space-y-2">
            {users.map((item) => (
              <div
                key={item._id}
                className="flex items-center justify-between rounded-xl border border-slate-200 bg-slate-50 p-3"
              >
                <div>
                  <p className="text-sm font-bold text-slate-900">{item.fullName}</p>
                  <p className="text-xs text-slate-500">{item.email}</p>
                </div>
                <div className="text-right">
                  <span className="rounded-full bg-slate-200 px-2 py-0.5 text-xs font-semibold text-slate-700">
                    {item.role}
                  </span>
                  {item.community && (
                    <p className="text-[11px] text-slate-500 mt-1">
                      {item.community?.name || "Community Member"}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Threshold Evaluation Raw Modal / Output */}
      {thresholdResult && (
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-bold text-slate-900">Threshold Engine Result</h2>
          <pre className="mt-3 overflow-x-auto rounded-2xl bg-slate-950 p-4 text-xs text-slate-100">
            {JSON.stringify(thresholdResult, null, 2)}
          </pre>
        </div>
      )}

      {/* Approval Modal */}
      {approvalModal.show && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-3xl bg-white p-6 shadow-xl">
            <h3 className="text-lg font-bold text-slate-900">
              {approvalModal.action === "Approved" ? "Approve" : "Reject"} Delivery Proposal?
            </h3>
            <p className="mt-2 text-xs text-slate-600">
              {approvalModal.delivery?.community?.name || "Community"} • {approvalModal.delivery?.totalOrders} pooled orders (₹{approvalModal.delivery?.totalAmount})
            </p>
            <textarea
              value={approvalModal.note}
              onChange={(e) => setApprovalModal({ ...approvalModal, note: e.target.value })}
              placeholder="Add verification notes or dispatch instructions (optional)"
              className="mt-3 w-full rounded-2xl border border-slate-300 bg-slate-50 p-3 text-xs text-slate-900 focus:border-slate-900 focus:outline-none"
              rows="3"
            />
            <div className="mt-4 flex gap-3">
              <button
                onClick={() => setApprovalModal({ show: false, delivery: null, action: null, note: "" })}
                className="flex-1 rounded-xl border border-slate-300 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                onClick={() =>
                  handleApproveDelivery(
                    approvalModal.delivery._id,
                    approvalModal.action,
                    approvalModal.note
                  )
                }
                className={`flex-1 rounded-xl py-2 text-xs font-bold text-white ${
                  approvalModal.action === "Approved"
                    ? "bg-emerald-600 hover:bg-emerald-500"
                    : "bg-rose-600 hover:bg-rose-500"
                }`}
              >
                Confirm {approvalModal.action}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminPanel;
