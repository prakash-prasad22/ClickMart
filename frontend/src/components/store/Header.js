'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Search, User, Heart, ShoppingBag, Menu, ChevronDown, ArrowRight } from 'lucide-react';
import Logo from './Logo';
import SearchOverlay from './SearchOverlay';
import CartDrawer from './CartDrawer';
import { Drawer } from '@/components/ui/Modal';
import { useCart } from '@/context/CartContext';
import { useAuth } from '@/context/AuthContext';
import { cn } from '@/lib/utils';

function buildTree(categories = []) {
  const roots = categories.filter((c) => !c.parent);
  return roots.map((r) => ({ ...r, children: categories.filter((c) => String(c.parent) === String(r._id)) }));
}

export default function Header({ settings, categories }) {
  const [scrolled, setScrolled] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [megaOpen, setMegaOpen] = useState(false);
  const { count, openDrawer } = useCart();
  const { user, wishlist } = useAuth();
  const pathname = usePathname();
  const tree = buildTree(categories);
  const [bump, setBump] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    setMenuOpen(false);
    setMegaOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!count) return undefined;
    setBump(true);
    const t = setTimeout(() => setBump(false), 400);
    return () => clearTimeout(t);
  }, [count]);

  const iconBtn = 'relative flex h-10 w-10 items-center justify-center rounded-full text-ink-soft transition-colors duration-300 hover:bg-ink/5 hover:text-ink';

  return (
    <>
      {settings?.announcement && (
        <div className="bg-ink text-center text-[12.5px] tracking-wide text-white/85">
          <div className="container py-2">{settings.announcement}</div>
        </div>
      )}

      <header
        className={cn(
          'sticky top-0 z-50 transition-all duration-500 ease-quiet',
          scrolled ? 'border-b border-line/80 bg-bg/85 shadow-[0_8px_30px_-20px_rgb(var(--ink)/0.25)] backdrop-blur-xl' : 'border-b border-transparent bg-bg'
        )}
        onMouseLeave={() => setMegaOpen(false)}
      >
        <div className={cn('container flex items-center gap-4 transition-all duration-500', scrolled ? 'h-16' : 'h-[72px]')}>
          <button type="button" className={cn(iconBtn, 'lg:hidden -ml-2')} onClick={() => setMenuOpen(true)} aria-label="Open menu">
            <Menu size={20} />
          </button>

          <Logo name={settings?.storeName} />

          <nav className="ml-10 hidden items-center gap-7 text-[14px] font-medium text-ink-soft lg:flex">
            <button type="button" onMouseEnter={() => setMegaOpen(true)} onClick={() => setMegaOpen((v) => !v)} className="flex items-center gap-1 transition hover:text-ink">
              Shop <ChevronDown size={14} className={cn('transition-transform duration-300', megaOpen && 'rotate-180')} />
            </button>
            {tree.slice(0, 4).map((c) => (
              <Link key={c._id} href={`/shop?category=${c.slug}`} className="link-underline transition hover:text-ink" onMouseEnter={() => setMegaOpen(false)}>
                {c.name}
              </Link>
            ))}
            <Link href="/help" className="link-underline transition hover:text-ink" onMouseEnter={() => setMegaOpen(false)}>Help</Link>
          </nav>

          <div className="ml-auto flex items-center gap-0.5">
            <button type="button" className={iconBtn} onClick={() => setSearchOpen(true)} aria-label="Search">
              <Search size={19} />
            </button>
            <Link href={user ? (user.role === 'customer' ? '/account' : '/admin') : '/login'} className={cn(iconBtn, 'hidden sm:flex')} aria-label="Account">
              <User size={19} />
            </Link>
            <Link href="/account/wishlist" className={cn(iconBtn, 'hidden sm:flex')} aria-label="Wishlist">
              <Heart size={19} />
              {wishlist.length > 0 && <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-primary ring-2 ring-bg" />}
            </Link>
            <button type="button" className={iconBtn} onClick={openDrawer} aria-label={`Bag, ${count} items`}>
              <ShoppingBag size={19} />
              {count > 0 && (
                <span className={cn('absolute -right-0.5 -top-0.5 flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-primary px-1 text-[10px] font-bold text-primary-fg transition-transform duration-300', bump && 'scale-125')}>
                  {count}
                </span>
              )}
            </button>
          </div>
        </div>

        {/* Mega menu */}
        <div className={cn('absolute inset-x-0 top-full hidden origin-top border-b border-line bg-bg/95 backdrop-blur-xl transition-all duration-300 ease-quiet lg:block', megaOpen ? 'visible translate-y-0 opacity-100' : 'invisible -translate-y-2 opacity-0')}>
          <div className="container grid grid-cols-12 gap-8 py-10">
            <div className="col-span-8 grid grid-cols-3 gap-8">
              {tree.map((c) => (
                <div key={c._id}>
                  <Link href={`/shop?category=${c.slug}`} className="font-display text-lg font-medium transition hover:text-primary">{c.name}</Link>
                  <ul className="mt-3 space-y-2 text-sm text-muted">
                    {c.children.map((s) => (
                      <li key={s._id}>
                        <Link href={`/shop?category=${s.slug}`} className="transition hover:text-ink">{s.name}</Link>
                      </li>
                    ))}
                    <li>
                      <Link href={`/shop?category=${c.slug}`} className="inline-flex items-center gap-1 text-primary">View all <ArrowRight size={13} /></Link>
                    </li>
                  </ul>
                </div>
              ))}
            </div>
            <Link href="/shop?sort=newest" className="group col-span-4 flex flex-col justify-end overflow-hidden rounded-2xl bg-ink p-6 text-white">
              <span className="eyebrow text-accent">Just in</span>
              <span className="mt-2 font-display text-2xl">New arrivals this week</span>
              <span className="mt-4 inline-flex items-center gap-2 text-sm text-white/80 transition group-hover:gap-3">Explore <ArrowRight size={15} /></span>
            </Link>
          </div>
        </div>
      </header>

      {/* Mobile menu */}
      <Drawer open={menuOpen} onClose={() => setMenuOpen(false)} side="left" title="Menu" width="max-w-xs">
        <nav className="flex flex-col p-4">
          <Link href="/shop" className="rounded-xl px-3 py-3 font-medium hover:bg-ink/5">Shop all</Link>
          {tree.map((c) => (
            <div key={c._id} className="border-t border-line/60 py-2">
              <Link href={`/shop?category=${c.slug}`} className="block rounded-xl px-3 py-2 font-medium hover:bg-ink/5">{c.name}</Link>
              {c.children.map((s) => (
                <Link key={s._id} href={`/shop?category=${s.slug}`} className="block rounded-xl px-6 py-1.5 text-sm text-muted hover:text-ink">{s.name}</Link>
              ))}
            </div>
          ))}
          <div className="mt-2 border-t border-line/60 pt-2">
            <Link href={user ? '/account' : '/login'} className="block rounded-xl px-3 py-3 font-medium hover:bg-ink/5">{user ? 'My account' : 'Sign in'}</Link>
            <Link href="/account/wishlist" className="block rounded-xl px-3 py-3 font-medium hover:bg-ink/5">Wishlist</Link>
            <Link href="/help" className="block rounded-xl px-3 py-3 font-medium hover:bg-ink/5">Help & support</Link>
          </div>
        </nav>
      </Drawer>

      <SearchOverlay open={searchOpen} onClose={() => setSearchOpen(false)} categories={tree} />
      <CartDrawer />
    </>
  );
}
