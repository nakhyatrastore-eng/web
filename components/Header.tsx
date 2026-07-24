'use client';

import Link from 'next/link';
import { useCart } from '@/lib/cart-context';
import Ticker from './Ticker';

export default function Header() {
  const { count, openCart } = useCart();

  return (
    <>
      <Ticker text="NAKHYATRA · STEEL POSTERS · PHONE CASES · MADE TO LAST" />
      <header className="sticky top-0 z-40 backdrop-blur bg-bg/85 border-b border-border">
        <div className="max-w-[1180px] mx-auto px-6 h-16 flex items-center justify-between">
          <Link href="/" className="font-sans font-extrabold tracking-tight text-lg">
            NAKHYATRA
          </Link>
          <nav className="hidden md:flex items-center gap-8 kicker">
            <Link href="/collections/poster-wall" className="hover:text-ink transition-colors">Poster Wall</Link>
            <Link href="/collections/phone-cases" className="hover:text-ink transition-colors">Phone Cases</Link>
            <Link href="/#faqs" className="hover:text-ink transition-colors">FAQs</Link>
          </nav>
          <button
            onClick={openCart}
            className="border border-border px-4 py-2 kicker hover:border-accent hover:text-accent transition-colors"
          >
            Cart {count > 0 && `(${count})`}
          </button>
        </div>
      </header>
    </>
  );
}
