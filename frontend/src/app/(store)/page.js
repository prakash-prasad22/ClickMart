import Link from 'next/link';
import { ArrowRight, Leaf, Truck, Wallet, RotateCcw } from 'lucide-react';
import HeroCarousel from '@/components/store/HeroCarousel';
import SectionHeader from '@/components/store/SectionHeader';
import { ProductGrid } from '@/components/store/ProductCard';
import ProductCard from '@/components/store/ProductCard';
import Img from '@/components/ui/Img';
import { Reveal } from '@/components/ui';
import { serverApi } from '@/lib/server-api';

export const revalidate = 60;

const PROMISES = [
  { icon: Leaf, title: 'Hand-sorted quality', text: 'Every batch checked by hand' },
  { icon: Truck, title: 'Fast Patna delivery', text: 'Most orders within 24–48 hrs' },
  { icon: Wallet, title: 'Cash on delivery', text: 'Pay when it reaches you' },
  { icon: RotateCcw, title: 'Easy saree returns', text: '7-day hassle-free returns' },
];

export default async function HomePage() {
  const data = (await serverApi('/store/home', { fallback: null })) || {};
  const { heroBanners = [], promoBanners = [], categories = [], featured = [], bestsellers = [], newArrivals = [], brands = [], offers = [] } = data;

  return (
    <>
      <HeroCarousel banners={heroBanners} />

      {/* Promises */}
      <section className="container mt-6">
        <div className="grid grid-cols-2 gap-px overflow-hidden rounded-2xl border border-line bg-line lg:grid-cols-4">
          {PROMISES.map(({ icon: Icon, title, text }, i) => (
            <Reveal key={title} delay={i * 70} className="flex items-center gap-4 bg-bg p-5 sm:p-6">
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-primary-soft text-primary">
                <Icon size={19} strokeWidth={1.7} />
              </span>
              <div>
                <p className="text-sm font-semibold">{title}</p>
                <p className="mt-0.5 text-xs text-muted">{text}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      {/* Categories */}
      {categories.length > 0 && (
        <section className="container mt-24">
          <SectionHeader eyebrow="Shop by category" title="Thoughtfully curated" href="/shop" linkLabel="Shop all" />
          <div className="grid grid-cols-2 gap-4 sm:gap-6 lg:grid-cols-3">
            {categories.slice(0, 6).map((c, i) => (
              <Reveal key={c._id} delay={i * 80}>
                <Link href={`/shop?category=${c.slug}`} className="group relative block overflow-hidden rounded-2xl">
                  <Img src={c.image} alt={c.name} className="aspect-[4/5] transition-transform duration-[1400ms] ease-quiet group-hover:scale-105 sm:aspect-[5/6]" />
                  <div className="absolute inset-0 bg-gradient-to-t from-ink/70 via-ink/5 to-transparent transition-opacity duration-500 group-hover:from-ink/80" />
                  <div className="absolute inset-x-0 bottom-0 flex items-end justify-between gap-3 p-5 sm:p-7">
                    <div className="text-white">
                      <h3 className="font-display text-2xl font-normal sm:text-3xl">{c.name}</h3>
                      {c.description && <p className="mt-1 hidden max-w-[16rem] text-sm text-white/75 sm:block">{c.description}</p>}
                    </div>
                    <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-white text-ink transition-all duration-500 ease-quiet group-hover:-rotate-45 group-hover:bg-primary group-hover:text-white">
                      <ArrowRight size={18} />
                    </span>
                  </div>
                </Link>
              </Reveal>
            ))}
          </div>
        </section>
      )}

      {/* Featured */}
      {featured.length > 0 && (
        <section className="container mt-24">
          <SectionHeader eyebrow="Editor’s picks" title="Curated for you" description="Our most-loved dry fruits and handwoven sarees, chosen by the team." href="/shop?featured=true" />
          <ProductGrid products={featured} />
        </section>
      )}

      {/* Offer band */}
      {(offers.length > 0 || promoBanners.length > 0) && (
        <section className="container mt-24">
          <div className="grid gap-4 lg:grid-cols-2">
            {offers.slice(0, 1).map((o) => (
              <Reveal key={o._id} className="relative overflow-hidden rounded-[28px] bg-primary p-10 text-primary-fg sm:p-14">
                <div className="absolute -right-16 -top-16 h-64 w-64 rounded-full bg-white/10" />
                <div className="absolute -bottom-24 right-24 h-48 w-48 rounded-full bg-white/10" />
                <p className="eyebrow text-white/80">Limited time</p>
                <h3 className="relative mt-4 font-display text-4xl font-light leading-tight sm:text-5xl">{o.title}</h3>
                {o.description && <p className="relative mt-3 max-w-sm text-white/80">{o.description}</p>}
                <Link href="/shop" className="btn relative mt-8 bg-white text-ink hover:bg-white/90">Shop the offer <ArrowRight size={16} /></Link>
              </Reveal>
            ))}
            {promoBanners.slice(0, offers.length ? 1 : 2).map((b) => (
              <Reveal key={b._id} delay={100}>
                <Link href={b.link || '/shop'} className="group relative flex h-full min-h-[280px] flex-col justify-end overflow-hidden rounded-[28px] bg-ink p-10 text-white sm:p-14">
                  {b.image ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={b.image} alt="" className="absolute inset-0 h-full w-full object-cover opacity-70 transition-transform duration-[1400ms] ease-quiet group-hover:scale-105" />
                  ) : (
                    <div className="absolute inset-0" style={{ background: 'radial-gradient(90% 80% at 90% 10%, rgb(var(--accent)/.5), transparent 60%)' }} />
                  )}
                  <div className="relative">
                    <h3 className="font-display text-4xl font-light">{b.title}</h3>
                    {b.subtitle && <p className="mt-2 text-white/75">{b.subtitle}</p>}
                    <span className="mt-6 inline-flex items-center gap-2 text-sm font-semibold transition-all group-hover:gap-3">{b.ctaLabel || 'Shop now'} <ArrowRight size={16} /></span>
                  </div>
                </Link>
              </Reveal>
            ))}
          </div>
        </section>
      )}

      {/* Bestsellers rail */}
      {bestsellers.length > 0 && (
        <section className="mt-24">
          <div className="container">
            <SectionHeader eyebrow="Loved in Patna" title="Bestsellers" href="/shop?sort=popular" />
          </div>
          <div className="container">
            <div className="-mx-4 flex snap-x snap-mandatory gap-5 overflow-x-auto px-4 pb-4 scrollbar-none sm:-mx-6 sm:px-6 lg:mx-0 lg:px-0">
              {bestsellers.map((p) => (
                <div key={p._id} className="w-[62%] shrink-0 snap-start sm:w-[38%] md:w-[30%] lg:w-[23%]">
                  <ProductCard product={p} />
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Story */}
      <section className="container mt-24">
        <div className="grid items-center gap-10 overflow-hidden rounded-[28px] bg-surface-alt/70 p-8 sm:p-14 lg:grid-cols-2 lg:gap-16">
          <Reveal>
            <p className="eyebrow">Our story</p>
            <h2 className="section-title mt-3 text-balance">From orchards & looms, to homes in Patna</h2>
            <p className="mt-5 leading-relaxed text-muted">
              We work directly with growers in Kashmir and Afghanistan for our dry fruits, and with weaving families in
              Bhagalpur, Banaras and Madhubani for our sarees. Fewer middlemen means fresher produce, fairer prices for
              artisans — and better value for you.
            </p>
            <div className="mt-8 grid grid-cols-3 gap-6 border-t border-line pt-8">
              {[['40+', 'Artisan partners'], ['100%', 'Hand-sorted'], ['24h', 'Patna delivery']].map(([n, l]) => (
                <div key={l}>
                  <p className="font-display text-3xl font-light text-primary">{n}</p>
                  <p className="mt-1 text-xs text-muted">{l}</p>
                </div>
              ))}
            </div>
          </Reveal>
          <Reveal delay={120} className="grid grid-cols-2 gap-4">
            <Img alt="Dry fruits" fallbackLabel="Dry fruits" className="aspect-[3/4] rounded-2xl" />
            <Img alt="Sarees" fallbackLabel="Sarees" className="mt-10 aspect-[3/4] rounded-2xl" />
          </Reveal>
        </div>
      </section>

      {/* New arrivals */}
      {newArrivals.length > 0 && (
        <section className="container mt-24">
          <SectionHeader eyebrow="Just landed" title="New arrivals" href="/shop?sort=newest" />
          <ProductGrid products={newArrivals} />
        </section>
      )}

      {/* Brands */}
      {brands.length > 0 && (
        <section className="container mt-24">
          <Reveal className="text-center">
            <p className="eyebrow">Brands we carry</p>
          </Reveal>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            {brands.map((b, i) => (
              <Reveal key={b._id} delay={i * 40}>
                <Link href={`/shop?brand=${b.slug}`} className="flex h-14 items-center gap-3 rounded-full border border-line bg-surface px-6 transition duration-300 hover:-translate-y-0.5 hover:border-ink/30 hover:shadow-soft">
                  {b.logo && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={b.logo} alt="" className="h-7 w-7 rounded-full object-cover" />
                  )}
                  <span className="font-display text-lg">{b.name}</span>
                </Link>
              </Reveal>
            ))}
          </div>
        </section>
      )}

      {!featured.length && !newArrivals.length && (
        <section className="container mt-20">
          <div className="card p-10 text-center">
            <p className="font-display text-2xl">Your store is almost ready</p>
            <p className="mx-auto mt-2 max-w-md text-sm text-muted">
              Connect MongoDB in <code>backend/.env</code>, run <code>npm run seed</code>, then add products from the admin panel.
            </p>
          </div>
        </section>
      )}
    </>
  );
}
