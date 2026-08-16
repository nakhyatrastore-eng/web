import Link from 'next/link';

export default function NotFound() {
  return (
    <main className="mx-auto flex min-h-[60vh] max-w-[720px] flex-col items-start justify-center px-4 py-20 md:px-8">
      <p className="eyebrow mb-3">404</p>
      <h1 className="font-display text-4xl font-black uppercase tracking-tight text-white md:text-6xl">
        That page isn&apos;t here.
      </h1>
      <p className="mt-4 text-sm leading-relaxed text-zinc-400 md:text-base">
        The item may have moved or is no longer available.
      </p>
      <Link
        href="/"
        className="mt-8 bg-accent px-6 py-3 font-mono text-xs font-bold uppercase tracking-widest text-black hover:bg-accenth"
      >
        Back to the shop
      </Link>
    </main>
  );
}

