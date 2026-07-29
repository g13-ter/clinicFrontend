import { Link } from "react-router-dom";
import Layout from "../layout/Layout";

function NotFoundPage() {
  return (
    <Layout>
      <div className="mx-auto mt-12 max-w-lg rounded-xl border border-gray-200 bg-white p-8 text-center shadow-sm">
        <p className="text-sm font-semibold uppercase tracking-wide text-blue-600">404</p>
        <h1 className="mt-2 text-2xl font-bold text-gray-900">Page not found</h1>
        <p className="mt-2 text-sm text-gray-600">
          The address may be incorrect, or the page may have moved.
        </p>
        <Link
          to="/dashboard"
          className="mt-6 inline-flex rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
        >
          Return to Dashboard
        </Link>
      </div>
    </Layout>
  );
}

export default NotFoundPage;
