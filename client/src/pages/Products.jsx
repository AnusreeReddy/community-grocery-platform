import { useEffect, useState, useMemo } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import {
  getProducts,
  searchProducts,
  getProductsByCategory,
  deleteProduct,
  createProduct,
} from "../services/productService.js";
import { addToCart } from "../services/cartService.js";
import { getCommunity } from "../services/communityService.js";

const categories = ["Fruits", "Vegetables", "Bakery", "Dairy", "Pantry", "Grains"];

const DEMAND_HINTS = {
  Milk: { pooled: 18, label: "Top Neighborhood Demand" },
  "Basmati Rice": { pooled: 11, label: "Staple Demand" },
  Eggs: { pooled: 24, label: "Fast Pooling" },
  Tomatoes: { pooled: 15, label: "Fresh Harvest" },
  "Fresh Apples": { pooled: 14, label: "High Demand" },
  "Whole Wheat Bread": { pooled: 9, label: "Daily Batch" },
  Carrots: { pooled: 12, label: "Community Favorite" },
  Paneer: { pooled: 8, label: "Local Dairy" },
  Banana: { pooled: 16, label: "High Demand" },
  "Olive Oil": { pooled: 6, label: "Pantry Shared" },
  Honey: { pooled: 7, label: "Pure Local" },
};

