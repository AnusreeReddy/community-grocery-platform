import { Routes, Route } from "react-router-dom";
import AppHeader from "./components/layout/AppHeader.jsx";
import AppFooter from "./components/layout/AppFooter.jsx";
import ProtectedRoute from "./components/ProtectedRoute.jsx";
import Home from "./pages/Home.jsx";
import Login from "./pages/Login.jsx";
import Register from "./pages/Register.jsx";
import Dashboard from "./pages/Dashboard.jsx";
import Communities from "./pages/Communities.jsx";
import CommunityDetail from "./pages/CommunityDetail.jsx";
import Products from "./pages/Products.jsx";
import Cart from "./pages/Cart.jsx";
import Orders from "./pages/Orders.jsx";
import DeliveryTracking from "./pages/DeliveryTracking.jsx";
import AdminPanel from "./pages/AdminPanel.jsx";
import ShopkeeperPanel from "./pages/ShopkeeperPanel.jsx";
import NotFound from "./pages/NotFound.jsx";

function App() {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <AppHeader />
      <main className="max-w-7xl mx-auto px-4 py-8">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            }
          />
          <Route path="/communities" element={<Communities />} />
          <Route path="/communities/:id" element={<CommunityDetail />} />
          <Route path="/products" element={<Products />} />
          <Route
            path="/cart"
            element={
              <ProtectedRoute>
                <Cart />
              </ProtectedRoute>
            }
          />
          <Route
            path="/orders"
            element={
              <ProtectedRoute>
                <Orders />
              </ProtectedRoute>
            }
          />
          <Route
            path="/deliveries"
            element={
              <ProtectedRoute roles={["communityAdmin", "shopkeeper", "superAdmin"]}>
                <DeliveryTracking />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin"
            element={
              <ProtectedRoute roles={["superAdmin"]}>
                <AdminPanel />
              </ProtectedRoute>
            }
          />
          <Route
            path="/shopkeeper"
            element={
              <ProtectedRoute roles={["shopkeeper"]}>
                <ShopkeeperPanel />
              </ProtectedRoute>
            }
          />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </main>
      <AppFooter />
    </div>
  );
}

export default App;
