import Link from "next/link";

export default function NotFound() {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center px-4 text-center">
      <h1 className="text-2xl font-semibold text-text-primary">Page not found</h1>
      <p className="mt-2 text-text-secondary">The page you requested does not exist.</p>
      <Link
        href="/"
        className="mt-6 rounded-xl bg-brand-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-brand-700"
      >
        Back to home
      </Link>
    </div>
  );
}