const Products = () => {
  const { user } = useAuth();
  const [products, setProducts] = useState([]);
  const [community, setCommunity] = useState(null);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("");
  const [message, setMessage] = useState("");
  const [addingId, setAddingId] = useState(null);
  const [newProduct, setNewProduct] = useState({
    name: "",
    category: "Fruits",
    price: "",
    stock: "",
    description: "",
    brand: "",
    image: "",
  });

  const loadProducts = () => {
    getProducts()
      .then((resp) => setProducts(resp.products || []))
      .catch(() => setMessage("Unable to load products."));
  };

  useEffect(() => {
    loadProducts();

    if (user?.community) {
      getCommunity(user.community)
        .then((resp) => setCommunity(resp.community))
        .catch(() => {});
    }
  }, [user]);

  const handleSearch = async () => {
    if (!search) {
      return loadProducts();
    }

    try {
      const resp = await searchProducts(search);
      setProducts(resp.products || []);
    } catch {
      setMessage("Search failed.");
    }
  };

  const handleCategory = async (value) => {
    setCategory(value);
    if (!value) {
      return loadProducts();
    }

    try {
      const resp = await getProductsByCategory(value);
      setProducts(resp.products || []);
    } catch {
      setMessage("Unable to filter products.");
    }
  };

  const handleAddToPool = async (id) => {
    setAddingId(id);
    try {
      await addToCart(id, 1);
      setMessage("✓ Added to your community pool!");
      setTimeout(() => setMessage(""), 3500);
    } catch (err) {
      setMessage(err.response?.data?.message || "Unable to add to pool.");
    } finally {
      setAddingId(null);
    }
  };

  const handleCreate = async (event) => {
    event.preventDefault();
    try {
      await createProduct({
        ...newProduct,
        price: Number(newProduct.price),
        stock: Number(newProduct.stock),
      });
      loadProducts();
      setNewProduct({
        name: "",
        category: "Fruits",
        price: "",
        stock: "",
        description: "",
        brand: "",
        image: "",
      });
      setMessage("Product created successfully.");
    } catch (err) {
      setMessage(err.response?.data?.message || "Unable to create product.");
    }
  };

  const handleDelete = async (id) => {
    try {
      await deleteProduct(id);
      loadProducts();
      setMessage("Product removed successfully.");
    } catch (err) {
      setMessage(err.response?.data?.message || "Unable to delete product.");
    }
  };

  // Community-scoped filtering: If a product specifies restricted communities,
  // ensure the user's community is in that list. Products with empty/no communities
  // are open to all nearby neighborhood pools.
  const scopedProducts = useMemo(() => {
    return products.filter((p) => {
      if (!p.communities || p.communities.length === 0) return true;
      if (!user?.community) return true;
      return p.communities.some(
        (c) => c === user.community || c._id === user.community
      );
    });
  }, [products, user]);

  return (
    <div className="space-y-6">
      {/* Community Pooling Header */}
      <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-800">
              <span>🌾 Community Grocery Pool Catalog</span>
            </div>
            <h1 className="mt-2 text-2xl font-bold text-slate-900">
              Local Grocery Products
            </h1>
            <p className="mt-1 text-sm text-slate-600">
              Browse staple products available for bulk neighborhood delivery. Add items to your active community pool.
            </p>
          </div>

          {community ? (
            <div className="rounded-2xl border border-emerald-200 bg-emerald-50/70 p-3 text-right">
              <span className="text-xs uppercase text-emerald-700 font-semibold">Active Pool</span>
              <p className="text-sm font-bold text-emerald-950">{community.name}</p>
              <p className="text-xs text-emerald-800">
                Threshold: ₹{community.currentOrderValue} / ₹{community.thresholdAmount}
              </p>
            </div>
          ) : (
            <div className="rounded-2xl border border-amber-200 bg-amber-50 p-3 text-right">
              <span className="text-xs uppercase text-amber-700 font-semibold">No Community Joined</span>
              <p className="text-xs text-amber-800">
                <Link to="/communities" className="font-semibold underline">
                  Join a community
                </Link>{" "}
                to unlock batch deliveries
              </p>
            </div>
          )}
        </div>

        {/* Filter & Search Bar */}
        <div className="mt-6 flex flex-wrap gap-3">
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSearch()}
            placeholder="Search items (e.g. Milk, Rice, Tomatoes)..."
            className="flex-1 min-w-[220px] rounded-2xl border border-slate-300 bg-slate-50 px-4 py-3 text-slate-900 placeholder:text-slate-400 focus:border-slate-900 focus:outline-none"
          />
          <button
            onClick={handleSearch}
            className="rounded-2xl bg-slate-900 px-5 py-3 text-sm font-medium text-white hover:bg-slate-700"
          >
            Search
          </button>
          <select
            value={category}
            onChange={(e) => handleCategory(e.target.value)}
            className="rounded-2xl border border-slate-300 bg-slate-50 px-4 py-3 text-sm text-slate-900 focus:border-slate-900 focus:outline-none"
          >
            <option value="">All Categories</option>
            {categories.map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </select>
        </div>
      </div>

      {message && (
        <div className={`rounded-2xl p-4 text-sm font-medium ${
          message.startsWith("✓") ? "bg-emerald-50 text-emerald-800 border border-emerald-200" : "bg-slate-100 text-slate-700"
        }`}>
          {message}
        </div>
      )}

      {/* Shopkeeper Add Inventory Form */}
      {user?.role === "shopkeeper" && (
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex items-center gap-2">
            <span className="text-xl">🏪</span>
            <h2 className="text-xl font-bold text-slate-900">Add Inventory to Local Pool</h2>
          </div>
          <p className="mt-1 text-xs text-slate-500">
            List products that nearby community pools can order for weekly batch delivery.
          </p>
          <form className="mt-6 grid gap-4 md:grid-cols-2" onSubmit={handleCreate}>
            {[
              { label: "Product Name", field: "name", placeholder: "e.g. Fresh Milk 1L" },
              { label: "Category", field: "category", placeholder: "Fruits, Vegetables, Dairy, Bakery, Pantry, Grains" },
              { label: "Brand / Farm", field: "brand", placeholder: "e.g. Local Organic Farm" },
              { label: "Price (₹)", field: "price", placeholder: "e.g. 60" },
              { label: "Stock Quantity", field: "stock", placeholder: "e.g. 100" },
              { label: "Image URL / SVG data", field: "image", placeholder: "Optional image URL" },
            ].map((item) => (
              <label key={item.field} className="block">
                <span className="text-xs font-semibold text-slate-700">{item.label}</span>
                <input
                  value={newProduct[item.field]}
                  onChange={(e) =>
                    setNewProduct({ ...newProduct, [item.field]: e.target.value })
                  }
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
                value={newProduct.description}
                onChange={(e) =>
                  setNewProduct({ ...newProduct, description: e.target.value })
                }
                placeholder="Product packaging, source, or unit specifications"
                rows="2"
                className="mt-1.5 w-full rounded-2xl border border-slate-300 bg-slate-50 px-4 py-2 text-sm text-slate-900 focus:border-slate-900 focus:outline-none"
              />
            </div>
            <button
              type="submit"
              className="rounded-2xl bg-emerald-600 px-5 py-3 text-sm font-semibold text-white hover:bg-emerald-500 md:col-span-2"
            >
              Publish to Community Pool
            </button>
          </form>
        </div>
      )}

      {/* Product Grid */}
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {scopedProducts.map((product) => {
          const demand = DEMAND_HINTS[product.name] || {
            pooled: Math.max(3, (product.stock % 15) + 4),
            label: "Active Pool Demand",
          };

          return (
            <div
              key={product._id}
              className="flex flex-col justify-between overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm transition hover:shadow-md"
            >
              <div className="p-6">
                {/* Product Image & Badges */}
                <div className="relative mb-4 flex h-40 w-full items-center justify-center overflow-hidden rounded-2xl bg-slate-100">
                  {product.image ? (
                    <img
                      src={product.image}
                      alt={product.name}
                      className="h-full w-full object-contain p-2"
                      onError={(e) => {
                        e.target.onerror = null;
                        e.target.src = "https://via.placeholder.com/160?text=Grocery";
                      }}
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center bg-emerald-50 text-4xl">
                      🛒
                    </div>
                  )}

                  {/* Demand Badge */}
                  <span className="absolute top-3 right-3 rounded-full bg-slate-900/80 px-2.5 py-1 text-[11px] font-semibold text-white backdrop-blur-sm">
                    {demand.pooled} pooled in batch
                  </span>

                  <span className="absolute bottom-3 left-3 rounded-full bg-white/90 px-2.5 py-0.5 text-[11px] font-medium text-slate-700 shadow-sm backdrop-blur-sm">
                    {product.category}
                  </span>
                </div>

                {/* Details */}
                <div>
                  <h3 className="text-lg font-bold text-slate-900">{product.name}</h3>
                  <p className="mt-0.5 text-xs text-slate-500">
                    {product.brand ? `${product.brand} • ` : ""}
                    {product.description || "Fresh local grocery staple"}
                  </p>

                  {/* Community Pooling Impact */}
                  <div className="mt-4 rounded-xl bg-slate-50 p-2.5 text-xs">
                    <div className="flex items-center justify-between text-slate-600">
                      <span>Demand Intensity</span>
                      <span className="font-semibold text-emerald-700">{demand.label}</span>
                    </div>
                    <div className="mt-1 flex items-center justify-between text-slate-500">
                      <span>Threshold Boost</span>
                      <span className="font-semibold text-slate-800">+₹{product.price} / unit</span>
                    </div>
                  </div>

                  {/* Price & Stock */}
                  <div className="mt-4 flex items-baseline justify-between">
                    <div>
                      <span className="text-2xl font-extrabold text-slate-900">₹{product.price}</span>
                      <span className="text-xs text-slate-500"> / unit</span>
                    </div>
                    <span className={`text-xs font-medium ${product.stock > 10 ? "text-slate-500" : "text-amber-600"}`}>
                      {product.stock} left in local shop
                    </span>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="border-t border-slate-100 bg-slate-50/60 p-4">
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleAddToPool(product._id)}
                    disabled={product.stock <= 0 || addingId === product._id}
                    className="flex-1 rounded-2xl bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {addingId === product._id ? "Adding..." : "Add to Pool"}
                  </button>

                  {user?.role === "shopkeeper" && product.shopkeeper?._id === user._id && (
                    <button
                      onClick={() => handleDelete(product._id)}
                      className="rounded-2xl border border-slate-300 px-3 py-2 text-xs font-medium text-slate-700 hover:bg-rose-50 hover:text-rose-600 hover:border-rose-300"
                    >
                      Remove
                    </button>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {scopedProducts.length === 0 && (
        <div className="rounded-3xl border border-slate-200 bg-white p-12 text-center shadow-sm">
          <p className="text-lg font-semibold text-slate-700">No products found</p>
          <p className="mt-1 text-sm text-slate-500">Try adjusting your search or category filter.</p>
        </div>
      )}
    </div>
  );
};

export default Products;
