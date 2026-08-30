import Link from 'next/link';
import { IconInstagram } from './icons';

const policyLinks = [
  ['shipping', 'Shipping'],
  ['returns', 'Returns'],
  ['privacy', 'Privacy'],
  ['terms', 'Terms'],
  ['contact', 'Contact'],
] as const;

export default function Footer() {
  return (
    <footer className="border-t border-line bg-surface">
      <div className="page-shell grid gap-10 py-12 md:grid-cols-[1.4fr_.6fr_.6fr] md:py-16">
        <div>
          <Link href="/" className="font-display text-3xl font-black uppercase tracking-[-0.055em] text-white">
            Nakhyatra<span className="text-accent">.</span>
          </Link>
          <p className="mt-3 max-w-sm text-sm text-ink-2">
            Distinctive phone cases and metal wall prints, fulfilled to order with trusted production partners.
          </p>
          <p className="mt-3 text-xs font-semibold uppercase tracking-[0.12em] text-accent">Nakhyatra, built in Guwahati.</p>
          <a href="https://www.instagram.com/nakhyatra.store" target="_blank" rel="noopener noreferrer" className="mt-6 inline-flex items-center gap-2 text-sm font-semibold text-white hover:text-accent">
            <IconInstagram className="h-4 w-4" /> Instagram
          </a>
        </div>

        <nav aria-label="Shop" className="grid content-start gap-3 text-sm">
          <p className="mb-1 font-semibold text-white">Shop</p>
          <Link href="/collections/phone-cases" className="text-ink-2 hover:text-white">Phone cases</Link>
          <Link href="/collections/poster-wall" className="text-ink-2 hover:text-white">Metal wall prints</Link>
          <Link href="/track" className="text-ink-2 hover:text-white">Track order</Link>
        </nav>

        <nav aria-label="Policies" className="grid content-start gap-3 text-sm">
          <p className="mb-1 font-semibold text-white">Help</p>
          {policyLinks.map(([handle, label]) => (
            <Link key={handle} href={`/policies/${handle}`} className="text-ink-2 hover:text-white">{label}</Link>
          ))}
        </nav>
      </div>

      <div className="page-shell flex flex-col gap-2 border-t border-line py-5 text-xs text-ink-3 md:flex-row md:items-center md:justify-between">
        <span>© {new Date().getFullYear()} Nakhyatra Store · UDYAM-AS-03-0097671</span>
        <span>Customer care · nakhyatrastore@gmail.com</span>
      </div>
    </footer>
  );
}
