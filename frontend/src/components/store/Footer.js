import Link from 'next/link';
import { Instagram, Facebook, MessageCircle, Mail, Phone, MapPin } from 'lucide-react';
import Logo from './Logo';

export default function Footer({ settings, categories = [] }) {
  const roots = categories.filter((c) => !c.parent).slice(0, 5);
  const year = new Date().getFullYear();
  return (
    <footer className="mt-24 bg-ink text-white/70">
      <div className="container grid gap-12 py-16 md:grid-cols-12">
        <div className="md:col-span-4">
          <Logo name={settings?.storeName} light />
          <p className="mt-5 max-w-xs text-sm leading-relaxed">{settings?.tagline}</p>
          <div className="mt-6 flex gap-2">
            {[
              [Instagram, settings?.socials?.instagram, 'Instagram'],
              [Facebook, settings?.socials?.facebook, 'Facebook'],
              [MessageCircle, settings?.socials?.whatsapp, 'WhatsApp'],
            ].map(([Icon, href, label]) => (
              <a key={label} href={href || '#'} aria-label={label} target="_blank" rel="noreferrer" className="flex h-10 w-10 items-center justify-center rounded-full border border-white/15 transition duration-300 hover:border-white/50 hover:text-white">
                <Icon size={17} />
              </a>
            ))}
          </div>
        </div>

        <div className="md:col-span-2">
          <h4 className="text-sm font-semibold text-white">Shop</h4>
          <ul className="mt-4 space-y-2.5 text-sm">
            <li><Link href="/shop" className="transition hover:text-white">All products</Link></li>
            {roots.map((c) => (
              <li key={c._id}><Link href={`/shop?category=${c.slug}`} className="transition hover:text-white">{c.name}</Link></li>
            ))}
          </ul>
        </div>

        <div className="md:col-span-2">
          <h4 className="text-sm font-semibold text-white">Account</h4>
          <ul className="mt-4 space-y-2.5 text-sm">
            <li><Link href="/account/orders" className="transition hover:text-white">My orders</Link></li>
            <li><Link href="/account/wishlist" className="transition hover:text-white">Wishlist</Link></li>
            <li><Link href="/account/addresses" className="transition hover:text-white">Addresses</Link></li>
            <li><Link href="/help" className="transition hover:text-white">Help centre</Link></li>
          </ul>
        </div>

        <div className="md:col-span-4">
          <h4 className="text-sm font-semibold text-white">Get in touch</h4>
          <ul className="mt-4 space-y-3 text-sm">
            <li className="flex gap-3"><MapPin size={16} className="mt-0.5 shrink-0 text-accent" />{settings?.address}</li>
            <li className="flex gap-3"><Phone size={16} className="mt-0.5 shrink-0 text-accent" />{settings?.supportPhone}</li>
            <li className="flex gap-3"><Mail size={16} className="mt-0.5 shrink-0 text-accent" />{settings?.supportEmail}</li>
          </ul>
        </div>
      </div>
      <div className="border-t border-white/10">
        <div className="container flex flex-col items-center justify-between gap-2 py-6 text-xs text-white/50 sm:flex-row">
          <p>© {year} {settings?.storeName || 'ClickMart'}. All rights reserved.</p>
          <p>Delivering across Patna · Worldwide shipping coming soon</p>
        </div>
      </div>
    </footer>
  );
}
