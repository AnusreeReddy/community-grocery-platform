import { useEffect, useState, useMemo } from "react";
import { useAuth } from "../context/AuthContext.jsx";
import {
  getProducts,
  createProduct,
  updateProduct,
  deleteProduct,
} from "../services/productService.js";
import { getCommunities } from "../services/communityService.js";
import { getDeliveries, confirmInventory } from "../services/deliveryService.js";

const ShopkeeperPanel = () => {
  const { user } = useAuth();
  const [products, setProducts] = useState([]);
  const [communities, setCommunities] = useState([]);
  const [deliveries, setDeliveries] = useState([]);
  const [message, setMessage] = useState("");
  const [activeTab, setActiveTab] = useState("demand"); // "demand" | "inventory" | "add"
  const [editingCommunityAccessId, setEditingCommunityAccessId] = useState(null);
  const [selectedCommunities, setSelectedCommunities] = useState([]);

  const [form, setForm] = useState({
    name: "",
    category: "Fruits",
    brand: "",
    price: "",
    stock: "",
    image: "",
    description: "",
    communities: [],
  });

  const loadData = () => {
    getProducts()
      .then((resp) => setProducts(resp.products || []))
      .catch(() => setMessage("Unable to load inventory."));

    getCommunities()
      .then((resp) => setCommunities(resp.communities || []))
      .catch(() => {});

    getDeliveries()
      .then((resp) => setDeliveries(resp.deliveries || []))
      .catch(() => {});
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleCreate = async (event) => {
    event.preventDefault();
    try {
      await createProduct({
        ...form,
        price: Number(form.price),
        stock: Number(form.stock),
        communities: selectedCommunities,
      });
      setMessage("✓ Product created with community access rules.");
      setForm({
        name: "",
        category: "Fruits",
        brand: "",
        price: "",
        stock: "",
        image: "",
        description: "",
        communities: [],
      });
      setSelectedCommunities([]);
      loadData();
      setActiveTab("inventory");
    } catch (err) {
      setMessage(err.response?.data?.message || "Unable to create product.");
    }
  };

  const handleDelete = async (id) => {
    try {
      await deleteProduct(id);
      setMessage("Product removed from inventory.");
      loadData();
    } catch (err) {
      setMessage(err.response?.data?.message || "Unable to remove product.");
    }
  };

  const handleUpdateCommunityAccess = async (productId, updatedCommunities) => {
    try {
      await updateProduct(productId, { communities: updatedCommunities });
      setMessage("✓ Updated community access for product.");
      setEditingCommunityAccessId(null);
      loadData();
    } catch (err) {
      setMessage(err.response?.data?.message || "Unable to update community access.");
    }
  };

  const handleInventoryAction = async (deliveryId, action) => {
    try {
      await confirmInventory(deliveryId, action, `Inventory ${action.toLowerCase()} by shopkeeper`);
      setMessage(`✓ Inventory ${action.toLowerCase()} for delivery batch.`);
      loadData();
    } catch (err) {
      setMessage(err.response?.data?.message || "Unable to process inventory confirmation.");
    }
  };

  // Group deliveries into community batches with aggregated product demand
  const batchDemandData = useMemo(() => {
    return deliveries.map((delivery) => {
      const demandMap = new Map();
      let totalItemsCount = 0;

      if (delivery.orders && Array.isArray(delivery.orders)) {
        for (const order of delivery.orders) {
          if (order.items && Array.isArray(order.items)) {
            for (const item of order.items) {
              const productName = item.product?.name || "Pooled Item";
              const current = demandMap.get(productName) || {
                name: productName,
                quantity: 0,
                unitPrice: item.price || 0,
              };
              current.quantity += item.quantity || 1;
              totalItemsCount += item.quantity || 1;
              demandMap.set(productName, current);
            }
          }
        }
      }

      return {
        ...delivery,
        aggregatedItems: Array.from(demandMap.values()),
        totalItemsCount,
      };
    });
  }, [deliveries]);

  const isPendingApproval = user?.shopkeeperApprovalStatus === "Pending";
  const isRejected = user?.shopkeeperApprovalStatus === "Rejected";

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full bg-blue-100 px-3 py-1 text-xs font-semibold text-blue-800">
              <span>🏪 Shopkeeper Operations Hub</span>
            </div>
            <h1 className="mt-2 text-2xl font-bold text-slate-900">
              Community Demand & Inventory
            </h1>
            <p className="mt-1 text-sm text-slate-600">
              Fulfill aggregated grocery demand across nearby neighborhood pools and manage community access.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-500">Account Status:</span>
            <span
              className={`rounded-full px-3 py-1 text-xs font-semibold ${
                user?.shopkeeperApprovalStatus === "Approved"
                  ? "bg-emerald-100 text-emerald-800"
                  : isPendingApproval
                  ? "bg-amber-100 text-amber-800 animate-pulse"
                  : "bg-slate-100 text-slate-800"
              }`}
            >
              {user?.shopkeeperApprovalStatus || "Approved"}
            </span>
          </div>
        </div>

        {/* Approval Alerts */}
        {isPendingApproval && (
          <div className="mt-4 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-xs text-amber-900">
            <strong>⚠️ Account Pending Approval:</strong> Your shopkeeper profile is currently under review by platform administrators. You can prepare inventory and review community demand; public ordering will unlock once verified.
          </div>
        )}

        {isRejected && (
          <div className="mt-4 rounded-2xl border border-rose-200 bg-rose-50 p-4 text-xs text-rose-900">
            <strong>❌ Application Not Approved:</strong> Please contact support to resolve community partner verification.
          </div>
        )}

        {/* Tabs */}
        <div className="mt-6 flex gap-2 border-b border-slate-100">
          <button
            onClick={() => setActiveTab("demand")}
            className={`px-4 py-2.5 text-sm font-semibold transition ${
              activeTab === "demand"
                ? "border-b-2 border-slate-900 text-slate-900"
                : "text-slate-500 hover:text-slate-900"
            }`}
          >
            Aggregated Demand by Batch ({batchDemandData.length})
          </button>
          <button
            onClick={() => setActiveTab("inventory")}
            className={`px-4 py-2.5 text-sm font-semibold transition ${
              activeTab === "inventory"
                ? "border-b-2 border-slate-900 text-slate-900"
                : "text-slate-500 hover:text-slate-900"
            }`}
          >
            Manage Products & Community Access
          </button>
          <button
            onClick={() => setActiveTab("add")}
            className={`px-4 py-2.5 text-sm font-semibold transition ${
              activeTab === "add"
                ? "border-b-2 border-slate-900 text-slate-900"
                : "text-slate-500 hover:text-slate-900"
            }`}
          >
            + Add New Product
          </button>
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

      {/* TAB 1: AGGREGATED DEMAND BY COMMUNITY / BATCH */}
      {activeTab === "demand" && (
        <div className="space-y-6">
          {/* Nearby Community Pools Overview */}
          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-lg font-bold text-slate-900">Nearby Community Pools</h2>
            <p className="mt-0.5 text-xs text-slate-500">
              Live pooled order volume waiting to hit delivery cutoff
            </p>

            <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {communities.map((comm) => (
                <div key={comm._id} className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="font-bold text-slate-900">{comm.name}</h3>
                      <p className="text-xs text-slate-500">{comm.city} • Pincode: {comm.pincode}</p>
                    </div>
                    <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[11px] font-semibold text-emerald-800">
                      ₹{comm.thresholdAmount} goal
                    </span>
                  </div>
                  <div className="mt-3">
                    <div className="flex justify-between text-xs text-slate-600 mb-1">
                      <span>Pooled Value</span>
                      <span className="font-bold text-slate-900">₹{comm.currentOrderValue}</span>
                    </div>
                    <div className="h-2 w-full rounded-full bg-slate-200 overflow-hidden">
                      <div
                        className="h-full bg-emerald-600 rounded-full"
                        style={{
                          width: `${Math.min(100, (comm.currentOrderValue / comm.thresholdAmount) * 100)}%`,
                        }}
                      />
                    </div>
                  </div>
                  <div className="mt-3 flex flex-wrap gap-1">
                    {(comm.deliverySchedule || []).map((s) => (
                      <span key={s.day} className="rounded bg-white px-1.5 py-0.5 text-[10px] text-slate-600 border border-slate-200">
                        {s.day} @ {s.cutOffTime}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Active Batch Demand List */}
          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-lg font-bold text-slate-900">
              Aggregated Demand by Community Batch
            </h2>
            <p className="mt-0.5 text-xs text-slate-500">
              Consolidated product units required per community delivery batch proposal
            </p>

            {batchDemandData.length > 0 ? (
              <div className="mt-6 space-y-6">
                {batchDemandData.map((delivery) => (
                  <div
                    key={delivery._id}
                    className="overflow-hidden rounded-2xl border border-slate-200 bg-slate-50/60 p-6"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-200/80 pb-4">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-lg text-slate-900">
                            {delivery.community?.name || "Community Batch"}
                          </span>
                          <span className="rounded-full bg-slate-200 px-2 py-0.5 text-xs font-semibold text-slate-800">
                            {delivery.deliveryDay} Batch
                          </span>
                        </div>
                        <p className="mt-1 text-xs text-slate-500">
                          Scheduled: {new Date(delivery.deliveryDate).toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric" })} • {delivery.totalOrders} Household Orders • Total Batch Value: ₹{delivery.totalAmount}
                        </p>
                      </div>

                      <div className="flex items-center gap-2">
                        <span className={`rounded-full px-3 py-1 text-xs font-semibold ${
                          delivery.approvalStatus === "Approved" ? "bg-emerald-100 text-emerald-800" : "bg-amber-100 text-amber-800"
                        }`}>
                          Admin: {delivery.approvalStatus}
                        </span>
                        <span className={`rounded-full px-3 py-1 text-xs font-semibold ${
                          delivery.shopkeeperApproval?.status === "Accepted" ? "bg-emerald-100 text-emerald-800" :
                          delivery.shopkeeperApproval?.status === "Rejected" ? "bg-rose-100 text-rose-800" :
                          "bg-blue-100 text-blue-800"
                        }`}>
                          Inventory: {delivery.shopkeeperApproval?.status || "Pending"}
                        </span>
                      </div>
                    </div>

                    {/* Consolidated Items Demand Breakdown */}
                    <div className="mt-4">
                      <p className="text-xs font-bold uppercase tracking-wider text-slate-600 mb-2">
                        Aggregated Item Sourcing List:
                      </p>
                      {delivery.aggregatedItems.length > 0 ? (
                        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
                          {delivery.aggregatedItems.map((item) => (
                            <div
                              key={item.name}
                              className="flex items-center justify-between rounded-xl bg-white p-3 border border-slate-200"
                            >
                              <div>
                                <p className="text-xs font-bold text-slate-900">{item.name}</p>
                                <p className="text-[11px] text-slate-500">₹{item.unitPrice} / unit</p>
                              </div>
                              <span className="rounded-lg bg-emerald-100 px-2.5 py-1 text-xs font-bold text-emerald-900">
                                {item.quantity} units
                              </span>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="rounded-xl bg-white p-4 text-xs text-slate-500">
                          {delivery.totalOrders} orders pooled totaling ₹{delivery.totalAmount}. Sourcing details initialized.
                        </div>
                      )}
                    </div>

                    {/* Shopkeeper Inventory Confirmation Actions */}
                    {delivery.approvalStatus === "Approved" && delivery.shopkeeperApproval?.status === "Pending" && (
                      <div className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-xl bg-blue-50 border border-blue-200 p-4">
                        <div className="text-xs text-blue-900">
                          <p className="font-bold">Inventory Confirmation Required</p>
                          <p>Admin approved this batch. Confirm your store has sufficient stock for dispatch.</p>
                        </div>
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleInventoryAction(delivery._id, "Accepted")}
                            className="rounded-xl bg-emerald-600 px-4 py-2 text-xs font-bold text-white hover:bg-emerald-500"
                          >
                            Accept Inventory
                          </button>
                          <button
                            onClick={() => handleInventoryAction(delivery._id, "Rejected")}
                            className="rounded-xl bg-rose-600 px-4 py-2 text-xs font-bold text-white hover:bg-rose-500"
                          >
                            Reject Inventory
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="mt-6 rounded-2xl bg-slate-50 p-8 text-center text-slate-500">
                <p className="text-lg font-semibold">No active delivery batches yet</p>
                <p className="mt-1 text-xs">Batches appear when neighborhood pools reach their order thresholds.</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 2: INVENTORY & COMMUNITY ACCESS MANAGEMENT */}
      {activeTab === "inventory" && (
        <div className="space-y-6">
          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <h2 className="text-xl font-bold text-slate-900">Product Community Access</h2>
                <p className="mt-1 text-xs text-slate-500">
                  Control which nearby communities can browse and pool each product in their batch cycles.
                </p>
              </div>
              <button
                onClick={() => setActiveTab("add")}
                className="rounded-2xl bg-slate-900 px-4 py-2 text-xs font-bold text-white hover:bg-slate-700"
              >
                + Add Product
              </button>
            </div>

            <div className="mt-6 space-y-4">
              {products
                .filter((p) => p.shopkeeper?._id === user._id || !p.shopkeeper)
                .map((product) => {
                  const isEditingAccess = editingCommunityAccessId === product._id;
                  const accessibleCommunityIds = product.communities || [];

                  return (
                    <div
                      key={product._id}
                      className="rounded-2xl border border-slate-200 bg-slate-50/60 p-5"
                    >
                      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                        <div className="flex items-center gap-4">
                          <div className="flex h-14 w-14 items-center justify-center overflow-hidden rounded-xl bg-white border border-slate-200">
                            {product.image ? (
                              <img src={product.image} alt={product.name} className="h-full w-full object-contain p-1" />
                            ) : (
                              <span className="text-xl">🛒</span>
                            )}
                          </div>
                          <div>
                            <h3 className="font-bold text-slate-900">{product.name}</h3>
                            <p className="text-xs text-slate-500">
                              {product.category} • ₹{product.price} • {product.stock} in stock
                            </p>

                            {/* Community Access Display */}
                            <div className="mt-2 flex flex-wrap items-center gap-1.5">
                              <span className="text-[11px] font-semibold text-slate-600">
                                Authorized Pools:
                              </span>
                              {accessibleCommunityIds.length === 0 ? (
                                <span className="rounded-md bg-emerald-100 px-2 py-0.5 text-[11px] font-semibold text-emerald-800">
                                  All Nearby Communities
                                </span>
                              ) : (
                                accessibleCommunityIds.map((cId) => {
                                  const comm = communities.find((c) => c._id === cId || c._id === cId._id);
                                  return (
                                    <span
                                      key={cId}
                                      className="rounded-md bg-blue-100 px-2 py-0.5 text-[11px] font-medium text-blue-800"
                                    >
                                      {comm?.name || "Community Pool"}
                                    </span>
                                  );
                                })
                              )}
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <button
                            onClick={() =>
                              setEditingCommunityAccessId(isEditingAccess ? null : product._id)
                            }
                            className="rounded-xl border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                          >
                            {isEditingAccess ? "Close Access" : "Configure Access"}
                          </button>
                          <button
                            onClick={() => handleDelete(product._id)}
                            className="rounded-xl border border-rose-200 px-3 py-1.5 text-xs font-semibold text-rose-600 hover:bg-rose-50"
                          >
                            Remove
                          </button>
                        </div>
                      </div>

                      {/* Community Access Configuration Panel */}
                      {isEditingAccess && (
                        <div className="mt-4 rounded-xl border border-blue-200 bg-white p-4">
                          <p className="text-xs font-bold text-slate-900 mb-2">
                            Select communities authorized to pool this item:
                          </p>
                          <div className="grid gap-2 sm:grid-cols-2">
                            <label className="flex items-center gap-2 text-xs font-medium text-slate-700 cursor-pointer">
                              <input
                                type="checkbox"
                                checked={accessibleCommunityIds.length === 0}
                                onChange={(e) => {
                                  if (e.target.checked) {
                                    handleUpdateCommunityAccess(product._id, []);
                                  }
                                }}
                                className="rounded text-emerald-600 focus:ring-emerald-500"
                              />
                              <span>All Nearby Communities (Open Access)</span>
                            </label>

                            {communities.map((comm) => {
                              const isChecked = accessibleCommunityIds.includes(comm._id);
                              return (
                                <label
                                  key={comm._id}
                                  className="flex items-center gap-2 text-xs text-slate-700 cursor-pointer"
                                >
                                  <input
                                    type="checkbox"
                                    checked={isChecked}
                                    onChange={(e) => {
                                      let updated;
                                      if (e.target.checked) {
                                        updated = [...accessibleCommunityIds, comm._id];
                                      } else {
                                        updated = accessibleCommunityIds.filter((id) => id !== comm._id);
                                      }
                                      handleUpdateCommunityAccess(product._id, updated);
                                    }}
                                    className="rounded text-blue-600 focus:ring-blue-500"
                                  />
                                  <span>{comm.name} ({comm.pincode})</span>
                                </label>
                              );
                            })}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: ADD NEW PRODUCT */}
      {activeTab === "add" && (
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-xl font-bold text-slate-900">List New Grocery Item</h2>
          <p className="mt-1 text-xs text-slate-500">
            Publish inventory with specific community-scoped availability.
          </p>

          <form className="mt-6 grid gap-4 md:grid-cols-2" onSubmit={handleCreate}>
            {[
              { label: "Product Name", field: "name", placeholder: "e.g. Pure Honey 500g" },
              { label: "Category", field: "category", placeholder: "Fruits, Vegetables, Bakery, Dairy, Pantry, Grains" },
              { label: "Brand / Farm", field: "brand", placeholder: "e.g. Bee Sweet" },
              { label: "Unit Price (₹)", field: "price", placeholder: "e.g. 200" },
              { label: "Available Stock", field: "stock", placeholder: "e.g. 25" },
              { label: "Image URL", field: "image", placeholder: "Optional image URL" },
            ].map((item) => (
              <label key={item.field} className="block">
                <span className="text-xs font-semibold text-slate-700">{item.label}</span>
                <input
                  value={form[item.field]}
                  onChange={(e) => setForm({ ...form, [item.field]: e.target.value })}
                  placeholder={item.placeholder}
                  type="text"
                  required={item.field !== "image" && item.field !== "brand"}
                  className="mt-1.5 w-full rounded-2xl border border-slate-300 bg-slate-50 px-4 py-2.5 text-sm text-slate-900 focus:border-slate-900 focus:outline-none"
                />
              </label>
            ))}

            <div className="md:col-span-2">
              <span className="text-xs font-semibold text-slate-700">Description</span>
              <textarea
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                placeholder="Product packaging, origin, and freshness notes"
                rows="2"
                className="mt-1.5 w-full rounded-2xl border border-slate-300 bg-slate-50 px-4 py-2 text-sm text-slate-900 focus:border-slate-900 focus:outline-none"
              />
            </div>

            {/* Community Access Selection */}
            <div className="md:col-span-2 rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <span className="text-xs font-bold text-slate-900 block mb-2">
                Authorized Nearby Communities:
              </span>
              <div className="grid gap-2 sm:grid-cols-2">
                <label className="flex items-center gap-2 text-xs font-medium text-slate-700 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={selectedCommunities.length === 0}
                    onChange={(e) => {
                      if (e.target.checked) setSelectedCommunities([]);
                    }}
                    className="rounded text-emerald-600 focus:ring-emerald-500"
                  />
                  <span>All Nearby Communities (Default)</span>
                </label>
                {communities.map((comm) => (
                  <label key={comm._id} className="flex items-center gap-2 text-xs text-slate-700 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={selectedCommunities.includes(comm._id)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedCommunities([...selectedCommunities, comm._id]);
                        } else {
                          setSelectedCommunities(selectedCommunities.filter((id) => id !== comm._id));
                        }
                      }}
                      className="rounded text-blue-600 focus:ring-blue-500"
                    />
                    <span>{comm.name} ({comm.pincode})</span>
                  </label>
                ))}
              </div>
            </div>

            <button
              type="submit"
              className="mt-2 rounded-2xl bg-slate-900 px-5 py-3 text-sm font-bold text-white hover:bg-slate-700 md:col-span-2"
            >
              Save Product & Enable Community Access
            </button>
          </form>
        </div>
      )}
    </div>
  );
};

export default ShopkeeperPanel;
