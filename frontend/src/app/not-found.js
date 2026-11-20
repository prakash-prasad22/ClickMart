import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-6 text-center">
      <p className="eyebrow">Error 404</p>
      <h1 className="mt-4 font-display text-6xl font-light">Page not found</h1>
      <p className="mt-4 max-w-md text-muted">The page you’re looking for may have moved, or the product is no longer available.</p>
      <div className="mt-8 flex gap-3">
        <Link href="/" className="btn btn-primary">Back to home</Link>
        <Link href="/shop" className="btn btn-outline">Browse shop</Link>
      </div>
    </div>
  );
}
