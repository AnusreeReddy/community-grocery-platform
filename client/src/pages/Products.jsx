import { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext.jsx";
import { getProducts, searchProducts, getProductsByCategory, deleteProduct, createProduct } from "../services/productService.js";
import { addToCart } from "../services/cartService.js";

const categories = ["Fruits", "Vegetables", "Bakery", "Dairy", "Pantry"];

const Products = () => {
  const { user } = useAuth();
  const [products, setProducts] = useState([]);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("");
  const [message, setMessage] = useState("");
  const [newProduct, setNewProduct] = useState({ name: "", category: "Fruits", price: "", stock: "", description: "", brand: "", image: "" });

  const loadProducts = () => {
    getProducts().then((resp) => setProducts(resp.products)).catch(() => setMessage("Unable to load products."));
  };

  useEffect(() => {
    loadProducts();
  }, []);

  const handleSearch = async () => {
    if (!search) {
      return loadProducts();
    }

    try {
      const resp = await searchProducts(search);
      setProducts(resp.products);
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

  const handleCreate = async (event) => {
    event.preventDefault();
    try {
      await createProduct({
        ...newProduct,
        price: Number(newProduct.price),
        stock: Number(newProduct.stock),
      });
      loadProducts();
      setNewProduct({ name: "", category: "Fruits", price: "", stock: "", description: "", brand: "", image: "" });
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

  return (
    <div className="space-y-6">
      <div className="rounded-3xl bg-white p-6 shadow-sm">
        <h1 className="text-2xl font-semibold text-slate-900">Products</h1>
        <p className="mt-2 text-slate-600">Browse inventory from community and local shops.</p>
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
      {user?.role === "shopkeeper" && (
        <div className="rounded-3xl bg-white p-6 shadow-sm">
          <h2 className="text-xl font-semibold text-slate-900">Add inventory</h2>
          <form className="mt-6 grid gap-4 md:grid-cols-2" onSubmit={handleCreate}>
            {[
              { label: "Name", field: "name" },
              { label: "Category", field: "category" },
              { label: "Brand", field: "brand" },
              { label: "Price", field: "price" },
              { label: "Stock", field: "stock" },
              { label: "Image URL", field: "image" },
            ].map((item) => (
              <label key={item.field} className="block">
                <span className="text-sm text-slate-700">{item.label}</span>
                <input
                  value={newProduct[item.field]}
                  onChange={(e) => setNewProduct({ ...newProduct, [item.field]: e.target.value })}
                  type="text"
                  className="mt-2 w-full rounded-2xl border border-slate-300 bg-slate-50 px-4 py-3 text-slate-900"
                />
              </label>
            ))}
            <button type="submit" className="mt-3 rounded-2xl bg-slate-900 px-4 py-3 text-white hover:bg-slate-700 md:col-span-2">
              Save product
            </button>
          </form>
        </div>
      )}
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
                <p className="mt-3 text-slate-900">₹{product.price} • {product.stock} in stock</p>
              </div>
            </div>
            <div className="mt-4 flex flex-wrap items-center gap-3">
              <button onClick={() => handleAddToCart(product._id)} className="rounded-2xl bg-slate-900 px-4 py-2 text-sm text-white hover:bg-slate-700">
                Add to cart
              </button>
              {user?.role === "shopkeeper" && product.shopkeeper?._id === user._id && (
                <button onClick={() => handleDelete(product._id)} className="rounded-2xl border border-slate-300 px-4 py-2 text-sm text-slate-900 hover:bg-slate-50">
                  Remove
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Products;
