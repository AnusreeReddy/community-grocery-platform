import { Link } from "react-router-dom";

const NotFound = () => (
  <div className="rounded-3xl bg-white p-10 text-center shadow-sm">
    <h1 className="text-4xl font-semibold text-slate-900">404</h1>
    <p className="mt-4 text-slate-600">Page not found.</p>
    <Link to="/" className="mt-6 inline-flex rounded-2xl bg-slate-900 px-6 py-3 text-white hover:bg-slate-700">
      Back to home
    </Link>
  </div>
);

export default NotFound;
