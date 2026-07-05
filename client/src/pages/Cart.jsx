import { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext.jsx";
import { getCart, updateCartItem, removeFromCart, clearCart } from "../services/cartService.js";
import { placeOrder } from "../services/orderService.js";
import { getCommunity } from "../services/communityService.js";

const Cart = () => {
  const { user } = useAuth();
  const [cart, setCart] = useState(null);
  const [deliveryDays, setDeliveryDays] = useState([]);
  const [deliveryDay, setDeliveryDay] = useState("");
  const [message, setMessage] = useState("");

  const loadCart = () => {
    getCart().then((resp) => setCart(resp.cart)).catch(() => setMessage("Could not load cart."));
  };

  useEffect(() => {
    loadCart();
    if (user?.community) {
      getCommunity(user.community)
        .then((resp) => {
          const schedule = resp.community.deliverySchedule || [];
          setDeliveryDays(schedule);
          setDeliveryDay(schedule[0]?.day || "");
        })
        .catch(() => {});
    }
  }, [user]);

  const handleQuantity = async (productId, quantity) => {
    try {
      const resp = await updateCartItem(productId, quantity);
      setCart(resp.cart);
    } catch (err) {
      setMessage(err.response?.data?.message || "Unable to update cart.");
    }
  };

  const handleRemove = async (productId) => {
    try {
      const resp = await removeFromCart(productId);
      setCart(resp.cart);
    } catch (err) {
      setMessage(err.response?.data?.message || "Unable to remove item.");
    }
  };

  const handleOrder = async () => {
    try {
      await placeOrder(deliveryDay);
      setMessage("Order placed successfully.");
      loadCart();
    } catch (err) {
      setMessage(err.response?.data?.message || "Unable to place order.");
    }
  };

  const handleClear = async () => {
    try {
      const resp = await clearCart();
      setCart(resp.cart);
    } catch (err) {
      setMessage(err.response?.data?.message || "Unable to clear cart.");
    }
  };

  return (
    <div className="space-y-6">
      <div className="rounded-3xl bg-white p-6 shadow-sm">
        <h1 className="text-2xl font-semibold text-slate-900">Cart</h1>
        <p className="mt-2 text-slate-600">Review your items before checkout.</p>
      </div>
      {message && <div className="rounded-3xl bg-slate-100 p-4 text-slate-700">{message}</div>}
      <div className="rounded-3xl bg-white p-6 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <h2 className="text-xl font-semibold text-slate-900">Your items</h2>
          <button onClick={handleClear} className="rounded-2xl border border-slate-300 px-4 py-2 text-sm text-slate-900 hover:bg-slate-50">
            Clear cart
          </button>
        </div>
        {cart?.items.length ? (
          <div className="mt-6 space-y-4">
            {cart.items.map((item) => (
              <div key={item.product._id} className="grid gap-4 rounded-3xl border border-slate-200 p-4 md:grid-cols-[1fr_auto]">
                <div>
                  <h3 className="font-semibold text-slate-900">{item.product.name}</h3>
                  <p className="text-sm text-slate-600">₹{item.price} each</p>
                  <div className="mt-3 flex items-center gap-3">
                    <button onClick={() => handleQuantity(item.product._id, item.quantity - 1)} disabled={item.quantity <= 1} className="rounded-full border border-slate-300 px-3 py-1 text-sm hover:bg-slate-100">
                      -
                    </button>
                    <span>{item.quantity}</span>
                    <button onClick={() => handleQuantity(item.product._id, item.quantity + 1)} className="rounded-full border border-slate-300 px-3 py-1 text-sm hover:bg-slate-100">
                      +
                    </button>
                  </div>
                </div>
                <div className="flex flex-col items-start justify-between gap-3 text-right md:items-end">
                  <p className="font-semibold text-slate-900">₹{item.quantity * item.price}</p>
                  <button onClick={() => handleRemove(item.product._id)} className="rounded-2xl border border-rose-200 px-4 py-2 text-sm text-rose-600 hover:bg-rose-50">
                    Remove
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="mt-4 text-slate-600">Your cart is empty.</p>
        )}
        <div className="mt-8 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div className="space-y-3">
            <label className="block text-sm text-slate-700">Delivery day</label>
            <select value={deliveryDay} onChange={(e) => setDeliveryDay(e.target.value)} className="w-full rounded-2xl border border-slate-300 bg-slate-50 px-4 py-3 text-slate-900 md:w-72">
              {deliveryDays.map((item) => (
                <option key={item.day} value={item.day}>{item.day} ({item.cutOffTime})</option>
              ))}
            </select>
          </div>
          <div className="rounded-3xl bg-slate-50 p-4 text-slate-900">
            <p className="text-sm text-slate-500">Total</p>
            <p className="mt-2 text-3xl font-semibold">₹{cart?.totalAmount || 0}</p>
          </div>
        </div>
        <button onClick={handleOrder} disabled={!cart?.items.length} className="mt-6 w-full rounded-2xl bg-slate-900 px-5 py-3 text-white hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-60">
          Place order
        </button>
      </div>
    </div>
  );
};

export default Cart;
