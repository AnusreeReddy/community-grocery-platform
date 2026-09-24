import { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext.jsx";
import { getProducts, createProduct, updateProduct, deleteProduct } from "../services/productService.js";
import { getCommunities } from "../services/communityService.js";
import { getMe } from "../services/authService.js";

const emptyForm = { name: "", category: "Fruits", brand: "", price: "", stock: "", image: "", description: "", communities: [] };

const ShopkeeperPanel = () => {
  const { user, setUser } = useAuth();
  const [products, setProducts] = useState([]);
  const [communities, setCommunities] = useState([]);
  const [message, setMessage] = useState("");
  const [form, setForm] = useState(emptyForm);
  const [refreshing, setRefreshing] = useState(false);

  const isApproved = user.shopkeeperApprovalStatus === "Approved";

  const loadProducts = () => {
    getProducts().then((resp) => setProducts(resp.products)).catch(() => setMessage("Unable to load products."));
  };

  useEffect(() => {
    loadProducts();
    getCommunities().then((resp) => setCommunities(resp.communities)).catch(() => {});
  }, []);

  const handleRefreshStatus = async () => {
    setRefreshing(true);
    try {
      const resp = await getMe();
      setUser(resp.user);
      localStorage.setItem("community-user", JSON.stringify(resp.user));
      setMessage("Status refreshed.");
    } catch {
      setMessage("Unable to refresh status.");
    } finally {
      setRefreshing(false);
    }
  };

  const toggleCommunity = (id) => {
    setForm((current) => ({
      ...current,
      communities: current.communities.includes(id) ? current.communities.filter((c) => c !== id) : [...current.communities, id],
    }));
  };

  const handleCreate = async (event) => {
    event.preventDefault();
    try {
      await createProduct({
        ...form,
        price: Number(form.price),
        stock: Number(form.stock),
      });
      setMessage("Product created.");
      setForm(emptyForm);
      loadProducts();
    } catch (err) {
      setMessage(err.response?.data?.message || "Unable to create product.");
    }
  };

  const handleStockUpdate = async (id, stock) => {
    try {
      await updateProduct(id, { stock: Number(stock) });
      loadProducts();
    } catch (err) {
      setMessage(err.response?.data?.message || "Unable to update stock.");
    }
  };

  const handleDelete = async (id) => {
    try {
      await deleteProduct(id);
      setMessage("Product removed.");
      loadProducts();
    } catch (err) {
      setMessage(err.response?.data?.message || "Unable to remove product.");
    }
  };

  return (
    <div className="space-y-6">
      <div className="rounded-3xl bg-white p-6 shadow-sm">
        <h1 className="text-2xl font-semibold text-slate-900">Shopkeeper dashboard</h1>
        <p className="mt-2 text-slate-600">Manage inventory and respond to community demand.</p>
      </div>

      {!isApproved && (
        <div className="rounded-3xl border border-amber-200 bg-amber-50 p-6">
          <p className="font-semibold text-amber-900">
            Your account is {user.shopkeeperApprovalStatus === "Rejected" ? "not approved" : "pending admin approval"}.
          </p>
          <p className="mt-1 text-sm text-amber-800">
            You can't add or edit products until a superAdmin approves your shopkeeper account.
          </p>
          <button onClick={handleRefreshStatus} disabled={refreshing} className="mt-4 rounded-2xl border border-amber-300 bg-white px-4 py-2 text-sm text-amber-900 hover:bg-amber-100 disabled:opacity-60">
            {refreshing ? "Checking..." : "Check approval status"}
          </button>
        </div>
      )}

      {message && <div className="rounded-3xl bg-slate-100 p-4 text-slate-700">{message}</div>}

      <div className="grid gap-6 lg:grid-cols-2">
        {isApproved && (
          <section className="rounded-3xl bg-white p-6 shadow-sm">
            <h2 className="text-xl font-semibold text-slate-900">Add product</h2>
            <form className="mt-6 space-y-4" onSubmit={handleCreate}>
              {[
                { label: "Product name", field: "name" },
                { label: "Category", field: "category" },
                { label: "Brand", field: "brand" },
                { label: "Price", field: "price" },
                { label: "Stock", field: "stock" },
                { label: "Image URL", field: "image" },
                { label: "Description", field: "description" },
              ].map((item) => (
                <label key={item.field} className="block">
                  <span className="text-sm text-slate-700">{item.label}</span>
                  <input
                    value={form[item.field]}
                    onChange={(e) => setForm({ ...form, [item.field]: e.target.value })}
                    type="text"
                    className="mt-2 w-full rounded-2xl border border-slate-300 bg-slate-50 px-4 py-3 text-slate-900"
                  />
                </label>
              ))}
              <div>
                <span className="text-sm text-slate-700">Available to (leave empty for all communities)</span>
                <div className="mt-2 flex flex-wrap gap-2">
                  {communities.map((c) => (
                    <label key={c._id} className={`cursor-pointer rounded-full border px-3 py-1.5 text-xs ${form.communities.includes(c._id) ? "border-slate-900 bg-slate-900 text-white" : "border-slate-300 text-slate-700"}`}>
                      <input type="checkbox" checked={form.communities.includes(c._id)} onChange={() => toggleCommunity(c._id)} className="hidden" />
                      {c.name}
                    </label>
                  ))}
                </div>
              </div>
              <button type="submit" className="rounded-2xl bg-slate-900 px-4 py-3 text-white hover:bg-slate-700">
                Save product
              </button>
            </form>
          </section>
        )}
        <section className="rounded-3xl bg-white p-6 shadow-sm">
          <h2 className="text-xl font-semibold text-slate-900">Your inventory</h2>
          <div className="mt-4 space-y-4">
            {products.filter((product) => product.shopkeeper?._id === user._id).map((product) => (
              <div key={product._id} className="rounded-3xl border border-slate-200 bg-slate-50 p-4">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <p className="font-semibold text-slate-900">{product.name}</p>
                    <p className="text-sm text-slate-600">
                      ₹{product.price} •{" "}
                      <input
                        type="number"
                        min="0"
                        defaultValue={product.stock}
                        disabled={!isApproved}
                        onBlur={(e) => e.target.value !== String(product.stock) && handleStockUpdate(product._id, e.target.value)}
                        className="w-20 rounded border border-slate-300 px-2 py-0.5 text-sm disabled:bg-slate-100"
                      />{" "}
                      in stock
                    </p>
                    <p className="text-xs text-slate-500">
                      {product.communities?.length ? `Limited to ${product.communities.length} community(ies)` : "Available to all communities"}
                    </p>
                  </div>
                  <button onClick={() => handleDelete(product._id)} disabled={!isApproved} className="rounded-2xl border border-rose-200 px-4 py-2 text-sm text-rose-600 hover:bg-rose-50 disabled:opacity-50">
                    Remove
                  </button>
                </div>
              </div>
            ))}
            {products.filter((product) => product.shopkeeper?._id === user._id).length === 0 && (
              <p className="text-sm text-slate-500">No products listed yet.</p>
            )}
          </div>
        </section>
      </div>
    </div>
  );
};

export default ShopkeeperPanel;
