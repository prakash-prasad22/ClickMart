import Header from '@/components/store/Header';
import Footer from '@/components/store/Footer';
import { serverApi } from '@/lib/server-api';

const DEFAULT_SETTINGS = {
  storeName: 'ClickMart',
  tagline: 'Finest dry fruits & handloom sarees, delivered across Patna',
  announcement: 'Free delivery across Patna on orders above ₹999',
  address: 'Patna, Bihar, India',
  supportPhone: '',
  supportEmail: '',
};

export default async function StoreLayout({ children }) {
  const [settings, categories] = await Promise.all([
    serverApi('/store/settings', { fallback: DEFAULT_SETTINGS }),
    serverApi('/store/categories', { fallback: [] }),
  ]);
  return (
    <div className="flex min-h-screen flex-col">
      <Header settings={settings || DEFAULT_SETTINGS} categories={categories || []} />
      <main className="flex-1">{children}</main>
      <Footer settings={settings || DEFAULT_SETTINGS} categories={categories || []} />
    </div>
  );
}
