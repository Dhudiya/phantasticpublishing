import { Link } from "react-router-dom";
import SEO from "../components/SEO";
import SchemaInjector from "../components/SchemaInjector";

export default function NotFoundPage() {
  return (
    <div>
      <SEO title="Page Not Found" description="The page you were looking for could not be found." canonicalPath="/404" noindex />
      <SchemaInjector schemas={[]} />
      <section className="min-h-screen flex items-center justify-center bg-neutral-950 text-white px-4">
        <div className="text-center max-w-md">
          <p className="font-serif text-7xl sm:text-8xl font-bold text-neutral-700 mb-4">404</p>
          <h1 className="font-serif text-2xl sm:text-3xl font-bold mb-3">Page Not Found</h1>
          <p className="text-neutral-400 text-sm sm:text-base mb-8">
            The page you were looking for doesn't exist or may have been moved.
          </p>
          <Link
            to="/"
            className="inline-flex items-center justify-center gap-2 glass-btn text-neutral-900 px-6 py-3 text-sm font-medium rounded-full"
          >
            Back to Home
          </Link>
        </div>
      </section>
    </div>
  );
}
