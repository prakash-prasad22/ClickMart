'use client';

import ResourcePage from '@/components/admin/ResourcePage';
import Badge from '@/components/ui/Badge';
import { ROLE_LABEL } from '@/lib/admin-nav';
import { formatDateTime, initials } from '@/lib/utils';

const ROLE_TONE = { admin: 'dark', manager: 'primary', support: 'info' };

export default function TeamPage() {
  return (
    <ResourcePage
      title="Team"
      singular="member"
      description="Staff accounts. Admins have full access; managers can run the store; support handles orders, tickets and reviews."
      endpoint="/admin/team"
      defaults={{ role: 'support', isActive: true }}
      transform={(d) => {
        const out = { ...d };
        if (!out.password) delete out.password;
        return out;
      }}
      columns={[
        {
          key: 'name', label: 'Member', render: (r) => (
            <div className="flex items-center gap-3">
              <span className="flex h-9 w-9 items-center justify-center rounded-full bg-ink/[0.06] text-xs font-semibold">{initials(r.name)}</span>
              <div><p className="font-medium">{r.name}</p><p className="text-xs text-muted">{r.email}</p></div>
            </div>
          ),
        },
        { key: 'role', label: 'Role', render: (r) => <Badge tone={ROLE_TONE[r.role]}>{ROLE_LABEL[r.role]}</Badge> },
        { key: 'lastLoginAt', label: 'Last sign-in', render: (r) => <span className="text-xs text-muted">{r.lastLoginAt ? formatDateTime(r.lastLoginAt) : 'Never'}</span> },
      ]}
      fields={[
        { name: 'name', label: 'Full name', required: true },
        { name: 'email', label: 'Email', type: 'email', required: true, half: true },
        { name: 'phone', label: 'Phone', half: true },
        { name: 'role', label: 'Role', type: 'select', placeholder: false, options: Object.entries(ROLE_LABEL).map(([value, label]) => ({ value, label })) },
        { name: 'password', label: 'Password', type: 'password', required: (isNew) => isNew, hint: 'Min 8 characters. Leave blank to keep the current password.' },
        { name: 'isActive', label: 'Status', type: 'switch', switchLabel: 'Can sign in' },
      ]}
    />
  );
}
