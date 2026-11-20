import { cn, titleCase } from '@/lib/utils';

const TONES = {
  neutral: 'bg-ink/[0.06] text-ink-soft',
  primary: 'bg-primary-soft text-primary-deep',
  accent: 'bg-accent-soft text-accent',
  success: 'bg-success-soft text-success',
  warning: 'bg-warning-soft text-warning',
  danger: 'bg-danger-soft text-danger',
  info: 'bg-info-soft text-info',
  dark: 'bg-ink text-white',
};

export default function Badge({ tone = 'neutral', dot = false, className, children }) {
  return (
    <span className={cn('inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-2.5 py-0.5 text-xs font-medium', TONES[tone] || TONES.neutral, className)}>
      {dot && <span className="h-1.5 w-1.5 rounded-full bg-current" />}
      {children}
    </span>
  );
}

export function StatusBadge({ status, tones }) {
  return (
    <Badge tone={tones?.[status] || 'neutral'} dot>
      {titleCase(status || 'unknown')}
    </Badge>
  );
}
