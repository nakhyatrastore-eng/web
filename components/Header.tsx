'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useCart } from '@/lib/cart-context';
import { IconCart, IconMenu, IconSearch, IconUser, IconX } from './icons';
import SearchDrawer from './SearchDrawer';

export default function Header() {
  const { count, openCart } = useCart();
  const [menuOpen, setMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const accountUrl =
    process.env.NEXT_PUBLIC_SHOPIFY_ACCOUNT_URL ??
    'https://checkout.nakhyatra.store/account';

  return (
    <>
      <header className="sticky top-0 z-[60] border-b border-line bg-bg">
        <div className="page-shell flex h-16 items-center gap-3">
          <button
            type="button"
            onClick={() => setMenuOpen((current) => !current)}
            aria-expanded={menuOpen}
            aria-controls="store-menu"
            aria-label={menuOpen ? 'Close menu' : 'Open menu'}
            className="flex h-11 w-11 items-center justify-center rounded-full text-ink-2 hover:bg-surface hover:text-white lg:hidden"
          >
            {menuOpen ? <IconX className="h-5 w-5" /> : <IconMenu className="h-5 w-5" />}
          </button>

          <Link href="/" className="shrink-0 font-display text-xl font-black uppercase tracking-[-0.05em] text-white md:text-2xl" onClick={() => setMenuOpen(false)}>
            Nakhyatra<span className="text-accent">.</span>
          </Link>

          <nav className="ml-8 hidden items-center gap-7 text-sm font-semibold lg:flex" aria-label="Primary">
            <Link href="/collections/phone-cases" className="text-ink-2 hover:text-white">Shop cases</Link>
            <Link href="/collections/poster-wall" className="text-ink-2 hover:text-white">Metal prints</Link>
            <Link href="/track" className="text-ink-2 hover:text-white">Track order</Link>
            <Link href="/policies/contact" className="text-ink-2 hover:text-white">Help</Link>
            <a href="https://www.instagram.com/nakhyatra.store" target="_blank" rel="noopener noreferrer" className="text-ink-2 hover:text-white">Instagram</a>
          </nav>

          <div className="ml-auto flex items-center gap-1">
            <button type="button" onClick={() => setSearchOpen(true)} aria-label="Search" className="flex h-11 w-11 items-center justify-center rounded-full text-ink-2 hover:bg-surface hover:text-white">
              <IconSearch className="h-5 w-5" />
            </button>
            <a href={accountUrl} aria-label="Account" className="hidden h-11 w-11 items-center justify-center rounded-full text-ink-2 hover:bg-surface hover:text-white sm:flex">
              <IconUser className="h-5 w-5" />
            </a>
            <button id="cart-open-btn" type="button" onClick={openCart} aria-label={count > 0 ? `Open cart with ${count} items` : 'Open cart'} className="relative flex h-11 min-w-11 items-center justify-center rounded-full px-2 text-ink-2 hover:bg-surface hover:text-white">
              <IconCart className="h-5 w-5" />
              {count > 0 ? <span className="absolute -right-0.5 -top-0.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-accent px-1 text-[10px] font-bold text-black">{count}</span> : null}
            </button>
          </div>
        </div>

        {menuOpen ? (
          <nav id="store-menu" className="absolute inset-x-0 top-full border-b border-line bg-bg p-[var(--pad)] shadow-[0_24px_50px_rgba(0,0,0,.45)] lg:hidden" aria-label="Mobile menu">
            <div className="grid gap-2">
              <Link onClick={() => setMenuOpen(false)} href="/collections/phone-cases" className="rounded-2xl bg-accent p-5 font-display text-2xl font-bold text-black">Shop phone cases</Link>
              <Link onClick={() => setMenuOpen(false)} href="/collections/poster-wall" className="rounded-2xl border border-accent/60 bg-accent/10 p-5 font-display text-2xl font-bold text-white">Shop metal wall prints</Link>
              <Link onClick={() => setMenuOpen(false)} href="/track" className="rounded-2xl border border-line bg-surface p-5 text-base font-semibold text-white">Track an order</Link>
              <Link onClick={() => setMenuOpen(false)} href="/policies/contact" className="rounded-2xl border border-line bg-surface p-5 text-base font-semibold text-white">Help & contact</Link>
              <a href={accountUrl} className="rounded-2xl border border-line bg-surface p-5 text-base font-semibold text-white">Customer account</a>
            </div>
          </nav>
        ) : null}
      </header>
      <SearchDrawer open={searchOpen} onClose={() => setSearchOpen(false)} />
    </>
  );
}
