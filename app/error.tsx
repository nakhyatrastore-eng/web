'use client';

export default function ErrorPage({ reset }: { reset: () => void }) {
  return (
    <main className="mx-auto flex min-h-[60vh] max-w-[720px] flex-col items-start justify-center px-4 py-20 md:px-8">
      <p className="eyebrow mb-3">Store unavailable</p>
      <h1 className="font-display text-4xl font-black uppercase tracking-tight text-white md:text-6xl">
        We couldn&apos;t load the shop.
      </h1>
      <p className="mt-4 max-w-lg text-sm leading-relaxed text-zinc-400 md:text-base">
        This is usually temporary. Try again in a moment.
      </p>
      <button
        type="button"
        onClick={reset}
        className="mt-8 bg-accent px-6 py-3 font-mono text-xs font-bold uppercase tracking-widest text-black hover:bg-accenth"
      >
        Try again
      </button>
    </main>
  );
}

