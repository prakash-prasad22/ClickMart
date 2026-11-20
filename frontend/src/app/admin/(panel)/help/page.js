'use client';

import ResourcePage from '@/components/admin/ResourcePage';
import Badge from '@/components/ui/Badge';
import { formatDate } from '@/lib/utils';

export default function HelpContentPage() {
  return (
    <ResourcePage
      title="Help content"
      singular="article"
      description="FAQ articles shown in the store’s Help centre."
      endpoint="/admin/help"
      toggleField="isPublished"
      defaults={{ isPublished: true, topic: 'General', sortOrder: 0 }}
      columns={[
        { key: 'title', label: 'Article', render: (r) => <div><p className="font-medium">{r.title}</p><p className="max-w-md truncate text-xs text-muted">{r.body}</p></div> },
        { key: 'topic', label: 'Topic', render: (r) => <Badge>{r.topic}</Badge> },
        { key: 'updatedAt', label: 'Updated', render: (r) => <span className="text-xs text-muted">{formatDate(r.updatedAt)}</span> },
      ]}
      fields={[
        { name: 'title', label: 'Question / title', required: true },
        { name: 'topic', label: 'Topic', placeholder: 'Orders, Delivery, Payments, Returns…', half: true },
        { name: 'sortOrder', label: 'Sort order', type: 'number', half: true },
        { name: 'body', label: 'Answer', type: 'textarea', rows: 10, required: true },
        { name: 'isPublished', label: 'Status', type: 'switch', switchLabel: 'Published' },
      ]}
    />
  );
}
