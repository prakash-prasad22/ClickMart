import { Fraunces, Plus_Jakarta_Sans } from 'next/font/google';
import Providers from './providers';
import './globals.css';

const display = Fraunces({ subsets: ['latin'], variable: '--font-display', display: 'swap', axes: ['opsz', 'SOFT'] });
const sans = Plus_Jakarta_Sans({ subsets: ['latin'], variable: '--font-sans', display: 'swap' });

export const metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'),
  title: { default: 'ClickMart — Premium Dry Fruits & Handloom Sarees, Patna', template: '%s · ClickMart' },
  description: 'Hand-sorted dry fruits, handloom sarees and festive hampers — delivered across Patna.',
};

export const viewport = { themeColor: '#FAF7F2' };

export default function RootLayout({ children }) {
  return (
    <html lang="en" className={`${display.variable} ${sans.variable}`}>
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
