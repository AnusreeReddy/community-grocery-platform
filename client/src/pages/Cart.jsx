import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import { getCart, updateCartItem, removeFromCart, clearCart } from "../services/cartService.js";
import { placeOrder } from "../services/orderService.js";
import { getBatches, getBestDeliveryDay } from "../services/communityService.js";

const Cart = () => {
  const { user } = useAuth();
  const communityId = user?.community?._id || user?.community || null;

  const [cart, setCart] = useState(null);
  const [batches, setBatches] = useState([]);
  const [deliveryDay, setDeliveryDay] = useState("");
  const [message, setMessage] = useState("");
  const [bestDay, setBestDay] = useState(null);
  const [placing, setPlacing] = useState(false);

  const loadCart = () => {
    getCart().then((resp) => setCart(resp.cart)).catch(() => setMessage("Could not load cart."));
  };

  const loadBatches = () => {
    if (!communityId) return;
    getBatches(communityId)
      .then((resp) => {
        setBatches(resp.batches);
        // Default to the first batch that's still open for ordering.
        setDeliveryDay((current) => {
          if (current && resp.batches.some((b) => b.deliveryDay === current && !b.cutoffPassed)) return current;
          return resp.batches.find((b) => !b.cutoffPassed)?.deliveryDay || resp.batches[0]?.deliveryDay || "";
        });
      })
      .catch(() => {});
  };

  useEffect(() => {
    loadCart();
    loadBatches();
    if (communityId) {
      getBestDeliveryDay(communityId).then((resp) => setBestDay(resp.recommendation)).catch(() => {});
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [communityId]);

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
    if (!deliveryDay) {
      setMessage("Choose a delivery batch first.");
      return;
    }
    setPlacing(true);
    try {
      await placeOrder(deliveryDay);
      setMessage("Order placed. It's now pooled with this batch's other orders.");
      loadCart();
      loadBatches();
    } catch (err) {
      setMessage(err.response?.data?.message || "Unable to place order.");
    } finally {
      setPlacing(false);
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

  if (user?.role === "customer" && !communityId) {
    return (
      <div className="rounded-3xl bg-white p-10 text-center shadow-sm">
        <h1 className="text-2xl font-semibold text-slate-900">Join a community first</h1>
        <p className="mx-auto mt-3 max-w-md text-slate-600">Your cart and delivery batches are tied to a community.</p>
        <Link to="/communities" className="mt-6 inline-flex rounded-2xl bg-slate-900 px-5 py-3 text-white hover:bg-slate-700">
          Browse communities
        </Link>
      </div>
    );
  }

  const selectedBatch = batches.find((b) => b.deliveryDay === deliveryDay);
  const projectedTotal = (selectedBatch?.totalAmount || 0) + (cart?.totalAmount || 0);
  const projectedPercent = selectedBatch?.thresholdAmount
    ? Math.min(100, Math.round((projectedTotal / selectedBatch.thresholdAmount) * 100))
    : 0;

  return (
    <div className="space-y-6">
      <div className="rounded-3xl bg-white p-6 shadow-sm">
        <h1 className="text-2xl font-semibold text-slate-900">Cart</h1>
        <p className="mt-2 text-slate-600">Review your items, then choose a delivery batch to pool your order into.</p>
      </div>
      {message && <div className="rounded-3xl bg-slate-100 p-4 text-slate-700">{message}</div>}

      {bestDay?.recommendedDeliveryDay && (
        <div className="rounded-3xl bg-gradient-to-r from-blue-50 to-cyan-50 border border-blue-200 p-4 shadow-sm">
          <p className="text-sm font-medium text-blue-900">💡 Recommended delivery day</p>
          <p className="mt-1 text-lg font-semibold text-blue-700">{bestDay.recommendedDeliveryDay}</p>
          <p className="text-xs text-blue-600 mt-2">{bestDay.rationale}</p>
        </div>
      )}

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

        <div className="mt-8">
          <h3 className="text-lg font-semibold text-slate-900">Choose a delivery batch</h3>
          <p className="mt-1 text-sm text-slate-600">
            Your order pools with everyone else's for the same day. A delivery is only scheduled once a batch's pooled
            total reaches the community threshold.
          </p>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            {batches.map((batch) => {
              const selected = deliveryDay === batch.deliveryDay;
              const disabled = batch.cutoffPassed;
              return (
                <button
                  type="button"
                  key={batch.deliveryDay}
                  disabled={disabled}
                  onClick={() => setDeliveryDay(batch.deliveryDay)}
                  className={`rounded-2xl border p-4 text-left transition disabled:cursor-not-allowed disabled:opacity-50 ${
                    selected ? "border-slate-900 bg-slate-900 text-white" : "border-slate-200 bg-slate-50 text-slate-900 hover:border-slate-400"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-semibold">{batch.deliveryDay}</span>
                    <span className={`text-xs ${selected ? "text-slate-200" : "text-slate-500"}`}>
                      {new Date(batch.deliveryDate).toLocaleDateString()}
                    </span>
                  </div>
                  <p className={`mt-1 text-xs ${selected ? "text-slate-200" : "text-slate-500"}`}>
                    Cutoff {batch.cutOffTime} {disabled ? "· closed for this cycle" : ""}
                  </p>
                  <div className={`mt-3 h-2 w-full overflow-hidden rounded-full ${selected ? "bg-white/20" : "bg-slate-200"}`}>
                    <div
                      className={`h-full rounded-full ${batch.thresholdReached ? "bg-green-500" : selected ? "bg-white" : "bg-slate-900"}`}
                      style={{ width: `${batch.percentToThreshold}%` }}
                    />
                  </div>
                  <p className={`mt-2 text-xs ${selected ? "text-slate-200" : "text-slate-600"}`}>
                    ₹{batch.totalAmount} / ₹{batch.thresholdAmount} pooled ({batch.orderCount} order{batch.orderCount === 1 ? "" : "s"})
                    {batch.thresholdReached ? " · threshold reached" : ""}
                  </p>
                  {batch.maxBatchAmount && (
                    <p className={`text-xs ${selected ? "text-slate-300" : "text-slate-400"}`}>Batch cap ₹{batch.maxBatchAmount}</p>
                  )}
                </button>
              );
            })}
            {batches.length === 0 && <p className="text-sm text-slate-500">No delivery batches configured for this community.</p>}
          </div>
          {selectedBatch && cart?.items.length > 0 && (
            <p className="mt-3 text-sm text-slate-600">
              Adding your order would bring this batch to ₹{projectedTotal} ({projectedPercent}% of threshold).
            </p>
          )}
        </div>

        <div className="mt-8 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div className="rounded-3xl bg-slate-50 p-4 text-slate-900">
            <p className="text-sm text-slate-500">Total</p>
            <p className="mt-2 text-3xl font-semibold">₹{cart?.totalAmount || 0}</p>
          </div>
        </div>
        <button
          onClick={handleOrder}
          disabled={!cart?.items.length || placing || !deliveryDay || selectedBatch?.cutoffPassed}
          className="mt-6 w-full rounded-2xl bg-slate-900 px-5 py-3 text-white hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {placing ? "Placing order..." : "Place order"}
        </button>
      </div>
    </div>
  );
};

export default Cart;
