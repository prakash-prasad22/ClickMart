import {
  LayoutGrid, ReceiptText, Package, BarChart3, Folder, Tag, Percent, Ticket, Image as ImageIcon, Star,
  MessageSquareText, HelpCircle, Users, Shield, LineChart, Settings, ListChecks,
} from 'lucide-react';

// `perm` must match backend/src/config/permissions.js
export const ADMIN_NAV = [
  { items: [{ label: 'Dashboard', href: '/admin', icon: LayoutGrid, perm: 'dashboard', exact: true }] },
  {
    section: 'Sell',
    items: [
      { label: 'Orders', href: '/admin/orders', icon: ReceiptText, perm: 'orders' },
      { label: 'Products', href: '/admin/products', icon: Package, perm: 'products' },
      { label: 'Inventory', href: '/admin/inventory', icon: BarChart3, perm: 'inventory' },
      { label: 'Categories', href: '/admin/categories', icon: Folder, perm: 'categories' },
      { label: 'Brands', href: '/admin/brands', icon: Tag, perm: 'brands' },
    ],
  },
  {
    section: 'Marketing',
    items: [
      { label: 'Offers', href: '/admin/offers', icon: Percent, perm: 'offers' },
      { label: 'Coupons', href: '/admin/coupons', icon: Ticket, perm: 'coupons' },
      { label: 'Banners', href: '/admin/banners', icon: ImageIcon, perm: 'banners' },
      { label: 'Reviews', href: '/admin/reviews', icon: Star, perm: 'reviews' },
    ],
  },
  {
    section: 'Support',
    items: [
      { label: 'Tickets', href: '/admin/tickets', icon: MessageSquareText, perm: 'tickets' },
      { label: 'Help content', href: '/admin/help', icon: HelpCircle, perm: 'help' },
    ],
  },
  {
    section: 'People',
    items: [
      { label: 'Customers', href: '/admin/customers', icon: Users, perm: 'customers' },
      { label: 'Team', href: '/admin/team', icon: Shield, perm: 'team' },
    ],
  },
  {
    section: 'Store',
    items: [
      { label: 'Reports', href: '/admin/reports', icon: LineChart, perm: 'reports' },
      { label: 'Settings', href: '/admin/settings', icon: Settings, perm: 'settings' },
      { label: 'Activity log', href: '/admin/activity', icon: ListChecks, perm: 'activity' },
    ],
  },
];

export const ROLE_LABEL = { admin: 'Administrator', manager: 'Manager', support: 'Support' };
