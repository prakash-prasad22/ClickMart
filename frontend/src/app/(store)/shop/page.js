import { Suspense } from 'react';
import Link from 'next/link';
import { PackageSearch } from 'lucide-react';
import ShopFilters, { SortSelect, ActiveFilters } from '@/components/store/ShopFilters';
import { ProductGrid } from '@/components/store/ProductCard';
import { EmptyState } from '@/components/ui';
import { serverApi } from '@/lib/server-api';

export const metadata = { title: 'Shop' };

export default async function ShopPage({ searchParams }) {
  const sp = await searchParams;
  const qs = new URLSearchParams();
  ['q', 'category', 'brand', 'minPrice', 'maxPrice', 'inStock', 'sort', 'page', 'featured'].forEach((k) => sp[k] && qs.set(k, sp[k]));
  qs.set('limit', '24');

  const [data, categories, brands] = await Promise.all([
    serverApi(`/store/products?${qs}`, { revalidate: 30, fallback: { items: [], total: 0, page: 1, pages: 1 } }),
    serverApi('/store/categories', { fallback: [] }),
    serverApi('/store/brands', { fallback: [] }),
  ]);
  const page = data?.page || 1;
  const pages = data?.pages || 1;

  const activeCat = (categories || []).find((c) => c.slug === sp.category);
  const title = sp.q ? `Results for “${sp.q}”` : activeCat?.name || (sp.featured ? 'Editor’s picks' : 'Shop all');

  const pageHref = (p) => {
    const n = new URLSearchParams(qs);
    n.delete('limit');
    n.set('page', String(p));
    return `/shop?${n}`;
  };

  return (
    <div className="container pt-10">
      <div className="border-b border-line pb-8">
        <nav className="text-xs text-muted"><Link href="/" className="hover:text-ink">Home</Link> <span className="mx-1.5">/</span> Shop</nav>
        <h1 className="mt-3 font-display text-4xl font-light sm:text-5xl animate-fade-up">{title}</h1>
        {activeCat?.description && <p className="mt-3 max-w-xl text-muted animate-fade-up" style={{ animationDelay: '80ms' }}>{activeCat.description}</p>}
      </div>

      <Suspense>
        <div className="flex gap-10 pt-8">
          <ShopFilters categories={categories || []} brands={brands || []} />
          <div className="min-w-0 flex-1">
            <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
              <p className="text-sm text-muted">{data?.total || 0} products</p>
              <SortSelect />
            </div>
            <div className="mb-6"><ActiveFilters categories={categories || []} brands={brands || []} /></div>

            {data?.items?.length ? (
              <ProductGrid products={data.items} className="lg:grid-cols-3" />
            ) : (
              <EmptyState icon={<PackageSearch size={26} strokeWidth={1.6} />} title="Nothing here yet" description="Try removing a filter or searching for something else." action={<Link href="/shop" className="btn btn-outline">Clear filters</Link>} />
            )}

            {pages > 1 && (
              <div className="mt-14 flex items-center justify-center gap-2">
                {Array.from({ length: pages }, (_, i) => i + 1).map((p) => (
                  <Link key={p} href={pageHref(p)} className={`flex h-10 w-10 items-center justify-center rounded-full text-sm font-medium transition ${p === page ? 'bg-ink text-white' : 'hover:bg-ink/5'}`}>
                    {p}
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>
      </Suspense>
    </div>
  );
}
