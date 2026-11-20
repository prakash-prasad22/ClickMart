// Role → admin-panel modules. Keep in sync with frontend/src/lib/admin-nav.js
const MODULES = [
  'dashboard', 'orders', 'products', 'inventory', 'categories', 'brands',
  'offers', 'coupons', 'banners', 'reviews', 'tickets', 'help',
  'customers', 'team', 'reports', 'settings', 'activity',
];

const ROLE_PERMISSIONS = {
  admin: MODULES,
  manager: MODULES.filter((m) => !['team', 'settings'].includes(m)),
  support: ['dashboard', 'orders', 'tickets', 'help', 'reviews', 'customers'],
  customer: [],
};

const STAFF_ROLES = ['admin', 'manager', 'support'];

const permissionsFor = (role) => ROLE_PERMISSIONS[role] || [];
const can = (role, module) => permissionsFor(role).includes(module);

module.exports = { MODULES, ROLE_PERMISSIONS, STAFF_ROLES, permissionsFor, can };
