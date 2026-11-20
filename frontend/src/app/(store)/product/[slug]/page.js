import Link from 'next/link';
import { notFound } from 'next/navigation';
import ProductGallery from '@/components/store/ProductGallery';
import ProductPurchase from '@/components/store/ProductPurchase';
import Accordion from '@/components/store/Accordion';
import Reviews from '@/components/store/Reviews';
import SectionHeader from '@/components/store/SectionHeader';
import { ProductGrid } from '@/components/store/ProductCard';
import { serverApi } from '@/lib/server-api';

export const revalidate = 60;

export async function generateMetadata({ params }) {
  const { slug } = await params;
  const data = await serverApi(`/store/products/${slug}`);
  if (!data?.product) return { title: 'Product' };
  const p = data.product;
  return {
    title: p.seo?.title || p.name,
    description: p.seo?.description || p.shortDescription,
    openGraph: { images: p.images?.slice(0, 1) },
  };
}

export default async function ProductPage({ params }) {
  const { slug } = await params;
  const [data, settings] = await Promise.all([serverApi(`/store/products/${slug}`), serverApi('/store/settings', { fallback: {} })]);
  if (!data?.product) notFound();
  const { product, reviews, related, ratingDistribution } = data;

  const details = [
    product.description && { title: 'Description', content: <p className="whitespace-pre-line">{product.description}</p> },
    product.attributes?.length && {
      title: 'Details',
      content: (
        <dl className="grid grid-cols-[140px_1fr] gap-y-2">
          {product.attributes.map((a) => (
            <div key={a.key} className="contents">
              <dt className="text-muted">{a.key}</dt>
              <dd>{a.value}</dd>
            </div>
          ))}
        </dl>
      ),
    },
    {
      title: 'Delivery & returns',
      content: (
        <p>
          We deliver across Patna, usually within 24–48 hours. Cash on delivery is available. Sarees can be returned
          within 7 days if unused with tags intact. Food items can’t be returned once opened, but we’ll replace anything
          that arrives damaged. <Link href="/help" className="text-primary underline">Read our policies</Link>.
        </p>
      ),
    },
  ].filter(Boolean);

  return (
    <div className="container pt-8">
      <nav className="text-xs text-muted">
        <Link href="/" className="hover:text-ink">Home</Link>
        <span className="mx-1.5">/</span>
        <Link href="/shop" className="hover:text-ink">Shop</Link>
        {product.category && (
          <>
            <span className="mx-1.5">/</span>
            <Link href={`/shop?category=${product.category.slug}`} className="hover:text-ink">{product.category.name}</Link>
          </>
        )}
      </nav>

      <div className="mt-6 grid gap-10 lg:grid-cols-[1.15fr_1fr] lg:gap-16">
        <div className="lg:sticky lg:top-24 lg:self-start animate-fade-in">
          <ProductGallery images={product.images} name={product.name} />
        </div>
        <div className="animate-fade-up">
          <ProductPurchase product={product} settings={settings} />
          <div className="mt-10">
            <Accordion items={details} />
          </div>
        </div>
      </div>

      <div className="mt-24">
        <Reviews product={product} reviews={reviews} distribution={ratingDistribution} />
      </div>

      {related?.length > 0 && (
        <section className="mt-24">
          <SectionHeader eyebrow="You may also like" title="Pairs well with" />
          <ProductGrid products={related.slice(0, 4)} />
        </section>
      )}
    </div>
  );
}
