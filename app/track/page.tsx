import type { Metadata } from 'next';
import Link from 'next/link';
import { IconArrowRight, IconShield, IconTruck } from '@/components/icons';

export const metadata: Metadata = {
  title: 'Track your order',
  description: 'Use your secure Shopify account or order-status link to track a Nakhyatra order.',
  alternates: { canonical: '/track' },
  openGraph: { title: 'Track your Nakhyatra order', description: 'Use your secure account or dispatch link to view the latest available order update.', url: '/track' },
  twitter: { card: 'summary_large_image', title: 'Track your Nakhyatra order', description: 'Use your secure account or dispatch link to view the latest available order update.', images: ['/og.png'] },
};

export default function TrackPage() {
  const accountUrl = process.env.NEXT_PUBLIC_SHOPIFY_ACCOUNT_URL ?? 'https://checkout.nakhyatra.store/account';
  return (
    <main className="page-shell py-14 md:py-24">
      <div className="max-w-4xl"><p className="eyebrow">Order tracking</p><h1 className="mt-5 font-display text-[clamp(3.2rem,9vw,8rem)] font-black uppercase leading-[.78] tracking-[-.07em] text-white">Track your Nakhyatra order.</h1><p className="mt-7 max-w-2xl text-lg leading-relaxed text-ink-2">Use the link in your dispatch message or sign in with the email used at checkout to see the latest available update.</p></div>
      <div className="mt-12 grid gap-4 md:grid-cols-2">
        <a href={accountUrl} className="group border border-accent bg-accent p-7 text-black"><IconShield className="h-6 w-6" /><h2 className="mt-6 font-display text-3xl font-extrabold uppercase leading-none">View my orders</h2><p className="mt-4 text-sm text-black/70">Sign in securely with the email used at checkout to view your order history and available status updates.</p><span className="mt-7 inline-flex items-center gap-2 font-mono text-[10px] font-bold uppercase tracking-widest">Open account <IconArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" /></span></a>
        <div className="border border-line bg-surface p-7"><IconTruck className="h-6 w-6 text-accent" /><h2 className="mt-6 font-display text-3xl font-extrabold uppercase leading-none text-white">Use your dispatch message</h2><p className="mt-4 text-sm leading-relaxed text-ink-2">The shipping confirmation email or message contains the carrier’s live order-status link. If it has not arrived, contact us with the order email and order number.</p><Link href="/policies/contact" className="mt-7 inline-flex items-center gap-2 font-mono text-[10px] uppercase tracking-widest text-accent">Contact support <IconArrowRight className="h-4 w-4" /></Link></div>
      </div>
    </main>
  );
}
