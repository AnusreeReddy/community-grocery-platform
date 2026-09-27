import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { getOrders, cancelOrder } from "../services/orderService.js";

const Orders = () => {
  const [orders, setOrders] = useState([]);
  const [message, setMessage] = useState("");

  const loadOrders = () => {
    getOrders()
      .then((resp) => setOrders(resp.orders || []))
      .catch(() => setMessage("Could not load your pooled orders."));
  };

  useEffect(() => {
    loadOrders();
  }, []);

  const handleCancel = async (id) => {
    try {
      await cancelOrder(id);
      setMessage("✓ Order cancelled from community pool.");
      loadOrders();
    } catch (err) {
      setMessage(err.response?.data?.message || "Unable to cancel order.");
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case "Delivered":
        return "bg-emerald-100 text-emerald-800 border-emerald-200";
      case "Confirmed":
      case "Packed":
        return "bg-blue-100 text-blue-800 border-blue-200";
      case "Out for Delivery":
        return "bg-purple-100 text-purple-800 border-purple-200";
      case "Cancelled":
        return "bg-rose-100 text-rose-800 border-rose-200";
      default:
        return "bg-amber-100 text-amber-800 border-amber-200";
    }
  };

  return (
    <div className="space-y-6">
      <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-800">
              <span>📦 Household Order Tracking</span>
            </div>
            <h1 className="mt-2 text-2xl font-bold text-slate-900">Your Pooled Orders</h1>
            <p className="mt-1 text-sm text-slate-600">
              Monitor your community delivery batches, fulfillment progress, and drop-off status.
            </p>
          </div>
          <Link
            to="/products"
            className="rounded-2xl bg-slate-900 px-4 py-2.5 text-xs font-semibold text-white hover:bg-slate-700"
          >
            + Add Items to Next Batch
          </Link>
        </div>
      </div>

      {message && (
        <div
          className={`rounded-2xl p-4 text-sm font-medium ${
            message.startsWith("✓")
              ? "border border-emerald-200 bg-emerald-50 text-emerald-800"
              : "bg-slate-100 text-slate-800"
          }`}
        >
          {message}
        </div>
      )}

      <div className="space-y-4">
        {orders.length ? (
          orders.map((order) => (
            <div
              key={order._id}
              className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm transition hover:shadow-md"
            >
              <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-100 pb-4">
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-lg font-bold text-slate-900">
                      Order #{order._id.slice(-6)}
                    </h2>
                    <span
                      className={`rounded-full border px-2.5 py-0.5 text-xs font-semibold ${getStatusBadge(
                        order.status
                      )}`}
                    >
                      {order.status}
                    </span>
                  </div>
                  <p className="mt-1 text-xs text-slate-500">
                    Community: <strong className="text-slate-700">{order.community?.name || "Local Pool"}</strong> • Scheduled Batch: <strong className="text-slate-700">{order.deliveryDay}</strong>
                  </p>
                </div>

                <div className="text-right">
                  <span className="text-xs text-slate-500 block">Total Amount</span>
                  <p className="text-xl font-extrabold text-slate-900">₹{order.totalAmount}</p>
                </div>
              </div>

              {/* Items List */}
              <div className="mt-4 grid gap-2 sm:grid-cols-2">
                {order.items.map((item, idx) => (
                  <div
                    key={item.product?._id || idx}
                    className="flex items-center justify-between rounded-2xl bg-slate-50 p-3 text-xs"
                  >
                    <div className="flex items-center gap-2.5">
                      <span className="text-base">🛒</span>
                      <div>
                        <span className="font-semibold text-slate-900">{item.product?.name || "Grocery Item"}</span>
                        <span className="text-slate-500 block">Qty: {item.quantity}</span>
                      </div>
                    </div>
                    <span className="font-bold text-slate-900">
                      ₹{(item.price || 0) * (item.quantity || 1)}
                    </span>
                  </div>
                ))}
              </div>

              {/* Footer with Payment info & Cancel option */}
              <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 pt-4 text-xs">
                <div className="flex items-center gap-4 text-slate-600">
                  <span>
                    Payment: <strong className="text-slate-800">{order.paymentMethod || "Cash on Delivery"}</strong>
                  </span>
                  <span>•</span>
                  <span>Delivery: <strong>Zero Fee (Community Pooled)</strong></span>
                </div>

                {order.status === "Pending" && (
                  <button
                    onClick={() => handleCancel(order._id)}
                    className="rounded-xl border border-rose-200 px-3 py-1.5 font-semibold text-rose-600 hover:bg-rose-50"
                  >
                    Cancel Pooled Order
                  </button>
                )}
              </div>
            </div>
          ))
        ) : (
          <div className="rounded-3xl border border-slate-200 bg-white p-12 text-center shadow-sm">
            <p className="text-3xl">🧺</p>
            <p className="mt-2 text-base font-bold text-slate-800">No pooled orders yet</p>
            <p className="mt-1 text-xs text-slate-500">
              When you add items to your active community cycle, they will appear here.
            </p>
            <Link
              to="/products"
              className="mt-4 inline-block rounded-2xl bg-slate-900 px-5 py-2.5 text-xs font-bold text-white hover:bg-slate-700"
            >
              Browse Community Catalog
            </Link>
          </div>
        )}
      </div>
    </div>
  );
};

export default Orders;
