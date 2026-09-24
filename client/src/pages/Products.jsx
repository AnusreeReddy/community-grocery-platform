import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import { getCommunity } from "../services/communityService.js";
import { getProducts, searchProducts, getProductsByCategory } from "../services/productService.js";
import { addToCart } from "../services/cartService.js";

const categories = ["Fruits", "Vegetables", "Bakery", "Dairy", "Pantry", "Grains"];

const Products = () => {
  const { user } = useAuth();
  const communityId = user?.community?._id || user?.community || null;

  const [community, setCommunity] = useState(null);
  const [products, setProducts] = useState([]);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(true);

  const loadProducts = () => {
    setLoading(true);
    getProducts(communityId)
      .then((resp) => setProducts(resp.products))
      .catch(() => setMessage("Unable to load products."))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    // Shoppers with no community joined see the join prompt below instead
    // of a flat catalog -- products are scoped to a community, so there is
    // nothing meaningful to shop from until one is chosen.
    if (user?.role === "customer" && !communityId) {
      setLoading(false);
      return;
    }
    loadProducts();
    if (communityId) {
      getCommunity(communityId).then((resp) => setCommunity(resp.community)).catch(() => {});
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [communityId]);

  const handleSearch = async () => {
    if (!search) return loadProducts();
    try {
      const resp = await searchProducts(search, communityId);
      setProducts(resp.products);
    } catch {
      setMessage("Search failed.");
    }
  };

  const handleCategory = async (value) => {
    setCategory(value);
    if (!value) return loadProducts();
    try {
      const resp = await getProductsByCategory(value, communityId);
      setProducts(resp.products);
    } catch {
      setMessage("Unable to filter products.");
    }
  };

  const handleAddToCart = async (id) => {
    try {
      await addToCart(id, 1);
      setMessage("Added to cart successfully.");
    } catch (err) {
      setMessage(err.response?.data?.message || "Unable to add to cart.");
    }
  };

  if (user?.role === "customer" && !communityId) {
    return (
      <div className="rounded-3xl bg-white p-10 text-center shadow-sm">
        <h1 className="text-2xl font-semibold text-slate-900">Join a community to start shopping</h1>
        <p className="mx-auto mt-3 max-w-md text-slate-600">
          Products, prices, and delivery batches are all specific to your community's local shopkeepers and delivery
          schedule. Pick a community to see what's available.
        </p>
        <Link to="/communities" className="mt-6 inline-flex rounded-2xl bg-slate-900 px-5 py-3 text-white hover:bg-slate-700">
          Browse communities
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="rounded-3xl bg-white p-6 shadow-sm">
        <h1 className="text-2xl font-semibold text-slate-900">Products</h1>
        <p className="mt-2 text-slate-600">
          {community ? (
            <>Available in <strong>{community.name}</strong>.</>
          ) : (
            "Browse inventory from community and local shops."
          )}
        </p>
        <div className="mt-6 flex flex-wrap gap-3">
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search products" className="rounded-2xl border border-slate-300 bg-slate-50 px-4 py-3 text-slate-900" />
          <button onClick={handleSearch} className="rounded-2xl bg-slate-900 px-4 py-3 text-white hover:bg-slate-700">Search</button>
          <select value={category} onChange={(e) => handleCategory(e.target.value)} className="rounded-2xl border border-slate-300 bg-slate-50 px-4 py-3 text-slate-900">
            <option value="">All categories</option>
            {categories.map((item) => (
              <option key={item} value={item}>{item}</option>
            ))}
          </select>
        </div>
      </div>
      {message && <div className="rounded-3xl bg-slate-100 p-4 text-slate-700">{message}</div>}
      {loading ? (
        <p className="text-slate-600">Loading products...</p>
      ) : (
        <div className="grid gap-6 md:grid-cols-2">
          {products.map((product) => (
            <div key={product._id} className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
              <div className="flex items-start gap-4">
                <div className="h-20 w-20 overflow-hidden rounded-3xl bg-slate-100">
                  <img src={product.image || "https://via.placeholder.com/120"} alt={product.name} className="h-full w-full object-cover" />
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-slate-900">{product.name}</h3>
                  <p className="mt-1 text-sm text-slate-600">{product.brand || "Local shop"}</p>
                  <p className="mt-3 text-slate-900">₹{product.price} • {product.stock > 0 ? `${product.stock} in stock` : "Out of stock"}</p>
                </div>
              </div>
              <div className="mt-4 flex flex-wrap items-center gap-3">
                <button
                  onClick={() => handleAddToCart(product._id)}
                  disabled={product.stock <= 0 || (user?.role !== "customer" && user)}
                  className="rounded-2xl bg-slate-900 px-4 py-2 text-sm text-white hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Add to cart
                </button>
              </div>
            </div>
          ))}
          {products.length === 0 && <p className="text-slate-600">No products available yet.</p>}
        </div>
      )}
    </div>
  );
};

export default Products;
