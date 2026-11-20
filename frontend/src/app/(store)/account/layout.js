'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { User, Package, MapPin, Heart, LifeBuoy, LogOut } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { cn, initials } from '@/lib/utils';

const NAV = [
  { href: '/account', label: 'Profile', icon: User, exact: true },
  { href: '/account/orders', label: 'Orders', icon: Package },
  { href: '/account/addresses', label: 'Addresses', icon: MapPin },
  { href: '/account/wishlist', label: 'Wishlist', icon: Heart },
  { href: '/account/support', label: 'Support', icon: LifeBuoy },
];

export default function AccountLayout({ children }) {
  const pathname = usePathname();
  const { user, logout } = useAuth();
  const isActive = (n) => (n.exact ? pathname === n.href : pathname.startsWith(n.href));

  return (
    <div className="container pt-10">
      <div className="flex items-center gap-4 animate-fade-up">
        <span className="flex h-14 w-14 items-center justify-center rounded-full bg-primary-soft font-display text-xl text-primary-deep">{initials(user?.name || 'U')}</span>
        <div>
          <p className="text-sm text-muted">Hello,</p>
          <h1 className="font-display text-3xl font-light">{user?.name || 'there'}</h1>
        </div>
      </div>

      <div className="mt-10 grid gap-10 lg:grid-cols-[220px_1fr]">
        <nav className="-mx-4 flex gap-1 overflow-x-auto px-4 scrollbar-none lg:mx-0 lg:flex-col lg:px-0">
          {NAV.map((n) => (
            <Link
              key={n.href}
              href={n.href}
              className={cn(
                'flex shrink-0 items-center gap-3 rounded-full px-4 py-2.5 text-sm font-medium transition-all duration-300 lg:rounded-xl',
                isActive(n) ? 'bg-ink text-white' : 'text-ink-soft hover:bg-ink/5'
              )}
            >
              <n.icon size={17} /> {n.label}
            </Link>
          ))}
          <button type="button" onClick={() => logout('/')} className="flex shrink-0 items-center gap-3 rounded-full px-4 py-2.5 text-sm font-medium text-ink-soft transition hover:bg-danger-soft hover:text-danger lg:mt-4 lg:rounded-xl">
            <LogOut size={17} /> Sign out
          </button>
        </nav>
        <div className="min-w-0 animate-fade-in">{children}</div>
      </div>
    </div>
  );
}
