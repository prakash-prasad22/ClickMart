import AdminShell from '@/components/admin/AdminShell';

export const metadata = { title: { default: 'Admin', template: '%s · ClickMart Admin' }, robots: { index: false } };

export default function AdminLayout({ children }) {
  return <AdminShell>{children}</AdminShell>;
}
