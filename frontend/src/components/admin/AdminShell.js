'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { Menu, X, ExternalLink, ShieldOff } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { ADMIN_NAV, ROLE_LABEL } from '@/lib/admin-nav';
import { Spinner } from '@/components/ui';
import { cn } from '@/lib/utils';

const ALL_ITEMS = ADMIN_NAV.flatMap((g) => g.items);

function matchItem(pathname) {
  return ALL_ITEMS.filter((i) => (i.exact ? pathname === i.href : pathname === i.href || pathname.startsWith(`${i.href}/`)))
    .sort((a, b) => b.href.length - a.href.length)[0];
}

function Sidebar({ user, pathname, onNavigate, onSignOut }) {
  const perms = user?.permissions || [];
  return (
    <div className="flex h-full flex-col bg-admin-sidebar text-admin-sidebar-text">
      <div className="flex items-center gap-3 px-5 py-5">
        <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary text-lg font-bold text-white shadow-[0_6px_16px_-6px_rgb(var(--primary)/0.8)]">C</span>
        <div className="leading-tight">
          <p className="text-[17px] font-bold text-white">ClickMart</p>
          <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-admin-sidebar-text/70">Admin</p>
        </div>
      </div>

      <nav className="flex-1 overflow-y-auto px-3 pb-4 scrollbar-thin [scrollbar-color:rgb(255_255_255/0.15)_transparent]">
        {ADMIN_NAV.map((group, gi) => {
          const items = group.items.filter((i) => perms.includes(i.perm));
          if (!items.length) return null;
          return (
            <div key={gi} className={cn(group.section && 'mt-5')}>
              {group.section && <p className="mb-1.5 px-3 text-[10.5px] font-semibold uppercase tracking-[0.16em] text-admin-sidebar-text/55">{group.section}</p>}
              <ul className="space-y-0.5">
                {items.map((item) => {
                  const active = matchItem(pathname)?.href === item.href;
                  return (
                    <li key={item.href}>
                      <Link
                        href={item.href}
                        onClick={onNavigate}
                        className={cn(
                          'group flex items-center gap-3 rounded-xl px-3 py-2 text-[14px] font-medium transition-all duration-200',
                          active ? 'bg-white text-ink shadow-sm' : 'hover:bg-white/[0.06] hover:text-white'
                        )}
                      >
                        <item.icon size={17} strokeWidth={1.8} className={cn('transition-transform duration-300', !active && 'group-hover:translate-x-0.5')} />
                        {item.label}
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </div>
          );
        })}
      </nav>

      <div className="flex items-center gap-3 border-t border-admin-sidebar-line px-4 py-4">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white/10 text-sm font-semibold text-white">
          {(user?.name || 'A')[0].toUpperCase()}
        </span>
        <div className="min-w-0 flex-1 leading-tight">
          <p className="truncate text-sm font-semibold text-white">{user?.name || 'Admin'}</p>
          <p className="truncate text-[11px] text-admin-sidebar-text/70">{ROLE_LABEL[user?.role] || user?.role} · Account</p>
        </div>
        <button type="button" onClick={onSignOut} className="rounded-lg px-2 py-1 text-xs font-semibold text-white/80 transition hover:bg-white/10 hover:text-white">
          Sign out
        </button>
      </div>
    </div>
  );
}

export default function AdminShell({ children }) {
  const { user, loading, logout } = useAuth();
  const pathname = usePathname();
  const router = useRouter();
  const [mobileOpen, setMobileOpen] = useState(false);
  const isStaff = user && user.role !== 'customer';

  useEffect(() => {
    if (!loading && !isStaff) router.replace(`/admin/login?next=${encodeURIComponent(pathname)}`);
  }, [loading, isStaff, router, pathname]);

  if (loading || !isStaff) {
    return <div className="flex h-screen items-center justify-center bg-admin-bg"><Spinner className="text-muted" /></div>;
  }

  const current = matchItem(pathname);
  const allowed = !current || user.permissions?.includes(current.perm);
  const signOut = () => logout('/admin/login');

  return (
    <div className="min-h-screen bg-admin-bg">
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-[232px] lg:block">
        <Sidebar user={user} pathname={pathname} onSignOut={signOut} />
      </aside>

      {mobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-ink/50 animate-fade-in" onClick={() => setMobileOpen(false)} />
          <aside className="absolute inset-y-0 left-0 w-[260px] animate-slide-in-left">
            <Sidebar user={user} pathname={pathname} onNavigate={() => setMobileOpen(false)} onSignOut={signOut} />
            <button type="button" onClick={() => setMobileOpen(false)} className="absolute -right-12 top-4 flex h-9 w-9 items-center justify-center rounded-full bg-white/10 text-white" aria-label="Close menu">
              <X size={18} />
            </button>
          </aside>
        </div>
      )}

      <div className="lg:pl-[232px]">
        <header className="no-print sticky top-0 z-30 flex h-14 items-center gap-3 border-b border-line/70 bg-white/80 px-4 backdrop-blur-xl sm:px-6">
          <button type="button" onClick={() => setMobileOpen(true)} className="btn btn-ghost btn-icon -ml-2 h-9 w-9 lg:hidden" aria-label="Open menu">
            <Menu size={18} />
          </button>
          <nav className="flex items-center gap-2 text-sm">
            <Link href="/admin" className="text-muted transition hover:text-ink">ClickMart</Link>
            <span className="text-line">/</span>
            <span className="font-semibold text-ink">{current?.label || 'Admin'}</span>
          </nav>
          <Link href="/" target="_blank" className="ml-auto inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium text-muted transition hover:bg-ink/5 hover:text-ink">
            View store <ExternalLink size={13} />
          </Link>
        </header>
        <main className="mx-auto max-w-[1400px] p-4 sm:p-6 lg:p-8">
          {allowed ? (
            <div key={pathname} className="animate-fade-in">{children}</div>
          ) : (
            <div className="flex flex-col items-center py-24 text-center">
              <ShieldOff size={36} className="text-muted" strokeWidth={1.5} />
              <h2 className="mt-4 text-lg font-semibold">You don’t have access to this section</h2>
              <p className="mt-1 text-sm text-muted">Ask an administrator to update your role.</p>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
