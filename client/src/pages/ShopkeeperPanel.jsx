import { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext.jsx";
import { getProducts, createProduct, deleteProduct } from "../services/productService.js";

const ShopkeeperPanel = () => {
  const { user } = useAuth();
  const [products, setProducts] = useState([]);
  const [message, setMessage] = useState("");
  const [form, setForm] = useState({ name: "", category: "Fruits", brand: "", price: "", stock: "", image: "", description: "" });

  useEffect(() => {
    getProducts().then((resp) => setProducts(resp.products)).catch(() => setMessage("Unable to load products."));
  }, []);

  const handleCreate = async (event) => {
    event.preventDefault();
    try {
      await createProduct({
        ...form,
        price: Number(form.price),
        stock: Number(form.stock),
      });
      setMessage("Product created.");
      setForm({ name: "", category: "Fruits", brand: "", price: "", stock: "", image: "", description: "" });
      const resp = await getProducts();
      setProducts(resp.products);
    } catch (err) {
      setMessage(err.response?.data?.message || "Unable to create product.");
    }
  };

  const handleDelete = async (id) => {
    try {
      await deleteProduct(id);
      setMessage("Product removed.");
      const resp = await getProducts();
      setProducts(resp.products);
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
      {message && <div className="rounded-3xl bg-slate-100 p-4 text-slate-700">{message}</div>}
      <div className="grid gap-6 lg:grid-cols-2">
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
            <button type="submit" className="rounded-2xl bg-slate-900 px-4 py-3 text-white hover:bg-slate-700">
              Save product
            </button>
          </form>
        </section>
        <section className="rounded-3xl bg-white p-6 shadow-sm">
          <h2 className="text-xl font-semibold text-slate-900">Your inventory</h2>
          <div className="mt-4 space-y-4">
            {products.filter((product) => product.shopkeeper?._id === user._id).map((product) => (
              <div key={product._id} className="rounded-3xl border border-slate-200 bg-slate-50 p-4">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <p className="font-semibold text-slate-900">{product.name}</p>
                    <p className="text-sm text-slate-600">₹{product.price} • {product.stock} in stock</p>
                  </div>
                  <button onClick={() => handleDelete(product._id)} className="rounded-2xl border border-rose-200 px-4 py-2 text-sm text-rose-600 hover:bg-rose-50">
                    Remove
                  </button>
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
};

export default ShopkeeperPanel;
