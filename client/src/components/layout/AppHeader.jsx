import { Link, NavLink } from "react-router-dom";
import { useAuth } from "../../context/AuthContext.jsx";

const AppHeader = () => {
  const { user, logout } = useAuth();

  return (
    <header className="border-b border-slate-200 bg-white shadow-sm">
      <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-4 px-4 py-4">
        <Link to="/" className="text-xl font-semibold text-slate-900">
          GroceryPool
        </Link>
        <nav className="flex flex-wrap items-center gap-3 text-sm text-slate-700">
          <NavLink to="/" className={({ isActive }) => isActive ? "font-semibold text-slate-900" : "hover:text-slate-900"}>
            Home
          </NavLink>
          <NavLink to="/communities" className={({ isActive }) => isActive ? "font-semibold text-slate-900" : "hover:text-slate-900"}>
            Communities
          </NavLink>
          <NavLink to="/products" className={({ isActive }) => isActive ? "font-semibold text-slate-900" : "hover:text-slate-900"}>
            Products
          </NavLink>
          {user && (
            <>
              <NavLink to="/cart" className={({ isActive }) => isActive ? "font-semibold text-slate-900" : "hover:text-slate-900"}>
                Cart
              </NavLink>
              <NavLink to="/orders" className={({ isActive }) => isActive ? "font-semibold text-slate-900" : "hover:text-slate-900"}>
                Orders
              </NavLink>
              {(user.role === "communityAdmin" || user.role === "shopkeeper" || user.role === "superAdmin") && (
                <NavLink to="/deliveries" className={({ isActive }) => isActive ? "font-semibold text-slate-900" : "hover:text-slate-900"}>
                  Deliveries
                </NavLink>
              )}
            </>
          )}
          {user?.role === "superAdmin" && (
            <NavLink to="/admin" className={({ isActive }) => isActive ? "font-semibold text-slate-900" : "hover:text-slate-900"}>
              Admin
            </NavLink>
          )}
          {user?.role === "shopkeeper" && (
            <NavLink to="/shopkeeper" className={({ isActive }) => isActive ? "font-semibold text-slate-900" : "hover:text-slate-900"}>
              Shopkeeper
            </NavLink>
          )}
        </nav>
        <div className="flex items-center gap-3">
          {user ? (
            <>
              <span className="text-sm text-slate-600">{user.fullName}</span>
              <button onClick={logout} className="rounded bg-slate-900 px-4 py-2 text-white hover:bg-slate-700">
                Logout
              </button>
            </>
          ) : (
            <div className="flex items-center gap-2">
              <Link to="/login" className="rounded border border-slate-300 px-4 py-2 text-sm hover:bg-slate-50">
                Login
              </Link>
              <Link to="/register" className="rounded bg-slate-900 px-4 py-2 text-sm text-white hover:bg-slate-700">
                Register
              </Link>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default AppHeader;
