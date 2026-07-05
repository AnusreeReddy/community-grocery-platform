import { useEffect, useState } from "react";
import { getOrders, cancelOrder } from "../services/orderService.js";

const Orders = () => {
  const [orders, setOrders] = useState([]);
  const [message, setMessage] = useState("");

  const loadOrders = () => {
    getOrders().then((resp) => setOrders(resp.orders)).catch(() => setMessage("Could not load orders."));
  };

  useEffect(() => {
    loadOrders();
  }, []);

  const handleCancel = async (id) => {
    try {
      await cancelOrder(id);
      setMessage("Order cancelled.");
      loadOrders();
    } catch (err) {
      setMessage(err.response?.data?.message || "Unable to cancel order.");
    }
  };

  return (
    <div className="space-y-6">
      <div className="rounded-3xl bg-white p-6 shadow-sm">
        <h1 className="text-2xl font-semibold text-slate-900">Orders</h1>
        <p className="mt-2 text-slate-600">Track your order history and status updates.</p>
      </div>
      {message && <div className="rounded-3xl bg-slate-100 p-4 text-slate-700">{message}</div>}
      <div className="space-y-4">
        {orders.length ? orders.map((order) => (
          <div key={order._id} className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <h2 className="text-lg font-semibold text-slate-900">Order #{order._id.slice(-6)}</h2>
                <p className="text-sm text-slate-600">{order.deliveryDay} • {order.status}</p>
              </div>
              <p className="text-xl font-semibold text-slate-900">₹{order.totalAmount}</p>
            </div>
            <div className="mt-4 grid gap-2">
              {order.items.map((item) => (
                <div key={item.product._id} className="flex items-center justify-between rounded-2xl bg-slate-50 p-3">
                  <span>{item.product.name} x {item.quantity}</span>
                  <span>₹{item.price * item.quantity}</span>
                </div>
              ))}
            </div>
            {order.status === "Pending" && (
              <button onClick={() => handleCancel(order._id)} className="mt-4 rounded-2xl bg-rose-600 px-4 py-2 text-white hover:bg-rose-500">
                Cancel order
              </button>
            )}
          </div>
        )) : (
          <div className="rounded-3xl bg-white p-6 shadow-sm">
            <p className="text-slate-600">No orders yet.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Orders;
