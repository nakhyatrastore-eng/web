'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { IconCreate, IconHome, IconPhone } from './icons';

function PrintIcon({ className = '' }: { className?: string; active?: boolean }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className={className} aria-hidden="true">
      <rect x="4" y="3" width="16" height="18" rx="1.5" />
      <path d="m7.5 16 3.5-4 2.5 2.5 1.75-2L19 17" />
      <circle cx="15.5" cy="8" r="1.25" />
    </svg>
  );
}

function TrackIcon({ className = '' }: { className?: string; active?: boolean }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className={className} aria-hidden="true">
      <path d="M4 7.5h16M6.5 4h11a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2h-11a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2Z" />
      <path d="M8 12h8M8 15.5h5" />
    </svg>
  );
}

const navItems = [
  { href: '/', icon: IconHome, label: 'Home' },
  { href: '/collections/phone-cases', icon: IconPhone, label: 'Phone Cases' },
  { href: '/collections/poster-wall', icon: PrintIcon, label: 'Metal Posters' },
  { href: '/create', icon: IconCreate, label: 'Customize' },
  { href: '/track', icon: TrackIcon, label: 'Tracking' },
];

export default function MobileNav() {
  const pathname = usePathname();
  const active = (href: string) =>
    href === '/' ? pathname === '/' : pathname.startsWith(href);

  return (
    <nav className="fixed inset-x-0 bottom-0 z-[65] border-t border-line bg-bg/95 pb-[env(safe-area-inset-bottom)] backdrop-blur-2xl md:hidden" aria-label="Mobile">
      <div className="grid h-[68px] grid-cols-5">
        {navItems.map(({ href, icon: Icon, label }) => {
          const selected = active(href);
          return (
            <Link key={href} href={href} aria-current={selected ? 'page' : undefined} className={`relative flex flex-col items-center justify-center gap-1 px-1 text-center text-[11px] font-semibold leading-tight ${selected ? 'text-accent' : 'text-ink-3'}`}>
              {selected ? <span className="absolute inset-x-5 top-0 h-[2px] rounded-full bg-accent" /> : null}
              <Icon className="h-[18px] w-[18px]" active={selected} />
              <span>{label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
