import { useEffect, useState, useMemo } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import { getCart, updateCartItem, removeFromCart, clearCart } from "../services/cartService.js";
import { placeOrder } from "../services/orderService.js";
import { getCommunity } from "../services/communityService.js";
import api from "../services/api.js";

const WEEKDAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

const getNextBatchDate = (dayName) => {
  if (!dayName) return new Date();
  const targetDay = WEEKDAYS.indexOf(dayName);
  if (targetDay === -1) return new Date();
  const date = new Date();
  const currentDay = date.getDay();
  let diff = targetDay - currentDay;
  if (diff <= 0) diff += 7;
  date.setDate(date.getDate() + diff);
  return date;
};

const Cart = () => {
  const { user } = useAuth();
  const [cart, setCart] = useState(null);
  const [community, setCommunity] = useState(null);
  const [deliveryDays, setDeliveryDays] = useState([]);
  const [deliveryDay, setDeliveryDay] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("Cash on Delivery");
  const [message, setMessage] = useState("");
  const [orderSuccess, setOrderSuccess] = useState(null);
  const [bestDay, setBestDay] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const loadCart = () => {
    getCart()
      .then((resp) => setCart(resp.cart))
      .catch(() => setMessage("Could not load pool items."));
  };

  useEffect(() => {
    loadCart();
    if (user?.community) {
      getCommunity(user.community)
        .then((resp) => {
          setCommunity(resp.community);
          const schedule = resp.community.deliverySchedule || [];
          setDeliveryDays(schedule);
          if (schedule.length > 0) {
            setDeliveryDay(schedule[0].day);
          }
        })
        .catch(() => {});

      // Load best delivery day recommendation
      api
        .get(`/communities/${user.community}/best-delivery-day`)
        .then((resp) => setBestDay(resp.data.recommendation))
        .catch(() => {});
    }
  }, [user]);

  const activeSchedule = useMemo(() => {
    return deliveryDays.find((d) => d.day === deliveryDay) || deliveryDays[0] || null;
  }, [deliveryDays, deliveryDay]);

  const calculatedBatchDate = useMemo(() => {
    return activeSchedule ? getNextBatchDate(activeSchedule.day) : null;
  }, [activeSchedule]);

  const handleQuantity = async (productId, quantity) => {
    try {
      const resp = await updateCartItem(productId, quantity);
      setCart(resp.cart);
    } catch (err) {
      setMessage(err.response?.data?.message || "Unable to update item quantity.");
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

  const handleClear = async () => {
    try {
      const resp = await clearCart();
      setCart(resp.cart);
    } catch (err) {
      setMessage(err.response?.data?.message || "Unable to clear items.");
    }
  };

  const handleOrder = async () => {
    if (!deliveryDay) {
      setMessage("Please select a delivery day batch.");
      return;
    }

    setSubmitting(true);
    setMessage("");
    try {
      const resp = await placeOrder(deliveryDay, paymentMethod);
      setOrderSuccess(resp.order);
      setMessage("🎉 Your order has been pooled into the active community delivery batch!");
      loadCart();
    } catch (err) {
      setMessage(err.response?.data?.message || "Unable to place pooled order.");
    } finally {
      setSubmitting(false);
    }
  };

  // Calculations for pooling threshold
  const currentPoolValue = community?.currentOrderValue || 0;
  const thresholdAmount = community?.thresholdAmount || 1000;
  const orderAmount = cart?.totalAmount || 0;
  const projectedPoolValue = currentPoolValue + orderAmount;
  const currentPercent = Math.min(100, Math.round((currentPoolValue / thresholdAmount) * 100));
  const projectedPercent = Math.min(100, Math.round((projectedPoolValue / thresholdAmount) * 100));
  const remainingNeeded = Math.max(0, thresholdAmount - projectedPoolValue);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-800">
              <span>🛒 Community Pool Checkout</span>
            </div>
            <h1 className="mt-2 text-2xl font-bold text-slate-900">Your Pooled Grocery Order</h1>
            <p className="mt-1 text-sm text-slate-600">
              Items added here are grouped with your neighbors' orders to meet the community batch threshold.
            </p>
          </div>

          {community && (
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3 text-right">
              <span className="text-xs uppercase text-slate-500 font-medium">Delivering To</span>
              <p className="text-sm font-bold text-slate-900">{community.name}</p>
              <p className="text-xs text-slate-600">{community.city} ({community.pincode})</p>
            </div>
          )}
        </div>
      </div>

      {message && (
        <div
          className={`rounded-2xl p-4 text-sm font-medium ${
            message.includes("🎉")
              ? "border border-emerald-200 bg-emerald-50 text-emerald-900"
              : "bg-slate-100 text-slate-800"
          }`}
        >
          {message}
        </div>
      )}

      {orderSuccess && (
        <div className="rounded-3xl border border-emerald-200 bg-emerald-50/70 p-6">
          <div className="flex items-center gap-3">
            <span className="text-2xl">📦</span>
            <div>
              <h2 className="text-lg font-bold text-emerald-950">
                Order Pooled Successfully!
              </h2>
              <p className="text-sm text-emerald-800">
                Order reference #{orderSuccess._id?.slice(-6)}. Batch scheduled for {orderSuccess.deliveryDay}.
              </p>
            </div>
          </div>
          <div className="mt-4 flex flex-wrap gap-3">
            <Link
              to="/orders"
              className="rounded-2xl bg-emerald-700 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-600"
            >
              View Pooled Orders
            </Link>
            <Link
              to="/dashboard"
              className="rounded-2xl border border-emerald-300 bg-white px-4 py-2 text-sm font-medium text-emerald-900 hover:bg-emerald-50"
            >
              Return to Community Dashboard
            </Link>
          </div>
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Left Column: Items */}
        <div className="space-y-6 lg:col-span-2">
          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-100 pb-4">
              <h2 className="text-xl font-bold text-slate-900">Neighborhood Pool Items</h2>
              {cart?.items?.length > 0 && (
                <button
                  onClick={handleClear}
                  className="rounded-2xl border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-50"
                >
                  Clear Pool Items
                </button>
              )}
            </div>

            {cart?.items?.length ? (
              <div className="mt-6 space-y-4">
                {cart.items.map((item) => (
                  <div
                    key={item.product._id}
                    className="flex flex-col gap-4 rounded-2xl border border-slate-200 bg-slate-50/60 p-4 sm:flex-row sm:items-center sm:justify-between"
                  >
                    <div className="flex items-center gap-4">
                      <div className="flex h-16 w-16 items-center justify-center overflow-hidden rounded-2xl bg-white border border-slate-200">
                        {item.product.image ? (
                          <img
                            src={item.product.image}
                            alt={item.product.name}
                            className="h-full w-full object-contain p-1"
                          />
                        ) : (
                          <span className="text-2xl">🛒</span>
                        )}
                      </div>
                      <div>
                        <h3 className="font-semibold text-slate-900">{item.product.name}</h3>
                        <p className="text-xs text-slate-500">₹{item.price} per unit</p>
                        <span className="mt-1 inline-block rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-semibold text-emerald-800">
                          Pooled item
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between gap-6 sm:justify-end">
                      {/* Quantity Controls */}
                      <div className="flex items-center rounded-2xl bg-white border border-slate-200 p-1">
                        <button
                          onClick={() => handleQuantity(item.product._id, item.quantity - 1)}
                          disabled={item.quantity <= 1}
                          className="flex h-7 w-7 items-center justify-center rounded-xl text-slate-600 hover:bg-slate-100 disabled:opacity-40"
                        >
                          -
                        </button>
                        <span className="w-8 text-center text-sm font-bold text-slate-900">
                          {item.quantity}
                        </span>
                        <button
                          onClick={() => handleQuantity(item.product._id, item.quantity + 1)}
                          className="flex h-7 w-7 items-center justify-center rounded-xl text-slate-600 hover:bg-slate-100"
                        >
                          +
                        </button>
                      </div>

                      {/* Subtotal & Delete */}
                      <div className="text-right">
                        <p className="text-base font-bold text-slate-900">
                          ₹{item.quantity * item.price}
                        </p>
                        <button
                          onClick={() => handleRemove(item.product._id)}
                          className="mt-1 text-xs text-rose-600 hover:underline"
                        >
                          Remove
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="py-12 text-center">
                <p className="text-4xl">🛒</p>
                <p className="mt-2 text-base font-semibold text-slate-800">
                  Your pooling cart is currently empty
                </p>
                <p className="mt-1 text-xs text-slate-500">
                  Browse the catalog to add items and pool with your neighborhood.
                </p>
                <Link
                  to="/products"
                  className="mt-4 inline-block rounded-2xl bg-slate-900 px-5 py-2.5 text-sm font-semibold text-white hover:bg-slate-700"
                >
                  Browse Pool Catalog
                </Link>
              </div>
            )}
          </div>

          {/* Payment Method Selection UI */}
          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-lg font-bold text-slate-900">Payment Preference</h2>
            <p className="mt-1 text-xs text-slate-500">
              Select how you prefer to pay upon community bulk delivery drop-off.
            </p>

            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <label
                className={`flex cursor-pointer items-start gap-3 rounded-2xl border p-4 transition ${
                  paymentMethod === "Cash on Delivery"
                    ? "border-emerald-600 bg-emerald-50/60 ring-2 ring-emerald-500/20"
                    : "border-slate-200 bg-white hover:bg-slate-50"
                }`}
              >
                <input
                  type="radio"
                  name="paymentMethod"
                  value="Cash on Delivery"
                  checked={paymentMethod === "Cash on Delivery"}
                  onChange={(e) => setPaymentMethod(e.target.value)}
                  className="mt-1 h-4 w-4 text-emerald-600 focus:ring-emerald-500"
                />
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-slate-900">Cash on Delivery</span>
                    <span className="rounded bg-slate-200/80 px-1.5 py-0.5 text-[10px] font-semibold text-slate-700">
                      Standard
                    </span>
                  </div>
                  <p className="mt-1 text-xs text-slate-600">
                    Pay in cash directly to the delivery personnel upon drop-off at your community hub.
                  </p>
                </div>
              </label>

              <label
                className={`flex cursor-pointer items-start gap-3 rounded-2xl border p-4 transition ${
                  paymentMethod === "UPI on Delivery"
                    ? "border-emerald-600 bg-emerald-50/60 ring-2 ring-emerald-500/20"
                    : "border-slate-200 bg-white hover:bg-slate-50"
                }`}
              >
                <input
                  type="radio"
                  name="paymentMethod"
                  value="UPI on Delivery"
                  checked={paymentMethod === "UPI on Delivery"}
                  onChange={(e) => setPaymentMethod(e.target.value)}
                  className="mt-1 h-4 w-4 text-emerald-600 focus:ring-emerald-500"
                />
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-slate-900">UPI on Delivery</span>
                    <span className="rounded bg-blue-100 px-1.5 py-0.5 text-[10px] font-semibold text-blue-800">
                      Digital
                    </span>
                  </div>
                  <p className="mt-1 text-xs text-slate-600">
                    Scan delivery driver QR code using GPay, PhonePe, Paytm, or BHIM upon bulk arrival.
                  </p>
                </div>
              </label>
            </div>
            <p className="mt-3 text-[11px] text-slate-500">
              Note: Orders participate directly in neighborhood pooling. Payment is collected upon batch fulfillment.
            </p>
          </div>
        </div>

        {/* Right Column: Batch Delivery & Threshold Progress Card */}
        <div className="space-y-6">
          {/* Selected Delivery Batch Card */}
          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-lg font-bold text-slate-900">Delivery Batch Cycle</h2>
            <p className="mt-1 text-xs text-slate-500">
              Orders pool towards your selected community batch day.
            </p>

            {bestDay && (
              <div className="mt-3 rounded-2xl border border-amber-200 bg-amber-50/70 p-3 text-xs text-amber-900">
                <span className="font-semibold">💡 Recommended:</span> {bestDay.recommendedDeliveryDay} is the most popular batch day for your community.
              </div>
            )}

            <div className="mt-4 space-y-3">
              <label className="block text-xs font-semibold text-slate-700">
                Select Delivery Day Batch
              </label>
              <select
                value={deliveryDay}
                onChange={(e) => setDeliveryDay(e.target.value)}
                className="w-full rounded-2xl border border-slate-300 bg-slate-50 px-4 py-3 text-sm text-slate-900 focus:border-slate-900 focus:outline-none"
              >
                {deliveryDays.map((item) => (
                  <option key={item.day} value={item.day}>
                    {item.day} Batch (Cutoff: {item.cutOffTime})
                  </option>
                ))}
              </select>

              {activeSchedule && (
                <div className="rounded-2xl bg-slate-50 p-4 text-xs space-y-2 border border-slate-100">
                  <div className="flex justify-between">
                    <span className="text-slate-500">Scheduled Date:</span>
                    <span className="font-bold text-slate-900">
                      {calculatedBatchDate?.toLocaleDateString(undefined, {
                        weekday: "short",
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      })}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Delivery Window:</span>
                    <span className="font-semibold text-slate-800">09:00 AM - 12:00 PM</span>
                  </div>
                  <div className="flex justify-between text-rose-600 font-medium">
                    <span>Order Cutoff:</span>
                    <span>{activeSchedule.day} at {activeSchedule.cutOffTime}</span>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Pool Progress & Threshold Status Card */}
          <div className="rounded-3xl border border-emerald-200 bg-white p-6 shadow-sm ring-1 ring-emerald-500/10">
            <h2 className="text-lg font-bold text-slate-900">Community Pool Progress</h2>
            <p className="mt-1 text-xs text-slate-500">
              Track how this order contributes to unlocking the delivery batch.
            </p>

            <div className="mt-4 space-y-3">
              <div className="flex justify-between text-xs text-slate-600">
                <span>Current Community Pool</span>
                <span className="font-semibold text-slate-900">₹{currentPoolValue}</span>
              </div>
              <div className="flex justify-between text-xs text-emerald-700 font-semibold">
                <span>+ Your Order Contribution</span>
                <span>+₹{orderAmount}</span>
              </div>
              <div className="border-t border-slate-100 pt-2 flex justify-between text-sm font-bold text-slate-900">
                <span>Projected Pool Total</span>
                <span>₹{projectedPoolValue} / ₹{thresholdAmount}</span>
              </div>

              {/* Progress Bar */}
              <div className="mt-2 space-y-1">
                <div className="h-3 w-full overflow-hidden rounded-full bg-slate-100">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-teal-500 transition-all duration-300"
                    style={{ width: `${projectedPercent}%` }}
                  />
                </div>
                <div className="flex justify-between text-[11px] text-slate-500">
                  <span>Current: {currentPercent}%</span>
                  <span className="font-semibold text-emerald-700">Projected: {projectedPercent}%</span>
                </div>
              </div>

              {/* Threshold Status Banner */}
              <div className="mt-4 rounded-2xl p-3 text-xs">
                {projectedPoolValue >= thresholdAmount ? (
                  <div className="rounded-xl bg-emerald-50 p-3 border border-emerald-200 text-emerald-900">
                    <p className="font-bold">🎉 Threshold Goal Reached!</p>
                    <p className="mt-1 text-[11px]">
                      Your order guarantees bulk delivery confirmation for this neighborhood cycle!
                    </p>
                  </div>
                ) : (
                  <div className="rounded-xl bg-amber-50 p-3 border border-amber-200 text-amber-900">
                    <p className="font-bold">🤝 ₹{remainingNeeded} Remaining</p>
                    <p className="mt-1 text-[11px]">
                      Pooled with other neighbors before cutoff to unlock the delivery batch.
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Order Summary & Submit Button */}
            <div className="mt-6 border-t border-slate-100 pt-4 space-y-3">
              <div className="flex justify-between text-sm text-slate-600">
                <span>Delivery Fee (Community Pool)</span>
                <span className="font-semibold text-emerald-700">FREE</span>
              </div>
              <div className="flex justify-between text-lg font-bold text-slate-900">
                <span>Order Total</span>
                <span>₹{orderAmount}</span>
              </div>

              <button
                onClick={handleOrder}
                disabled={!cart?.items?.length || submitting}
                className="mt-2 w-full rounded-2xl bg-emerald-600 py-3.5 text-center text-sm font-bold text-white shadow transition hover:bg-emerald-500 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {submitting ? "Pooling Order..." : "Confirm & Add to Pool Batch"}
              </button>
              <p className="text-center text-[11px] text-slate-400">
                Payment preference: {paymentMethod}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Cart;
