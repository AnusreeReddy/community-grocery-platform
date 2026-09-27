import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";

const Home = () => {
  const { user } = useAuth();

  return (
    <div className="space-y-12 py-4">
      {/* Hero Section */}
      <section className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-emerald-950 via-teal-900 to-slate-900 px-8 py-14 text-white shadow-xl">
        <div className="relative z-10 max-w-3xl space-y-6">
          <div className="inline-flex items-center gap-2 rounded-full bg-emerald-500/20 px-4 py-1.5 text-xs font-semibold text-emerald-300 ring-1 ring-inset ring-emerald-500/40">
            <span>🌾 Smart Neighborhood Logistics</span>
            <span>•</span>
            <span>Zero Delivery Fees</span>
          </div>

          <h1 className="text-4xl font-extrabold tracking-tight sm:text-5xl">
            Community Grocery Pooling for Smarter Neighborhood Deliveries
          </h1>

          <p className="text-lg text-emerald-100/90 leading-relaxed">
            Replace individual ecommerce delivery vans with pooled neighborhood purchasing.
            Households pool demand together, unlock scheduled bulk truck dispatches when reaching the community threshold, and support local shopkeepers.
          </p>

          <div className="flex flex-wrap gap-4 pt-2">
            <Link
              to={user?.community ? "/dashboard" : "/communities"}
              className="rounded-2xl bg-emerald-500 px-6 py-3.5 text-sm font-bold text-slate-950 shadow-lg transition hover:bg-emerald-400"
            >
              {user?.community ? "Go to My Community Pool" : "Find Your Neighborhood Pool"}
            </Link>
            <Link
              to="/products"
              className="rounded-2xl border border-white/30 bg-white/10 px-6 py-3.5 text-sm font-semibold text-white backdrop-blur-sm transition hover:bg-white/20"
            >
              Browse Local Catalog
            </Link>
          </div>
        </div>
      </section>

      {/* THE CORE VISUAL STORY: 5-STAGE PIPELINE */}
      <section className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
        <div className="text-center max-w-2xl mx-auto">
          <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-800">
            The Pooling Lifecycle
          </span>
          <h2 className="mt-2 text-3xl font-extrabold text-slate-900">
            How Community Pooling Works
          </h2>
          <p className="mt-2 text-sm text-slate-600">
            From neighborhood demand to optimized community drop-off in five simple stages.
          </p>
        </div>

        {/* 5-Step Pipeline Card Grid */}
        <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
          {/* Step 1 */}
          <div className="relative flex flex-col justify-between rounded-2xl border border-emerald-100 bg-emerald-50/50 p-5">
            <div>
              <div className="flex items-center justify-between">
                <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-emerald-600 text-xs font-bold text-white shadow-sm">
                  1
                </span>
                <span className="text-2xl">👥</span>
              </div>
              <h3 className="mt-4 text-base font-bold text-slate-900">
                Community Demand
              </h3>
              <p className="mt-1 text-xs text-slate-600">
                Households across the community add daily grocery staples (Milk, Rice, Veggies) to the pool.
              </p>
            </div>
            <div className="mt-4 border-t border-emerald-200/60 pt-2 text-[11px] font-semibold text-emerald-800">
              Demand Aggregates
            </div>
          </div>

          {/* Step 2 */}
          <div className="relative flex flex-col justify-between rounded-2xl border border-slate-200 bg-slate-50 p-5">
            <div>
              <div className="flex items-center justify-between">
                <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-slate-900 text-xs font-bold text-white shadow-sm">
                  2
                </span>
                <span className="text-2xl">🛒</span>
              </div>
              <h3 className="mt-4 text-base font-bold text-slate-900">
                Pooled Orders
              </h3>
              <p className="mt-1 text-xs text-slate-600">
                Individual cart items combine into an active community batch with live progress tracking.
              </p>
            </div>
            <div className="mt-4 border-t border-slate-200 pt-2 text-[11px] font-semibold text-slate-700">
              Collective Order Value
            </div>
          </div>

          {/* Step 3 */}
          <div className="relative flex flex-col justify-between rounded-2xl border border-amber-100 bg-amber-50/50 p-5">
            <div>
              <div className="flex items-center justify-between">
                <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-amber-600 text-xs font-bold text-white shadow-sm">
                  3
                </span>
                <span className="text-2xl">🎯</span>
              </div>
              <h3 className="mt-4 text-base font-bold text-slate-900">
                Batch Threshold
              </h3>
              <p className="mt-1 text-xs text-slate-600">
                Once the community reaches its minimum threshold (e.g. ₹1,000), bulk dispatch is unlocked.
              </p>
            </div>
            <div className="mt-4 border-t border-amber-200/60 pt-2 text-[11px] font-semibold text-amber-800">
              Target Reached
            </div>
          </div>

          {/* Step 4 */}
          <div className="relative flex flex-col justify-between rounded-2xl border border-blue-100 bg-blue-50/50 p-5">
            <div>
              <div className="flex items-center justify-between">
                <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-blue-600 text-xs font-bold text-white shadow-sm">
                  4
                </span>
                <span className="text-2xl">⏳</span>
              </div>
              <h3 className="mt-4 text-base font-bold text-slate-900">
                Scheduled Cutoff
              </h3>
              <p className="mt-1 text-xs text-slate-600">
                Orders freeze at cutoff for local shopkeepers to pack fresh inventory into batches.
              </p>
            </div>
            <div className="mt-4 border-t border-blue-200/60 pt-2 text-[11px] font-semibold text-blue-800">
              Fulfillment Prepared
            </div>
          </div>

          {/* Step 5 */}
          <div className="relative flex flex-col justify-between rounded-2xl border border-emerald-300 bg-emerald-500/10 p-5 ring-1 ring-emerald-500/30">
            <div>
              <div className="flex items-center justify-between">
                <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-emerald-600 text-xs font-bold text-white shadow-sm">
                  5
                </span>
                <span className="text-2xl">🚚</span>
              </div>
              <h3 className="mt-4 text-base font-bold text-emerald-950">
                Community Delivery
              </h3>
              <p className="mt-1 text-xs text-slate-700">
                A single delivery truck stops sequentially at designated community drop-off hubs.
              </p>
            </div>
            <div className="mt-4 border-t border-emerald-300/60 pt-2 text-[11px] font-bold text-emerald-900">
              Zero Fees & Zero Congestion
            </div>
          </div>
        </div>
      </section>

      {/* Stakeholder Value Cards */}
      <section className="grid gap-6 md:grid-cols-3">
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-100 text-2xl">
            🏡
          </div>
          <h3 className="mt-4 text-lg font-bold text-slate-900">For Neighborhood Residents</h3>
          <p className="mt-2 text-sm text-slate-600">
            Enjoy scheduled grocery deliveries without paying delivery fees, while pooling orders with neighbors to access wholesale freshness.
          </p>
        </div>

        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-100 text-2xl">
            🏪
          </div>
          <h3 className="mt-4 text-lg font-bold text-slate-900">For Local Shopkeepers</h3>
          <p className="mt-2 text-sm text-slate-600">
            Receive consolidated, predictable bulk order batches per community instead of handling piecemeal on-demand packing and dispatches.
          </p>
        </div>

        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-purple-100 text-2xl">
            🌱
          </div>
          <h3 className="mt-4 text-lg font-bold text-slate-900">For the Community & City</h3>
          <p className="mt-2 text-sm text-slate-600">
            Consolidating 20 individual delivery trips into a single scheduled truck corridor cuts neighborhood vehicle congestion and urban carbon emissions.
          </p>
        </div>
      </section>
    </div>
  );
};

export default Home;
