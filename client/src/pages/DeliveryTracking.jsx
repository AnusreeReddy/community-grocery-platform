import { useEffect, useState } from "react";
import { getDeliveries } from "../services/deliveryService.js";

const DeliveryTracking = () => {
  const [deliveries, setDeliveries] = useState([]);
  const [error, setError] = useState("");

  useEffect(() => {
    getDeliveries()
      .then((resp) => setDeliveries(resp.deliveries))
      .catch(() => setError("Unable to load deliveries."));
  }, []);

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
              <span className="rounded-full bg-slate-100 px-3 py-1 text-sm text-slate-700">{delivery.deliveryStatus}</span>
            </div>
            <div className="mt-4 text-slate-600">
              <p>Orders: {delivery.totalOrders}</p>
              <p>Amount: ₹{delivery.totalAmount}</p>
              <p>Truck: {delivery.truckNumber || "TBD"}</p>
            </div>
          </div>
        )) : (
          <div className="rounded-3xl bg-white p-6 shadow-sm">
            <p className="text-slate-600">No deliveries are available right now.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default DeliveryTracking;
