import { Link } from "react-router-dom";

const Home = () => (
  <section className="space-y-10 py-8">
    <div className="rounded-3xl bg-gradient-to-r from-slate-900 to-slate-700 px-8 py-12 text-white shadow-xl">
      <div className="max-w-3xl space-y-6">
        <h1 className="text-4xl font-semibold">Community Grocery Pooling for smarter deliveries</h1>
        <p className="text-slate-200">Connect local buyers, optimize truck routes, reduce waste, and support shopkeepers with a community-first ordering platform.</p>
        <div className="flex flex-wrap gap-4">
          <Link to="/communities" className="rounded bg-white px-6 py-3 text-slate-900 shadow hover:bg-slate-100">
            Explore Communities
          </Link>
          <Link to="/products" className="rounded border border-white px-6 py-3 text-white hover:bg-white/10">
            Browse Products
          </Link>
        </div>
      </div>
    </div>

    <div className="grid gap-6 lg:grid-cols-3">
      {[
        { title: "Community Ordering", description: "Users place pooled orders for their neighborhood delivery cycle." },
        { title: "Threshold Engine", description: "Deliveries confirm automatically when community order value meets target." },
        { title: "Local Shop Support", description: "Shopkeepers manage inventory and serve community demand." },
      ].map((card) => (
        <article key={card.title} className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-xl font-semibold text-slate-900">{card.title}</h2>
          <p className="mt-3 text-slate-600">{card.description}</p>
        </article>
      ))}
    </div>
  </section>
);

export default Home;
