import { useEffect, useState } from "react";
import { Link, NavLink } from "react-router-dom";
import { useAuth } from "../../context/AuthContext.jsx";
import { getCommunity } from "../../services/communityService.js";

const AppHeader = () => {
  const { user, logout } = useAuth();
  const [communityName, setCommunityName] = useState("");

  useEffect(() => {
    if (user?.community) {
      getCommunity(user.community)
        .then((resp) => setCommunityName(resp.community?.name || ""))
        .catch(() => {});
    } else {
      setCommunityName("");
    }
  }, [user]);

  return (
    <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/95 backdrop-blur-md shadow-xs">
      <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-4 px-4 py-3.5">
        <div className="flex items-center gap-3">
          <Link to="/" className="flex items-center gap-2">
            <span className="flex h-9 w-9 items-center justify-center rounded-2xl bg-emerald-600 text-white font-black text-lg shadow-sm">
              🌾
            </span>
            <div>
              <span className="text-lg font-black tracking-tight text-slate-900 block leading-tight">
                GroceryPool
              </span>
              <span className="text-[10px] font-semibold uppercase tracking-wider text-emerald-700 block">
                Community-First Pooling
              </span>
            </div>
          </Link>

          {/* User's Community Badge */}
          {user && communityName && (
            <Link
              to="/dashboard"
              className="hidden sm:inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-800 border border-emerald-200/80 hover:bg-emerald-100 transition"
            >
              <span>🏡</span>
              <span className="truncate max-w-[160px]">{communityName}</span>
            </Link>
          )}
        </div>

        <nav className="flex flex-wrap items-center gap-1.5 text-sm text-slate-700">
          <NavLink
            to="/"
            className={({ isActive }) =>
              `rounded-xl px-3 py-1.5 transition ${
                isActive ? "bg-slate-100 font-bold text-slate-900" : "text-slate-600 hover:text-slate-900"
              }`
            }
          >
            Home
          </NavLink>

          {user && (
            <NavLink
              to="/dashboard"
              className={({ isActive }) =>
                `rounded-xl px-3 py-1.5 transition ${
                  isActive ? "bg-slate-100 font-bold text-slate-900" : "text-slate-600 hover:text-slate-900"
                }`
              }
            >
              Dashboard
            </NavLink>
          )}

          <NavLink
            to="/communities"
            className={({ isActive }) =>
              `rounded-xl px-3 py-1.5 transition ${
                isActive ? "bg-slate-100 font-bold text-slate-900" : "text-slate-600 hover:text-slate-900"
              }`
            }
          >
            Communities
          </NavLink>

          <NavLink
            to="/products"
            className={({ isActive }) =>
              `rounded-xl px-3 py-1.5 transition ${
                isActive ? "bg-slate-100 font-bold text-slate-900" : "text-slate-600 hover:text-slate-900"
              }`
            }
          >
            Products
          </NavLink>

          {user && (
            <>
              <NavLink
                to="/cart"
                className={({ isActive }) =>
                  `rounded-xl px-3 py-1.5 transition flex items-center gap-1 ${
                    isActive ? "bg-slate-100 font-bold text-slate-900" : "text-slate-600 hover:text-slate-900"
                  }`
                }
              >
                <span>Pool Cart</span>
              </NavLink>

              <NavLink
                to="/orders"
                className={({ isActive }) =>
                  `rounded-xl px-3 py-1.5 transition ${
                    isActive ? "bg-slate-100 font-bold text-slate-900" : "text-slate-600 hover:text-slate-900"
                  }`
                }
              >
                Orders
              </NavLink>

              {(user.role === "communityAdmin" || user.role === "shopkeeper" || user.role === "superAdmin") && (
                <NavLink
                  to="/deliveries"
                  className={({ isActive }) =>
                    `rounded-xl px-3 py-1.5 transition ${
                      isActive ? "bg-slate-100 font-bold text-slate-900" : "text-slate-600 hover:text-slate-900"
                    }`
                  }
                >
                  Deliveries
                </NavLink>
              )}
            </>
          )}

          {user?.role === "superAdmin" && (
            <NavLink
              to="/admin"
              className={({ isActive }) =>
                `rounded-xl px-3 py-1.5 transition ${
                  isActive ? "bg-slate-100 font-bold text-slate-900" : "text-slate-600 hover:text-slate-900"
                }`
              }
            >
              Admin
            </NavLink>
          )}

          {user?.role === "shopkeeper" && (
            <NavLink
              to="/shopkeeper"
              className={({ isActive }) =>
                `rounded-xl px-3 py-1.5 transition ${
                  isActive ? "bg-slate-100 font-bold text-slate-900" : "text-slate-600 hover:text-slate-900"
                }`
              }
            >
              Shopkeeper
            </NavLink>
          )}
        </nav>

        <div className="flex items-center gap-3">
          {user ? (
            <div className="flex items-center gap-2">
              <span className="hidden text-xs text-slate-600 md:inline font-medium">
                {user.fullName}
              </span>
              <button
                onClick={logout}
                className="rounded-2xl border border-slate-200 bg-slate-50 px-3.5 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-100 transition"
              >
                Logout
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Link
                to="/login"
                className="rounded-2xl border border-slate-300 px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition"
              >
                Login
              </Link>
              <Link
                to="/register"
                className="rounded-2xl bg-emerald-600 px-4 py-2 text-xs font-semibold text-white shadow-sm hover:bg-emerald-500 transition"
              >
                Join Pool
              </Link>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default AppHeader;
