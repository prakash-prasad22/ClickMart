import Link from 'next/link';
import { cn } from '@/lib/utils';

export default function Logo({ name = 'ClickMart', className, light = false }) {
  return (
    <Link href="/" className={cn('group inline-flex items-center gap-2.5', className)} aria-label={`${name} home`}>
      <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary font-display text-lg font-semibold text-primary-fg shadow-[0_6px_16px_-6px_rgb(var(--primary)/0.7)] transition-transform duration-500 ease-quiet group-hover:-rotate-6">
        {name[0]}
      </span>
      <span className={cn('font-display text-[22px] font-medium tracking-tight', light ? 'text-white' : 'text-ink')}>{name}</span>
    </Link>
  );
}
