import { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext.jsx";
import { getDeliveries } from "../services/deliveryService.js";
import api from "../services/api.js";

const DeliveryTracking = () => {
  const { user } = useAuth();
  const [deliveries, setDeliveries] = useState([]);
  const [error, setError] = useState("");
  const [selectedDelivery, setSelectedDelivery] = useState(null);
  const [inventoryModal, setInventoryModal] = useState({ show: false, delivery: null, action: null, note: "" });
  const [statusModal, setStatusModal] = useState({ show: false, delivery: null, newStatus: null });

  const loadDeliveries = () => {
    getDeliveries()
      .then((resp) => setDeliveries(resp.deliveries))
      .catch(() => setError("Unable to load deliveries."));
  };

  useEffect(() => {
    loadDeliveries();
  }, []);

  const handleInventoryConfirmation = async (deliveryId, action, note) => {
    try {
      await api.patch(`/deliveries/${deliveryId}/inventory-confirmation`, { action, note });
      setError("");
      setInventoryModal({ show: false, delivery: null, action: null, note: "" });
      loadDeliveries();
    } catch (err) {
      setError(err.response?.data?.message || "Unable to process inventory confirmation.");
    }
  };

  const handleStatusUpdate = async (deliveryId, newStatus) => {
    try {
      await api.patch(`/deliveries/${deliveryId}/status`, { status: newStatus });
      setError("");
      setStatusModal({ show: false, delivery: null, newStatus: null });
      loadDeliveries();
    } catch (err) {
      setError(err.response?.data?.message || "Unable to update delivery status.");
    }
  };

  const canConfirmInventory = (delivery) => {
    return user?.role === "shopkeeper" && delivery.approvalStatus === "Approved" && delivery.shopkeeperApproval.status === "Pending";
  };

  const canUpdateStatus = (delivery) => {
    return ["communityAdmin", "superAdmin", "shopkeeper"].includes(user?.role) && delivery.approvalStatus === "Approved" && delivery.shopkeeperApproval.status === "Accepted";
  };

  const getNextStatusOptions = (currentStatus) => {
    const transitions = {
      Scheduled: ["Packed", "Cancelled"],
      Packed: ["Dispatched", "Cancelled"],
      Dispatched: ["Out for Delivery"],
      "Out for Delivery": ["Delivered"],
      Delivered: [],
      Cancelled: [],
    };
    return transitions[currentStatus] || [];
  };

  return (
    <div className="space-y-6">
      <div className="rounded-3xl bg-white p-6 shadow-sm">
        <h1 className="text-2xl font-semibold text-slate-900">Delivery tracking</h1>
        <p className="mt-2 text-slate-600">Monitor active and scheduled deliveries for your community.</p>
      </div>
      {error && <div className="rounded-3xl bg-rose-50 p-4 text-rose-700">{error}</div>}
      <div className="grid gap-6">
        {deliveries.length ? deliveries.map((delivery) => (
          <div key={delivery._id} className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <h2 className="text-lg font-semibold text-slate-900">{delivery.community?.name || "Community delivery"}</h2>
                <p className="text-sm text-slate-600">{delivery.deliveryDay} • {new Date(delivery.deliveryDate).toLocaleDateString()}</p>
              </div>
              <div className="flex gap-2">
                <span className={`rounded-full px-3 py-1 text-sm font-medium ${
                  delivery.deliveryStatus === "Delivered" ? "bg-green-100 text-green-700" :
                  delivery.deliveryStatus === "Cancelled" ? "bg-red-100 text-red-700" :
                  "bg-blue-100 text-blue-700"
                }`}>
                  {delivery.deliveryStatus}
                </span>
                <span className={`rounded-full px-3 py-1 text-sm font-medium ${
                  delivery.approvalStatus === "Approved" ? "bg-green-100 text-green-700" :
                  delivery.approvalStatus === "Rejected" ? "bg-red-100 text-red-700" :
                  "bg-yellow-100 text-yellow-700"
                }`}>
                  {delivery.approvalStatus}
                </span>
              </div>
            </div>
            <div className="mt-4 grid gap-3 text-slate-600 md:grid-cols-4">
              <div>
                <p className="text-xs text-slate-500">Orders</p>
                <p className="font-semibold text-slate-900">{delivery.totalOrders}</p>
              </div>
              <div>
                <p className="text-xs text-slate-500">Amount</p>
                <p className="font-semibold text-slate-900">₹{delivery.totalAmount}</p>
              </div>
              <div>
                <p className="text-xs text-slate-500">Truck</p>
                <p className="font-semibold text-slate-900">{delivery.truckNumber || "TBD"}</p>
              </div>
              <div>
                <p className="text-xs text-slate-500">Driver</p>
                <p className="font-semibold text-slate-900">{delivery.driverName || "TBD"}</p>
              </div>
            </div>

            {/* Inventory Confirmation Status */}
            {delivery.approvalStatus === "Approved" && (
              <div className="mt-4 rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-slate-900">Inventory Status</p>
                    <p className="text-xs text-slate-600">
                      {delivery.shopkeeperApproval.status === "Pending" 
                        ? "Awaiting shopkeeper confirmation" 
                        : `${delivery.shopkeeperApproval.status} by shopkeeper`}
                    </p>
                  </div>
                  {canConfirmInventory(delivery) && (
                    <div className="flex gap-2">
                      <button 
                        onClick={() => setInventoryModal({ show: true, delivery, action: "Accepted", note: "" })}
                        className="rounded-2xl bg-green-600 px-4 py-2 text-sm text-white hover:bg-green-500"
                      >
                        Accept Inventory
                      </button>
                      <button 
                        onClick={() => setInventoryModal({ show: true, delivery, action: "Rejected", note: "" })}
                        className="rounded-2xl bg-red-600 px-4 py-2 text-sm text-white hover:bg-red-500"
                      >
                        Reject Inventory
                      </button>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Status Update */}
            {canUpdateStatus(delivery) && getNextStatusOptions(delivery.deliveryStatus).length > 0 && (
              <div className="mt-4 flex gap-2">
                {getNextStatusOptions(delivery.deliveryStatus).map((status) => (
                  <button 
                    key={status}
                    onClick={() => setStatusModal({ show: true, delivery, newStatus: status })}
                    className="rounded-2xl border border-slate-300 px-4 py-2 text-sm text-slate-900 hover:bg-slate-50"
                  >
                    Mark as {status}
                  </button>
                ))}
              </div>
            )}

            <button 
              onClick={() => setSelectedDelivery(selectedDelivery?._id === delivery._id ? null : delivery)}
              className="mt-4 text-sm text-slate-600 hover:text-slate-900"
            >
              {selectedDelivery?._id === delivery._id ? "Hide details" : "Show details"}
            </button>

            {selectedDelivery?._id === delivery._id && (
              <div className="mt-4 rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <h3 className="font-semibold text-slate-900">Orders in this delivery</h3>
                <div className="mt-3 space-y-2 text-sm">
                  {delivery.orders?.length ? delivery.orders.map((order, idx) => (
                    <div key={idx} className="rounded-lg bg-white p-3">
                      <p className="font-medium text-slate-900">Order #{order._id?.slice(-6) || idx}</p>
                      <p className="text-xs text-slate-600">{order.user?.fullName} • ₹{order.totalAmount}</p>
                    </div>
                  )) : <p className="text-slate-600">No orders loaded</p>}
                </div>
              </div>
            )}
          </div>
        )) : (
          <div className="rounded-3xl bg-white p-6 shadow-sm">
            <p className="text-slate-600">No deliveries are available right now.</p>
          </div>
        )}
      </div>

      {/* Inventory Confirmation Modal */}
      {inventoryModal.show && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="rounded-3xl bg-white p-6 shadow-lg max-w-md w-full mx-4">
            <h3 className="text-xl font-semibold text-slate-900">
              {inventoryModal.action === "Accepted" ? "Accept" : "Reject"} Inventory?
            </h3>
            <p className="mt-2 text-slate-600">
              Confirm inventory for {inventoryModal.delivery?.community?.name || "Community"} delivery
            </p>
            <textarea
              value={inventoryModal.note}
              onChange={(e) => setInventoryModal({ ...inventoryModal, note: e.target.value })}
              placeholder="Add a note (optional)"
              className="mt-4 w-full rounded-2xl border border-slate-300 bg-slate-50 px-4 py-3 text-slate-900"
              rows="3"
            />
            <div className="mt-6 flex gap-3">
              <button onClick={() => setInventoryModal({ show: false, delivery: null, action: null, note: "" })} className="flex-1 rounded-2xl border border-slate-300 px-4 py-2 text-slate-900 hover:bg-slate-50">
                Cancel
              </button>
              <button onClick={() => handleInventoryConfirmation(inventoryModal.delivery._id, inventoryModal.action, inventoryModal.note)} className={`flex-1 rounded-2xl px-4 py-2 text-white ${
                inventoryModal.action === "Accepted" ? "bg-green-600 hover:bg-green-500" : "bg-red-600 hover:bg-red-500"
              }`}>
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Status Update Modal */}
      {statusModal.show && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="rounded-3xl bg-white p-6 shadow-lg max-w-md w-full mx-4">
            <h3 className="text-xl font-semibold text-slate-900">
              Update Delivery Status
            </h3>
            <p className="mt-2 text-slate-600">
              Mark this delivery as {statusModal.newStatus}?
            </p>
            <div className="mt-6 flex gap-3">
              <button onClick={() => setStatusModal({ show: false, delivery: null, newStatus: null })} className="flex-1 rounded-2xl border border-slate-300 px-4 py-2 text-slate-900 hover:bg-slate-50">
                Cancel
              </button>
              <button onClick={() => handleStatusUpdate(statusModal.delivery._id, statusModal.newStatus)} className="flex-1 rounded-2xl bg-blue-600 px-4 py-2 text-white hover:bg-blue-500">
                Update Status
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DeliveryTracking;
